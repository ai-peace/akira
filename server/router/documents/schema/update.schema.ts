import { z } from 'zod'

export const updateDocumentSchema = z.object({
  agentUniqueKey: z.string().optional(),
  title: z.string().optional(),
  mdxContent: z.string().optional(),
  regenerate: z.boolean().optional(),
  setting: z
    .object({
      prompt: z.string().optional(),
      additionals: z.string().optional(),
    })
    .optional(),
})

export type UpdateDocumentSchema = z.infer<typeof updateDocumentSchema>
