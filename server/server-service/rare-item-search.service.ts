import { ChatOpenAI } from '@langchain/openai'
import { MandarakeCrawlerTool } from './mandarake-crawler.service'
import { ExtractKeywordsTool } from './extract-keywords.service'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ProductEntity } from '@/domains/entities/product.entity'

export class RareItemSearchService {
  private agentExecutor: AgentExecutor | null = null
  private extractKeywordsTool: ExtractKeywordsTool | null = null
  private translator: ChatOpenAI | null = null

  static async create(openAIApiKey: string): Promise<RareItemSearchService> {
    const service = new RareItemSearchService()
    await service.initialize(openAIApiKey)
    return service
  }

  private async initialize(openAIApiKey: string): Promise<void> {
    const tools = [new MandarakeCrawlerTool()]
    this.extractKeywordsTool = new ExtractKeywordsTool(openAIApiKey)
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

    this.translator = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey,
    })
  }

  private async translateToJapanese(text: string): Promise<string> {
    if (!this.translator) throw new Error('Translator not initialized')

    // 既に日本語の場合はそのまま返す
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return text
    }

    const response = await this.translator.invoke([
      [
        'system',
        'You are a translator. Translate the following text to Japanese, keeping product names in their original form.',
      ],
      ['human', text],
    ])

    return response.content as string
  }

  async searchItems(keyword: string): Promise<ProductEntity[]> {
    if (!this.agentExecutor) throw new Error('Service not initialized')

    // キーワードを日本語に翻訳
    const japaneseKeyword = await this.translateToJapanese(keyword)
    console.log('Translated keyword:', japaneseKeyword)

    const result = await this.agentExecutor.invoke({
      input: `Search for rare items on Mandarake using the keyword "${japaneseKeyword}". Focus on finding the most interesting and valuable items.`,
    })

    try {
      // JSON文字列を抽出する
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) return []

      const jsonData = JSON.parse(jsonMatch[1])

      return jsonData.items.map((item: any) => ({
        title: item.title,
        price: item.price,
        priceWithTax: item.priceWithTax,
        condition: item.status || 'Unknown',
        description: `Available at: ${item.shopInfo}${item.priceRange ? ` ${item.priceRange}` : ''}`,
        imageUrl: item.imageUrl,
        url: item.url,
      }))
    } catch (error) {
      console.error('Failed to parse response:', result.output)
      throw new Error('Failed to parse agent response as JSON')
    }
  }

  async extractKeywords(items: ProductEntity[]): Promise<string[]> {
    if (!this.extractKeywordsTool) {
      throw new Error('Service not initialized')
    }

    const result = await this.extractKeywordsTool.invoke(JSON.stringify(items))
    try {
      return JSON.parse(result)
    } catch (error) {
      console.error('Failed to parse keywords response:', result)
      return []
    }
  }
}
