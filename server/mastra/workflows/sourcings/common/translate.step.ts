import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step } from '@mastra/core/workflows'
import { z } from 'zod'

const translateStep = new Step({
  id: 'translateStep',
  outputSchema: z.object({
    translatedKeyword: z.string(),
  }),
  execute: async ({ context }) => {
    const userInput = context.triggerData?.input
    if (!userInput) throw new Error('User input is required')

    const response = await translateAgent.stream([
      {
        role: 'user',
        content: userInput,
      },
    ])

    let result = ''
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk)
      result += chunk
    }

    const translatedText = result.trim()

    console.log('translatedText', translatedText)

    return {
      translatedKeyword: translatedText,
    }
  },
})

const translateAgent = new Agent({
  name: 'translateAgent',
  instructions: `あなたは日本語以外の言語を日本語に翻訳し、円に変換するアシスタントです。ユーザーの入力を日本語に翻訳してください。

# 注意事項
- 固有のIPアドレスやキャラクター名や商品名は日本の正しい名称に変換してください。
- 金額は円に変換してください。以下の為替レートを参考にしてください。
- 日本語はそのままで良いです。
- 円表記もそのままで良いです。
- キーワードは文章にせず、検索エンジンが見つけやすいようにキーワードのみを返してください。

# 金額の変換
金額は円に変換してください。以下の為替レートを参考にしてください：
- 1 USD（米ドル） = 約150円
- 1 EUR（ユーロ） = 約160円
- 1 GBP（英ポンド） = 約190円
- 1 AUD（豪ドル） = 約100円
- 1 CAD（カナダドル） = 約110円
- 1 CNY（中国元） = 約21円
- 1 KRW（韓国ウォン） = 約0.11円
- 1 HKD（香港ドル） = 約19円
- 1 SGD（シンガポールドル） = 約112円

例：
- "10 dollars" → "1,500円"
- "25 euros" → "4,000円"

レートは変動しますが、上記の概算値を目安として使用してください。
`,
  model: openai('gpt-4o-mini'),
})

export { translateStep }
