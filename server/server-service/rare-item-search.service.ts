import { ChatOpenAI } from '@langchain/openai'
import { MandarakeCrawlerTool } from './mandarake-crawler.service'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'

export class RareItemSearchService {
  private agentExecutor: AgentExecutor | null = null

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
        'You are a helpful assistant that searches for rare items on Mandarake. You will use the mandarake_crawler tool to search for items and analyze the results. JSON format is required.',
      ],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ])

    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    })

    this.agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: false,
    })
  }

  async searchItems(keyword: string): Promise<any> {
    if (!this.agentExecutor) {
      throw new Error('Service not initialized')
    }

    const result = await this.agentExecutor.invoke({
      input: `Search for rare items on Mandarake using the keyword "${keyword}". Focus on finding the most interesting and valuable items.`,
    })

    try {
      // JSON文字列を抽出する
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      // 抽出したJSON文字列をパースする
      const jsonData = JSON.parse(jsonMatch[1])

      // 必要なデータ構造に変換
      return {
        items: jsonData.items.map((item: any) => ({
          title: item.title,
          price: item.price,
          priceWithTax: item.priceWithTax,
          condition: item.status || 'Unknown',
          rarity: 'Standard', // または適切な値を設定
          description: `Available at: ${item.shopInfo}${item.priceRange ? ` ${item.priceRange}` : ''}`,
        })),
        summary: `Found ${jsonData.items.length} items on Mandarake`,
      }
    } catch (error) {
      console.error('Failed to parse response:', result.output)
      throw new Error('Failed to parse agent response as JSON')
    }
  }
}
