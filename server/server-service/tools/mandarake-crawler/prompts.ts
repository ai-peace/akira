const optimizeSearchQuery = `
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

const urlGeneration = (
  keywords: string,
  categoryHints: string[],
  priceRange: { min: number | null; max: number | null },
  sortType: string | null,
  sellType: string | null,
  stockType: string | null,
) => `
Generate a Mandarake search URL based on the following information:

Search Keywords: ${keywords}
Suggested Categories: ${categoryHints.join(', ')}
Original User Query: ${prompt}

Use these parameters to generate the URL:

Basic Parameters:
- Keyword: keyword=${encodeURIComponent(keywords)}

Price Parameters:
${priceRange?.min ? `- Minimum Price: minPrice=${priceRange.min}` : ''}
${priceRange?.max ? `- Maximum Price: maxPrice=${priceRange.max}` : ''}


Sort Parameters:
${sortType ? `- Sort: sort=${sortType}` : ''}

Item Conditions:
${sellType ? `- Item Type: goodsSellType=${sellType}` : ''}
${stockType ? `- Stock Status: goodsZaiko=${stockType}` : ''}

Base URL: https://order.mandarake.co.jp/order/listPage/list?dispAdult=0

Return only the URL.
Do not include categoryCode parameter if categoryHints is empty.
`

const translateTitleSystemPrompt =
  'You are a translator specializing in Japanese anime, manga, and collectibles. Translate the following Japanese product title to English. Keep proper nouns as is.'

const generateSearchUrlSystemPrompt =
  'You are a URL generator. Generate an optimal search URL based on the provided information.'

export const mandarakeCrawlerPrompts = {
  optimizeSearchQuery,
  urlGeneration,
  translateTitleSystemPrompt,
  generateSearchUrlSystemPrompt,
}
