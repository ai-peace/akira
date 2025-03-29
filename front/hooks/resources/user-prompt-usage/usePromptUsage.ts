import { UserPromptUsageEntity } from '@/common/domains/entities/user-prompt-usage.entity'
import { PrivyAccessTokenRepository } from '@/front/repositories/privy-access-token.repository'
import { userPromptUsageRepository } from '@/front/repositories/user-prompt-usage.repository'
import useSWR from 'swr'

const useUserPromptUsage = () => {
  const { data, error, isLoading, mutate } = useSWR<UserPromptUsageEntity | null>(
    [`user-prompt-usages`],
    async () => {
      const accessToken = await PrivyAccessTokenRepository.get()
      if (!accessToken) return null
      return await userPromptUsageRepository.get(accessToken)
    },
  )

  const upsertUserPromptUsage = async (data: UserPromptUsageEntity) => {
    const accessToken = await PrivyAccessTokenRepository.get()
    if (!accessToken) return
    const updatedUserPromptUsage = await userPromptUsageRepository.upsert(accessToken, data)
    mutate(updatedUserPromptUsage, false)
  }

  return {
    userPromptUsage: data,
    userPromptUsageError: error,
    userPromptUsageIsLoading: isLoading,
    userPromptUsageMutate: mutate,
    upsertUserPromptUsage,
  }
}

export default useUserPromptUsage
