import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'

const buildQueryStep = new Step({
  id: 'buildQueryStep',
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    console.log('buildQueryStep', context)
    const userInput = context.triggerData?.input
    if (!userInput) throw new Error('User input is required')

    const response = await buildQueryAgent.stream([
      {
        role: 'user',
        content: userInput,
      },
    ])

    let result = ''
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk)
      result += chunk
    }

    try {
      const parsedResult = JSON.parse(result)
      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options,
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

export { buildQueryStep }

const buildQueryAgent = new Agent({
  name: 'buildQueryAgent',
  instructions: `あなたはMandarakeの検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    // URLクエリパラメータの形式で出力
  }
}

オプションのルール:
1. 在庫状態:
   - デフォルト: "soldOut=1" (在庫ありのみ)
   - 在庫なしを含む場合: パラメータなし

2. 表示順:
   - デフォルト: "sort=price&sortOrder=1" (価格が高い順)
   - 価格安い順: "sort=price&sortOrder=0"
   - 新着順: "sort=arrival&sortOrder=0"
   - 古い順: "sort=arrival&sortOrder=1"

3. アダルトコンテンツ:
   - デフォルト: "dispAdult=0" (アダルトなし)
   - アダルトあり: "dispAdult=1"

4. 価格範囲:
   - 最低価格指定: "minPrice=[金額]"
   - 最高価格指定: "maxPrice=[金額]"

5. カテゴリ:
   - コミック・ラノベ: "categoryCode=11"
   - グッズ: "categoryCode=12"
   - 書籍: "categoryCode=01"
   - 雑誌: "categoryCode=10"
   - TOY: "categoryCode=02"
   - 同人: "categoryCode=03"

キーワードについて:
- オプションに関連する単語（在庫、価格、表示順、カテゴリなど）は除外し、純粋な検索キーワードのみを抽出してください。

ユーザーの入力を解析し、上記の形式で結果を出力してください。`,
  model: openai('gpt-4o-mini'),
})
