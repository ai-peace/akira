import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { Tool } from 'langchain/tools'
import { translateToJapanesePrompts } from './prompts'

export class TranslateToJapaneseTool extends Tool {
  name = 'translate_to_japanese'
  description =
    'Translates the input text to Japanese. If Japanese is already included, returns it as is. Product names and similar terms are kept in their original form.'

  private translator: BaseChatModel

  constructor(translator: BaseChatModel) {
    super()
    this.translator = translator
  }

  async _call(input: string): Promise<string> {
    if (!this.translator) throw new Error('Translator not initialized')

    // 既に日本語が含まれている場合はそのまま返す
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(input)) return input

    const response = await this.translator.invoke([
      ['system', translateToJapanesePrompts.translateSystemPrompt],
      ['human', input],
    ])

    return response.content as string
  }
}
