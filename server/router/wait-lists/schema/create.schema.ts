import { z } from 'zod'

export const createWaitListSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type CreateWaitListSchema = z.infer<typeof createWaitListSchema>
