/*
Copyright 2025 linux.do

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


package main

import (
    "bytes"
    "context"
    crand "crypto/rand"
    "crypto/aes"
    "crypto/cipher"
    "crypto/sha256"
    "encoding/base64"
    "encoding/gob"
    "encoding/hex"
    "encoding/json"
    "errors"
    "flag"
    "fmt"
    "io"
    "log"
    mrand "math/rand/v2"
    "math/big"
    "net/http"
    "strings"
    "time"

    "github.com/google/uuid"
    "github.com/gorilla/securecookie"
    "github.com/jackc/pgx/v5"
    "github.com/redis/go-redis/v9"
)

// --- Configuration Constants ---
const (
    // Default Configuration
    DefaultSessionSecret = "dev-session-secret"
    CookieName           = "linux_do_credit_session_id"
    DefaultRedisDSN      = "redis://:redis_pwd@redis:6379/0"
    DefaultPostgresDSN   = "postgres://postgres_user:postgres_pwd@postgres:5432/linux_do_credit"
    DefaultAvatarURL     = "https://linux.do/user_avatar/linux.do/diffusion/288/493124_2.png"
    UserAgent            = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

    // Cryptography & Keys
    SessionIDBytes    = 24
    PayPwdMax         = 1000000 // 6 digit pay password

    // Redis & Session
    RedisKeyPrefix      = "credit:session:"
    SessionTTL          = 86400 * time.Second // 24 Hours

    // HTTP & API
    APIURLTemplate       = "https://linux.do/leaderboard/1?page=%d&period=all"
    BaseURL              = "https://linux.do"
    MaxLeaderPages       = 50

    // User Generation Limits
    MaxRandomUserID = 900000
    LevelMin        = 0
    LevelMax        = 3

    // User Sources
    SourceRandom = "Random Generation"
    SourceAPI    = "Linux.do API"

    // Pay Score Ranges (Lower bounds are implicit from previous Upper)
    ScoreLvl0Max = 2000
    ScoreLvl1Max = 10000
    ScoreLvl2Max = 50000
    ScoreLvl3Max = 100000
)

// SQL Constants
const InsertUserSQL = `
INSERT INTO users (
  id, username, nickname, avatar_url, trust_level,
  pay_score, pay_key, sign_key, 
  total_receive, total_payment, total_transfer, total_community, 
  community_balance, available_balance, 
  is_active, is_admin, last_login_at, created_at, updated_at
) VALUES (
  $1, $2, $3, $4, floor(random()*5)::int,
  $5, $6, $7,
  ROUND((random()*(80000-100)+100)::numeric, 2), ROUND((random()*(50000-100)+100)::numeric, 2), ROUND((random()*(50000-100)+100)::numeric, 2), ROUND((random()*(80000-10000)+10000)::numeric, 2),
  ROUND((random()*(80000-10000)+10000)::numeric, 2), ROUND((random()*(80000-100)+100)::numeric, 2),
  true, (random() > 0.5), NOW(), NOW(), NOW()
);`

type UserData struct {
    ID         int
    Username   string
    Nickname   string
    AvatarURL  string
    SignKey    string
    PayKey     string
    PayScore   int
    IsRealData bool
    Source     string
}

type LeaderboardResponse struct {
    Users []struct {
        ID             int    `json:"id"`
        Username       string `json:"username"`
        Name           string `json:"name"`
        AvatarTemplate string `json:"avatar_template"`
    } `json:"users"`
}

func init() {
    // Register the map type for Gob encoding/decoding used in sessions
    gob.Register(map[interface{}]interface{}{})
}

func main() {
    // --- Command Line Flags ---
    mode := flag.String("mode", "check", "Operation mode: 'check' (parse cookie), 'gen' (create user), 'batch' (create multiple)")

    // Common flags
    redisDSN := flag.String("redis-dsn", DefaultRedisDSN, "Redis connection string")
    postgresDSN := flag.String("postgres-dsn", DefaultPostgresDSN, "Postgres connection string")
    sessionSecret := flag.String("session-secret", DefaultSessionSecret, "Session secret for securecookie")
    cookieName := flag.String("cookie-name", CookieName, "Name of the session cookie")

    // Check mode flags
    cookieStr := flag.String("cookie", "", "Browser cookie string to parse (only for check mode, e.g. 'linux_do_credit_session_id=...')")

    // Gen/Batch mode flags
    apiKey := flag.String("api-key", "", "Linux.do API Key for fetching real user data (OPTIONAL, may not work)")
    count := flag.Int("count", 1, "Number of users to generate (for batch mode)")
    level := flag.Int("level", -1, "User Level (0-3) to generate. -1 for random.")

    flag.Parse()

    switch *mode {
    case "check":
        if *cookieStr == "" {
            log.Fatal("Error: --cookie is required for check mode")
        }
        runCheckCookie(*cookieStr, *redisDSN, *sessionSecret, *cookieName)
    case "gen":
        runGenUser(*postgresDSN, *redisDSN, *apiKey, *sessionSecret, *cookieName, *level)
    case "batch":
        if *count < 1 {
            log.Fatal("Error: --count must be at least 1")
        }
        for i := 0; i < *count; i++ {
            fmt.Printf("\n--- Batch Processing User %d/%d ---\n", i+1, *count)
            runGenUser(*postgresDSN, *redisDSN, *apiKey, *sessionSecret, *cookieName, *level)
            // Sleep briefly to avoid rate limits if using API
            if *apiKey != "" {
                time.Sleep(1 * time.Second)
            }
        }
    default:
        log.Fatalf("Unknown mode: %s. Use 'check', 'gen', or 'batch'", *mode)
    }
}

// GenerateUniqueIDSimple 生成 64 位唯一标识符
func GenerateUniqueIDSimple() string {
    randomBytes := make([]byte, 32)
    if _, err := io.ReadFull(crand.Reader, randomBytes); err != nil {
        // 如果随机数生成失败，使用 UUID 作为后备
        uuidBytes := []byte(uuid.NewString())
        hash := sha256.Sum256(uuidBytes)
        copy(randomBytes, hash[:])
    }
    return hex.EncodeToString(randomBytes)
}

// Encrypt 使用 SignKey 加密字符串数据
func Encrypt(signKey string, plaintext string) (string, error) {
    return encryptBytes(signKey, []byte(plaintext))
}

// Decrypt 使用 SignKey 解密字符串数据 (Included for completeness)
func Decrypt(signKey string, ciphertext string) (string, error) {
    plaintext, err := decryptBytes(signKey, ciphertext)
    if err != nil {
        return "", err
    }
    return string(plaintext), nil
}

// encryptBytes 加密函数，处理字节数据
func encryptBytes(signKey string, plaintext []byte) (string, error) {
    // 将 hex 编码的密钥转换为字节
    key, err := hex.DecodeString(signKey)
    if err != nil {
        return "", fmt.Errorf("invalid sign key: %w", err)
    }
    if len(key) != 32 {
        return "", errors.New("sign key must be 32 bytes (64 hex characters)")
    }

    // 创建 AES cipher
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", fmt.Errorf("failed to create cipher: %w", err)
    }

    // 使用 GCM 模式（Galois/Counter Mode）
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", fmt.Errorf("failed to create GCM: %w", err)
    }

    // 生成随机 nonce
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(crand.Reader, nonce); err != nil {
        return "", fmt.Errorf("failed to generate nonce: %w", err)
    }

    // 加密数据
    ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

    // 返回 base64 编码的密文
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decryptBytes 解密函数，处理字节数据
func decryptBytes(signKey string, ciphertext string) ([]byte, error) {
    // 将 hex 编码的密钥转换为字节
    key, err := hex.DecodeString(signKey)
    if err != nil {
        return nil, fmt.Errorf("invalid sign key: %w", err)
    }
    if len(key) != 32 {
        return nil, errors.New("sign key must be 32 bytes (64 hex characters)")
    }

    // 解码 base64 密文
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return nil, fmt.Errorf("failed to decode ciphertext: %w", err)
    }

    // 创建 AES cipher
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, fmt.Errorf("failed to create cipher: %w", err)
    }

    // 使用 GCM 模式
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, fmt.Errorf("failed to create GCM: %w", err)
    }

    // 提取 nonce
    nonceSize := gcm.NonceSize()
    if len(data) < nonceSize {
        return nil, errors.New("ciphertext too short")
    }

    nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]

    // 解密数据
    plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to decrypt: %w", err)
    }

    return plaintext, nil
}

// ==========================================
// MODE 1: Check Cookie
// ==========================================
func runCheckCookie(rawCookie string, redisDSN string, sessionSecret string, cookieName string) {
    fmt.Println(">>> Starting Cookie Analysis...")

    s := securecookie.New([]byte(sessionSecret), nil)

    cookieVal := rawCookie
    if strings.Contains(rawCookie, "=") {
        parts := strings.SplitN(rawCookie, "=", 2)
        if len(parts) == 2 && parts[0] == cookieName {
            cookieVal = parts[1]
        } else if len(parts) == 2 {
            fmt.Printf("Warning: Cookie name matches '%s', but expected '%s'. Attempting decode...\n", parts[0], cookieName)
            cookieVal = parts[1]
        }
    }

    var sessionID string
    err := s.Decode(cookieName, cookieVal, &sessionID)
    if err != nil {
        fmt.Printf("❌ Failed to verify cookie signature: %v\n", err)
        return
    }

    fmt.Printf("✅ Cookie Signature Verified!\n")
    fmt.Printf("🔑 Session ID: %s\n", sessionID)

    redisKey := RedisKeyPrefix + sessionID

    // Parse DSN
    opt, err := redis.ParseURL(redisDSN)
    if err != nil {
        printManualRedisInstruction(redisKey, "Invalid Redis DSN provided")
        return
    }

    rdb := redis.NewClient(opt)
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()

    val, err := rdb.Get(ctx, redisKey).Result()
    if err != nil {
        fmt.Printf("⚠️  Redis fetch failed: %v\n", err)
        printManualRedisInstruction(redisKey, "Key not found")
        return
    }

    var data = make(map[interface{}]interface{})
    buf := bytes.NewBuffer([]byte(val))
    dec := gob.NewDecoder(buf)
    if err := dec.Decode(&data); err != nil {
        log.Fatalf("❌ Gob decoding failed: %v", err)
    }

    fmt.Println("\n📄 User Session Data:")
    fmt.Printf("   User ID:  %v (Type: %T)\n", data["user_id"], data["user_id"])
    fmt.Printf("   Username: %v (Type: %T)\n", data["username"], data["username"])
    fmt.Printf("   Raw Map:  %+v\n", data)
}

func printManualRedisInstruction(key, reason string) {
    fmt.Println("\n---------------------------------------------------")
    fmt.Printf("Reason: %s\n", reason)
    fmt.Println("To check manually, run this in redis-cli:")
    fmt.Printf("SELECT 0\n")
    fmt.Printf("GET \"%s\"\n", key)
    fmt.Println("---------------------------------------------------")
}

// ==========================================
// MODE 2: Generate User
// ==========================================
func runGenUser(postgresDSN string, redisDSN string, apiKey string, sessionSecret string, cookieName string, level int) {
    var user UserData
    var err error

    if apiKey != "" {
        user, err = fetchRealUser(apiKey)
        if err != nil {
            fmt.Printf("⚠️  Failed to fetch real user: %v. Falling back to random data.\n", err)
            user = generateRandomUser()
        }
    } else {
        user = generateRandomUser()
    }

    // If level is invalid or -1, pick a random level
    if level < LevelMin || level > LevelMax {
        level = mrand.IntN(LevelMax + 1) // 0, 1, 2, 3
    }
    user.PayScore = generatePayScore(level)

    user.SignKey = GenerateUniqueIDSimple()

    max := big.NewInt(int64(PayPwdMax))
    n, err := crand.Int(crand.Reader, max)
    if err != nil {
        log.Fatalf("Critical error generating secure random number: %v", err)
    }
    payPwd := fmt.Sprintf("%06d", n.Int64())

    encryptedPayKey, err := Encrypt(user.SignKey, payPwd)
    if err != nil {
        log.Fatalf("Critical error generating keys: %v", err)
    }
    user.PayKey = encryptedPayKey

    fmt.Printf("👤 Target User: [%d] %s (%s)\n", user.ID, user.Username, user.Source)
    fmt.Printf("📊 Level Input: %d -> Pay Score: %d\n", level, user.PayScore)
    fmt.Printf("🔑 Sign Key: %s\n", user.SignKey)
    fmt.Printf("💳 Pay Key (Encrypted '%s'): %s\n", payPwd, user.PayKey)

    insertUserToDB(user, postgresDSN)

    generateSessionAndOutput(user, redisDSN, sessionSecret, cookieName)
}

func generatePayScore(level int) int {
    min, max := 0, 0
    switch level {
    case 0:
        min, max = 0, ScoreLvl0Max
    case 1:
        min, max = ScoreLvl0Max, ScoreLvl1Max
    case 2:
        min, max = ScoreLvl1Max, ScoreLvl2Max
    case 3:
        min, max = ScoreLvl2Max, ScoreLvl3Max
    default:
        min, max = 0, ScoreLvl0Max
    }

    // [min, max)
    return mrand.IntN(max-min) + min
}

func generateRandomUser() UserData {
    id := mrand.IntN(MaxRandomUserID)
    return UserData{
        ID:         id,
        Username:   fmt.Sprintf("mock_user_%06d", id),
        Nickname:   fmt.Sprintf("User %06d", id),
        AvatarURL:  DefaultAvatarURL,
        IsRealData: false,
        Source:     SourceRandom,
    }
}

func fetchRealUser(apiKey string) (UserData, error) {
    page := mrand.IntN(MaxLeaderPages) + 1
    url := fmt.Sprintf(APIURLTemplate, page)

    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return UserData{}, err
    }

    // Headers
    req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
    req.Header.Set("User-Api-Key", apiKey)
    req.Header.Set("User-Agent", UserAgent)
    req.Header.Set("Discourse-Logged-In", "true")

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return UserData{}, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return UserData{}, fmt.Errorf("API returned status: %d", resp.StatusCode)
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return UserData{}, fmt.Errorf("failed to read response body: %w", err)
    }

    var result LeaderboardResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return UserData{}, err
    }

    if len(result.Users) == 0 {
        return UserData{}, fmt.Errorf("no users found on page %d", page)
    }

    // Pick random user
    target := result.Users[mrand.IntN(len(result.Users))]

    // Format avatar
    avatar := strings.Replace(target.AvatarTemplate, "{size}", "288", 1)
    if !strings.HasPrefix(avatar, "http") {
        avatar = BaseURL + avatar
    }

    return UserData{
        ID:         target.ID,
        Username:   target.Username,
        Nickname:   target.Name,
        AvatarURL:  avatar,
        IsRealData: true,
        Source:     SourceAPI,
    }, nil
}

func insertUserToDB(user UserData, dsn string) {
    conn, err := pgx.Connect(context.Background(), dsn)
    if err != nil {
        fmt.Printf("⚠️  Postgres connection failed: %v\n", err)
        fmt.Println("⬇️  Run this SQL manually:")
        fmt.Println("---------------------------------------------------")
        fmt.Println("-- Ensure extension exists: CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        cleanNick := strings.ReplaceAll(user.Nickname, "'", "''")
        filledSQL := strings.Replace(InsertUserSQL, "$1", fmt.Sprintf("%d", user.ID), 1)
        filledSQL = strings.Replace(filledSQL, "$2", fmt.Sprintf("'%s'", user.Username), 1)
        filledSQL = strings.Replace(filledSQL, "$3", fmt.Sprintf("'%s'", cleanNick), 1)
        filledSQL = strings.Replace(filledSQL, "$4", fmt.Sprintf("'%s'", user.AvatarURL), 1)
        filledSQL = strings.Replace(filledSQL, "$5", fmt.Sprintf("%d", user.PayScore), 1)
        filledSQL = strings.Replace(filledSQL, "$6", fmt.Sprintf("'%s'", user.PayKey), 1)
        filledSQL = strings.Replace(filledSQL, "$7", fmt.Sprintf("'%s'", user.SignKey), 1)
        fmt.Println(filledSQL)
        fmt.Println("---------------------------------------------------")
        return
    }
    defer conn.Close(context.Background())

    _, err = conn.Exec(context.Background(), InsertUserSQL,
        user.ID,
        user.Username,
        user.Nickname,
        user.AvatarURL,
        user.PayScore,
        user.PayKey,
        user.SignKey,
    )
    if err != nil {
        if strings.Contains(err.Error(), "duplicate key") {
            fmt.Printf("⚠️  User %s (ID %d) already exists in DB. Skipping insert.\n", user.Username, user.ID)
        } else {
            fmt.Printf("❌ DB Insert Error: %v\n", err)
        }
    } else {
        fmt.Printf("✅ User inserted into Postgres successfully.\n")
    }
}

func generateSessionAndOutput(user UserData, redisDSN string, sessionSecret string, cookieName string) {
    sessionID := fmt.Sprintf("%X", securecookie.GenerateRandomKey(SessionIDBytes))

    data := map[interface{}]interface{}{
        "username": user.Username,
        "user_id":  uint64(user.ID),
    }

    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)
    if err := enc.Encode(&data); err != nil {
        log.Fatalf("Encoding error: %v", err)
    }

    var redisValueBuilder strings.Builder
    for _, b := range buf.Bytes() {
        redisValueBuilder.WriteString(fmt.Sprintf("\\x%02x", b))
    }
    redisHexVal := redisValueBuilder.String()

    s := securecookie.New([]byte(sessionSecret), nil)
    encodedCookie, err := s.Encode(cookieName, sessionID)
    if err != nil {
        log.Fatalf("Cookie signing error: %v", err)
    }

    redisKey := RedisKeyPrefix + sessionID
    savedToRedis := false

    opt, err := redis.ParseURL(redisDSN)
    if err == nil {
        rdb := redis.NewClient(opt)
        ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
        defer cancel()

        // Write bytes directly to Redis (go-redis handles binary safe strings)
        err := rdb.Set(ctx, redisKey, buf.Bytes(), SessionTTL).Err()
        if err == nil {
            fmt.Printf("✅ Session saved to Redis automatically.\n")
            savedToRedis = true
        }
    }

    fmt.Println("\n==================== SESSION RESULT ====================")
    if !savedToRedis {
        fmt.Println("⚠️  Could not write to Redis automatically. Run this command:")
        fmt.Printf("SET \"%s\" \"%s\"\n", redisKey, redisHexVal)
        fmt.Printf("EXPIRE \"%s\" %d\n", redisKey, int(SessionTTL.Seconds()))
        fmt.Println("--------------------------------------------------------")
    }

    fmt.Println("🍪 BROWSER COOKIE:")
    fmt.Printf("%s=%s\n", cookieName, encodedCookie)
    fmt.Println("========================================================\n")
}
