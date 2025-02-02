import { ChatOpenAI } from '@langchain/openai'
import { MandarakeCrawlerTool } from './mandarake-crawler.service'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'

export class RareItemSearchService {
  private agent: AgentExecutor | null = null

  static async create(openAIApiKey: string): Promise<RareItemSearchService> {
    const service = new RareItemSearchService()
    await service.initialize(openAIApiKey)
    return service
  }

  private async initialize(openAIApiKey: string): Promise<void> {
    const tools = [new MandarakeCrawlerTool()]
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey,
    })

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are a helpful assistant that searches for rare items on Mandarake. You will use the mandarake_crawler tool to search for items and analyze the results.',
      ],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ])

    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    })

    this.agent = new AgentExecutor({
      agent,
      tools,
      verbose: false,
    })
  }

  async searchItems(keyword: string): Promise<string> {
    if (!this.agent) {
      throw new Error('Service not initialized')
    }

    const result = await this.agent.invoke({
      input: `Please search for rare items on Mandarake using the keyword "${keyword}" and analyze the results. Focus on finding the most interesting and valuable items.`,
    })

    return result.output
  }
}
