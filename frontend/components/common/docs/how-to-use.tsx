import { type PolicySection } from "./types"
import { CodeBlock } from "@/components/ui/code-block"
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableHead,
  DocsTableRow,
  DocsTableCell,
} from "@/components/ui/docs-table"

/**
 * ------------------------------------------------------------------
 * 使用指南 (How To Use)
 * ------------------------------------------------------------------
 */
export const howToUseSections: PolicySection[] = [
  {
    value: "quick-start",
    title: "1. 快速开始",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 mb-6">
          <p className="text-muted-foreground m-0">为社区开发者与用户提供完整的平台使用说明</p>
        </div>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>身份认证：</strong>基于 LINUX DO Connect (OAuth)</li>
          <li><strong>认证方式：</strong>账户积分消耗认证</li>
          <li><strong>手续费：</strong>动态费率，由服务方承担</li>
          <li><strong>争议处理：</strong>支持服务方与消费方的双方争议处理</li>
        </ul>
      </div>
    )
  },
  {
    value: "roles",
    title: "2. 角色说明",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>服务方：</strong>最终积分流转的转入方</li>
          <li><strong>消费方：</strong>最终积分流转的转出方</li>
          <li><strong>认证平台：</strong>LINUX DO Credit 系统本身</li>
        </ul>
      </div>
    )
  },
  {
    value: "integration",
    title: "3. 接入积分服务",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <h3 id="3-1-api" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">3.1 使用 API 接口</h3>
        <ol className="list-decimal pl-4 md:pl-5 space-y-2">
          <li>
            <strong>创建应用</strong>
            <ul className="list-disc pl-4 md:pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>前往 <a href="/merchant" className="text-primary hover:underline">集市中心</a></li>
              <li>点击顶部右侧 <strong>创建应用</strong> 按钮</li>
              <li>填写必要信息：应用名称、应用主页、回调地址、通知地址</li>
            </ul>
          </li>
          <li>
            <strong>获取 API 凭证</strong>
            <ul className="list-disc pl-4 md:pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>在集市中心顶部右侧选择器中选择您的应用</li>
              <li>在 <strong>API 配置</strong> 面板中获取：
                <ul className="list-[circle] pl-4 md:pl-5 mt-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">Client ID</code>：客户端ID，用于标识您的身份</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">Client Secret</code>：客户端密钥，用于签名验证（<strong>请妥善保管，切勿泄露</strong>）</li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <strong>使用 API 接口</strong>
            <ul className="list-disc pl-4 md:pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>使用 API 接口创建积分流转服务</li>
              <li>参考文档：<a href="/docs/api" className="text-primary hover:underline">API 接口文档</a></li>
            </ul>
          </li>
        </ol>

        <h3 id="3-2-online" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">3.2 使用在线服务</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-4">
          <li><strong>适用场景：</strong>无代码开发基础，或只用于简单的积分服务。</li>
          <li><strong>操作步骤：</strong>
            <ol className="list-decimal pl-4 md:pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>前往 <a href="/merchant" className="text-primary hover:underline">集市中心</a> 创建应用，获取 API 凭证</li>
              <li>选择应用，点击 <strong>在线收款</strong> 功能</li>
              <li>创建在线积分服务</li>
              <li>获取唯一积分服务链接</li>
              <li>发送给您所服务的客户使用</li>
            </ol>
          </li>
        </ul>

        <h3 id="3-3-new-api" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">3.3 快速集成 New API</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-4">
          <li><strong>适用场景：</strong>New API 站点，LINUX DO Credit 兼容 EasyPay 协议，公益站站长可直接集成。</li>
          <li><strong>操作步骤：</strong>
            <ol className="list-decimal pl-4 md:pl-5 mt-2 space-y-2 text-muted-foreground">
              <li>
                前往 <a href="/merchant" className="text-primary hover:underline">集市中心</a>，点击 <strong>创建应用</strong>，填写 New API 站点信息：
                <div className="my-4">
                  <DocsTable>
                    <DocsTableHeader>
                      <DocsTableRow>
                        <DocsTableHead>字段</DocsTableHead>
                        <DocsTableHead>值</DocsTableHead>
                      </DocsTableRow>
                    </DocsTableHeader>
                    <DocsTableBody>
                      <DocsTableRow>
                        <DocsTableCell>应用名称</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">您的应用名称</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>应用主页</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">https://{"{您的 New API 域名}"}</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>回调地址</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">https://{"{您的 New API 域名}"}/console/log</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>通知地址</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">https://{"{您的 New API 域名}"}/api/user/epay/notify</code></DocsTableCell>
                      </DocsTableRow>
                    </DocsTableBody>
                  </DocsTable>
                </div>
              </li>
              <li>前往 New API 站点的系统设置，找到 <strong>支付设置</strong>。</li>
              <li>
                配置 LINUX DO Credit 平台参数：
                <div className="my-4">
                  <DocsTable>
                    <DocsTableHeader>
                      <DocsTableRow>
                        <DocsTableHead>参数</DocsTableHead>
                        <DocsTableHead>值</DocsTableHead>
                      </DocsTableRow>
                    </DocsTableHeader>
                    <DocsTableBody>
                      <DocsTableRow>
                        <DocsTableCell>支付地址</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">https://credit.linux.do/epay/pay</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>易支付商户ID</DocsTableCell>
                        <DocsTableCell>您的 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">Client ID</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>易支付商户密钥</DocsTableCell>
                        <DocsTableCell>您的 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">Client Secret</code></DocsTableCell>
                      </DocsTableRow>
                      <DocsTableRow>
                        <DocsTableCell>回调地址</DocsTableCell>
                        <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">https://{"{您的 New API 域名}"}</code></DocsTableCell>
                      </DocsTableRow>
                    </DocsTableBody>
                  </DocsTable>
                </div>
              </li>
              <li>
                配置充值方式（JSON 格式）：
                <div className="my-4">
                  <CodeBlock
                    code={`[
  {"color":"rgba(var(--semi-blue-5), 1)","name":"支付宝","type":"alipay"},
  {"color":"rgba(var(--semi-green-5), 1)","name":"微信","type":"wxpay"},
  {"color":"black","name":"Linux Do Credit","type":"epay"}
]`}
                    language="json"
                  />
                </div>
              </li>
            </ol>
          </li>
        </ul>
      </div>
    ),
    children: [
      { value: "3-1-api", title: "3.1 使用 API 接口" },
      { value: "3-2-online", title: "3.2 使用在线服务" },
      { value: "3-3-new-api", title: "3.3 快速集成 New API" },
    ]
  },
  {
    value: "usage",
    title: "4. 使用 LINUX DO Credit 积分",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>您可以在任意支持 LINUX DO Credit 的平台下使用积分。在其他平台点击使用 LINUX DO Credit 积分时，会自动跳转到 LINUX DO Credit 的积分流转服务页面，您只需要确认积分流转信息无误，并选择使用 LINUX DO Credit 进行账户认证，即可完成整个交易服务。</p>
      </div>
    )
  },
  {
    value: "fees",
    title: "5. 服务（手续）费",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <h3 id="5-1-rules" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">5.1 规则说明</h3>
        <p>为了更好的维持 LINUX DO Credit 平台的积分服务机制，保证社区积分的生态可持续发展，我们会按照规范进行不同程度的服务（手续）费用收取。</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li><strong>承担方：</strong>服务（手续）费默认<strong>由服务方承担</strong></li>
          <li><strong>消费方使用：</strong>不会产生额外费用</li>
          <li><strong>服务方实收：</strong>订单金额 - 服务（手续）费</li>
        </ul>
        <div className="mt-4">
          <p className="font-mono text-xs mb-2 text-muted-foreground">计算公式：</p>
          <CodeBlock
            code={`手续费 = 订单金额 × 当前费率
商家实际到账 = 订单金额 - 手续费`}
            language="text"
          />
        </div>

        <h3 id="5-2-dynamic" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">5.2 动态费率</h3>
        <p>费率并非固定不变，会根据以下因素动态调整：</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1">
          <li>服务方平台等级</li>
          <li>服务方平台积分</li>
          <li>LINUX DO Credit 平台活动</li>
        </ul>
      </div>
    ),
    children: [
      { value: "5-1-rules", title: "5.1 规则说明" },
      { value: "5-2-dynamic", title: "5.2 动态费率" },
    ]
  },
  {
    value: "dispute",
    title: "6. 争议处理",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>为了保障服务方与消费方的合法权益，当积分服务出现纠纷时，可使用争议功能。</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li>作为服务方，您需要及时响应消费方的争议请求：
            <ol className="list-decimal pl-4 md:pl-5 mt-1 text-muted-foreground">
              <li>在集市中心或通知中查看到 <strong>待处理的争议</strong></li>
              <li>查看消费方理由，选择操作：
                <ul className="list-[circle] pl-5 mt-1">
                  <li><strong>同意：</strong>认可消费方诉求，积分原路退回给消费方</li>
                  <li><strong>拒绝：</strong>如果您认为已履约，请提交相关证据</li>
                </ul>
              </li>
            </ol>
          </li>
        </ul>
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-2 rounded-lg mt-4">
          <p className="m-0 text-sm">
            <strong>重要：</strong>建议服务方与消费方优先沟通解决。长时间未处理的争议会由 LINUX DO Credit 平台介入仲裁，这可能会影响您的服务方信誉。
          </p>
        </div>
      </div>
    )
  },
  {
    value: "transfer",
    title: "7. 积分转移",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg mt-4">
          <p className="m-0 text-sm">
            <strong>重要：</strong>积分转移功能已下架，请遵循积分使用规范并使用正确流转功能继续！
          </p>
        </div>
      </div>
    )
  },
  {
    value: "community-balance",
    title: "8. 社区积分",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>您的 LINUX DO Credit 平台基础积分主要由 <strong>社区积分 (Community Balance)</strong> 划转而来。</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li><strong>基本获取方式：</strong>通过在 LINUX DO 社区的活跃行为获得：
            <ul className="list-[circle] pl-4 md:pl-5 mt-1 text-muted-foreground">
              <li>点赞、阅读、解决问题等社区贡献</li>
              <li>详情可见 <a href="https://linux.do/t/topic/1355933" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LINUX DO 社区</a></li>
            </ul>
          </li>
          <li><strong>划转规则：</strong>
            <ul className="list-[circle] pl-4 md:pl-5 mt-1 text-muted-foreground">
              <li>划转时间：社区积分每日凌晨 <strong>00:00</strong> 自动划转至可用余额</li>
              <li>限制说明：划转前不可用于任何积分服务</li>
              <li>服务费用：目前不收取任何划转 <strong>服务费</strong></li>
            </ul>
          </li>
        </ul>
      </div>
    )
  },
  {
    value: "settings",
    title: "9. 账户设置",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>您可以在 <strong>设置 (Settings)</strong> 页面管理您的账户信息。</p>
        <h3 className="text-base md:text-lg font-semibold text-foreground mt-4 mb-2">功能列表</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-1">
          <li><strong>个人资料：</strong>查看当前的账户信息和会员等级</li>
          <li><strong>安全设置：</strong>修改认证密码</li>
          <li><strong>外观设置：</strong>切换页面主题、界面外观</li>
        </ul>
      </div>
    )
  },
  {
    value: "scripts",
    title: "10. 辅助脚本",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>为了方便用户随时查看当前的实时积分收入，我们提供了开源的 Userscript 脚本。</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li><strong>功能：</strong>在 LINUX DO 显示实时积分收入，支持拖拽，不影响界面。</li>
          <li><strong>获取：</strong>仅需安装 Tampermonkey 插件即可使用。</li>
          <li><strong>安装：</strong>
            <a
              href="https://linux.do/t/topic/1365853"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              「LINUX DO Credit」实时积分收入脚本
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
            </a>
          </li>
        </ul>
        <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 mt-2">
          <p className="text-xs text-muted-foreground m-0">
            注：脚本完全开源且安全，仅通过官方 API 获取公开数据，不涉及任何敏感权限。
          </p>
        </div>
      </div>
    )
  }
]
