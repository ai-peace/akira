import { applicationServerConst } from '../server-const/appilication.server-const'

const GPT4O_MINI_COST = {
  input: 0.15, // per 1M tokens
  output: 0.6, // per 1M tokens
}

export const logLLMCost = (
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  operation: string,
) => {
  if (!applicationServerConst.openai.enableCostLogging) return

  if (modelName === 'gpt-4o-mini') {
    const inputCost = (inputTokens / 1_000_000) * GPT4O_MINI_COST.input
    const outputCost = (outputTokens / 1_000_000) * GPT4O_MINI_COST.output
    const totalCost = inputCost + outputCost

    console.log(`
=== LLM Cost Log ===
Operation: ${operation}
Model: ${modelName}
Input Tokens: ${inputTokens.toLocaleString()} (Cost: $${inputCost.toFixed(6)})
Output Tokens: ${outputTokens.toLocaleString()} (Cost: $${outputCost.toFixed(6)})
Total Cost: $${totalCost.toFixed(6)}
==================
`)
  }
}
