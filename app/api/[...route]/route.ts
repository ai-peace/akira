import { createDocument } from '@/server/router/documents/create'
import { getDocument } from '@/server/router/documents/show'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getDocument)
hono.route('/', createDocument)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
