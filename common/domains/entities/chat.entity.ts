import { PromptGroupEntity } from './prompt-group.entity'

export type ChatEntity = {
  uniqueKey: string
  title?: string
  mdxContent?: string
  keywords?: string[]
  updatedAt: Date
  createdAt: Date
  promptGroups?: PromptGroupEntity[]
}
