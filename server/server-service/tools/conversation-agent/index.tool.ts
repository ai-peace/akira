import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { searchProductItemUsecase } from '../../../server-usecase/search-product-item.usecase'
import { conversationAgentPrompt } from './prompt'
import { prisma } from '@/server/server-lib/prisma'

const actionSchema = z.object({
  action: z.enum(['CHAT', 'SEARCH']),
  reasoning: z.string(),
})

type ConversationContext = {
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

class SafeStructuredOutputParser extends BaseOutputParser<z.infer<typeof actionSchema>> {
  private parser: StructuredOutputParser<typeof actionSchema>
  lc_namespace = ['langchain', 'output_parsers', 'safe_structured']

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
      const matched = input.match(/\{.*\}/)
      if (matched) {
        return await this.parser.parse(matched[0])
      }
      throw e
    }
  }
}

export class ConversationAgent {
  private model: ChatOpenAI
  private context: ConversationContext
  private parser: SafeStructuredOutputParser

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
    })
    this.context = { history: [] }
    this.parser = new SafeStructuredOutputParser()
  }

  async processInput(promptUniqueKey: string, input: string) {
    console.log(
      '??????????????processInput',
      ...this.context.history.map(({ role, content }) => ({ role, content })),
    )
    const prompt = ChatPromptTemplate.fromMessages([
      { role: 'system', content: conversationAgentPrompt.systemPersonality },
      ...this.context.history.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: input },
      {
        role: 'system',
        content: conversationAgentPrompt.systemOutput,
      },
    ])
    const chain = RunnableSequence.from([prompt, this.model, this.parser])
    const result = await chain.invoke({})

    // 会話履歴の更新
    this.context.history.push({ role: 'user', content: input })
    if (result.action === 'SEARCH') {
      return await this.handleSearch(promptUniqueKey, input)
    } else {
      return await this.handleChat(promptUniqueKey, input)
    }
  }

  private async handleSearch(promptUniqueKey: string, query: string) {
    // 既存の検索機能を利用
    const result = await searchProductItemUsecase.execute(promptUniqueKey, query)
    this.context.history.push({ role: 'assistant', content: `検索結果: ${JSON.stringify(result)}` })
    return result
  }

  private async handleChat(promptUniqueKey: string, input: string) {
    const chatPrompt = ChatPromptTemplate.fromMessages([
      {
        role: 'system',
        content: conversationAgentPrompt.systemBuyerChat,
      },
      ...this.context.history.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: input },
    ])

    const chain = RunnableSequence.from([chatPrompt, this.model])
    const response = await chain.invoke({})
    const content = String(response.content || response)
    this.context.history.push({ role: 'assistant', content })

    await prisma.prompt.update({
      where: {
        uniqueKey: promptUniqueKey,
      },
      data: {
        result: { message: content },
        llmStatus: 'SUCCESS',
        resultType: 'AGENT_RESPONSE',
      },
    })
    return content
  }
}

export const conversationAgent = new ConversationAgent()
