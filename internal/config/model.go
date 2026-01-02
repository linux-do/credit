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

package config

type configModel struct {
	App        appConfig        `mapstructure:"app"`
	OAuth2     OAuth2Config     `mapstructure:"oauth2"`
	Database   databaseConfig   `mapstructure:"database"`
	Redis      redisConfig      `mapstructure:"redis"`
	Log        logConfig        `mapstructure:"log"`
	Scheduler  schedulerConfig  `mapstructure:"scheduler"`
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
	NodeID                  int64  `mapstructure:"node_id"`
	APIPrefix               string `mapstructure:"api_prefix"`
	GracefulShutdownTimeout int    `mapstructure:"graceful_shutdown_timeout"`
	FrontendURL             string `mapstructure:"frontend_url"`
	FrontendPayURL          string `mapstructure:"frontend_pay_url"`
	SessionCookieName       string `mapstructure:"session_cookie_name"`
	SessionSecret           string `mapstructure:"session_secret"`
	SessionDomain           string `mapstructure:"session_domain"`
	SessionAge              int    `mapstructure:"session_age"`
	SessionHttpOnly         bool   `mapstructure:"session_http_only"`
	SessionSecure           bool   `mapstructure:"session_secure"`
}

// IsProduction 检查当前环境是否为生产环境
func (a *appConfig) IsProduction() bool {
	return a.Env == "production"
}

// OAuth2Config OAuth2/OIDC认证配置
type OAuth2Config struct {
	ClientID              string `mapstructure:"client_id"`
	ClientSecret          string `mapstructure:"client_secret"`
	RedirectURI           string `mapstructure:"redirect_uri"`
	Issuer                string `mapstructure:"issuer"`
	AuthorizationEndpoint string `mapstructure:"authorization_endpoint"`
	TokenEndpoint         string `mapstructure:"token_endpoint"`
	UserEndpoint          string `mapstructure:"user_endpoint"`
}

// databaseConfig 数据库配置
type databaseConfig struct {
	Enabled                bool                    `mapstructure:"enabled"`
	Host                   string                  `mapstructure:"host"`
	Port                   int                     `mapstructure:"port"`
	Username               string                  `mapstructure:"username"`
	Password               string                  `mapstructure:"password"`
	Database               string                  `mapstructure:"database"`
	MaxIdleConn            int                     `mapstructure:"max_idle_conn"`
	MaxOpenConn            int                     `mapstructure:"max_open_conn"`
	ConnMaxLifetime        int                     `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime        int                     `mapstructure:"conn_max_idle_time"`
	LogLevel               string                  `mapstructure:"log_level"`
	SSLMode                string                  `mapstructure:"ssl_mode"`
	TimeZone               string                  `mapstructure:"time_zone"`
	ApplicationName        string                  `mapstructure:"application_name"`
	SearchPath             string                  `mapstructure:"search_path"`
	PreferSimpleProtocol   bool                    `mapstructure:"prefer_simple_protocol"`
	StatementCacheCapacity int                     `mapstructure:"statement_cache_capacity"`
	DefaultQueryExecMode   string                  `mapstructure:"default_query_exec_mode"`
	Replicas               []databaseReplicaConfig `mapstructure:"replicas"`
}

// databaseReplicaConfig 只读副本配置
type databaseReplicaConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
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
	BlockBufferSize uint8    `mapstructure:"block_buffer_size"`
}

// redisConfig Redis配置
type redisConfig struct {
	Enabled         bool     `mapstructure:"enabled"`
	Addrs           []string `mapstructure:"addrs"`
	Username        string   `mapstructure:"username"`
	Password        string   `mapstructure:"password"`
	DB              int      `mapstructure:"db"`
	ClusterMode     bool     `mapstructure:"cluster_mode"`
	MasterName      string   `mapstructure:"master_name"`
	KeyPrefix       string   `mapstructure:"key_prefix"`
	PoolSize        int      `mapstructure:"pool_size"`
	MinIdleConn     int      `mapstructure:"min_idle_conn"`
	DialTimeout     int      `mapstructure:"dial_timeout"`
	ReadTimeout     int      `mapstructure:"read_timeout"`
	WriteTimeout    int      `mapstructure:"write_timeout"`
	MaxRetries      int      `mapstructure:"max_retries"`
	PoolTimeout     int      `mapstructure:"pool_timeout"`
	ConnMaxIdleTime int      `mapstructure:"conn_max_idle_time"`
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

// schedulerConfig 定时任务配置
type schedulerConfig struct {
	UpdateUserGamificationScoresTaskCron     string `mapstructure:"update_user_gamification_scores_task_cron"`
	DisputeAutoRefundDispatchIntervalSeconds int    `mapstructure:"dispute_auto_refund_dispatch_interval_seconds"`
	AutoRefundExpiredDisputesTaskCron        string `mapstructure:"auto_refund_expired_disputes_task_cron"`
	SyncOrdersToClickHouseTaskCron           string `mapstructure:"sync_orders_to_clickhouse_task_cron"`
	RefundExpiredRedEnvelopesTaskCron        string `mapstructure:"refund_expired_red_envelopes_task_cron"`
}

// workerConfig 工作配置
type workerConfig struct {
	Concurrency                int             `mapstructure:"concurrency"`
	StrictPriority             bool            `mapstructure:"strict_priority"`
	Queues                     []QueueConfig   `mapstructure:"queues"`
	GamificationScoreRateLimit RateLimitConfig `mapstructure:"gamification_score_rate_limit"`
}

// QueueConfig 队列配置
type QueueConfig struct {
	Name     string `mapstructure:"name"`
	Priority int    `mapstructure:"priority"`
}

// RateLimitConfig 速率限制配置（N次/M秒）
type RateLimitConfig struct {
	Rate   int `mapstructure:"rate"`   // 允许的请求次数
	Period int `mapstructure:"period"` // 时间周期（秒）
}

// linuxDoConfig
type linuxDoConfig struct {
	ApiKey string `mapstructure:"api_key"`
}

// otelConfig OpenTelemetry 配置
type otelConfig struct {
	SamplingRate float64 `mapstructure:"sampling_rate"`
}
