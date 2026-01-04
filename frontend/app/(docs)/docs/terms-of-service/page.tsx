import { LegalPageLayout } from "@/components/common/docs/legal-page-layout";
import {
  termsSections,
  TERMS_LAST_UPDATED,
} from "@/components/common/docs/terms";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="服务协议 (Terms)"
      lastUpdated={TERMS_LAST_UPDATED}
      sections={termsSections}
      description={
        <span>
          欢迎使用 LINUX DO
          Credit。本协议详述了您在使用本平台服务时的权利与义务。
          <br className="hidden md:block" />
          为了保障您的合法权益，请您仔细阅读以下条款。
        </span>
      }
    />
  );
}
