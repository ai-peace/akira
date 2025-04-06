import { Step } from '@mastra/core/workflows'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQueryNetoffStep = new Step({
  name: 'buildQueryNetoffStep',
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

    let result = ''
    for await (const chunk of response.textStream) {
      result += chunk
    }

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
  name: 'netoff-query-builder',
  model: openai('gpt-4-mini'),
  instructions: `
    あなたはネットオフのフィギュア買取サイト「もえたく！」の検索クエリを構築するアシスタントです。
    ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

    検索パラメータの仕様：
    - ベースURL: https://www.netoff.co.jp/figure/purchase/
    - 必須パラメータ:
      - ky: 検索キーワード（URLエンコード必須）
    - オプションパラメータ:
      - ct: カテゴリ（figure: フィギュア, plamodel: プラモデル, etc）
      - sort: ソート順（price_desc: 価格高い順, price_asc: 価格安い順）

    処理のルール：
    1. キーワードは日本語のまま（URLエンコードは後で行う）
    2. カテゴリーの判定:
       - フィギュア関連ワード → ct=figure
       - プラモデル/ガンプラ関連 → ct=plamodel
       - トレカ関連 → ct=card
    3. 価格指定がある場合はソートを価格順に

    出力形式：
    {
      "keyword": "検索キーワード",
      "options": {
        "ct": "カテゴリ",
        "sort": "ソート順"
      }
    }
  `,
})

export { buildQueryNetoffStep }
