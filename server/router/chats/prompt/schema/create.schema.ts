import { z } from 'zod'

export const createChatPromptSchema = z.object({
  mainPrompt: z.string().min(1, 'mainPrompt is required'),
})

export type CreateChatPromptSchema = z.infer<typeof createChatPromptSchema>
