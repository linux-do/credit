import { LegalPageLayout } from "@/components/common/docs/legal-page-layout";
import { howToUseSections } from "@/components/common/docs/how-to-use";
import { DOCS_LAST_UPDATED } from "@/components/common/docs/api";

export default function HowToUsePage() {
  return (
    <LegalPageLayout
      title="平台使用指南"
      lastUpdated={DOCS_LAST_UPDATED}
      sections={howToUseSections}
      description={
        <p className="text-muted-foreground text-sm leading-relaxed">
          欢迎使用 LINUX DO
          Credit。本文档将引导您快速了解平台的核心功能、角色定义及使用流程，帮助您更好地使用我们的服务。
        </p>
      }
    />
  );
}
