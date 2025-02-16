const extractKeywords = (input: string) => `
以下の商品リストから特徴的なキーワードを20個抽出し、日本語と英語のペアを作成してください。
商品のタイトル、状態、ショップ情報などから、コレクターにとって重要な特徴を表すキーワードを選んでください。
以下の形式でJSONを返してください：

[
  { "en": "English Keyword", "ja": "日本語キーワード" },
  ...
]

商品リスト:
${input}
`

export const extractKeywordsPrompts = { extractKeywords }
