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

export const DOCS_LAST_UPDATED = "2025-12-30"

/**
 * ------------------------------------------------------------------
 * API 文档
 * ------------------------------------------------------------------
 */
export const apiSections: PolicySection[] = [
  {
    value: "official-service",
    title: "1. 官方服务接口",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2">
          <p className="text-muted-foreground m-0">官方服务接口暂未上线，敬请期待</p>
        </div>
      </div>
    ),
  },
  {
    value: "epay-compatibility",
    title: "2. 易支付兼容接口",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 mb-6">
          <p className="text-muted-foreground m-0">兼容易支付、CodePay、VPay 等支付协议</p>
        </div>

        <h3 id="2-1-overview" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.1 概览</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li><strong>协议：</strong>EasyPay / CodePay / VPay 兼容协议</li>
          <li><strong>服务类型：</strong>仅支持 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">type=epay</code></li>
          <li><strong>网关基址：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">https://credit.linux.do/epay</code></li>
          <li><strong>订单有效期：</strong>取系统配置 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">merchant_order_expire_minutes</code>（平台端设置）</li>
        </ul>

        <h3 id="2-2-common-errors" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.2 常见错误</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">不支持的请求类型</code>：<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">type</code> 仅允许 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">epay</code></li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">签名验证失败</code>：参与签名字段与请求体需一致，密钥直接拼接</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">金额必须大于0</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">积分小数位数不能超过2位</code></li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">订单已过期</code>：超出系统配置有效期</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">订单不存在或已完成</code>：订单号错误、已退回或已完成</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">余额不足</code>：余额退回时用户积分不足</li>
        </ul>

        <h3 id="2-3-flow" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.3 对接流程</h3>
        <ol className="list-decimal pl-4 md:pl-5 space-y-2">
          <li>控制台创建 API Key，记录 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">pid</code>、<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">key</code>，配置回调地址</li>
          <li>按“签名算法”生成 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">sign</code>，调用 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">/pay/submit.php</code> 创建积分流转服务并跳转认证界面</li>
          <li>可通过 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">/api.php</code> 轮询结果，或等待异步回调</li>
          <li>退回服务时，携带同一 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">trade_no</code> 和原积分数量，调用积分退回接口</li>
          <li>回调验签通过后返回 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">success</code> 完成闭环</li>
        </ol>

        <h3 id="2-4-auth-sign" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.4 鉴权与签名</h3>
        <h4 className="font-medium text-foreground mt-3 md:mt-4 mb-2">2.4.1 API Key</h4>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-4">
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">pid</code>：Client ID</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">key</code>：Client Secret（妥善保管）</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">notify_url</code>：回调地址, 使用创建应用时设置的 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">notify_url</code>；请求体中的 notify_url 仅参与签名，不会覆盖创建应用时设置的 notify_url。</li>
        </ul>

        <h4 className="font-medium text-foreground mt-3 md:mt-4 mb-2">2.4.2 签名算法</h4>
        <div className="space-y-4">
          <ol className="list-decimal pl-4 md:pl-5 space-y-2">
            <li>取所有非空字段（排除 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">sign</code>、<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">sign_type</code> 字段）</li>
            <li>将上述字段按 ASCII 升序，依次拼成 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">k1=v1&k2=v2</code></li>
            <li>在末尾追加应用密钥：<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">k1=v1&k2=v2{"{secret}"}</code></li>
            <li>整体进行 MD5，取小写十六进制作为 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">sign</code></li>
          </ol>
          <CodeBlock
            code={`payload="money=10&name=Test&out_trade_no=M20250101&pid=001&type=epay"
sign=$(echo -n "\${payload}\${SECRET}" | md5)  # 输出小写`}
            language="bash"
          />
        </div>

        <h3 id="2-5-submit" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.5 积分流转服务</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-6">
          <li><strong>方法：</strong>POST <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">/pay/submit.php</code></li>
          <li><strong>编码：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">application/x-www-form-urlencoded</code></li>
          <li><strong>成功：</strong>验签通过后，平台自动创建积分流转服务，并跳转到认证界面（Location=<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">https://credit.linux.do/paying?order_no=...</code>）</li>
          <li><strong>失败：</strong>返回 JSON <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">{`{"error_msg":"...", "data":null}`}</code></li>
        </ul>

        <DocsTable>
          <DocsTableHeader>
            <DocsTableRow>
              <DocsTableHead>参数</DocsTableHead>
              <DocsTableHead>必填</DocsTableHead>
              <DocsTableHead>说明</DocsTableHead>
            </DocsTableRow>
          </DocsTableHeader>
          <DocsTableBody>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">pid</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>Client ID</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">type</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>固定 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">epay</code></DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">out_trade_no</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>业务单号，建议全局唯一</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">name</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>标题，最多 64 字符</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">money</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>积分数量，最多 2 位小数</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">notify_url</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>仅参与签名，不会覆盖创建应用时设置的 notify_url</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">return_url</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>仅参与签名，不会覆盖创建应用时设置的 return_url</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">device</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>终端标识，可选</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">sign</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>按“签名算法”生成</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">sign_type</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>固定 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">MD5</code></DocsTableCell>
            </DocsTableRow>
          </DocsTableBody>
        </DocsTable>

        <p className="text-muted-foreground mb-2">请求示例：</p>
        <CodeBlock
          code={`curl -X POST https://credit.linux.do/epay/pay/submit.php \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "pid=001" \\
  -d "type=epay" \\
  -d "out_trade_no=M20250101" \\
  -d "name=Test" \\
  -d "money=10" \\
  -d "sign=\${SIGN}" \\
  -d "sign_type=MD5"`}
          language="bash"
        />

        <h3 id="2-6-order" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.6 订单查询</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-6">
          <li><strong>方法：</strong>GET <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">/api.php</code></li>
          <li><strong>认证：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">pid</code> + <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">key</code></li>
          <li><strong>说明：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">trade_no</code> 必填；<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">out_trade_no</code> 可选；<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">act</code> 可传 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">order</code>，后端不强校验。</li>
        </ul>

        <DocsTable>
          <DocsTableHeader>
            <DocsTableRow>
              <DocsTableHead>参数</DocsTableHead>
              <DocsTableHead>必填</DocsTableHead>
              <DocsTableHead>说明</DocsTableHead>
            </DocsTableRow>
          </DocsTableHeader>
          <DocsTableBody>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">act</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>可选字段，建议 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">order</code></DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">pid</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>Client ID</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">key</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>Client Secret</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">trade_no</DocsTableCell>
              <DocsTableCell>是</DocsTableCell>
              <DocsTableCell>编号</DocsTableCell>
            </DocsTableRow>
            <DocsTableRow>
              <DocsTableCell className="font-mono text-xs">out_trade_no</DocsTableCell>
              <DocsTableCell>否</DocsTableCell>
              <DocsTableCell>业务单号</DocsTableCell>
            </DocsTableRow>
          </DocsTableBody>
        </DocsTable>

        <p className="text-muted-foreground mb-2">成功响应：</p>
        <CodeBlock
          code={`{
  "code": 1,
  "msg": "查询订单号成功！",
  "trade_no": "M20250101",
  "out_trade_no": "M20250101",
  "type": "epay",
  "pid": "001",
  "addtime": "2025-01-01 12:00:00",
  "endtime": "2025-01-01 12:01:30",
  "name": "Test",
  "money": "10",
  "status": 1
}`}
          language="json"
        />
        <p className="text-muted-foreground text-xs"><strong className="text-foreground">补充：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">status</code> 1=成功，0=失败/处理中；不存在会返回 HTTP 404 且 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">{`{"code":-1,"msg":"服务不存在或已完成"}`}</code>。</p>

        <h3 id="2-7-refund" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.7 订单退款</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-6">
          <li><strong>方法：</strong>POST <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">/api.php</code></li>
          <li><strong>编码：</strong><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">application/json</code> 或 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">application/x-www-form-urlencoded</code></li>
          <li><strong>限制：</strong>仅支持对已成功的积分流转服务进行积分的全额退回</li>
        </ul>

        <div>
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead>参数</DocsTableHead>
                <DocsTableHead>必填</DocsTableHead>
                <DocsTableHead>说明</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">pid</DocsTableCell>
                <DocsTableCell>是</DocsTableCell>
                <DocsTableCell>Client ID</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">key</DocsTableCell>
                <DocsTableCell>是</DocsTableCell>
                <DocsTableCell>Client Secret</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">trade_no</DocsTableCell>
                <DocsTableCell>是</DocsTableCell>
                <DocsTableCell>编号</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">money</DocsTableCell>
                <DocsTableCell>是</DocsTableCell>
                <DocsTableCell>必须等于原积分流转服务的积分数量</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">out_trade_no</DocsTableCell>
                <DocsTableCell>否</DocsTableCell>
                <DocsTableCell>业务单号（兼容）</DocsTableCell>
              </DocsTableRow>
            </DocsTableBody>
          </DocsTable>
        </div>

        <p className="text-muted-foreground mb-2">响应：</p>
        <CodeBlock code={`{ "code": 1, "msg": "退款成功" }`} language="json" />
        <p className="text-muted-foreground text-xs"><strong className="text-foreground">常见失败：</strong>服务不存在/未认证、金额不合法（&lt;=0 或小数超过 2 位）。</p>


        <h3 id="2-8-notify" className="text-base md:text-lg font-semibold text-foreground mt-6 md:mt-8 mb-3 md:mb-4">2.8 异步通知（认证成功）</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-2 mb-6">
          <li><strong>触发：</strong>认证成功后；失败自动重试，最多 5 次（单次 30s 超时）</li>
          <li><strong>目标：</strong>创建应用时设置的 notify_url</li>
          <li><strong>方式：</strong>HTTP GET</li>
        </ul>

        <div>
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead>参数</DocsTableHead>
                <DocsTableHead>说明</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">pid</DocsTableCell>
                <DocsTableCell>Client ID</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">trade_no</DocsTableCell>
                <DocsTableCell>编号</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">out_trade_no</DocsTableCell>
                <DocsTableCell>业务单号</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">type</DocsTableCell>
                <DocsTableCell>固定 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">epay</code></DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">name</DocsTableCell>
                <DocsTableCell>标题</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">money</DocsTableCell>
                <DocsTableCell>积分数量，最多 2 位小数</DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">trade_status</DocsTableCell>
                <DocsTableCell>固定 <code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">TRADE_SUCCESS</code></DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">sign_type</DocsTableCell>
                <DocsTableCell><code className="bg-muted px-1 rounded text-xs before:content-none after:content-none">MD5</code></DocsTableCell>
              </DocsTableRow>
              <DocsTableRow>
                <DocsTableCell className="font-mono text-xs">sign</DocsTableCell>
                <DocsTableCell>按“签名算法”生成</DocsTableCell>
              </DocsTableRow>
            </DocsTableBody>
          </DocsTable>
        </div>
        <p className="text-muted-foreground text-xs">应用需返回 HTTP 200 且响应体为 <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono before:content-none after:content-none">success</code>（大小写不敏感），否则视为失败并继续重试。</p>
      </div>
    ),
    children: [
      { value: "2-1-overview", title: "2.1 概览" },
      { value: "2-2-common-errors", title: "2.2 常见错误" },
      { value: "2-3-flow", title: "2.3 对接流程" },
      { value: "2-4-auth-sign", title: "2.4 鉴权与签名" },
      { value: "2-5-submit", title: "2.5 积分流转服务" },
      { value: "2-6-order", title: "2.6 订单查询" },
      { value: "2-7-refund", title: "2.7 订单退款" },
      { value: "2-8-notify", title: "2.8 异步通知" },
    ]
  },
]
