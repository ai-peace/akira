import { User } from '@prisma/client'
import { UserPrivateEntity } from '@/domains/entities/user-private.entity'

export const userPrivateMapper = {
  toDomain: (prismaUser: User): UserPrivateEntity => {
    return {
      privyId: prismaUser.privyId,
      name: prismaUser.name ?? '',
      email: prismaUser.email ?? '',
      loginMethod: prismaUser.loginMethod,
    }
  },
}
