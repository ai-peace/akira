import { createChat } from '@/server/router/chats/create'
import { createChatPromptGroup } from '@/server/router/chats/prompt-groups/create'
import { getChat } from '@/server/router/chats/show'
import { getUserPrivateChatCollection } from '@/server/router/user-privates/chats'
import { createUserPrivate } from '@/server/router/user-privates/create'
import { initializeUserPromptUsage } from '@/server/router/user-prompt-usages/initialize'
import { upsertUserPromptUsage } from '@/server/router/user-prompt-usages/upsert'
import { getUserPrivate } from '@/server/router/user-privates/show'
import { updateUserPrivate } from '@/server/router/user-privates/update'
import { createWaitList } from '@/server/router/wait-lists/create'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getPromptGroup } from '@/server/router/prompt-groups/show'
import { createDeposit } from '@/server/router/deposits/create'
import { mintNft } from '@/server/router/nfts/mint'
import { nftStatus } from '@/server/router/nfts/status'
import { listNfts } from '@/server/router/nfts/list'

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
hono.route('/', getPromptGroup)
hono.route('/', createWaitList)
hono.route('/', createDeposit)
hono.route('/', mintNft)
hono.route('/', nftStatus)
hono.route('/', listNfts)

export const GET = handle(hono)
export const POST = handle(hono)
export const PATCH = handle(hono)
