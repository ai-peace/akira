import { createDocument } from '@/server/router/documents/create'
import { getDocument } from '@/server/router/documents/show'
import { searchRareItems } from '@/server/router/rare-items/search'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getDocument)
hono.route('/', createDocument)
hono.route('/', searchRareItems)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
