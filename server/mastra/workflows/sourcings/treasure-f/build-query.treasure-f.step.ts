import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'
import { selectSourcesStep } from '../common/select-sources.step'
import { translateStep } from '../common/translate.step'

const buildQueryTreasureFStep = new Step({
  id: 'buildQueryTreasureFStep',
  inputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  outputSchema: z.object({
    keyword: z.string(),
    options: z.record(z.string()),
  }),
  execute: async ({ context }) => {
    console.log('buildQueryTreasureFStep', context)

    // selectSourcesStepから取得を試み、なければtranslateStepから取得
    let translatedKeyword = context.getStepResult(selectSourcesStep)?.translatedKeyword
    if (!translatedKeyword) {
      translatedKeyword = context.getStepResult(translateStep)?.translatedKeyword
    }

    console.log('translatedKeyword', translatedKeyword)
    if (!translatedKeyword) throw new Error('Translated keyword is required')

    const response = await buildQueryTreasureFAgent.stream([
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

export { buildQueryTreasureFStep }

const buildQueryTreasureFAgent = new Agent({
  name: 'buildQueryTreasureFAgent',
  instructions: `あなたはトレファクONLINE(treasure-f.com)の検索クエリを構築するアシスタントです。
ユーザーの入力から検索キーワードとオプションを抽出し、適切な形式に整形してください。

# 最重要指示
**在庫状態は指定がない限り必ず「在庫ありのみ」を出力してください。**
**ユーザーが明示的に「在庫なし含む」などと指定した場合のみ、在庫状態パラメータを変更してください。**
**特に指定がなければ、必ずホビー・おもちゃ、ゲーム・本・DVD類のカテゴリに絞ってください。**

出力形式:
{
  "keyword": "検索キーワード",
  "options": {
    // URLクエリパラメータ
  }
}

オプションのルール:
1. 在庫状態 【最優先事項】:
   - デフォルト: 在庫ありのみ（パラメータ不要、デフォルトで在庫ありのみ表示）
   - 在庫なしを含む: "step=1"

2. 表示順:
   - デフォルト: "order=relevance" (関連順)
   - 価格安い順: "order=lowprice"
   - 価格高い順: "order=highprice"
   - 新着順: "order=newarrival"

3. 表示形式:
   - デフォルト: "size=grid" (グリッド表示)
   - リスト表示: "size=list"

4. 表示件数:
   - デフォルト: "number=60" (60件表示)
   - 30件表示: "number=30"
   - 90件表示: "number=90"

5. カテゴリ:
   - デフォルト: "category=ホビー・おもちゃ,ゲーム・本・DVD類"（指定がなければ必ずこれを設定）
   - ホビー・おもちゃ: "category=ホビー・おもちゃ"
   - ゲーム・本・DVD類: "category=ゲーム・本・DVD類"
   - その他具体的なカテゴリが指定された場合は適切に設定

   【ホビー・おもちゃのサブカテゴリ例】
   - フィギュア: "subCategory=フィギュア"
   - プラモデル: "subCategory=プラモデル"
   - ミニカー: "subCategory=ミニカー"
   - トレーディングカード: "subCategory=トレーディングカード"
   - ボードゲーム: "subCategory=ボードゲーム"
   - アウトドア・レジャー: "subCategory=アウトドア・レジャー"
   - テント・タープ: "subCategory=テント・タープ"

   【ゲーム・本・DVD類のサブカテゴリ例】
   - TVゲーム: "subCategory=TVゲーム"
   - ニンテンドースイッチ: "subCategory=ニンテンドースイッチ"
   - プレイステーション: "subCategory=プレイステーション"
   - レトロゲーム: "subCategory=レトロゲーム"
   - 漫画: "subCategory=漫画"
   - 書籍: "subCategory=書籍"
   - CD・DVD・ブルーレイ: "subCategory=CD・DVD・ブルーレイ"

6. ページ番号:
   - デフォルト: page=1（省略可能）
   - 2ページ目以降: "page=2"など

7. ステップパラメータ:
   - 基本: "step=1"

8. 価格範囲:
   - 最小価格: "minPrice=数値"（例: "minPrice=1000"）
   - 最大価格: "maxPrice=数値"（例: "maxPrice=5000"）

9. 商品状態フィルター:
   - セール商品のみ: "sale=1"
   - 未使用商品のみ: "itemCondition=6"
   - 美品: "itemCondition=5" 
   - 良品: "itemCondition=4"
   - 並品: "itemCondition=3"
   - 難あり: "itemCondition=2"
   - 破損有り: "itemCondition=1"
   - ジャンク品: "itemCondition=0"

10. ショップフィルター:
   - 特定ショップでの絞り込み: "shop=ショップ名"

11. その他:
   - 詳細カテゴリ設定: "subCategory=サブカテゴリ名"（例: "subCategory=テント・タープ"）
   - ブランド指定: "brand=ブランド名"（例: "brand=コールマン"）

キーワードについて:
- オプションに関連する単語（在庫、価格、表示順、カテゴリなど）は除外し、純粋な検索キーワードのみを抽出してください。

ユーザーの入力を解析し、上記の形式で結果を出力してください。最後にもう一度確認してください：
**ユーザーが明示的にカテゴリを指定していない場合は、必ず「ホビー・おもちゃ,ゲーム・本・DVD類」カテゴリを設定すること。**
**ユーザーが明示的に在庫なしを含むよう指定していない場合は、在庫ありのみの設定を維持すること。**

例：
ユーザー: "5000円以下のドラゴンボールフィギュア"
出力:
{
  "keyword": "ドラゴンボールフィギュア",
  "options": {
    "category": "ホビー・おもちゃ",
    "subCategory": "フィギュア",
    "maxPrice": "5000",
    "order": "relevance",
    "size": "grid", 
    "number": "60",
    "step": "1"
  }
}

ユーザー: "未使用のポケモンカード 高い順"
出力:
{
  "keyword": "ポケモンカード",
  "options": {
    "category": "ホビー・おもちゃ",
    "subCategory": "トレーディングカード",
    "itemCondition": "6",
    "order": "highprice",
    "size": "grid",
    "number": "60",
    "step": "1"
  }
}

ユーザー: "スイッチ ゼルダの伝説"
出力:
{
  "keyword": "ゼルダの伝説",
  "options": {
    "category": "ゲーム・本・DVD類",
    "subCategory": "ニンテンドースイッチ",
    "order": "relevance",
    "size": "grid",
    "number": "60",
    "step": "1"
  }
}`,
  model: openai('gpt-4o-mini'),
})
