import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
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
    console.log('buildQueryStep', context)

    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    console.log('translatedKeyword', translatedKeyword)
    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryMoetakuAgent.stream([
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

export { buildQueryMoetakuStep }

const buildQueryMoetakuAgent = new Agent({
  name: 'buildQueryMoetakuAgent',
  instructions: `あなたは「もえたく！」サイトの検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 「もえたく！」サイトの検索構造
「もえたく！」サイトのURLパラメータ構造は以下の通りです：

出力形式:
{
  "keyword": "検索キーワード", // ky=パラメータに使用
  "options": {
    // 以下、適用されるフィルターパラメータ
  }
}

オプションのルール:
1. キーワード検索:
   - ky=[キーワード] - 検索キーワード
   - t=w - 検索タイプ（通常はこの値）

2. カテゴリーフィルター:
   - ct=[カテゴリー名] - カテゴリーでフィルター
   - 例: "ct=フィギュア", "ct=プラモデル"

3. シリーズフィルター:
   - sr=[シリーズ名] - シリーズでフィルター
   - 例: "sr=ねんどろいど", "sr=figma"

4. メーカーフィルター:
   - mk=[メーカー名] - メーカーでフィルター
   - 例: "mk=グッドスマイルカンパニー", "mk=バンダイ"

5. 原作フィルター:
   - og=[原作名] - 原作でフィルター
   - 例: "og=VOCALOID(ボーカロイド)", "og=初音ミク"

6. ページネーション:
   - pg=[ページ番号] - ページ番号
   - 例: "pg=2"

キーワードについて:
- オプションに関連する単語（カテゴリー、シリーズ、メーカーなど）は、それぞれ対応するパラメータとして options に設定し、純粋な検索キーワードのみを keyword として抽出してください。
- ユーザーがカテゴリー、シリーズ、メーカーなどを指定した場合、対応するパラメータを設定してください。
- ユーザーがページを指定した場合（例：2ページ目）、pg パラメータを設定してください。

ユーザーの入力を解析し、上記の形式で結果を出力してください。`,
  model: openai('gpt-4o-mini'),
})
