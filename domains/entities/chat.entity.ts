import { PromptGroupEntity } from './prompt-group.entity'

export type ChatEntity = {
  uniqueKey: string
  title?: string
  mdxContent?: string
  updatedAt: Date
  createdAt: Date
  promptGroups?: PromptGroupEntity[]
}
