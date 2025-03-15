import { WaitListEntity } from '@/domains/entities/wait-list.entity'
import { Waitlist } from '@prisma/client'

export const waitListMapper = {
  toDomain: (prismaWaitList: Waitlist): WaitListEntity => {
    return {
      uniqueKey: prismaWaitList.uniqueKey,
      email: prismaWaitList.email,
      status: prismaWaitList.status,
      createdAt: prismaWaitList.createdAt,
      updatedAt: prismaWaitList.updatedAt,
    }
  },

  toDomainCollection: (prismaWaitLists: Waitlist[]): WaitListEntity[] => {
    return prismaWaitLists.map(waitListMapper.toDomain)
  },
}
