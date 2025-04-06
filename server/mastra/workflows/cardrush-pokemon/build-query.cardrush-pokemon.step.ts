import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQueryCardrushPokemonStep = new Step({
  id: 'buildQueryCardrushPokemonStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    console.log('buildQueryStep', context)

    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    console.log('translatedKeyword', translatedKeyword)
    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryCardrushPokemonAgent.stream([
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
      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options,
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

export { buildQueryCardrushPokemonStep }

const buildQueryCardrushPokemonAgent = new Agent({
  name: 'buildQueryCardrushPokemonAgent',
  instructions: `あなたはカードラッシュポケモンの検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 最重要指示
**在庫状態は指定がない限り必ず「在庫ありのみ」を出力してください。**
**ユーザーが明示的に「在庫なし含む」などと指定した場合のみ、在庫ありフラグを無効にしてください。**

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    "stock": "in-stock", // ★重要: 指定がなければ必ず在庫ありのみ(in-stock)を設定
    // その他URLクエリパラメータ
  }
}

オプションのルール:
1. 在庫状態 【最優先事項】:
   - **デフォルト: "stock=in-stock" (在庫ありのみ) ← 指定がなければ必ずこれを設定**
   - 在庫なしを含む場合のみ: "stock=all"

2. 表示順:
   - デフォルト: "sort=price-asc" (価格が安い順)
   - 価格高い順: "sort=price-desc"
   - 新着順: "sort=newest"
   - 人気順: "sort=popular"

3. 表示件数:
   - デフォルト: "display=100"
   - その他: "display=20", "display=40", "display=60", "display=80"

4. カテゴリ:
   - 特定のカテゴリがある場合のみ設定: "category=[カテゴリ名]"

キーワードについて:
- オプションに関連する単語（在庫、価格、表示順、カテゴリなど）は除外し、純粋な検索キーワードのみを抽出してください。
- 例えば「安いピカチュウカード」の場合、キーワードは「ピカチュウ」となります。

ユーザーの入力を解析し、上記の形式で結果を出力してください。最後にもう一度確認してください：
**ユーザーが明示的に在庫なしを含むよう指定していない場合は、必ずstock=in-stockを設定すること。**`,
  model: openai('gpt-4o-mini'),
})
