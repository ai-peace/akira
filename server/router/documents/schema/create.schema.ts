import { z } from 'zod'

export const createDocumentSchema = z.object({})

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>
