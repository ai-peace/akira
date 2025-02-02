import { documentMapper } from '@/domains/mappers/document/index.mapper'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { zValidator } from '@hono/zod-validator'
import { LlmStatus } from '@prisma/client'
import { Hono } from 'hono'
import { createDocumentSchema } from './schema'

export const createDocument = new Hono()

const route = createDocument.post(
  '/documents',
  zValidator('json', createDocumentSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')

      const document = await prisma.document.create({
        data: {
          uniqueKey: generateUniqueKey('doc_'),
          llmStatus: LlmStatus.PROCESSING,
        },
      })

      // LLM処理を非同期に実施、追ってデータを更新する
      // generateTableOfContentService(document.id)

      const documentEntity = documentMapper.toDomain(document)

      // 作成したデータで一旦返す
      return c.json({ data: documentEntity }, 201)
    } catch (error) {
      console.error('Error creating document:', error)
      return c.json({ error: 'Failed to create document' }, 500)
    }
  },
)

export type CreateDocumentRoute = typeof route
