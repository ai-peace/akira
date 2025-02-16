import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { Tool } from '@langchain/core/tools'
import { extractKeywordsPrompts } from './prompts'

export class ExtractKeywordsTool extends Tool {
  name = 'extract_keywords'
  description = 'Extract 20 characteristic keywords from Mandarake items'

  private model: BaseChatModel

  constructor(model: BaseChatModel) {
    super()
    this.model = model
  }

  async _call(input: string): Promise<string> {
    try {
      const prompt = extractKeywordsPrompts.extractKeywords(input)
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
