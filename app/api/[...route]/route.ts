import { createChat } from '@/server/router/chats/create'
import { createChatPrompt } from '@/server/router/chats/prompt/create'
import { getChat } from '@/server/router/chats/show'
import { searchRareItems } from '@/server/router/rare-items/search'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getChat)
hono.route('/', createChat)
hono.route('/', searchRareItems)
hono.route('/', createChatPrompt)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
