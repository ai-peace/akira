import { WaitListEntity } from '@/common/domains/entities/wait-list.entity'
import { CreateWaitListInput, waitListRepository } from '@/front/repositories/wait-list.repository'

export const useCreateWaitList = () => {
  const createWaitList = async (params: CreateWaitListInput): Promise<WaitListEntity> => {
    return await waitListRepository.create(params)
  }

  return {
    createWaitList,
  }
}
