import { createChat } from '@/server/router/chats/create'
import { createChatPromptGroup } from '@/server/router/chats/prompt-groups/create'
import { getChat } from '@/server/router/chats/show'
import { getUserPrivateChatCollection } from '@/server/router/user-privates/chats'
import { createUserPrivate } from '@/server/router/user-privates/create'
import { initializeUserPromptUsage } from '@/server/router/user-prompt-usages/initialize'
import { upsertUserPromptUsage } from '@/server/router/user-prompt-usages/upsert'
import { getUserPrivate } from '@/server/router/user-privates/show'
import { updateUserPrivate } from '@/server/router/user-privates/update'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const hono = new Hono().basePath('/api')

hono.route('/', getChat)
hono.route('/', createChat)
hono.route('/', createChatPromptGroup)
hono.route('/', getUserPrivate)
hono.route('/', createUserPrivate)
hono.route('/', updateUserPrivate)
hono.route('/', getUserPrivateChatCollection)
hono.route('/', initializeUserPromptUsage)
hono.route('/', upsertUserPromptUsage)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
