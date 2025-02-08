import { Tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { ProductItemEntity } from '../../domains/entities/product-item.entity'

export class ExtractKeywordsTool extends Tool {
  name = 'extract_keywords'
  description = 'Extract 20 characteristic keywords from Mandarake items'
  private model: ChatOpenAI

  constructor(openAIApiKey: string) {
    super()
    this.model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
      openAIApiKey,
    })
  }

  async _call(input: string): Promise<string> {
    try {
      const items: ProductItemEntity[] = JSON.parse(input)

      const prompt = `
以下の商品リストから特徴的なキーワードを20個抽出し、日本語と英語のペアを作成してください。
商品のタイトル、状態、ショップ情報などから、コレクターにとって重要な特徴を表すキーワードを選んでください。
以下の形式でJSONを返してください：

[
  { "en": "English Keyword", "ja": "日本語キーワード" },
  ...
]

商品リスト:
${JSON.stringify(items, null, 2)}
`

      const response = await this.model.invoke(prompt)
      return response.content as string
    } catch (error: unknown) {
      if (error instanceof Error) {
        return JSON.stringify({ error: 'Failed to extract keywords', details: error.message })
      }
      return JSON.stringify({
        error: 'Failed to extract keywords',
        details: 'Unknown error occurred',
      })
    }
  }
}
