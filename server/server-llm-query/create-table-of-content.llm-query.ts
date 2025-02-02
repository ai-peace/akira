import { LLMRequest } from '@/server/types/llm.types'

const query = (context: { name?: string; prompt?: string; additionals?: string }): LLMRequest => {
  return {
    provider: 'openai',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt(context),
      },
    ],
  }
}

export { query as createTableOfContentQuery }

const systemPrompt = `
あなたは文章構造化のプロフェッショナルです。
与えられたテーマについて、適切な目次構造を作成してください。
大規模文章を想定して、150項目を目安に生成してください。
以下の制約に従ってください：
- 出力は日本語で行ってください
- 階層構造はMarkdownのheadingタグで表現してください
  例：
  # 第1階層
  ## 第2階層
  ### 第3階層
  #### 第4階層
- 階層は最大で4階層までとしてください
- 各項目は簡潔で分かりやすい表現を心がけてください
- 目次全体で10-15項目程度を目安にしてください
- 箇条書き以外の装飾や説明は一切不要です
- 第1階層はかならず2項目以上を作成してください(1階層が目次やタイトルなど意味のないものになるのを防ぐためです)
`

const userPrompt = (context: { name?: string; prompt?: string; additionals?: string }) => `
「${context.name}」についての目次を作成してください。
---
制約条件は以下です。
${context.additionals ?? ''}
---
作成して欲しいドキュメントの内容は以下です。  
${context.prompt}
`
