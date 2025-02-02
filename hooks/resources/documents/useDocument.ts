import { DocumentEntity } from '@/domains/entities/document.entity'
import { documentRepository, GenerateTableOfContentInput } from '@/repository/document.repository'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

type UseDocumentOptions = {
  polling?: boolean
  pollingInterval?: number
}

export const useDocument = (
  variables: { uniqueKey: string },
  options: UseDocumentOptions = { polling: false },
) => {
  const [errorType, setErrorType] = useState<string | undefined>()
  const { polling = false, pollingInterval = 3000 } = options

  const { data, error, isLoading, mutate } = useSWR<DocumentEntity | null>(
    [`document/${variables.uniqueKey}`, variables],
    async () => {
      return await documentRepository.get(variables.uniqueKey)
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: polling ? (pollingInterval ? pollingInterval : 2000) : 0,
      refreshInterval: polling ? (pollingInterval ? pollingInterval : 2000) : 0,
      onSuccess: (data) => {
        // if (data?.llmStatus === 'SUCCESS' || data?.llmStatus === 'FAILED') {
        //   mutate(data)
        //   options.polling = false
        // }
      },
    },
  )

  const generateTableOfContent = async (input: GenerateTableOfContentInput) => {
    const response = await documentRepository.generateTableOfContent(input)
    mutate()
    return response
  }

  const sync = async (content: string) => {
    const response = await documentRepository.sync(variables.uniqueKey, content)
    await mutate(response)
    return response
  }

  useEffect(() => {
    if (!error) return
    if (`${error}`.includes('NotFoundError')) {
      setErrorType('NotFoundError')
    } else {
      setErrorType(`UnknownError ${error}`)
    }
  }, [error])

  return {
    document: data,
    documentError: error,
    documentIsLoading: isLoading,
    documentErrorType: errorType,
    documentGenerateTableOfContent: generateTableOfContent,
    documentSync: sync,
  }
}
