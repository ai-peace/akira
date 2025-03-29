# サービスのボイラープレート

## 目的

このファイルは、特定のドメインに関連するビジネスロジックを実装するサービスを定義します。
サービスは、外部APIとの連携、複雑な処理の実行、ドメイン固有のロジックのカプセル化などを担当します。

## 配置場所

`server/server-service/{service-name}/{file-name}.ts`

## ルール

1. サービス名は機能を表す名前にする（例: `conversation-agent`, `payment-processor`）
2. クラスベースの実装を基本とし、必要に応じてシングルトンパターンを使用する
3. 依存関係は明示的に注入する（コンストラクタインジェクションなど）
4. エラーハンドリングを適切に実装する
5. 型安全性を確保する
6. 外部サービスとの連携部分は適切に抽象化する
7. 設定値は環境変数やサーバー定数から取得する
8. 複雑なロジックは適切に分割する

## 実装例

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser } from '@langchain/core/output_parsers'
import { prisma } from '@/server/server-lib/prisma-service.util'
import { applicationServerConst } from '@/server/server-const/application.server-const'

// 入力スキーマの定義
const outputSchema = z.object({
  result: z.string(),
  confidence: z.number().min(0).max(1),
})

// カスタムパーサーの実装
class CustomOutputParser extends BaseOutputParser<z.infer<typeof outputSchema>> {
  private parser: StructuredOutputParser<typeof outputSchema>

  constructor() {
    super()
    this.parser = StructuredOutputParser.fromZodSchema(outputSchema)
  }

  getFormatInstructions(): string {
    return this.parser.getFormatInstructions()
  }

  async parse(input: string) {
    try {
      return await this.parser.parse(input)
    } catch (e) {
      // エラーハンドリング
      throw e
    }
  }
}

// サービスクラスの実装
export class AnalysisService {
  private model: BaseChatModel
  private parser: CustomOutputParser

  constructor(model?: BaseChatModel) {
    // デフォルト値の設定
    this.model =
      model ||
      new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0,
        apiKey: applicationServerConst.openai.apiKey,
      })
    this.parser = new CustomOutputParser()
  }

  // モデルの設定
  setModel(model: BaseChatModel) {
    this.model = model
  }

  // 主要な処理メソッド
  async analyzeText(uniqueKey: string, text: string) {
    try {
      // プロンプトの作成
      const prompt = ChatPromptTemplate.fromMessages([
        { role: 'system', content: 'あなたはテキスト分析の専門家です。' },
        { role: 'user', content: `以下のテキストを分析してください: ${text}` },
      ])

      // 処理チェーンの構築
      const chain = RunnableSequence.from([prompt, this.model, this.parser])

      // 処理の実行
      const result = await chain.invoke({})

      // 結果の保存
      await this.saveResult(uniqueKey, result)

      return result
    } catch (error) {
      // エラーハンドリング
      console.error('Text analysis failed:', error)
      await this.saveError(uniqueKey, error)
      throw error
    }
  }

  // 結果の保存
  private async saveResult(uniqueKey: string, result: z.infer<typeof outputSchema>) {
    await prisma.prompt.update({
      where: { uniqueKey },
      data: {
        result: result,
        resultType: 'TEXT_ANALYSIS',
        llmStatus: 'SUCCESS',
        llmStatusChangeAt: new Date(),
      },
    })
  }

  // エラーの保存
  private async saveError(uniqueKey: string, error: any) {
    await prisma.prompt.update({
      where: { uniqueKey },
      data: {
        llmError: error.message || String(error),
        llmStatus: 'FAILED',
        llmStatusChangeAt: new Date(),
      },
    })
  }
}

// シングルトンインスタンスのエクスポート
export const analysisService = new AnalysisService()
```

## 使用例

```typescript
// server/server-service/conversation-agent/index.tool.ts
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser } from '@langchain/core/output_parsers'
import { conversationAgentPrompt } from './prompt'
import { prisma } from '@/server/server-lib/prisma-service.util'

// スキーマ定義
const actionSchema = z.object({
  action: z.enum(['CHAT', 'SEARCH']),
  reasoning: z.string(),
})

// コンテキスト型の定義
type ConversationContext = {
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

// カスタムパーサーの実装
class SafeStructuredOutputParser extends BaseOutputParser<z.infer<typeof actionSchema>> {
  private parser: StructuredOutputParser<typeof actionSchema>

  constructor() {
    super()
    this.parser = StructuredOutputParser.fromZodSchema(actionSchema)
  }

  getFormatInstructions(): string {
    return this.parser.getFormatInstructions()
  }

  async parse(input: string) {
    try {
      return await this.parser.parse(input)
    } catch (e) {
      // エラーハンドリング
      const matched = input.match(/\{.*\}/)
      if (matched) {
        return await this.parser.parse(matched[0])
      }
      throw e
    }
  }
}

// サービスクラスの実装
export class ConversationAgent {
  private model: BaseChatModel
  private context: ConversationContext
  private parser: SafeStructuredOutputParser

  constructor(model?: BaseChatModel) {
    this.model =
      model ||
      new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0,
      })
    this.context = { history: [] }
    this.parser = new SafeStructuredOutputParser()
  }

  setModel(model: BaseChatModel) {
    this.model = model
  }

  async processInput(promptUniqueKey: string, input: string) {
    // 会話履歴の更新
    this.context.history.push({ role: 'user', content: input })

    // チャット処理の実行
    return await this.handleChat(promptUniqueKey, input)
  }

  private async handleChat(promptUniqueKey: string, input: string) {
    // プロンプトの作成
    const chatPrompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: conversationAgentPrompt.systemPersonality },
      ...this.context.history.map(({ role, content }) => ({ role, content })),
    ])

    // 処理チェーンの構築
    const chain = RunnableSequence.from([chatPrompt, this.model])

    // 処理の実行
    const response = await chain.invoke({})
    const content = String(response.content || response)

    // 会話履歴の更新
    this.context.history.push({ role: 'assistant', content })

    // 結果の保存
    await prisma.prompt.update({
      where: { uniqueKey: promptUniqueKey },
      data: {
        result: { message: content },
        llmStatus: 'SUCCESS',
        resultType: 'AGENT_RESPONSE',
      },
    })

    return content
  }
}

// シングルトンインスタンスのエクスポート
export const conversationAgent = new ConversationAgent()
```

## 注意点

1. **外部APIの呼び出し**

   - API呼び出しは適切にエラーハンドリングする
   - レート制限を考慮する
   - タイムアウト処理を実装する
   - 再試行メカニズムを検討する

2. **状態管理**

   - サービスの状態は明示的に管理する
   - 必要に応じてデータベースに状態を保存する
   - 並行処理を考慮する

3. **テスト容易性**

   - 依存関係を注入可能にして、モックやスタブを使用したテストを容易にする
   - 副作用を分離する
   - 純粋関数を活用する

4. **エラーハンドリング**

   - エラーは適切に捕捉し、意味のあるエラーメッセージを提供する
   - エラーログを適切に記録する
   - エラー状態をデータベースに保存する

5. **パフォーマンス**
   - 重い処理は非同期で実行する
   - キャッシュを活用する
   - 必要に応じてバッチ処理を実装する
