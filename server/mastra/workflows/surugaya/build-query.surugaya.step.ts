import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { translateStep } from '../common/translate.step'

const buildQueryStep = new Step({
  id: 'buildQueryStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    console.log('buildQueryStep', context)

    // 前のステップの結果から翻訳されたキーワードを取得
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
        options: parsedResult.options || {},
      }
    } catch (e) {
      throw new Error('Failed to parse agent response')
    }
  },
})

export { buildQueryStep }

const buildQueryAgent = new Agent({
  name: 'surugaya-query-builder',
  model: openai('gpt-4o-mini'),
  instructions: `あなたは駿河屋の検索クエリを構築するアシスタントです。
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
   - search_word: 検索キーワード（必須）
   - category: カテゴリID
     - "10": 雑貨・小物
     - "5": おもちゃ・ホビー
     - "7": 本・コミック
     - "11": 同人
     - "4": 音楽ソフト
     - "3": 映像ソフト
     - "2": ゲーム
     - "6": パソコン・スマホ
     - "8": 家電・カメラ・AV機器
     - "12": 福袋

2. 商品状態:
   - sale_classified: 商品状態
     - "中古": 中古商品
     - "新品": 新品商品
     - "予約": 予約商品

3. 在庫状態:
   - inStock: 在庫状態
     - "On": 在庫ありのみ
     - "Off": 品切れを含む

4. 表示順:
   - sort: 並び替え
     - "人気順": デフォルト
     - "値段が安い順": 価格の安い順
     - "値段が高い順": 価格の高い順
     - "更新の新しい順": 新着順
     - "発売日の新しい順": 発売日新しい順
     - "発売日の古い順": 発売日古い順

5. 価格範囲:
   - price: 価格範囲（配列形式）
     例: [800,1699] = 800円から1699円まで
     定義済み範囲:
     - [0,799]: 799円以下
     - [800,1699]: 800円-1699円
     - [1700,4599]: 1700円-4599円
     - [4600,9099]: 4600円-9099円
     - [9100,27099]: 9100円-27099円
     など

6. 商品変動:
   - hendou: 商品の変動状態
     - "人気上昇中": 人気上昇中の商品
     - "値下げ": 値下げされた商品
     - "新入荷": 新しく入荷した商品

7. ページネーション:
   - page: ページ番号（1から開始）
   - grid: 表示形式
     - "f": リスト表示
     - "t": ウィンドウショッピング表示

8. マーケットプレイス:
   - is_marketplace: マーケットプレイス優先
     - "1": マーケットプレイス優先
     - "0": 駿河屋優先

注意事項:
1. キーワードからは検索に関係ない単語（在庫、価格、表示順など）を除外
2. 日本語キーワードはエンコードが必要
3. 複数のカテゴリを指定する場合はカンマ区切り

例:
入力: "ワンピース フィギュア 新品 在庫あり 5000円以上 人気順"
出力: {
  "keyword": "ワンピース フィギュア",
  "options": {
    "category": "5",
    "sale_classified": "新品",
    "inStock": "On",
    "price": [5000,999999],
    "sort": "人気順"
  }
}`,
})
