import { documentMapper } from '@/domains/mappers/document/index.mapper'
import { prisma } from '@/server/server-lib/prisma'
import { Hono } from 'hono'

export const getDocument = new Hono()

const route = getDocument.get('/documents/:uniqueKey', async (c) => {
  try {
    const uniqueKey = c.req.param('uniqueKey')
    const document = await prisma.document.findUnique({
      where: {
        uniqueKey: uniqueKey,
      },
      include: {
        setting: true,
        agent: true,
        project: true,
        prompts: true,
      },
    })

    if (!document) {
      return c.json({ error: 'Document not found' }, 404)
    }

    const documentEntity = documentMapper.toDomain(document)
    return c.json({ data: documentEntity })
  } catch (error) {
    console.error('Error fetching document:', error)
    return c.json({ error: 'Failed to fetch document' }, 500)
  }
})

export type GetDocumentRoute = typeof route
