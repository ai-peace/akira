import { z } from 'zod'

export const createChatSchema = z.object({
  mainPrompt: z.string().min(1, 'mainPrompt is required'),
})

export type CreateChatSchema = z.infer<typeof createChatSchema>
