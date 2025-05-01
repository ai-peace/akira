import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { OpenAIVoice } from '@mastra/voice-openai'

const instructions = `
あなたは音声をテキストに変換するエージェントです。
音声を日本語のテキストに変換してください。
音声は日本語です。
`

export const voiceAgent = new Agent({
  name: 'voice Agent',
  instructions: instructions,
  model: openai('gpt-4o-mini'),
  voice: new OpenAIVoice(),
})
