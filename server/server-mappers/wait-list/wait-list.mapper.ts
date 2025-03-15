import { WaitListEntity } from '@/domains/entities/wait-list.entity'
import { WaitList } from '@prisma/client'

export const waitListMapper = {
  toDomain: (prismaWaitList: WaitList): WaitListEntity => {
    return {
      uniqueKey: prismaWaitList.uniqueKey,
      email: prismaWaitList.email,
      status: prismaWaitList.status,
      createdAt: prismaWaitList.createdAt,
      updatedAt: prismaWaitList.updatedAt,
    }
  },

  toDomainCollection: (prismaWaitLists: WaitList[]): WaitListEntity[] => {
    return prismaWaitLists.map(waitListMapper.toDomain)
  },
}
