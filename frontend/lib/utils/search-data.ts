import PinyinMatch from 'pinyin-match'

type MatchResult = [number, number] | false;
type MatchFunction = (input: string, keys: string) => MatchResult;

// Handle CJS/ESM interop for pinyin-match
const match = ((): MatchFunction | null => {
  const p = PinyinMatch as unknown;
  if (!p) return null;

  // Check for .default.match (common in some ESM bundles)
  const withDefault = p as { default?: { match?: MatchFunction } };
  if (typeof withDefault.default?.match === 'function') {
    return withDefault.default.match;
  }

  // Check for .match (defined in its typings)
  const withMatch = p as { match?: MatchFunction };
  if (typeof withMatch.match === 'function') {
    return withMatch.match;
  }

  // Check if it's the function itself
  if (typeof p === 'function') {
    return p as MatchFunction;
  }

  return null;
})();
export interface SearchItem {
  id: string
  title: string
  description: string
  url: string
  category: 'page' | 'feature' | 'setting' | 'admin'
  keywords: string[]
  icon?: string
  matchRange?: [number, number]
}

/**
 * 全局搜索数据源
 * 包含所有可搜索的页面和功能
 */
export const searchData: SearchItem[] = [
  // ==================== 首页 ====================
  {
    id: 'home',
    title: '首页',
    description: '返回首页仪表板',
    url: '/home',
    category: 'page',
    keywords: ['home', '主页', '首页', 'dashboard'],
  },
  {
    id: 'home-disputes',
    title: '我的争议',
    description: '查看和处理我的争议',
    url: '/home',
    category: 'feature',
    keywords: ['dispute', '争议', '纠纷', 'my'],
  },
  {
    id: 'home-pending-disputes',
    title: '待处理的争议',
    description: '查看待处理的争议',
    url: '/home',
    category: 'feature',
    keywords: ['dispute', '争议', '待处理', 'pending'],
  },

  // ==================== 商户中心 ====================
  {
    id: 'merchant',
    title: '集市',
    description: '管理集市应用及其相关功能',
    url: '/merchant',
    category: 'page',
    keywords: ['merchant', '商户', '集市', '应用', '功能'],
  },
  {
    id: 'merchant-disputes',
    title: '处理争议',
    description: '您的争议活动',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '争议', 'dispute', '处理'],
  },
  {
    id: 'merchant-orders',
    title: '查看所有活动',
    description: '查看您的所有活动',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '商户', '订单', 'order', '查看'],
  },
  {
    id: 'merchant-create-online',
    title: '创建在线流转',
    description: '创建在线流转活动',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['merchant', '服务方', '创建', '在线', 'create', 'online'],
  },
  {
    id: 'merchant-create-app',
    title: '创建集市应用',
    description: '创建新的集市应用',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '创建', '应用', 'create', 'app'],
  },
  {
    id: 'merchant-transactions',
    title: '查看活动记录',
    description: '查看您的活动记录',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '交易', 'transaction', '记录'],
  },
  {
    id: 'merchant-app-info',
    title: '查看应用信息',
    description: '查看集市应用详细信息',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '应用', '信息', 'app', 'info'],
  },
  {
    id: 'merchant-app-config',
    title: '应用配置',
    description: '查看和编辑应用配置',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '配置', 'config', 'app'],
  },
  {
    id: 'merchant-edit-app',
    title: '编辑应用信息',
    description: '编辑集市应用信息',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '编辑', 'edit', 'app'],
  },
  {
    id: 'merchant-delete-app',
    title: '删除应用',
    description: '删除集市应用',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', '删除', 'delete', 'app'],
  },
  {
    id: 'merchant-client-id',
    title: '查看 Client ID',
    description: '查看应用 Client ID',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '服务方', 'client', 'id', '查看'],
  },
  {
    id: 'merchant-client-secret',
    title: '查看 Client Secret',
    description: '查看应用密钥',
    url: '/merchant',
    category: 'feature',
    keywords: ['merchant', '商户', 'client', 'secret', '密钥', '查看'],
  },

  // ==================== 在线收款 ====================
  {
    id: 'online-paying',
    title: '在线流转',
    description: '管理在线流转活动',
    url: '/merchant/online-paying',
    category: 'page',
    keywords: ['online', '在线', '流转', '活动', 'activity', 'link'],
  },
  {
    id: 'online-products',
    title: '活动列表',
    description: '查看所有在线活动',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['online', '在线', '商品', 'product', 'list', '列表'],
  },
  {
    id: 'online-create',
    title: '创建活动',
    description: '创建新的在线流转活动',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['online', '在线', '创建', 'create', 'activity'],
  },
  {
    id: 'online-manage',
    title: '管理活动',
    description: '管理在线流转活动',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['online', '在线', '管理', 'manage', 'activity'],
  },
  {
    id: 'online-delete',
    title: '删除活动',
    description: '删除在线流转活动',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['online', '在线', '删除', 'delete', 'activity'],
  },
  {
    id: 'online-preview',
    title: '实时预览',
    description: '预览在线流转页面效果',
    url: '/merchant/online-paying',
    category: 'feature',
    keywords: ['online', '在线', '预览', 'preview', '实时'],
  },

  // ==================== 余额管理 ====================
  {
    id: 'balance',
    title: '积分',
    description: '查看和管理您的积分余额',
    url: '/balance',
    category: 'page',
    keywords: ['balance', '余额', '积分', '充值', '提现', 'wallet'],
  },
  {
    id: 'balance-view',
    title: '查看积分余额',
    description: '查看您的积分余额',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '查看', 'view'],
  },
  {
    id: 'balance-report',
    title: '查看积分报告',
    description: '查看积分报告和统计',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '报告', 'report', '统计'],
  },
  {
    id: 'balance-activity',
    title: '查看交易活动',
    description: '查看积分交易活动',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '交易', '活动', 'activity'],
  },
  {
    id: 'balance-received',
    title: '近期积分收益',
    description: '查看近期积分收益记录',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '收益', 'receive', '近期'],
  },
  {
    id: 'balance-payment',
    title: '近期积分消耗',
    description: '查看近期积分消耗记录',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '消耗', 'payment', '近期'],
  },
  {
    id: 'balance-transfer',
    title: '近期积分转移',
    description: '查看近期积分转移记录',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '转移', 'transfer', '近期'],
  },
  {
    id: 'balance-community',
    title: '近期社区积分划转',
    description: '查看社区积分划转记录',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '余额', '社区', 'community', '划转', '近期'],
  },
  {
    id: 'balance-all',
    title: '近期所有活动',
    description: '查看所有积分活动',
    url: '/balance',
    category: 'feature',
    keywords: ['balance', '积分', '所有', 'all', '活动', '近期'],
  },

  // ==================== 交易记录 ====================
  {
    id: 'trade',
    title: '活动',
    description: '查看所有交易历史记录',
    url: '/trade',
    category: 'page',
    keywords: ['trade', '交易', '活动', '记录', '历史', 'transaction'],
  },
  {
    id: 'trade-received',
    title: '积分收益记录',
    description: '查看积分收益记录',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '收益', 'receive', '记录'],
  },
  {
    id: 'trade-payment',
    title: '积分消耗记录',
    description: '查看积分消耗记录',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '消耗', 'payment', '记录'],
  },
  {
    id: 'trade-transfer',
    title: '积分转移记录',
    description: '查看积分转移记录',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '转移', 'transfer', '记录'],
  },
  {
    id: 'trade-community',
    title: '社区积分划转记录',
    description: '查看社区积分划转记录',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '社区', 'community', '积分', '划转', '记录'],
  },
  {
    id: 'trade-all',
    title: '所有积分交易记录',
    description: '查看所有积分交易记录',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '积分', '所有', 'all', '记录'],
  },
  {
    id: 'trade-official-api',
    title: '接入官方积分服务',
    description: '集成官方积分服务API',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '积分', '接入', 'api', '官方', '服务'],
  },
  {
    id: 'trade-custom-form',
    title: '在线流转表单',
    description: '创建自定义在线流转表单',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '创建', '自定义', 'form', '表单'],
  },
  {
    id: 'trade-transfer-action',
    title: '转移积分',
    description: '发起积分转移操作',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '积分', '转移', 'transfer', '他人'],
  },
  {
    id: 'trade-overview',
    title: '数据概览',
    description: '查看积分交易数据统计',
    url: '/trade',
    category: 'feature',
    keywords: ['trade', '交易', '积分', '数据', 'data', '概览', 'overview'],
  },

  // ==================== 文档 ====================
  {
    id: 'docs-api',
    title: '接口文档',
    description: '查看 API 接口文档',
    url: '/docs/api',
    category: 'page',
    keywords: ['api', 'docs', '文档', '接口', 'documentation'],
  },
  {
    id: 'docs-official-api',
    title: '官方服务接口',
    description: '官方服务接口文档',
    url: '/docs/api',
    category: 'feature',
    keywords: ['api', 'docs', '文档', '官方', '支付', 'payment'],
  },
  {
    id: 'docs-epay-api',
    title: '易支付兼容接口',
    description: '易支付兼容接口文档',
    url: '/docs/api',
    category: 'feature',
    keywords: ['api', 'docs', '文档', '易支付', 'epay', '兼容'],
  },
  {
    id: 'docs-how-to-use',
    title: '使用文档',
    description: '查看使用教程和示例',
    url: '/docs/how-to-use',
    category: 'page',
    keywords: ['docs', '文档', '使用', 'how to', 'tutorial', '教程'],
  },

  // ==================== 设置 ====================
  {
    id: 'settings',
    title: '设置',
    description: '应用设置和偏好',
    url: '/settings',
    category: 'setting',
    keywords: ['settings', '设置', '偏好', 'preferences'],
  },
  {
    id: 'settings-all',
    title: '所有设置',
    description: '查看所有设置选项',
    url: '/settings',
    category: 'setting',
    keywords: ['settings', '设置', '所有', 'all'],
  },
  {
    id: 'settings-profile',
    title: '我的资料',
    description: '编辑个人信息和头像',
    url: '/settings/profile',
    category: 'setting',
    keywords: ['profile', '资料', '个人', '我的', '信息', '头像'],
  },
  {
    id: 'settings-profile-level',
    title: '会员等级',
    description: '查看会员等级和权益',
    url: '/settings/profile',
    category: 'setting',
    keywords: ['profile', '资料', '会员', 'level', '等级'],
  },
  {
    id: 'settings-profile-basic',
    title: '基本信息',
    description: '编辑基本个人信息',
    url: '/settings/profile',
    category: 'setting',
    keywords: ['profile', '资料', '基本', 'basic', '信息'],
  },
  {
    id: 'settings-appearance',
    title: '外观设置',
    description: '自定义界面主题和显示',
    url: '/settings/appearance',
    category: 'setting',
    keywords: ['appearance', '外观', '主题', 'theme', 'dark', 'light'],
  },
  {
    id: 'settings-theme-switch',
    title: '主题切换',
    description: '切换亮色/暗色主题',
    url: '/settings/appearance',
    category: 'setting',
    keywords: ['appearance', '外观', '主题', 'theme', '切换', 'switch'],
  },
  {
    id: 'settings-color-theme',
    title: '颜色主题',
    description: '选择颜色主题',
    url: '/settings/appearance',
    category: 'setting',
    keywords: ['appearance', '外观', '颜色', 'color', '主题'],
  },
  {
    id: 'settings-notification',
    title: '通知设置',
    description: '管理通知偏好',
    url: '/settings',
    category: 'setting',
    keywords: ['settings', '设置', '通知', 'notification'],
  },
  {
    id: 'settings-security',
    title: '安全设置',
    description: '账户安全和隐私设置',
    url: '/settings',
    category: 'setting',
    keywords: ['settings', '设置', '安全', 'security', '隐私'],
  },

  // ==================== 管理员 ====================
  {
    id: 'admin-system',
    title: '系统配置',
    description: '系统配置和管理',
    url: '/admin/system',
    category: 'admin',
    keywords: ['admin', '管理', '系统', '配置', 'system'],
  },
  {
    id: 'admin-user-pay',
    title: '积分配置',
    description: '管理用户支付等级和配置',
    url: '/admin/user_pay',
    category: 'admin',
    keywords: ['admin', '管理', '积分', '配置', 'payment', 'config'],
  },
]

/**
 * 搜索功能
 * @param query 搜索关键词
 * @param isAdmin 是否为管理员
 * @returns 匹配的搜索结果
 */
export function searchItems(query: string, isAdmin: boolean = false): SearchItem[] {
  const trimmedQuery = query.trim()
  
  // 非管理员不能搜索 admin 类别项
  const filteredData = isAdmin 
    ? searchData 
    : searchData.filter(item => item.category !== 'admin')

  if (!trimmedQuery) {
    return filteredData
  }

  return filteredData.map(item => {
    // 优先匹配标题
    const titleMatch = typeof match === 'function' ? match(item.title, trimmedQuery) : null
    if (titleMatch) {
      return { ...item, matchRange: titleMatch as [number, number] }
    }

    // 匹配描述
    if (typeof match === 'function' && match(item.description, trimmedQuery)) {
      return item
    }

    // 匹配关键词
    if (item.keywords.some(keyword => typeof match === 'function' && match(keyword, trimmedQuery))) {
      return item
    }

    return null
  }).filter((item): item is SearchItem => item !== null)
    .sort((a, b) => {
      // 标题匹配优先
      if (a.matchRange && !b.matchRange) return -1
      if (!a.matchRange && b.matchRange) return 1
      
      // 如果都是标题匹配，按匹配位置排序
      if (a.matchRange && b.matchRange) {
        return a.matchRange[0] - b.matchRange[0]
      }
      
      return 0
    })
}
