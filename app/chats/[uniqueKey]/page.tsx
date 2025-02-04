import { SChatScreen } from '@/components/04_screens/SChatScreen'

type Params = {
  params: {
    uniqueKey: string
  }
}

const Page = ({ params }: Params) => {
  return <SChatScreen chatUniqueKey={params.uniqueKey} />
}

export default Page
