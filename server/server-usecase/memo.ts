// 引数
// 1.LLM
// 2.prompt

// キーワードを日本語に変換する
// まんだらけを検索する
//   検索URL
//   クローラー起動
// ------------
// 検索結果をパースする
// 検索結果を変換する
// 検索結果を元にプロンプトを更新する
// ------------
// キーワードを抽出する

// ▼ 本来やりたい流れ
// LLMとやりとりをする
// 検索をした方がいいと判断した場合、まんだらけがよいか駿河屋がよいか、あるいは二つとも良いかを判断する
//   まんだらけ検索モジュール
//   駿河屋検索モジュール

// 検索結果をパースする - parser
// 検索結果を変換する - transformer to product entity

// 検索結果を元にプロンプトを更新する
// キーワードを抽出する

import { OpenAI } from 'langchain/llms/openai'
import { Tool } from 'langchain/tools'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'

/**
 * 検索ツール: 指定されたキーワードで検索を行います。
 */
class SearchTool extends Tool {
  name = 'search'
  description = 'ユーザーが指定したキーワードでウェブ検索を行います。'

  async _call(input: string): Promise<string> {
    // 実際の検索処理の実装がここに入ります。
    // ここでは例としてダミーの結果を返します。
    return `検索結果: "${input}" に関する情報が見つかりました。`
  }
}

/**
 * PDF読解ツール: PDFファイルの内容を解析し、指定された情報を抽出します。
 */
class PDFReaderTool extends Tool {
  name = 'pdf_reader'
  description = 'PDFファイルの内容を解析し、指定された情報を抽出します。'

  async _call(input: string): Promise<string> {
    // 実際のPDF解析処理の実装がここに入ります。
    // ここでは例としてダミーの結果を返します。
    return `PDF読解結果: 入力内容 "${input}" に関する情報をPDFから抽出しました。`
  }
}

;(async () => {
  // 1. OpenAIモデルの初期化（環境変数にOPENAI_API_KEYを設定してください）
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  })

  // 2. カスタムツールの初期化
  const searchTool = new SearchTool()
  const pdfReaderTool = new PDFReaderTool()

  // 3. エージェントの初期化
  // エージェントは、登録されたツールの説明を元に、ユーザーの入力に適したツールを自動的に選択します。
  const agentExecutor = await initializeAgentExecutorWithOptions(
    [searchTool, pdfReaderTool],
    model,
    {
      agentType: 'zero-shot-react-description',
    },
  )

  console.log('エージェントが初期化されました。')

  // 4. ユーザーからの入力例

  // 例1: 検索に関する指示
  const userInput1 = '最新の技術ニュースを検索してください。'
  const result1 = await agentExecutor.call({ input: userInput1 })
  console.log('結果1:', result1.output)

  // 例2: PDF読解に関する指示
  const userInput2 = '契約書のPDFから重要な日付を抽出してください。'
  const result2 = await agentExecutor.call({ input: userInput2 })
  console.log('結果2:', result2.output)
})()
