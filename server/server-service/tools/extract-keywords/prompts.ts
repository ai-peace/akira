const extractKeywordsSystemPrompt = `You are a helpful assistant that extracts keywords from product listings.
Your task is to extract 20 characteristic keywords and create Japanese-English pairs.
Select keywords that represent important features for collectors from product titles, conditions, and shop information.

IMPORTANT: You must respond with ONLY a valid JSON array in the following format, with no additional text or explanation:
[
  { "en": "English Keyword", "ja": "Japanese Keyword" }
]
`

const extractKeywords = (
  input: string,
) => `Analyze this product list and respond with only the JSON array:

${input}`

export const extractKeywordsPrompts = {
  extractKeywords,
  extractKeywordsSystemPrompt,
}
