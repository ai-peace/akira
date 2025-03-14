import { SSearchResultScreen } from '@/components/04_screens/SSearchResultScreen'

type Params = {
  params: {
    uniqueKey: string
  }
}

const Page = ({ params }: Params) => {
  return (
    <>
      <SSearchResultScreen promptGroupUniqueKey={params.uniqueKey} />
    </>
  )
}

export default Page
