import { type PolicySection } from "./types";

/**
 * ------------------------------------------------------------------
 * 隐私政策 (PRIVACY POLICY)
 * ------------------------------------------------------------------
 */
export const privacySections: PolicySection[] = [
  {
    value: "collection-details",
    title: "1. 详细信息收集说明",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          我们仅遵循合法、正当、必要的原则，收集为您提供服务所必需的信息。我们的数据收集范围严格限制如下：
        </p>
        <div className="space-y-3">
          <div>
            <span className="font-semibold text-foreground">
              1.1 身份鉴权信息：
            </span>
            <p className="mt-1 text-muted-foreground">
              当您通过 LINUX DO Connect 登录时，我们会获取您的社区
              OpenID（唯一标识符）、加密后的用户名及头像 URL。
              <strong>我们不收集您的手机号、真实姓名或身份证件信息。</strong>
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              1.2 服务日志信息：
            </span>
            <p className="mt-1 text-muted-foreground">
              为保障系统运行安全及满足法律合规要求，我们会自动收集您的操作日志，包括
              IP 地址、访问日期和时间、API
              调用记录、User-Agent（浏览器/设备类型）。
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              1.3 交易与资产信息：
            </span>
            <p className="mt-1 text-muted-foreground">
              若您使用支付或转账功能，我们将记录您的商户订单号、交易金额、交易时间、交易状态摘要。这些信息是账务核对的必要依据。
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "storage-security",
    title: "2. 数据存储与安全保护",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>我们深知数据安全的重要性，并采取业界领先的技术措施保护您的数据：</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li>
            <strong>存储地点：</strong>
            依照法规要求，我们收集和产生的用户个人信息，
            <strong>存储在独立</strong>
            的服务器上。我们不会将您的数据传输至境外管辖区。
          </li>
          <li>
            <strong>加密技术：</strong>敏感数据（如
            支付密码）在数据库中均采用高强度加密算法存储。数据传输全链路采用
            SSL/TLS 1.3 协议进行加密，防止网络嗅探。
          </li>
          <li>
            <strong>隔离机制：</strong>本平台数据与外部网络物理隔离，且独立于
            LINUX DO 社区论坛主数据库，确保单一系统故障不会波及全局数据安全。
          </li>
          <li>
            <strong>访问控制：</strong>我们实行严格的最小权限原则（Least
            Privilege），仅有核心运维人员经授权后方可访问必要的维护数据，且所有操作均有审计日志留存。
          </li>
        </ul>
      </div>
    ),
  },
  {
    value: "usage-rules",
    title: "3. 信息使用规范",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>我们收集的信息将仅用于以下目的：</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1">
          <li>
            <strong>身份识别：</strong>
            用于确认您的社区身份，展示您的个人中心数据。
          </li>
          <li>
            <strong>业务功能：</strong>处理您的支付指令、API
            请求、回调通知及账单生成。
          </li>
          <li>
            <strong>安全风控：</strong>利用 IP
            及行为日志进行反作弊、反欺诈分析，识别恶意攻击行为，保护平台及其他用户的安全。
          </li>
          <li>
            <strong>客户支持：</strong>
            在您发起工单或申诉时，查询相关日志以协助您解决问题。
          </li>
        </ul>
        <p>
          <strong>禁止用途：</strong>我们承诺<strong>绝不</strong>
          利用您的数据进行用户画像分析、个性化广告推送或商业营销。
        </p>
      </div>
    ),
  },
  {
    value: "sharing-disclosure",
    title: "4. 信息共享与对外披露",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>4.1 共享原则：</strong>我们坚持<strong>数据零共享</strong>
          策略。除以下极端情况外，我们不会向任何第三方（包括且不限于关联公司、支付宝、微信、银行、广告商）共享您的个人信息：
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 text-muted-foreground">
          <li>事先获得您的明确授权或同意；</li>
          <li>
            根据适用的法律法规、法律程序的要求、强制性的行政或司法要求所必须的情况下进行提供。
          </li>
        </ul>
        <p>
          <strong>4.2 转让与公开披露：</strong>
          我们不会将您的个人信息转让给任何公司、组织和个人。我们仅在法律法规强制要求，或为了保护平台及用户与公众的人身财产安全免受侵害时，才会公开披露您的信息。
        </p>
      </div>
    ),
  },
  {
    value: "user-rights",
    title: "5. 您的权利与数据管理",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          依照《中华人民共和国个人信息保护法》，您对您的个人信息享有完整的控制权：
        </p>
        <div className="space-y-3">
          <div>
            <span className="font-semibold text-foreground">
              5.1 查阅与复制权：
            </span>
            <p className="mt-1 text-muted-foreground">
              您可以随时登录开发者后台，查阅您的概览信息、API Key
              状态及历史交易账单。您可以通过“导出账单”功能获取您的数据副本。
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              5.2 删除与遗忘权：
            </span>
            <p className="mt-1 text-muted-foreground">
              若您决定停止使用本服务，在结清所有应付费用及余额后，您可以申请
              <strong>注销账户</strong>
              。注销后，我们将立即删除您的所有敏感信息或进行匿名化处理，法律法规规定需保留的日志除外。
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              5.3 纠正与更正权：
            </span>
            <p className="mt-1 text-muted-foreground">
              若您发现您的信息有误，您有权要求我们更正或补充。您可以在设置页面直接修改您的信息，或通过客服提交工单。
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "policy-update",
    title: "6. 政策更新与通知",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          随着业务的发展或法律法规的变动，我们可能会适时修订本《隐私政策》。
        </p>
        <p>
          当条款发生重大变更时（例如收集范围扩大、使用目的改变），我们会通过站内信、公告或弹窗等显著方式通知您。若您在政策更新后继续使用本服务，即表示您同意接受更新后的隐私政策约束。
        </p>
      </div>
    ),
  },
];
