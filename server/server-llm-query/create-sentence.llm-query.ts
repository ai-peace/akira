import { LLMRequest } from '@/server/types/llm.types'

const query = (context: {
  name?: string
  prompt?: string
  additionals?: string
  minimumHeadingLevel?: number
}): LLMRequest => {
  return {
    provider: 'openai',
    messages: [
      {
        role: 'system',
        content: systemPrompt(context),
      },
      {
        role: 'user',
        content: userPrompt(context),
      },
    ],
  }
}

export { query as createSentenceQuery }

const systemPrompt = (context: { minimumHeadingLevel?: number }) => {
  const headingLevel = context.minimumHeadingLevel ?? 1
  const minimumHeadingLevel = headingLevel
  const maximumHeadingLevel = 4
  const useableHeadingLevels = Array.from({ length: maximumHeadingLevel }, (_, i) => i + 1).filter(
    (level) => level >= minimumHeadingLevel,
  )

  return `
あなたは文章構造化のプロフェッショナルです。
与えられたテーマについて、Markdown形式で文章を生成してください。

以下の制約に従ってください：
- 出力は日本語で行ってください
- 階層構造はMarkdownのheadingタグで表現してください
${minimumHeadingLevel ? `- Headingの階層は最小で${minimumHeadingLevel}階層です。よって使えるHeadingの階層は${useableHeadingLevels.join(', ')}です。` : ''}
- 階層の記述例：
  - ${useableHeadingLevels.map((level) => `${'#'.repeat(level)} 第${level}階層`).join('\n')}
- 各項目は簡潔で分かりやすい表現を心がけてください
- 箇条書きは明示的に指定されない限り使わないでください。

${minimumHeadingLevel ? `**重要**: Headingの階層は必ず指定された最小階層を超えないようにしてください。Headingの階層は最小で${minimumHeadingLevel}階層です。よって使えるHeadingの階層は${useableHeadingLevels.join(', ')}です。` : ''}
`
}

const userPrompt = (context: { name?: string; prompt?: string; additionals?: string }) => `
「${context.name}」についてのMarkdown形式の文章を作成してください。

---
制約条件は以下です。
${context.additionals ?? ''}

---
作成して欲しいドキュメントの内容は以下です。  
${context.prompt}
`
