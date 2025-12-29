-- 排行榜聚合表（按周期 + 指标 + 用户预聚合）
-- 依赖：执行前请确保已 USE 到目标数据库

CREATE TABLE IF NOT EXISTS leaderboard_scores
(
    period_type  LowCardinality(String), -- day/week/month/all_time
    period_start Date,                   -- day=当天，week=周一，month=当月1号，all_time=固定值
    metric_type  LowCardinality(String), -- receive_amount/payment_amount/.../net_amount
    user_id      UInt64,
    score        Decimal(20, 2),
    updated_at   DateTime,

    INDEX idx_user_id user_id TYPE bloom_filter(0.01) GRANULARITY 4
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY (period_type, toYYYYMM(period_start))
ORDER BY (period_type, period_start, metric_type, user_id)
SETTINGS index_granularity = 8192;
