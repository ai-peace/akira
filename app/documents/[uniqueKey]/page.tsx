import { SDocumentScreen } from '@/components/04_screens/SDocumentScreen'

type Props = {
  params: {
    uniqueKey: string
  }
}

const Page = ({ params }: Props) => {
  return <SDocumentScreen documentUniqueKey={params.uniqueKey} />
}

export default Page
