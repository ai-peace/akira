import { Descendant } from 'slate'
import { unified } from 'unified'
import markdown from 'remark-parse'
import slate from 'remark-slate'

export const markdownToSlate = (markdownText: string): Descendant[] => {
  const processor = unified().use(markdown).use(slate)
  const file = processor.processSync(markdownText)
  return file.result as Descendant[]
}
