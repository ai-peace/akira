export type WaitListStatus = 'WAITING' | 'INVITED' | 'REGISTERED'

export type WaitListEntity = {
  uniqueKey: string
  email: string
  status: WaitListStatus
  createdAt: Date
  updatedAt: Date
}
