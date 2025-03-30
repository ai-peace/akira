import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { ProductEntity } from '@/common/domains/entities/product.entity'
import { prisma } from '@/server/server-lib/prisma'
import { mastra } from '@/server/mastra'

// タグ情報の型定義
type TagInfo = {
  title: string
  tags: string[]
}

// ジャンルタグ抽出ステップ
const extractTagsStep = new Step({
  id: 'extractTagsStep',
  outputSchema: z.object({
    products: z.array(z.any()),
    tagsExtracted: z.boolean(),
  }),
  execute: async ({ context }) => {
    console.log('ジャンルタグ抽出ステップ開始')

    try {
      // プロンプトのuniqueKeyを取得
      const promptUniqueKey = context.triggerData?.promptUniqueKey
      if (!promptUniqueKey) {
        throw new Error('Prompt unique key is required')
      }

      // 現在のプロンプト情報を取得
      const currentPrompt = await prisma.prompt.findUnique({
        where: { uniqueKey: promptUniqueKey },
        select: { result: true },
      })

      // 既存の結果データを取得
      const result = (currentPrompt?.result as any) || {}
      const products = result.data || []

      if (products.length === 0) {
        console.log('タグ付けする商品がありません')
        return {
          products,
          tagsExtracted: false,
        }
      }

      // 全商品のタイトルを抽出
      const titles = products.map((product: ProductEntity) => product.title.ja || product.title.en)
      console.log(`タイトル一覧: ${titles.join(', ')}`)

      // タグ抽出エージェントを取得
      const tagExtractorAgent = mastra.getAgent('tagExtractorAgent')

      if (!tagExtractorAgent) {
        throw new Error('タグ抽出エージェントが見つかりません')
      }

      // エージェントを使ってタグを抽出
      console.log('タグ抽出エージェントを使用してタグを抽出中...')
      const titlesText = titles.join('\n')

      // エージェントを実行
      const agentResponse = await tagExtractorAgent.generate(titlesText)
      const responseText = agentResponse.text

      console.log('エージェントからの応答:', responseText)

      // 応答からJSONを抽出
      let tagsData: TagInfo[] = []
      try {
        // 応答テキストからJSON部分を抽出
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s)
        if (jsonMatch) {
          tagsData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('タグデータの形式が不正です')
        }
      } catch (parseError) {
        console.error('タグデータの解析に失敗しました:', parseError)
        // フォールバック: タイトルごとにデフォルトタグを設定
        tagsData = titles.map((title: string) => ({
          title,
          tags: ['その他'],
        }))
      }

      // 抽出したタグを商品に適用
      const updatedProducts = products.map((product: ProductEntity) => {
        const productTitle = product.title.ja || product.title.en
        const matchingTagInfo = tagsData.find((item: TagInfo) => item.title === productTitle)

        if (matchingTagInfo) {
          return {
            ...product,
            tags: matchingTagInfo.tags,
          }
        }

        return product
      })

      // 更新した商品データを保存
      const updatedResult = {
        ...result,
        data: updatedProducts,
      }

      await prisma.prompt.update({
        where: { uniqueKey: promptUniqueKey },
        data: { result: updatedResult },
      })

      console.log('商品にタグを適用しました')
      return {
        products: updatedProducts,
        tagsExtracted: true,
      }
    } catch (error) {
      console.error('タグ抽出中にエラーが発生しました:', error)
      return {
        products: [],
        tagsExtracted: false,
      }
    }
  },
})

export { extractTagsStep }
