"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "bash",
  className,
  ...props
}: CodeBlockProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-[#1e1e1e] dark:bg-[#0d0d0d] border border-border/40 shadow-sm my-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] dark:bg-[#0d0d0d] border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
        </div>
        <button
          onClick={onCopy}
          className="text-muted-foreground hover:text-white transition-colors"
        >
          {hasCopied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-transparent">
        <pre className="font-mono text-xs leading-relaxed text-[#e0e0e0] !bg-transparent !p-0 !m-0 !border-0 shadow-none whitespace-pre-wrap break-all">
          <code
            className={cn(
              "!bg-transparent !p-0 !m-0 !border-0 shadow-none font-mono",
              language && `language-${language}`
            )}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
