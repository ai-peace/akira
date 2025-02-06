import { z } from 'zod'

export const createChatPromptGroupSchema = z.object({
  question: z.string().min(1, 'mainPrompt is required'),
})

export type CreateChatPromptGroupSchema = z.infer<typeof createChatPromptGroupSchema>
