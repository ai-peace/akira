import { PromptGroupEntity } from '@/common/domains/entities/prompt-group.entity'
import {
  createHcApiError,
  hcApiErrorCodes,
  HcApiResponseType,
} from '@/common/domains/errors/hc-api.error'
import { mastra } from '@/server/mastra'
import { prisma } from '@/server/server-lib/prisma'
import { privyAuthMiddleware } from '@/server/server-middleware/privy-auth.middleware'
import { requireUserPromptUsage } from '@/server/server-middleware/require-user-prompt-usage.middleware'
import { requireUserMiddleware } from '@/server/server-middleware/require-user.middleware'
import { sourcingUsecase } from '@/server/server-usecase/sourcing.usecase'
import { Hono } from 'hono'
import { Readable } from 'node:stream'

export const createVoiceChatPromptGroup = new Hono()

const route = createVoiceChatPromptGroup.post(
  '/voice-chats/:uniqueKey/prompt-groups',
  privyAuthMiddleware,
  requireUserMiddleware,
  requireUserPromptUsage,
  async (c) => {
    try {
      console.log('1')
      // プロンプトのためのデータ準備
      const uniqueKey = c.req.param('uniqueKey')
      console.log('2')
      const userPromptUsage = c.get('userPromptUsage')
      console.log('3')
      const formData = await c.req.formData()
      console.log('4')
      const audioFile = formData.get('audio')
      console.log('5')

      if (!audioFile) {
        // if (!audioFile || !(audioFile instanceof File)) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError(hcApiErrorCodes.UNKNOWN_ERROR, {
              message: 'Audio file is required',
            }),
          },
          400,
        )
      }

      console.log('6')
      const chat = await prisma.chat.findUnique({
        where: { uniqueKey },
        include: { user: true },
      })
      console.log('7')
      if (!chat) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND', {
              message: 'Chat not found',
            }),
          },
          404,
        )
      }
      console.log('8')
      if (chat.userId !== c.var.user.id) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('FORBIDDEN', {
              message: 'You can only create prompt groups for your own chats',
            }),
          },
          403,
        )
      }
      console.log('9')
      // 音声ファイルをバッファに変換
      const arrayBuffer = await audioFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const readable = Readable.from(buffer)

      // Mastraを使用して音声をテキストに変換
      const voiceAgent = mastra.getAgent('voiceAgent')
      const mainPrompt = (await voiceAgent.voice?.listen(readable)) as string
      console.log('10')
      if (!mainPrompt) {
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError(hcApiErrorCodes.UNKNOWN_ERROR, {
              message: 'Failed to transcribe audio',
            }),
          },
          400,
        )
      }

      const promptGroupEntity = await sourcingUsecase.execute(
        uniqueKey,
        mainPrompt,
        userPromptUsage,
      )

      return c.json<HcApiResponseType<PromptGroupEntity>>(
        {
          data: promptGroupEntity,
        },
        201,
      )
    } catch (error) {
      console.error('Error chats/prompt-groups/create:', error)

      return c.json<HcApiResponseType<never>>(
        {
          error: createHcApiError('SERVER_ERROR'),
        },
        500,
      )
    }
  },
)

export type CreateVoiceChatPromptGroupRoute = typeof route
