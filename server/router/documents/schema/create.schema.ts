import { z } from 'zod'

export const createDocumentSchema = z.object({
  projectUniqueKey: z.string(),
  agentUniqueKey: z.string(),
  setting: z
    .object({
      prompt: z.string(),
      additionals: z.string().optional(),
    })
    .optional(),
})

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>
