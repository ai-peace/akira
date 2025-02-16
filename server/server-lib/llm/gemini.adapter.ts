import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseMessage, AIMessage } from '@langchain/core/messages'
import { ChatResult } from '@langchain/core/outputs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CallbackManagerForLLMRun } from '@langchain/core/dist/callbacks/manager'

export class GeminiChatModel extends BaseChatModel {
  private model: any

  constructor({
    apiKey,
    modelName,
    temperature = 0.7,
  }: {
    apiKey: string
    modelName: string
    temperature?: number
  }) {
    super({})
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: temperature,
      },
    })
  }

  async _generate(
    messages: BaseMessage[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    try {
      const prompt = messages.map((m) => m.content).join('\n')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return {
        generations: [
          {
            text: text,
            message: new AIMessage(text),
          },
        ],
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw error
    }
  }

  _llmType(): string {
    return 'gemini'
  }
}
