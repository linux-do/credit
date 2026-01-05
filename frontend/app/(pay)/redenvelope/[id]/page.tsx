import { RedEnvelopeClaimPage } from "@/components/common/redenvelope/red-envelope-claim"

export default async function RedEnvelopePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RedEnvelopeClaimPage id={id} />
}