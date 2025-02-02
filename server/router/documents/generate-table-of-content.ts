import { documentMapper } from '@/domains/mappers/document/index.mapper'
import { prisma } from '@/server/server-lib/prisma'
import { generateUniqueKey } from '@/server/server-lib/uuid'
import { createTableOfContentQuery } from '@/server/server-llm-query/create-table-of-content.llm-query'
import { llmServerRepository } from '@/server/server-repository/llm/index.server-repository'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { generateTableOfContentSchema } from './schema'

export const generateTableOfContent = new Hono()

const route = generateTableOfContent.put(
  '/documents/:uniqueKey/generate-table-of-content',
  zValidator('json', generateTableOfContentSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')
      const uniqueKey = c.req.param('uniqueKey')

      const query = createTableOfContentQuery({
        name: '',
        prompt: data.prompt,
        additionals: '',
      })

      const res = await llmServerRepository.createCompletion(query)

      // TODO 指定した型ではない場合、設定した数回リトライする
      // TODO リトライ回数が設定した回数を超えた場合、エラーを返す
      if (res.error) {
        return c.json({ error: res.error }, 500)
      }

      const tableOfContent = res.content

      const document = await prisma.document.update({
        where: {
          uniqueKey,
        },
        data: {
          mdxContent: tableOfContent,
        },
      })

      const documentEntity = documentMapper.toDomain(document)
      return c.json({ data: documentEntity }, 201)
    } catch (error) {
      console.error('Error creating document:', error)
      return c.json({ error: 'Failed to create document' }, 500)
    }
  },
)

export type GenerateTableOfContentRoute = typeof route
