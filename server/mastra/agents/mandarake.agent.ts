import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'

export const mandarakeAgent = new Agent({
  name: 'Mandarake Agent',
  instructions: 'あなたは　マンガや　アニメの商品を探すためのアシスタントです。',
  model: openai('gpt-4o-mini'),
})
