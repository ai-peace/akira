import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQueryAmiAmiStep = new Step({
  id: 'buildQueryAmiAmiStep',
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

    const response = await buildQueryAmiAmiAgent.stream([
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

export { buildQueryAmiAmiStep }

const buildQueryAmiAmiAgent = new Agent({
  name: 'buildQueryAmiAmiAgent',
  instructions: `あなたはAmiAmi（あみあみ）の検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 最重要指示
**在庫状態は指定がない限り必ず「在庫ありのみ」（s_st_list_newitem_available=1）を出力してください。**
**ユーザーが明示的に「在庫なし含む」などと指定した場合のみ、在庫パラメータを省略してください。**

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    "s_st_list_newitem_available": "1", // ★重要: 指定がなければ必ず在庫ありのみを設定
    // その他URLクエリパラメータ
  }
}

オプションのルール:
1. 在庫状態 【最優先事項】:
   - **デフォルト: "s_st_list_newitem_available=1" (在庫ありのみ) ← 指定がなければ必ずこれを設定**
   - 在庫なしを含む場合のみ: パラメータなし
   - 予約可能商品のみ: "s_st_list_preorder_available=1"

2. 表示順:
   - デフォルト: "s_sortkey=preowned" (人気順)
   - 価格高い順: "s_sortkey=price_high"
   - 価格安い順: "s_sortkey=price_low"
   - 新着順: "s_sortkey=release_date"

3. 商品カテゴリ:
   - フィギュア: "s_cate_tag=1"
   - グッズ: "s_cate_tag=14"
   - ゲーム: "s_cate_tag=8"
   - 書籍: "s_cate_tag=9"

4. 商品状態:
   - 新品: "s_st_condition_flg=1"
   - 中古: "s_condition_flg=1"

5. 表示件数:
   - 通常: "pagemax=60"
   - 少なめ: "pagemax=15"
   - 多め: "pagemax=100"

6. 追加フィルター:
   - 特典付き商品: "s_st_list_store_bonus=1"
   - 送料無料: "s_st_list_free_shipping=1"

キーワードについて:
- オプションに関連する単語（在庫、価格、表示順、カテゴリなど）は除外し、純粋な検索キーワードのみを抽出してください。

ユーザーの入力を解析し、上記の形式で結果を出力してください。最後にもう一度確認してください：
**ユーザーが明示的に在庫なしを含むよう指定していない場合は、必ずs_st_list_newitem_available=1を設定すること。**`,
  model: openai('gpt-4o-mini'),
})
