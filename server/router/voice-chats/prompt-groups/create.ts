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
      console.log('=== 音声チャット処理開始 ===')
      // プロンプトのためのデータ準備
      const uniqueKey = c.req.param('uniqueKey')
      console.log(`uniqueKey: ${uniqueKey}`)
      const userPromptUsage = c.get('userPromptUsage')
      console.log(`userPromptUsage: ${JSON.stringify(userPromptUsage)}`)
      const formData = await c.req.formData()
      console.log('formDataを取得しました')

      // formDataの中身を確認
      console.log('formDataのキー一覧:')
      for (const key of formData.keys()) {
        console.log(`- ${key}`)
      }

      const audioFile = formData.get('audio')
      console.log(`audioFileの型: ${typeof audioFile}`)
      console.log(`audioFileの内容: ${audioFile ? '取得済み' : 'null'}`)
      console.log(`audioFileのコンストラクタ名: ${audioFile?.constructor?.name || 'なし'}`)

      if (!audioFile) {
        console.log('エラー: オーディオファイルがありません')
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError(hcApiErrorCodes.UNKNOWN_ERROR, {
              message: 'Audio file is required',
            }),
          },
          400,
        )
      }

      const chat = await prisma.chat.findUnique({
        where: { uniqueKey },
        include: { user: true },
      })
      console.log(`チャットデータ: ${chat ? 'found' : 'not found'}`)
      if (chat) {
        console.log(`チャットユーザーID: ${chat.userId}`)
      }

      if (!chat) {
        console.log('エラー: チャットが見つかりません')
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('NOT_FOUND', {
              message: 'Chat not found',
            }),
          },
          404,
        )
      }

      if (chat.userId !== c.var.user.id) {
        console.log(
          `エラー: ユーザー不一致 (chatのユーザー: ${chat.userId}, リクエストユーザー: ${c.var.user.id})`,
        )
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError('FORBIDDEN', {
              message: 'You can only create prompt groups for your own chats',
            }),
          },
          403,
        )
      }

      console.log('=== オーディオファイル処理開始 ===')
      // 音声ファイルをバッファに変換
      let buffer: Buffer

      // オーディオファイルの詳細情報
      if (audioFile) {
        console.log(`audioFileのキー: ${Object.keys(audioFile)}`)
        if (typeof audioFile === 'object') {
          console.log(
            `audioFileのメソッド: ${Object.getOwnPropertyNames(Object.getPrototypeOf(audioFile)).join(', ')}`,
          )
        }
      }

      // Node.js環境で安全に処理する
      if (typeof audioFile === 'string') {
        console.log('audioFileは文字列です')
        // 文字列の場合（Base64エンコードされたデータなど）
        buffer = Buffer.from(audioFile)
        console.log(`バッファ作成成功: ${buffer.length} バイト`)
      } else if (Buffer.isBuffer(audioFile)) {
        console.log('audioFileはすでにBufferです')
        // すでにBufferの場合
        buffer = audioFile
        console.log(`バッファサイズ: ${buffer.length} バイト`)
      } else if (audioFile instanceof Uint8Array) {
        console.log('audioFileはUint8Arrayです')
        // Uint8Arrayの場合
        buffer = Buffer.from(audioFile)
        console.log(`バッファ作成成功: ${buffer.length} バイト`)
      } else if (audioFile instanceof Blob || 'arrayBuffer' in audioFile) {
        console.log('audioFileはBlobまたはarrayBufferメソッドを持っています')
        try {
          // BlobまたはarrayBufferメソッドを持つオブジェクト
          // @ts-ignore - サーバー環境でもarrayBufferメソッドを持つオブジェクトを処理
          const arrayBuffer = await audioFile.arrayBuffer()
          console.log(`arrayBuffer取得成功: ${arrayBuffer.byteLength} バイト`)
          buffer = Buffer.from(arrayBuffer)
          console.log(`バッファ作成成功: ${buffer.length} バイト`)
        } catch (e) {
          console.error('arrayBufferの取得中にエラーが発生しました:', e)
          throw e
        }
      } else {
        console.log('audioFileはその他の形式です - 変換を試みます')
        // その他の場合、何らかの方法で処理を試みる
        try {
          // @ts-ignore - 一般的なオブジェクトとして処理を試みる
          buffer = Buffer.from(audioFile)
          console.log(`バッファ作成成功: ${buffer.length} バイト`)
        } catch (e) {
          console.error('audioFileからBufferへの変換に失敗しました:', e)
          return c.json<HcApiResponseType<never>>(
            {
              error: createHcApiError(hcApiErrorCodes.UNKNOWN_ERROR, {
                message: 'Invalid audio file format',
              }),
            },
            400,
          )
        }
      }

      console.log('バッファからReadableストリームを作成します')
      const readable = Readable.from(buffer)
      console.log('Readableストリーム作成成功')

      // Mastraを使用して音声をテキストに変換
      console.log('=== 音声認識開始 ===')
      const voiceAgent = mastra.getAgent('voiceAgent')
      console.log('voiceAgentを取得しました')

      console.log('音声認識を実行します...')
      const mainPrompt = (await voiceAgent.voice?.listen(readable)) as string
      console.log(`音声認識結果: ${mainPrompt ? '成功' : '失敗'}`)
      if (mainPrompt) {
        console.log(
          `認識テキスト: ${mainPrompt.substring(0, 100)}${mainPrompt.length > 100 ? '...' : ''}`,
        )
      }

      if (!mainPrompt) {
        console.log('エラー: 音声認識に失敗しました')
        return c.json<HcApiResponseType<never>>(
          {
            error: createHcApiError(hcApiErrorCodes.UNKNOWN_ERROR, {
              message: 'Failed to transcribe audio',
            }),
          },
          400,
        )
      }

      console.log('=== 音声認識処理終了、ソーシングを開始 ===')
      const promptGroupEntity = await sourcingUsecase.execute(
        uniqueKey,
        mainPrompt,
        userPromptUsage,
      )
      console.log('ソーシング完了')
      console.log(`結果: ${JSON.stringify(promptGroupEntity)}`)

      console.log('=== 処理完了、レスポンス返却 ===')
      return c.json<HcApiResponseType<PromptGroupEntity>>(
        {
          data: promptGroupEntity,
        },
        201,
      )
    } catch (error) {
      console.error('Error chats/prompt-groups/create:', error)
      console.error(`エラースタック: ${error instanceof Error ? error.stack : 'スタックなし'}`)

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
