/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package config

type configModel struct {
	App        appConfig        `mapstructure:"app"`
	OAuth2     OAuth2Config     `mapstructure:"oauth2"`
	Database   databaseConfig   `mapstructure:"database"`
	Redis      redisConfig      `mapstructure:"redis"`
	Log        logConfig        `mapstructure:"log"`
	Schedule   scheduleConfig   `mapstructure:"schedule"`
	Worker     workerConfig     `mapstructure:"worker"`
	ClickHouse clickHouseConfig `mapstructure:"clickhouse"`
	LinuxDo    linuxDoConfig    `mapstructure:"linuxdo"`
	Otel       otelConfig       `mapstructure:"otel"`
}

// appConfig 应用基本配置
type appConfig struct {
	AppName                 string `mapstructure:"app_name"`
	Env                     string `mapstructure:"env"`
	Addr                    string `mapstructure:"addr"`
	APIPrefix               string `mapstructure:"api_prefix"`
	GracefulShutdownTimeout int    `mapstructure:"graceful_shutdown_timeout"`
	FrontendPayURL          string `mapstructure:"frontend_pay_url"`
	SessionCookieName       string `mapstructure:"session_cookie_name"`
	SessionSecret           string `mapstructure:"session_secret"`
	SessionDomain           string `mapstructure:"session_domain"`
	SessionAge              int    `mapstructure:"session_age"`
	SessionHttpOnly         bool   `mapstructure:"session_http_only"`
	SessionSecure           bool   `mapstructure:"session_secure"`
}

// OAuth2Config OAuth2认证配置
type OAuth2Config struct {
	ClientID              string `mapstructure:"client_id"`
	ClientSecret          string `mapstructure:"client_secret"`
	RedirectURI           string `mapstructure:"redirect_uri"`
	AuthorizationEndpoint string `mapstructure:"authorization_endpoint"`
	TokenEndpoint         string `mapstructure:"token_endpoint"`
	UserEndpoint          string `mapstructure:"user_endpoint"`
}

// databaseConfig 数据库配置
type databaseConfig struct {
	Enabled                bool   `mapstructure:"enabled"`
	Host                   string `mapstructure:"host"`
	Port                   int    `mapstructure:"port"`
	Username               string `mapstructure:"username"`
	Password               string `mapstructure:"password"`
	Database               string `mapstructure:"database"`
	MaxIdleConn            int    `mapstructure:"max_idle_conn"`
	MaxOpenConn            int    `mapstructure:"max_open_conn"`
	ConnMaxLifetime        int    `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime        int    `mapstructure:"conn_max_idle_time"`
	LogLevel               string `mapstructure:"log_level"`
	SSLMode                string `mapstructure:"ssl_mode"`
	TimeZone               string `mapstructure:"time_zone"`
	ApplicationName        string `mapstructure:"application_name"`
	SearchPath             string `mapstructure:"search_path"`
	PreferSimpleProtocol   bool   `mapstructure:"prefer_simple_protocol"`
	StatementCacheCapacity int    `mapstructure:"statement_cache_capacity"`
	DefaultQueryExecMode   string `mapstructure:"default_query_exec_mode"`
}

// clickhouse 配置
type clickHouseConfig struct {
	Enabled         bool     `mapstructure:"enabled"`
	Hosts           []string `mapstructure:"hosts"`
	Username        string   `mapstructure:"username"`
	Password        string   `mapstructure:"password"`
	Database        string   `mapstructure:"database"`
	MaxIdleConn     int      `mapstructure:"max_idle_conn"`
	MaxOpenConn     int      `mapstructure:"max_open_conn"`
	ConnMaxLifetime int      `mapstructure:"conn_max_lifetime"`
	DialTimeout     int      `mapstructure:"dial_timeout"`
}

// redisConfig Redis配置
type redisConfig struct {
	Enabled         bool   `mapstructure:"enabled"`
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	DB              int    `mapstructure:"db"`
	PoolSize        int    `mapstructure:"pool_size"`
	MinIdleConn     int    `mapstructure:"min_idle_conn"`
	DialTimeout     int    `mapstructure:"dial_timeout"`
	ReadTimeout     int    `mapstructure:"read_timeout"`
	WriteTimeout    int    `mapstructure:"write_timeout"`
	MaxRetries      int    `mapstructure:"max_retries"`
	PoolTimeout     int    `mapstructure:"pool_timeout"`
	ConnMaxIdleTime int    `mapstructure:"conn_max_idle_time"`
}

// logConfig 日志配置
type logConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	FilePath   string `mapstructure:"file_path"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxAge     int    `mapstructure:"max_age"`
	MaxBackups int    `mapstructure:"max_backups"`
	Compress   bool   `mapstructure:"compress"`
}

// scheduleConfig 定时任务配置
type scheduleConfig struct {
	UserGamificationScoreDispatchIntervalSeconds int    `mapstructure:"user_gamification_score_dispatch_interval_seconds"`
	UpdateUserGamificationScoresTaskCron         string `mapstructure:"update_user_gamification_scores_task_cron"`
	DisputeAutoRefundDispatchIntervalSeconds     int    `mapstructure:"dispute_auto_refund_dispatch_interval_seconds"`
	AutoRefundExpiredDisputesTaskCron            string `mapstructure:"auto_refund_expired_disputes_task_cron"`
}

// workerConfig 工作配置
type workerConfig struct {
	Concurrency    int           `mapstructure:"concurrency"`
	StrictPriority bool          `mapstructure:"strict_priority"`
	Queues         []QueueConfig `mapstructure:"queues"`
}

// QueueConfig 队列配置
type QueueConfig struct {
	Name     string `mapstructure:"name"`
	Priority int    `mapstructure:"priority"`
}

// linuxDoConfig
type linuxDoConfig struct {
	ApiKey string `mapstructure:"api_key"`
}

// otelConfig OpenTelemetry 配置
type otelConfig struct {
	SamplingRate float64 `mapstructure:"sampling_rate"`
}
