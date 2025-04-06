import { Step } from '@mastra/core/workflows'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQueryMoetakuStep = new Step({
  id: 'buildQueryMoetakuStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryAgent.stream([
      {
        role: 'user',
        content: translatedKeyword,
      },
    ])

    console.log('response----------------', response)

    let result = ''
    for await (const chunk of response.textStream) {
      result += chunk
    }
    console.log('result----------------', result)

    try {
      const parsedResult = JSON.parse(result)
      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options || {},
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

const buildQueryAgent = new Agent({
  name: 'moetaku-query-builder',
  model: openai('gpt-4o-mini'),
  instructions: `
    あなたはもえたく！の検索クエリを構築するアシスタントです。
    ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

    検索パラメータの仕様：
    - 必須パラメータ:
      - ky: 検索キーワード
    - オプションパラメータ:
      - category: 商品カテゴリー
        - figure: フィギュア
        - plamodel: プラモデル
        - tcg: トレーディングカード
        - doll: ドール
        - kamenrider: 仮面ライダー
        - bearbrick: BE@RBRICK
        - lego: LEGO
        - mgoods: 抱き枕カバー
        - omocha: おもちゃ
      - sort: ソート順
        - price_desc: 価格が高い順
        - price_asc: 価格が低い順

    処理のルール：
    1. キーワードからは検索に関係ない指示語を除外
    2. 以下の優先順位でパラメータを設定：
       - カテゴリー
       - 価格順

    出力形式：
    {
      "keyword": "検索キーワード",
      "options": {
        "category": "カテゴリー",
        "sort": "ソート順"
      }
    }
  `,
})

export { buildQueryMoetakuStep }
