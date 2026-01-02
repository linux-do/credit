import { RedEnvelopeClaimPage } from "@/components/common/redenvelope/red-envelope-claim"

interface Props {
  params: Promise<{ id: string }>
}

export default async function RedEnvelopePage({ params }: Props) {
  const { id } = await params
  return <RedEnvelopeClaimPage id={id} />
}