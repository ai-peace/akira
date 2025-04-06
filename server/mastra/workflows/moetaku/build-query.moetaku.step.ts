import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { translateStep } from '../common/translate.step'

/**
 * もえたく！サイト用クエリビルダーステップ
 * 検索キーワードとオプションからURLを構築する
 */
export const buildMoetakuQueryStep = new Step({
  id: 'buildMoetakuQueryStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
    searchUrl: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    console.log('translatedKeyword', translatedKeyword)
    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryAgent.stream([
      {
        role: 'user',
        content: translatedKeyword,
      },
    ])

    let result = ''
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk)
      result += chunk
    }

    try {
      const parsedResult = JSON.parse(result)

      // 検索URLの構築
      const baseUrl = 'https://www.netoff.co.jp/figure/purchase/'
      const params = new URLSearchParams()

      // 基本検索キーワード
      params.append('ky', parsedResult.keyword)

      // オプションをパラメータに追加
      Object.entries(parsedResult.options || {}).forEach(([key, value]) => {
        params.append(key, String(value))
      })

      const searchUrl = `${baseUrl}?${params.toString()}`
      console.log('もえたく！Search URL:', searchUrl)

      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options || {},
        searchUrl,
      }
    } catch (e) {
      console.error('Failed to parse agent response:', e)
      throw new Error('Failed to parse agent response')
    }
  },
})

const buildQueryAgent = new Agent({
  name: 'moetaku-query-builder',
  model: openai('gpt-4o-mini'),
  instructions: `あなたはネットオフの買取サイト「もえたく！」の検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    // URLクエリパラメータの形式で出力
  }
}

検索パラメータの仕様:

1. 基本検索パラメータ:
   - t: 検索タイプ
     - "w": ワード検索（デフォルト）

2. カテゴリ:
   - cid: カテゴリID
     - "70001": フィギュア
     - "70002": ドール
     - "70003": プライズ
     - "70004": トレカ
     - "70005": ゲーム
     - "70006": アニメ
     - "70007": 同人

3. 価格範囲:
   - minp: 最小価格（例: 1000）
   - maxp: 最大価格（例: 5000）

4. ソート順:
   - sort: ソート基準
     - "price_asc": 価格が安い順
     - "price_desc": 価格が高い順
     - "new": 新着順

5. 在庫状態:
   - stock: 在庫状態
     - "1": 在庫ありのみ
     - "0": すべて表示

注意事項:
1. キーワードからは検索に関係ない単語（在庫、価格、表示順など）を除外
2. 日本語キーワードは自動的にエンコードされる
3. 不要なオプションは省略

例:
入力: "ワンピース フィギュア 新品 在庫あり 5000円以上"
出力: {
  "keyword": "ワンピース フィギュア 新品",
  "options": {
    "t": "w",
    "cid": "70001",
    "minp": "5000",
    "stock": "1"
  }
}`,
})
