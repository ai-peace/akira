import { PromptEntity } from './prompt.entity'

export type ChatEntity = {
  uniqueKey: string
  title?: string
  mdxContent?: string
  updatedAt: Date
  createdAt: Date
  prompts?: PromptEntity[]
}
