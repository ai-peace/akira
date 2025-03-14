import { PromptGroupEntity } from '@/domains/entities/prompt-group.entity'
import { promptGroupRepository } from '@/repository/prompt-group.repository'
import useSWR from 'swr'

export const usePromptGroup = (variables: { uniqueKey: string }) => {
  const { data, error, isLoading, mutate } = useSWR<PromptGroupEntity | null>(
    [`prompt-group/${variables.uniqueKey}`, variables],
    async () => {
      return await promptGroupRepository.get(variables.uniqueKey)
    },
  )

  return {
    promptGroup: data,
    promptGroupError: error,
    promptGroupIsLoading: isLoading,
  }
}
