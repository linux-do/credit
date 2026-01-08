import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Book, Check, Copy, Key, Terminal } from "lucide-react";

export interface DeveloperSectionProps {
  className?: string;
}

/**
 * Developer Section - 开发者体验展示
 */
export const DeveloperSection = React.memo(function DeveloperSection({ className }: DeveloperSectionProps) {
  const [copied, setCopied] = React.useState(false);

  const codeContent = `curl https://credit.linux.do/epay/submit.php \\
  -u sk_live_...: \\
  -d amount=1000 \\
  -d currency="cny" \\
  -d description="Pro Plan"`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = codeContent;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className={cn("relative z-10 w-full min-h-screen flex items-center justify-center px-6 overflow-hidden", className)}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] max-w-[90vw] max-h-[90vh] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1 relative"
        >
          <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black backdrop-blur-xl shadow-2xl max-w-full">
            <div className="flex items-center px-4 py-3 border-b border-white/20 w-full">
              <div className="flex-1 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-none text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                bash
              </div>
              <div className="flex-1" />
            </div>

            <div className="p-6 overflow-x-auto relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white" onClick={onCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal overflow-x-auto">
                <code className="block">
                  <span className="text-purple-400">curl</span> <span className="text-green-400">https://credit.linux.do/epay/submit.php</span> \{'\n'}
                  {'  '}-u <span className="text-yellow-400">sk_live_...:</span> \{'\n'}
                  {'  '}-d <span className="text-blue-400">amount</span>=<span className="text-orange-400">1000</span> \{'\n'}
                  {'  '}-d <span className="text-blue-400">currency</span>=<span className="text-green-400">&quot;cny&quot;</span> \{'\n'}
                  {'  '}-d <span className="text-blue-400">description</span>=<span className="text-green-400">&quot;Pro Plan&quot;</span>
                </code>
              </pre>
            </div>
          </div>

          <div className="absolute -z-10 -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        </motion.div>

        <div className="flex flex-col justify-center space-y-8 order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              简单直接，<br />
              开发者快速集成
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              标准化的 RESTful API 接口，清晰的错误提示，完善的调试工具。无论您使用什么编程语言，只需几行代码，即可完成积分服务功能接入。
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "RESTful API 接口，语义清晰",
                "完善的 Webhook 回调通知",
                "简单调试，开发测试零成本",
                "完善的文档和示例代码"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link href="/docs/api">
                <Button variant="secondary" className="rounded-full text-xs hover:bg-muted-foreground/10">
                  <Book className="w-3 h-3" />
                  API 文档
                </Button>
              </Link>
              <Link href="/merchant">
                <Button variant="default" className="rounded-full text-xs hover:bg-primary/70">
                  <Key className="w-3 h-3" />
                  获取 API Key
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
});
