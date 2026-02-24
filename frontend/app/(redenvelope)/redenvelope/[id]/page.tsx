import type { Metadata } from "next"
import { headers } from "next/headers"
import { RedEnvelopeClaimPage } from "@/components/common/redenvelope/red-envelope-claim"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const requestHeaders = await headers()
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https"
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? ""
  const baseUrl = host ? `${protocol}://${host}` : ""
  const title = "你收到一个LDC红包"
  const description = "点击打开领取"
  const url = baseUrl ? `${baseUrl}/redenvelope/${id}` : undefined
  const image = baseUrl ? `${baseUrl}/red-envelope.svg` : "/red-envelope.svg"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image, width: 384, height: 512, alt: "红包" }],
    }
  }
}

export default async function RedEnvelopePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RedEnvelopeClaimPage id={id} />
}