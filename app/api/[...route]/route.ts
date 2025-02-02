import { getAgent } from '@/server/router/agents/show'
import { getDocumentSetting } from '@/server/router/document-settings/show'
import { createDocument } from '@/server/router/documents/create'
import { generateTableOfContent } from '@/server/router/documents/generate-table-of-content'
import { createDocumentPrompt } from '@/server/router/documents/prompts/create'
import { listDocumentPrompts } from '@/server/router/documents/prompts/list'
import { getDocument } from '@/server/router/documents/show'
import { syncDocument } from '@/server/router/documents/sync'
import { updateDocument } from '@/server/router/documents/update'
import { getPrompt } from '@/server/router/prompts/show'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!',
  })
})

hono.route('/', getDocument)
hono.route('/', getDocumentSetting)
hono.route('/', getAgent)
hono.route('/', createDocument)
hono.route('/', updateDocument)
hono.route('/', generateTableOfContent)
hono.route('/', createDocumentPrompt)
hono.route('/', getPrompt)
hono.route('/', syncDocument)
hono.route('/', listDocumentPrompts)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
