import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from './translate.step'

// 利用可能なショップのリスト
export type ShopSource = 'mandarake' | 'surugaya' | 'treasureF' | 'toysrus' | 'cardrushPokemon'

// どのショップを検索に使用するかを判断するステップ
const selectSourcesStep = new Step({
  id: 'selectSourcesStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    selectedSources: z.array(z.string()),
    translatedKeyword: z.string(),
  }),
  execute: async ({ context }) => {
    console.log('selectSourcesStep', context)

    const translatedResult = context.getStepResult(translateStep)
    const translatedKeyword = translatedResult?.translatedKeyword

    console.log('translatedKeyword', translatedKeyword)
    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await sourceSelectAgent.stream([
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

      // 最大3つまでのソースに制限する
      let selectedSources = parsedResult.selectedSources
      if (selectedSources.length > 3) {
        selectedSources = selectedSources.slice(0, 3)
      }

      return {
        selectedSources,
        translatedKeyword,
      }
    } catch (e) {
      console.error('Failed to parse agent response:', e)
      // エラーが発生した場合は、デフォルトで最初の3つのソースを選択
      return {
        selectedSources: ['mandarake', 'surugaya', 'treasureF'],
        translatedKeyword,
      }
    }
  },
})

export { selectSourcesStep }

// ソース選択エージェント
const sourceSelectAgent = new Agent({
  name: 'sourceSelectAgent',
  instructions: `あなたは検索クエリに基づいて最適な検索ソースを選択するエキスパートです。
ユーザーの検索キーワードを分析し、最も関連性の高いショップを選択してください。

# 利用可能なショップ
1. mandarake - まんだらけ: アニメ、マンガ、フィギュア、TCG、同人誌など幅広いジャンルの中古品を扱う
2. surugaya - 駿河屋: ゲーム、DVD、CD、書籍、おもちゃなど様々なジャンルの中古品を扱う
3. treasureF - トレジャーファクトリー: 家電、家具から衣類、アクセサリー、おもちゃまで幅広いリユース品を扱う
4. toysrus - トイザらス: 子供向けおもちゃ、ゲーム、ベビー用品などを扱う大型総合玩具店
5. cardrushPokemon - カードラッシュ: ポケモンカードなどTCG専門店

# 選択の基準
- キーワードの内容と各ショップの専門性を照らし合わせる
- 特定のカテゴリに特化したショップを優先する（例：TCGならcardrushPokemon）
- 一般的な商品は複数のショップから検索する
- 最も関連性の高いショップを最大3つまで選択する

# 出力形式
検索キーワードを分析し、以下の形式でJSONを出力してください:

{
  "selectedSources": ["ショップ名1", "ショップ名2", "ショップ名3"],
  "reasoning": "選択理由を簡潔に説明"
}

選択するショップは最大3つまでとし、関連性の高い順に並べてください。
必ず"selectedSources"キーに有効なショップ名（mandarake, surugaya, treasureF, toysrus, cardrushPokemon）のみを含めてください。`,
  model: openai('gpt-4o-mini'),
})
