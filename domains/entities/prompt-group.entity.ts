import { PromptEntity } from './prompt.entity'

export interface PromptGroupEntity {
  uniqueKey: string
  question: string
  prompts: PromptEntity[]
  updatedAt: Date
  createdAt: Date
  chatUniqueKey: string
}
