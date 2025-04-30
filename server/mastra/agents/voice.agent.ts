import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { OpenAIVoice } from '@mastra/voice-openai'

const instructions = `
あなたは音声をテキストに変換するエージェントです。
音声をテキストに変換してください。
なお、音声はさまざまな言語が想定されますが、
優先度
1.日本語
2.英語
3.アラビア語
4.中国語
5.その他
の順で、音声をテキストに変換してください。

音声が欠落することも考え、音声を元に正しいテキストを類推してください。
`

export const voiceAgent = new Agent({
  name: 'voice Agent',
  instructions: instructions,
  model: openai('gpt-4o-mini'),
  voice: new OpenAIVoice(),
})
