import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQueryToysrusStep = new Step({
  id: 'buildQueryToysrusStep',
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

    const response = await buildQueryToysrusAgent.stream([
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

export { buildQueryToysrusStep }

const buildQueryToysrusAgent = new Agent({
  name: 'buildQueryToysrusAgent',
  instructions: `あなたはトイザらス（Toys"R"Us）日本の検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 最重要指示
**在庫状態は指定がない限り必ず「在庫ありのみ」（inStock=true）を出力してください。**
**ユーザーが明示的に「在庫なし含む」などと指定した場合のみ、inStockパラメータを省略してください。**

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    "inStock": "true", // ★重要: 指定がなければ必ず在庫ありのみを設定
    // その他URLクエリパラメータ
  }
}

オプションのルール:
1. 在庫状態 【最優先事項】:
   - **デフォルト: "inStock=true" (在庫ありのみ) ← 指定がなければ必ずこれを設定**
   - 在庫なしを含む場合のみ: パラメータなし

2. 表示順:
   - デフォルト: "sort=price&order=asc" (価格が安い順)
   - 価格高い順: "sort=price&order=desc"
   - 新着順: "sort=new&order=desc"
   - 人気順: "sort=popular&order=desc"
   - 評価の高い順: "sort=rating&order=desc"
   - 評価の低い順: "sort=rating&order=asc"

3. 価格範囲:
   - 最低価格指定: "minPrice=[金額]"
   - 最高価格指定: "maxPrice=[金額]"

4. カテゴリ/ブランド:
   - トミカ: "category=tomica"
   - プラレール: "category=plarail"
   - レゴ: "category=lego"
   - バービー: "category=barbie"
   - ディズニー: "category=disney"
   - スターウォーズ: "category=starwars"

5. 年齢:
   - 0〜1歳: "age=0-1"
   - 2〜3歳: "age=2-3"
   - 4〜6歳: "age=4-6"
   - 7〜9歳: "age=7-9"
   - 10〜12歳: "age=10-12"
   - 12歳以上: "age=12plus"

キーワードについて:
- オプションに関連する単語（在庫、価格、表示順、カテゴリなど）は除外し、純粋な検索キーワードのみを抽出してください。
- 商品名、シリーズ名、ブランド名などの具体的な検索対象を優先してください。

ユーザーの入力を解析し、上記の形式で結果を出力してください。最後にもう一度確認してください：
**ユーザーが明示的に在庫なしを含むよう指定していない場合は、必ずinStock=trueを設定すること。**`,
  model: openai('gpt-4o-mini'),
})
