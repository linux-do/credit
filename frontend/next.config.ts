import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
  },
  async rewrites() {
    const backendUrl = process.env.LINUX_DO_CREDIT_BACKEND_URL || 'http://localhost:8000';
    return [
      // 易支付兼容接口 - 创建订单
      {
        source: '/epay/pay/:path*',
        destination: `${ backendUrl }/pay/:path*`,
      },
      // 易支付兼容接口 - 查询订单和退款
      {
        source: '/epay/api.php',
        destination: `${ backendUrl }/api.php`,
      },
      // Credit 协议接口 - 商户分发
      {
        source: '/lpay/distribute',
        destination: `${ backendUrl }/pay/distribute`,
      },
      // 标准 RESTful API 接口
      {
        source: '/api/:path*',
        destination: `${ backendUrl }/api/:path*`,
      }
    ];
  },
};

export default nextConfig;
