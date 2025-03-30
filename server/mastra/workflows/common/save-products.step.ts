import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { prisma } from '@/server/server-lib/prisma'
import type { ProductEntity } from '@/common/domains/entities/product.entity'

// 商品情報取得ステップ (結果確認用)
const saveProductsStep = new Step({
  id: 'saveProductsStep',
  outputSchema: z.object({
    products: z.array(z.any()),
    sourceSites: z.array(z.string()),
    totalCount: z.number(),
    savedToDb: z.boolean(),
  }),
  execute: async ({ context }) => {
    console.log('結果取得ステップ開始')

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
      const sourceSites = result.sourceSites || []
      const totalCount = products.length

      console.log(`合計商品数: ${totalCount}`)
      console.log(`検索サイト: ${sourceSites.join(', ')}`)

      return {
        products,
        sourceSites,
        totalCount,
        savedToDb: true,
      }
    } catch (error) {
      console.error('結果取得中にエラーが発生しました:', error)
      return {
        products: [],
        sourceSites: [],
        totalCount: 0,
        savedToDb: false,
      }
    }
  },
})

export { saveProductsStep }
