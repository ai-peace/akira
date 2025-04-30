import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { sourcingTool } from '../tools/sourcing.tool'

const instructions = `
You are an AI note assistant tasked with providing concise, structured summaries of their content
`

export const textAgent = new Agent({
  name: 'text Agent',
  instructions: instructions,
  model: openai('gpt-4o-mini'),
  tools: { sourcingTool },
})
