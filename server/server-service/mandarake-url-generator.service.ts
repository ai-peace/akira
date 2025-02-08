import { ChatOpenAI } from '@langchain/openai'

export class MandarakeUrlGeneratorService {
  private model: ChatOpenAI

  constructor(openAIApiKey: string) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey,
    })
  }

  private async optimizeSearchQuery(prompt: string): Promise<{
    keywords: string
    categoryHints: string[]
    priceRange: { min: number | null; max: number | null }
    sortType: string | null
    sellType: string | null
    stockType: string | null
  }> {
    const systemPrompt = `
You are a search expert specializing in Japanese otaku culture.
Convert user search requests into optimal search keywords for Japanese collectible items.

Optimization Rules:
1. Keywords should only include:
   - Work titles (official names)
   - Character names
   Note: Product categories (figures, doujinshi, etc.) should be handled in categoryHints

2. Do not include in keywords:
   - Product categories
   - Price-related expressions
   - Condition-related expressions
   - Popularity/rarity expressions

3. Convert English titles to their common Japanese names
4. Convert nicknames and abbreviations to official names

Price and Condition Processing:
- Price expressions:
  - Automatically convert USD to JPY ($1 = ¥150)
  - "expensive", "rare", "premium" → priceRange.min = 10000
  - "reasonable", "normal" → priceRange = { min: 3000, max: 10000 }
  - "cheap", "affordable" → priceRange.max = 3000
  - "$100-$500" → priceRange = { min: 15000, max: 75000 }
  - "over $100" → priceRange.min = 15000
- Condition expressions:
  - "rare", "premium" → sellType = "1" (prioritize used)
  - "new", "latest" → sellType = "2" (prioritize new)
  - "popular" → stockType = "2" (include stock check required)

Output Format:
{
  "keywords": "optimized search keywords (proper nouns only)",
  "categoryHints": ["category codes"],
  "priceRange": {
    "min": number | null,  // amount in JPY
    "max": number | null   // amount in JPY
  },
  "sortType": "price&sortOrder=1",  // default to highest price first
  "sellType": string | null,
  "stockType": string | null
}

Examples:
Input: "Find Evangelion figures between $100-$500"
Output: {
  "keywords": "エヴァンゲリオン",
  "categoryHints": ["20101", "20102"],
  "priceRange": {
    "min": 15000,
    "max": 75000
  },
  "sortType": "price&sortOrder=1",
  "sellType": null,
  "stockType": null
}

Input: "Gundam figure over $100"
Output: {
  "keywords": "ガンダム",
  "categoryHints": ["20103"],
  "priceRange": {
    "min": 15000,
    "max": null
  },
  "sortType": "price&sortOrder=1",
  "sellType": null,
  "stockType": null
}
`

    const response = await this.model.invoke([
      ['system', systemPrompt],
      ['human', prompt],
    ])

    try {
      const result = JSON.parse(response.content as string)
      return {
        keywords: result.keywords,
        categoryHints: result.categoryHints,
        priceRange: result.priceRange,
        sortType: result.sortType,
        sellType: result.sellType,
        stockType: result.stockType,
      }
    } catch (error) {
      console.error('Failed to parse optimization result:', error)
      return {
        keywords: prompt,
        categoryHints: [],
        priceRange: { min: null, max: null },
        sortType: null,
        sellType: null,
        stockType: null,
      }
    }
  }

  async generateSearchUrl(prompt: string): Promise<string> {
    try {
      console.log('\n=== Mandarake URL Generator ===')
      console.log('🔍 Input prompt:', prompt)

      // 検索クエリの最適化
      const { keywords, categoryHints, priceRange, sortType, sellType, stockType } =
        await this.optimizeSearchQuery(prompt)

      console.log('\n📝 Optimized Parameters:')
      console.log('- Keywords:', keywords)
      console.log('- Category Hints:', categoryHints)
      console.log('- Price Range:', priceRange)
      console.log('- Sort Type:', sortType)
      console.log('- Sell Type:', sellType)
      console.log('- Stock Type:', stockType)

      // URL generation prompt
      const urlGenerationPrompt = `
Generate a Mandarake search URL based on the following information:

Search Keywords: ${keywords}
Suggested Categories: ${categoryHints.join(', ')}
Original User Query: ${prompt}

Use these parameters to generate the URL:

Basic Parameters:
- Keyword: keyword=${encodeURIComponent(keywords)}
${categoryHints.length > 0 ? `- Category: categoryCode=${categoryHints[0]}` : ''}

Price Parameters:
${priceRange?.min ? `- Minimum Price: minPrice=${priceRange.min}` : ''}
${priceRange?.max ? `- Maximum Price: maxPrice=${priceRange.max}` : ''}

Sort Parameters:
${sortType ? `- Sort: sort=${sortType}` : ''}

Item Conditions:
${sellType ? `- Item Type: goodsSellType=${sellType}` : ''}
${stockType ? `- Stock Status: goodsZaiko=${stockType}` : ''}

Base URL: https://order.mandarake.co.jp/order/listPage/list

Return only the URL.
Do not include categoryCode parameter if categoryHints is empty.
`

      const response = await this.model.invoke([
        [
          'system',
          'You are a URL generator. Generate an optimal search URL based on the provided information.',
        ],
        ['human', urlGenerationPrompt],
      ])

      const url = (response.content as string).trim()

      console.log('\n🌐 Generated URL:')
      console.log('Encoded:')
      console.log(url)
      console.log('\nDecoded:')
      console.log(decodeURIComponent(url))

      // URLパラメータを解析して表示
      try {
        const urlObj = new URL(url)
        console.log('\n📊 URL Parameters:')
        for (const [key, value] of urlObj.searchParams.entries()) {
          console.log(`- ${key}: ${decodeURIComponent(value)}`)
        }
      } catch (error) {
        console.log('Failed to parse URL parameters')
      }

      console.log('\n=== End of URL Generation ===\n')

      return url
    } catch (error) {
      console.error('\n❌ Error generating URL:', error)
      const fallbackUrl = `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeURIComponent(
        prompt,
      )}`
      console.log('⚠️ Using fallback URL:', fallbackUrl)
      return fallbackUrl
    }
  }
}
