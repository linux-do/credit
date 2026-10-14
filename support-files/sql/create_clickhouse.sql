CREATE DATABASE IF NOT EXISTS linux_do_credit;

USE linux_do_credit;

-- 注意：payer_user_id / payee_user_id 使用 Int64（支持负数用户 ID，如中央银行账号 id=-1）。
-- 已有环境升级时需先执行：
--   ALTER TABLE linux_do_credit.orders MODIFY COLUMN payer_user_id Int64;
--   ALTER TABLE linux_do_credit.orders MODIFY COLUMN payee_user_id Int64;
CREATE TABLE IF NOT EXISTS orders
(
    id                UInt64,
    order_name        String,
    merchant_order_no String,
    client_id         String,
    payer_user_id     Int64,
    payee_user_id     Int64,
    amount            Decimal(20, 2),
    status            LowCardinality(String),
    type              LowCardinality(String),
    remark            String,
    payment_type      LowCardinality(String),
    trade_time        DateTime,
    expires_at        DateTime,
    created_at        DateTime,
    updated_at        DateTime
)
    ENGINE = ReplacingMergeTree(updated_at)
        PARTITION BY toYYYYMM(created_at)
        ORDER BY (created_at, id)
        SETTINGS index_granularity = 8192;

-- ============================================================
-- 常用查询示例
-- ============================================================

-- 查询单个订单（加 FINAL 获取最新版本）
-- SELECT * FROM orders FINAL WHERE id = 1001;

-- 按用户统计订单
-- SELECT payer_user_id, count() AS cnt, sum(amount) AS total
-- FROM orders FINAL
-- WHERE status = 'success'
-- GROUP BY payer_user_id;

-- 按月统计（利用分区裁剪）
-- SELECT toYYYYMM(created_at) AS month, count() AS orders, sum(amount) AS volume
-- FROM orders FINAL
-- GROUP BY month
-- ORDER BY month;
