import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { prisma } from '@/server/server-lib/prisma'
import type { ProductEntity } from '@/common/domains/entities/product.entity'
import { pageCrawlerMandarakeStep } from '../mandarake/page-crawler.mandarake.step'
import { pageCrawlerSurugayaStep } from '../surugaya/page-crawler.surugaya.step'

// 商品情報保存ステップ
const saveProductsStep = new Step({
  id: 'saveProductsStep',
  outputSchema: z.object({
    products: z.array(z.any()),
    sourceSites: z.array(z.string()),
    totalCount: z.number(),
    savedToDb: z.boolean(),
  }),
  execute: async ({ context }) => {
    console.log('保存ステップ開始')

    // マンダラケの結果を取得
    const mandarakeResults = context.getStepResult(pageCrawlerMandarakeStep)
    const mandarakeProducts = mandarakeResults?.products || []
    console.log(`マンダラケの商品数: ${mandarakeProducts.length}`)

    // 駿河屋の結果を取得
    const surugayaResults = context.getStepResult(pageCrawlerSurugayaStep)
    const surugayaProducts = surugayaResults?.products || []
    console.log(`駿河屋の商品数: ${surugayaProducts.length}`)

    // 両サイトの結果を統合
    const products = [...mandarakeProducts, ...surugayaProducts]
    const totalCount = products.length

    // 検索したサイト名の一覧
    const sourceSites = []
    if (mandarakeProducts.length > 0) sourceSites.push('mandarake')
    if (surugayaProducts.length > 0) sourceSites.push('surugaya')

    console.log(`合計商品数: ${totalCount}`)
    console.log(`検索サイト: ${sourceSites.join(', ')}`)

    try {
      // プロンプトのuniqueKeyを取得
      const promptUniqueKey = context.triggerData?.promptUniqueKey
      if (!promptUniqueKey) {
        throw new Error('Prompt unique key is required')
      }

      // 検索結果をデータベースに保存
      await prisma.prompt.update({
        where: {
          uniqueKey: promptUniqueKey,
        },
        data: {
          result: {
            message: getResultMessage(products),
            data: products,
            keywords: [],
            sourceSites,
          },
          llmStatus: 'SUCCESS',
          resultType: products.length > 0 ? 'FOUND_PRODUCT_ITEMS' : 'NO_PRODUCT_ITEMS',
        },
      })

      console.log(`${products.length}件の商品をデータベースに保存しました`)
      return {
        products,
        sourceSites,
        totalCount,
        savedToDb: true,
      }
    } catch (error) {
      console.error('データベース保存中にエラーが発生しました:', error)
      return {
        products,
        sourceSites,
        totalCount,
        savedToDb: false,
      }
    }
  },
})

export { saveProductsStep }

// 結果メッセージを生成する関数
const getResultMessage = (products: ProductEntity[], isPartial: boolean = false) => {
  if (products.length === 0) {
    return '検索条件に一致する商品は見つかりませんでした。'
  }
  return `検索条件に一致する商品が${products.length}件${isPartial ? '（途中経過）' : ''}見つかりました。`
}
