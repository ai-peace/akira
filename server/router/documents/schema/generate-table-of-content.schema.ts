import { z } from 'zod'

export const generateTableOfContentSchema = z.object({
  prompt: z.string(),
})

export type GenerateTableOfContentSchema = z.infer<typeof generateTableOfContentSchema>
