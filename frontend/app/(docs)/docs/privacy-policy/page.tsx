import { LegalPageLayout } from "@/components/common/docs/legal-page-layout";
import { privacySections } from "@/components/common/docs/privacy";
import { TERMS_LAST_UPDATED } from "@/components/common/docs/terms";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="隐私政策 (Privacy)"
      lastUpdated={TERMS_LAST_UPDATED}
      sections={privacySections}
      description={
        <span>
          我们非常重视您的隐私保护。本政策将向您透明地展示我们如何收集、使用、存储您的个人信息，
          <br className="hidden md:block" />
          以及您享有的相关权利。
        </span>
      }
    />
  );
}
