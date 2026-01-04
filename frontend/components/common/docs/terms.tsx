import { type PolicySection } from "./types";

export const TERMS_LAST_UPDATED = "2025-12-22";

/**
 * ------------------------------------------------------------------
 * 服务条款 (TERMS OF SERVICE)
 * ------------------------------------------------------------------
 */
export const termsSections: PolicySection[] = [
  {
    value: "contract-establishment",
    title: "1. 缔约申明与服务综述",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>1.1 缔约主体：</strong>
          本《服务协议》（以下简称“本协议”）是您（以下亦称“社区用户”、“开发者”、“消费方”或“服务方”）与
          LINUX DO Credit
          平台运营团队（以下简称“平台”、“我们”）之间关于使用平台服务所订立的具有法律约束力的契约。
        </p>
        <p>
          <strong>1.2 审慎阅读：</strong>
          请您务必审慎阅读、充分理解各条款内容，特别是
          <strong>免除或者限制责任的条款、争议解决和法律适用条款</strong>
          。各免责或限责条款将以粗体标识，您应重点阅读。如您不同意本协议的任何内容，请立即停止注册或使用本服务。
        </p>
        <p>
          <strong>1.3 协议构成：</strong>
          本协议内容包括协议正文及所有我们已经发布或将来可能发布的各类规则、声明、说明。所有规则为本协议不可分割的组成部分，与协议正文具有同等法律效力。
        </p>
      </div>
    ),
  },
  {
    value: "service-definition",
    title: "2. 服务定义与性质界定",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>2.1 社区技术服务：</strong>LINUX DO Credit 是基于 LINUX DO
          社区生态构建的独立价值交换协议与技术系统。我们仅提供 API
          接口调用、数据路由、账单管理等<strong>纯技术服务</strong>。
        </p>
        <p>
          <strong>2.2 非金融机构申明：</strong>
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li>
            <strong>非银行机构：</strong>
            我们不是商业银行、持牌支付机构（如支付宝、微信支付、银联）或清算机构。
          </li>
          <li>
            <strong>不提供资金沉淀：</strong>
            平台不设立资金池，不提供真实法币存取款、转账汇款或支付结算服务。所有涉及资金流转的行为均发生于社区用户与社区支付渠道之间，不涉及真实货币。
          </li>
          <li>
            <strong>不提供金融服务：</strong>
            平台不提供任何金融服务，包括但不限于贷款、融资、投资、理财、保险等金融服务。
          </li>
          <li>
            <strong>不提供积分兑现：</strong>
            平台不提供任何积分兑换服务，包括但不限于积分兑换为真实货币、积分兑换为实物商品、积分兑换为服务等。
          </li>
          <li>
            <strong>不提供真实货币交易：</strong>
            平台不提供任何真实货币交易服务，包括但不限于真实货币交易为积分、真实货币交易为虚拟资产、真实货币交易为服务等。
          </li>
        </ul>
        <p>
          <strong>2.3 服务限定：</strong>
          本平台建议用于仅支持虚拟商品、软件授权、技术咨询、会员订阅等
          <strong>无实物交付</strong>
          的场景。关于实物电商、物流发货或涉及线下履约的商业场景造成的任何后果我们概不负责，请妥善保管好自己的个人财产，谨防上当受骗。
        </p>
      </div>
    ),
  },
  {
    value: "account-specifications",
    title: "3. 账号注册与使用规范",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>3.1 账号体系：</strong>本平台采用 LINUX DO Connect (OAuth)
          授权登录体系。您必须拥有合法、有效的 LINUX DO
          社区账号方可使用本服务。您的平台账号权益（包括但不限于信誉分、等级）与社区账号严格绑定。
        </p>
        <p>
          <strong>3.2 匿名性与真实性：</strong>
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-2">
          <li>
            <strong>无需实名：</strong>
            我们尊重您的隐私，不强制要求您提供居民身份证、护照或营业执照进行实名认证。
          </li>
          <li>
            <strong>操作真实性：</strong>
            您承诺注册和使用的账号是您本人操作。严禁恶意注册、挂机脚本、自动化程序注册等破坏平台公平性的行为。
          </li>
        </ul>
        <p>
          <strong>3.3 账号安全责任：</strong>
          您应妥善保管您账号的支付密码、Client ID 和 Client Secret。
          <strong>
            因您保管不善可能导致账号被他人非法使用、资金损失或数据泄露的责任，由您自行承担。
          </strong>
          如发现账号异常，请立即通知我们进行冻结。
        </p>
      </div>
    ),
  },
  {
    value: "user-conduct",
    title: "4. 用户行为准则（负面清单）",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          您在使用本服务时，必须严格遵守《中华人民共和国网络安全法》、《计算机信息网络国际联网安全保护管理办法》等法律法规。
          <strong>严禁利用本平台从事以下活动（“红线条款”）：</strong>
        </p>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 md:p-4 space-y-3">
          <ul className="list-disc pl-4 md:pl-5 space-y-2 text-red-600 dark:text-red-400 font-medium">
            <li>
              <strong>危害国家安全：</strong>
              反对宪法所确定的基本原则、危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的；
            </li>
            <li>
              <strong>非法信息服务：</strong>黑客攻击工具、DDoS
              攻击服务、服务器爆破等其他非法信息服务平台；
            </li>
            <li>
              <strong>黄赌毒关联：</strong>
              制作、复制、发布、传播淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；
            </li>
            <li>
              <strong>侵犯知识产权：</strong>
              销售盗版软件、盗版影视资源、非法游戏外挂、私服、黑号、社工库数据等；
            </li>
            <li>
              <strong>欺诈与虚假：</strong>
              进行电信诈骗、金融诈骗、传销、虚假广告虚假交易等；
            </li>
            <li>
              <strong>其他违法信息：</strong>
              涉及散布谣言、宣扬邪教/封建迷信、侮辱/诽谤他人、侵害他人合法权益的。
            </li>
          </ul>
        </div>
        <p>
          <strong>违约处理：</strong>一旦发现您违反上述规定，平台有权不经通知
          <strong>
            立即永久封禁您的账号、拦截所有 API
            请求、冻结账户内所有关联价值，并依法向公安机关、网安部门移交相关线索。
          </strong>
        </p>
      </div>
    ),
  },
  {
    value: "virtual-assets",
    title: "5. 虚拟资产与交易规则",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>5.1 资产性质：</strong>平台内流转的“余额”、“积分”等均为
          <strong>社区虚拟积分</strong>
          ，仅代表您在社区生态内的活跃度或贡献值。它们
          <strong>不具有任何货币属性</strong>
          ，严禁兑换为法定货币，也不可用于任何非平台许可的商业交易。
        </p>
        <p>
          <strong>5.2 交易不可逆：</strong>鉴于网络技术的实时性，
          <strong>一旦积分转移指令被执行，该操作即不可撤销。</strong>
          请您在确认消耗或转移积分前，务必仔细核对服务方信息。
        </p>
        <p>
          <strong>5.3 规则说明：</strong>
          为营造良好的社区积分环境，平台有权收取一定的服务费（以积分为结算单位）进行调控，具体规则以控制台公示为准。平台保留根据社区运营状况调整积分规则的权利。
        </p>
      </div>
    ),
  },
  {
    value: "liability-limitation",
    title: "6. 免责声明与不可抗力",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>6.1 基础免责：</strong>
          本平台服务按“现状”（As-Is）及“现有”（As-Available）状态提供。我们不保证服务一定能满足您的要求，也不保证服务不会中断，对服务的及时性、安全性、准确性都不作担保。
        </p>
        <p>
          <strong>6.2 不可抗力：</strong>
          对于因以下原因导致的服务中断、数据丢失或账号损失，平台不承担赔偿责任：
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 text-muted-foreground">
          <li>自然灾害（台风、地震、海啸、洪水等）；</li>
          <li>政府行为、法律法规或政策调整、行政命令；</li>
          <li>电信部门技术调整、通讯线路中断、海底光缆故障；</li>
          <li>黑客攻击、计算机病毒侵入或发作、技术性故障；</li>
          <li>社区维护、系统升级（我们将尽可能提前公告）。</li>
        </ul>
        <p>
          <strong>6.3 责任上限：</strong>
          在任何情况下，平台对您所承担的违约赔偿责任总额不超过您在违约行为发生前
          1 个月内向平台支付的费用总额。
        </p>
      </div>
    ),
  },
  {
    value: "governing-law",
    title: "7. 法律适用与争议解决",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          <strong>7.1 法律适用：</strong>
          本协议的订立、执行、解释及争议的解决均适用
          <strong>中华人民共和国法律</strong>（不包括港澳台地区法律及冲突法）。
        </p>
        <p>
          <strong>7.2 争议解决：</strong>
          若您和平台发生任何争议或纠纷，首先应友好协商解决；协商不成的，您同意将纠纷或争议提交至
          <strong>平台运营团队所在地有管辖权的人民法院</strong>管辖。
        </p>
        <p>
          <strong>7.3 协议变更：</strong>
          我们有权根据法律法规变化或业务发展需要修改本协议。变更后的协议将在平台公示，自公示之日起生效。若您继续使用服务，视为您已接受修订后的协议。
        </p>
      </div>
    ),
  },
];
