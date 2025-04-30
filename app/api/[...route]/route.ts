import { getUserPrivateChatCollection } from '@/server/router/user-privates/chats'
import { createUserPrivate } from '@/server/router/user-privates/create'
import { initializeUserPromptUsage } from '@/server/router/user-prompt-usages/initialize'
import { upsertUserPromptUsage } from '@/server/router/user-prompt-usages/upsert'
import { getUserPrivate } from '@/server/router/user-privates/show'
import { updateUserPrivate } from '@/server/router/user-privates/update'
import { createWaitList } from '@/server/router/wait-lists/create'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getChat } from '@/server/router/chats/show'
import { getPromptGroup } from '@/server/router/prompt-groups/show'
import { createChatPromptGroup } from '@/server/router/chats/prompt-groups/create'
import { createChat } from '@/server/router/chats/create'
import { createVoiceChat } from '@/server/router/voice-chats/create'
import { createVoiceChatPromptGroup } from '@/server/router/voice-chats/prompt-groups/create'

const hono = new Hono().basePath('/api')

hono.route('/', getChat)
hono.route('/', getPromptGroup)
hono.route('/', getUserPrivate)
hono.route('/', createUserPrivate)
hono.route('/', updateUserPrivate)
hono.route('/', getUserPrivateChatCollection)
hono.route('/', initializeUserPromptUsage)
hono.route('/', upsertUserPromptUsage)
hono.route('/', createWaitList)
hono.route('/', createChatPromptGroup)
hono.route('/', createChat)

// VoiceChat用
hono.route('/', createVoiceChat)
hono.route('/', createVoiceChatPromptGroup)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
