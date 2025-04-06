# buildQueryのstepを構築してください

## 依頼内容

ありがとうございます。
いただいたキーワード検索のURLと絞り込みのキーワードクエリを元に
キーワードのクエリビルダーのエージェントを作ろうと思います。

以下のテンプレートを元に、作成いただけますか。

## ファイルの置き場所

`server/mastra/workflows/{サイト名}/build-query.{サイト名}.step.ts`

## 作成テンプレート

```ts
import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'

const buildQuerySiteNameStep = new Step({
  id: 'buildQuerySiteNameStep',
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
      return {
        keyword: parsedResult.keyword,
        options: parsedResult.options,
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

export { buildQueryMandarakeStep }

// これは例でサイトによってクエリ生成が変わってきます。
// またURLテンプレートは次のステップにて生成するので、クエリビルド生成に専念してください。
const buildQuerySitenameAgent = new Agent({
  name: 'buildQuerySitenameAgent',
  instructions: `あなたは{サイト名}の検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 最重要指示
**在庫状態は指定がない限り必ず「在庫ありのみ」（soldOut=1）を出力してください。**
**ユーザーが明示的に「在庫なし含む」などと指定した場合のみ、soldOutパラメータを省略してください。**

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    "soldOut": "1", // ★重要: 指定がなければ必ず在庫ありのみ(soldOut=1)を設定
    // その他URLクエリパラメータ
  }
}

オプションのルール:
1. 在庫状態 【最優先事項】:
   - **デフォルト: "soldOut=1" (在庫ありのみ) ← 指定がなければ必ずこれを設定**
   - 在庫なしを含む場合のみ: パラメータなし

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

ユーザーの入力を解析し、上記の形式で結果を出力してください。最後にもう一度確認してください：
**ユーザーが明示的に在庫なしを含むよう指定していない場合は、必ずsoldOut=1を設定すること。**`,
  model: openai('gpt-4o-mini'),
})
```
