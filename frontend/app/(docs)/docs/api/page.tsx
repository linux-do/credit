import { LegalPageLayout } from "@/components/common/docs/legal-page-layout";
import { apiSections, DOCS_LAST_UPDATED } from "@/components/common/docs/api";

export default function ApiDocPage() {
  return (
    <LegalPageLayout
      title="API 接口文档"
      lastUpdated={DOCS_LAST_UPDATED}
      sections={apiSections}
      description={
        <p className="text-muted-foreground text-sm leading-relaxed">
          LINUX DO Credit 提供简单、强大的 API
          接口，支持多种编程语言和开发环境。通过标准化的 HTTP
          接口，您可以轻松将积分服务集成到您的应用中。
        </p>
      }
    />
  );
}
