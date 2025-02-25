import { getChatCollection } from '@/server/router/chats'
import { createChat } from '@/server/router/chats/create'
import { createChatPromptGroup } from '@/server/router/chats/prompt-groups/create'
import { getChat } from '@/server/router/chats/show'
import { getUserPrivate } from '@/server/router/user-privates/show'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getChat)
hono.route('/', getChatCollection)
hono.route('/', createChat)
hono.route('/', createChatPromptGroup)
hono.route('/', getUserPrivate)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
