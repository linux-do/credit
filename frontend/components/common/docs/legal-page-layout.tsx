"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Check, Copy, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, useScroll, useSpring } from "motion/react"
import type { PolicySection } from "./types"

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  sections: PolicySection[]
  description?: React.ReactNode
}

export function LegalPageLayout({
  title,
  lastUpdated,
  sections,
  description,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = React.useState<string>(sections[0]?.value || "")
  const [hasCopied, setHasCopied] = React.useState(false)
  const { scrollYProgress } = useScroll()
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const allSectionIds = React.useMemo(() => {
    return sections.flatMap(section => [
      section.value,
      ...(section.children?.map(child => child.value) || [])
    ])
  }, [sections])

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0px -35% 0px" }
    )

    allSectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections, allSectionIds])

  const convertInlineNodes = (nodes: ChildNode[]): string => {
    return nodes.map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ""
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return ""
      }
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()
      if (tagName === "code") {
        return `\`${element.textContent?.trim() || ""}\``
      }
      if (tagName === "strong" || tagName === "b") {
        return `**${convertInlineNodes(Array.from(element.childNodes))}**`
      }
      if (tagName === "em" || tagName === "i") {
        return `*${convertInlineNodes(Array.from(element.childNodes))}*`
      }
      if (tagName === "a") {
        const text = convertInlineNodes(Array.from(element.childNodes)) || element.textContent || ""
        const href = element.getAttribute("href") || ""
        return href ? `[${text}](${href})` : text
      }
      if (tagName === "br") {
        return "\n"
      }
      return convertInlineNodes(Array.from(element.childNodes))
    }).join("")
  }

  const convertList = (
    list: HTMLOListElement | HTMLUListElement,
    indentLevel: number
  ): string => {
    const isOrdered = list.tagName.toLowerCase() === "ol"
    const items = Array.from(list.children).filter((child) => child.tagName.toLowerCase() === "li")
    return items.map((item, index) => {
      const prefix = isOrdered ? `${index + 1}. ` : "- "
      const indent = "  ".repeat(indentLevel)
      const parts: string[] = []
      const itemElement = item as HTMLElement
      const childNodes = Array.from(itemElement.childNodes)
      const nestedLists: HTMLElement[] = []

      childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childElement = child as HTMLElement
          if (childElement.tagName.toLowerCase() === "ul" || childElement.tagName.toLowerCase() === "ol") {
            nestedLists.push(childElement)
            return
          }
        }
        parts.push(convertInlineNodes([child]).trim())
      })

      const baseLine = `${indent}${prefix}${parts.join("").trim()}`
      const nestedMarkdown = nestedLists.map((nested) => convertList(nested as HTMLOListElement | HTMLUListElement, indentLevel + 1))
      return [baseLine, ...nestedMarkdown].filter(Boolean).join("\n")
    }).join("\n")
  }

  const convertTable = (table: HTMLTableElement): string => {
    const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th,td")).map((cell) => (cell.textContent || "").trim())
    )
    if (!rows.length) return ""
    const header = rows[0]
    const body = rows.slice(1)
    const headerLine = `| ${header.join(" | ")} |`
    const separatorLine = `| ${header.map(() => "---").join(" | ")} |`
    const bodyLines = body.map((row) => `| ${row.join(" | ")} |`)
    return [headerLine, separatorLine, ...bodyLines].join("\n")
  }

  const convertBlockNode = (node: HTMLElement, indentLevel: number): string => {
    const tagName = node.tagName.toLowerCase()
    if (tagName === "h3") return `### ${node.textContent?.trim() || ""}`
    if (tagName === "h4") return `#### ${node.textContent?.trim() || ""}`
    if (tagName === "p") return convertInlineNodes(Array.from(node.childNodes)).trim()
    if (tagName === "ul" || tagName === "ol") return convertList(node as HTMLOListElement | HTMLUListElement, indentLevel)
    if (tagName === "pre") {
      const code = node.textContent || ""
      return `\`\`\`\n${code.trim()}\n\`\`\``
    }
    if (tagName === "table") return convertTable(node as HTMLTableElement)
    if (tagName === "div") {
      const hasTable = node.querySelector("table")
      const hasList = node.querySelector("ul,ol")
      const hasPre = node.querySelector("pre")
      if (hasTable || hasList || hasPre) {
        return Array.from(node.children)
          .map((child) => convertBlockNode(child as HTMLElement, indentLevel))
          .filter(Boolean)
          .join("\n\n")
      }
      const text = convertInlineNodes(Array.from(node.childNodes)).trim()
      return text
    }
    return convertInlineNodes(Array.from(node.childNodes)).trim()
  }

  const buildMarkdown = (): string => {
    const contentRoot = contentRef.current
    if (!contentRoot) return ""
    const lines: string[] = []
    lines.push(`# ${title}`)
    lines.push("")
    lines.push(`最后更新：${lastUpdated}`)
    if (description) {
      const descriptionElement = contentRoot.querySelector("[data-docs-description]")
      if (descriptionElement) {
        const descriptionText = convertInlineNodes(Array.from(descriptionElement.childNodes)).trim()
        if (descriptionText) {
          lines.push("")
          lines.push(descriptionText)
        }
      }
    }
    lines.push("")

    const sectionNodes = Array.from(contentRoot.querySelectorAll("[data-docs-section]")) as HTMLElement[]
    sectionNodes.forEach((section) => {
      const heading = section.querySelector("h2")
      if (heading?.textContent) {
        lines.push(`## ${heading.textContent.trim()}`)
        lines.push("")
      }
      const prose = section.querySelector("[data-docs-content]")
      if (prose) {
        const blocks = Array.from(prose.children)
          .map((child) => convertBlockNode(child as HTMLElement, 0))
          .filter(Boolean)
        if (blocks.length) {
          lines.push(blocks.join("\n\n"))
          lines.push("")
        }
      }
    })

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
  }

  const handleCopyMarkdown = async () => {
    const markdown = buildMarkdown()
    if (!markdown) return
    try {
      await navigator.clipboard.writeText(markdown)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = markdown
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    }
  }

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
        style={{ scaleX }}
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      <div ref={contentRef} className="container relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 lg:py-16">
        <header className="mb-8 md:mb-12">
          <Link href="/" className="inline-block mb-8">
            <Button
              variant="ghost"
              className="gap-2 pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                <FileText className="w-3.5 h-3.5" />
                {sections.length} 个内容
              </span>
              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                <Calendar className="w-3.5 h-3.5" />
                最后更新：{lastUpdated}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="h-8 gap-2 text-xs"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {hasCopied ? "已复制" : "复制 Markdown"}
              </Button>
            </div>
            {description && (
              <div className="w-full p-4 md:p-6 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm overflow-hidden">
                <div data-docs-description className="text-sm md:text-base text-muted-foreground leading-relaxed m-0 break-all">
                  {description}
                </div>
              </div>
            )}
          </motion.div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 relative">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin">
                <div className="text-sm font-semibold text-foreground mb-4 pl-3">目录</div>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <div key={section.value} className="space-y-1">
                      <a
                        href={`#${ section.value }`}
                        onClick={(e) => scrollToSection(e, section.value)}
                        className={cn(
                          "group flex items-center justify-between py-2 px-3 text-sm rounded-lg transition-all duration-200",
                          activeSection === section.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="truncate">{section.title}</span>
                        {activeSection === section.value && (
                          <motion.div
                            layoutId="active-dot"
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                          />
                        )}
                      </a>
                      {section.children && (
                        <div className="pl-4 space-y-1">
                          {section.children.map((child) => (
                            <a
                              key={child.value}
                              href={`#${ child.value }`}
                              onClick={(e) => scrollToSection(e, child.value)}
                              className={cn(
                                "block py-1.5 px-3 text-xs rounded-lg transition-all duration-200 truncate",
                                activeSection === child.value
                                  ? "text-primary font-medium bg-primary/5"
                                  : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/30"
                              )}
                            >
                              {child.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 lg:col-start-4 space-y-8 md:space-y-16 pb-20">
            {sections.map((section, index) => (
              <motion.section
                key={section.value}
                id={section.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="scroll-mt-24 group"
                data-docs-section
              >
                <div className="sticky top-0 z-20 flex items-center gap-4 py-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-2 -mx-4 px-4 md:-mx-0 md:px-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {index + 1}
                  </span>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                    {section.title.replace(/^\d+\.\s*/, '')}
                  </h2>
                </div>

                <div
                  data-docs-content
                  className={cn(
                  "prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none",
                  "prose-p:text-muted-foreground prose-p:leading-7",
                  "prose-li:text-muted-foreground",
                  "prose-strong:text-foreground",
                  "pl-4 md:pl-12 border-l border-border/30 group-hover:border-primary/20 transition-colors duration-500"
                )}>
                  {section.content}
                </div>
              </motion.section>
            ))}

            <div className="pt-16 border-t border-border mt-20">
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  对这些内容有疑问？
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="https://github.com/linux-do/credit/issues" target="_blank">
                    <Button variant="outline" className="h-9 text-xs">
                      联系支持
                    </Button>
                  </Link>
                  <Link href="https://linux.do" target="_blank">
                    <Button variant="outline" className="h-9 text-xs">
                      访问社区
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div >
    </div >
  )
}
