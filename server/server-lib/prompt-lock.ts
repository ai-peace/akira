import { prisma } from './prisma'

// ロック用のマップ - キーはprompUniqueKey
const lockMap = new Map<string, boolean>()

/**
 * プロンプトに製品を保存するための同期ユーティリティ
 */
export const promptProductSaver = {
  /**
   * プロンプトにロックを取得する
   */
  acquireLock(promptUniqueKey: string): boolean {
    if (lockMap.get(promptUniqueKey)) {
      return false
    }
    lockMap.set(promptUniqueKey, true)
    return true
  },

  /**
   * プロンプトのロックを解放する
   */
  releaseLock(promptUniqueKey: string): void {
    lockMap.delete(promptUniqueKey)
  },

  /**
   * プロンプトに製品を保存する (ロック取得済みであること前提)
   */
  async saveProducts(
    promptUniqueKey: string,
    products: any[],
    shopName: string,
    isPartial: boolean = false,
  ): Promise<void> {
    try {
      // 空の製品リストの場合は早期リターン（ただしソースサイトは追加する）
      if (products.length === 0) {
        console.log(`プロンプト(${promptUniqueKey})に${shopName}からの商品はありません`)

        // 現在のプロンプト情報を取得
        const currentPrompt = await prisma.prompt.findUnique({
          where: { uniqueKey: promptUniqueKey },
          select: { result: true },
        })

        // 既存の結果データを取得
        const existingResult = (currentPrompt?.result as any) || {}
        const existingSourceSites = existingResult.sourceSites || []

        // 新しいソースサイトを追加（商品がなくてもソースは記録）
        let sourceSites = [...existingSourceSites]
        if (!sourceSites.includes(shopName)) {
          sourceSites.push(shopName)

          // ソースサイトのみ更新
          await prisma.prompt.update({
            where: { uniqueKey: promptUniqueKey },
            data: {
              result: {
                ...existingResult,
                sourceSites,
              },
              llmStatus: 'PROCESSING', // 処理中
            },
          })
        }

        return
      }

      // 現在のプロンプト情報を取得
      const currentPrompt = await prisma.prompt.findUnique({
        where: { uniqueKey: promptUniqueKey },
        select: { result: true },
      })

      // 既存の結果データを取得
      const existingResult = (currentPrompt?.result as any) || {}
      const existingData = existingResult.data || []
      const existingSourceSites = existingResult.sourceSites || []

      // 新しいソースサイトを追加
      let sourceSites = [...existingSourceSites]
      if (!sourceSites.includes(shopName)) {
        sourceSites.push(shopName)
      }

      // 製品データを結合
      const combinedProducts = [...existingData, ...products]

      // 結果を更新
      await prisma.prompt.update({
        where: { uniqueKey: promptUniqueKey },
        data: {
          result: {
            message: getResultMessage(combinedProducts, isPartial),
            data: combinedProducts,
            keywords: existingResult.keywords || [],
            sourceSites,
          },
          llmStatus: 'PROCESSING', // 処理中
          resultType: combinedProducts.length > 0 ? 'FOUND_PRODUCT_ITEMS' : 'NO_PRODUCT_ITEMS',
        },
      })

      console.log(
        `${products.length}件の商品をプロンプト(${promptUniqueKey})に追加しました。合計: ${combinedProducts.length}`,
      )
    } catch (error) {
      console.error(`プロンプト(${promptUniqueKey})への商品保存中にエラーが発生しました:`, error)
      throw error
    }
  },

  /**
   * プロンプトの処理を完了としてマークする
   */
  async markComplete(promptUniqueKey: string): Promise<void> {
    try {
      await prisma.prompt.update({
        where: { uniqueKey: promptUniqueKey },
        data: { llmStatus: 'SUCCESS' },
      })
      console.log(`プロンプト(${promptUniqueKey})の処理を完了としてマークしました`)
    } catch (error) {
      console.error(`プロンプト(${promptUniqueKey})の完了マーク中にエラーが発生しました:`, error)
      throw error
    }
  },
}

// 結果メッセージを生成する関数
const getResultMessage = (products: any[], isPartial: boolean = false) => {
  if (products.length === 0) {
    return '検索条件に一致する商品は見つかりませんでした。'
  }
  return `検索条件に一致する商品が${products.length}件${isPartial ? '（途中経過）' : ''}見つかりました。`
}
