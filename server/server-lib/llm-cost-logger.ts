import { createLogger } from '@mastra/core/logger'

// LLMモデルごとのコスト定義（1Mトークンあたり）
const LLM_COSTS = {
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.6,
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06,
  },
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002,
  },
} as const

// コストロガーの作成
const costLogger = createLogger({
  name: 'LLMCostLogger',
  level: 'info',
})

type LLMModelName = keyof typeof LLM_COSTS

/**
 * LLMの使用コストを計算してログに記録する
 * @param modelName - 使用したLLMモデルの名前
 * @param inputTokens - 入力トークン数
 * @param outputTokens - 出力トークン数
 * @param operation - 実行した操作の説明
 * @param metadata - 追加のメタデータ（オプション）
 */
export const logLLMCost = (
  modelName: LLMModelName,
  inputTokens: number,
  outputTokens: number,
  operation: string,
  metadata?: Record<string, any>,
) => {
  const modelCosts = LLM_COSTS[modelName]
  if (!modelCosts) {
    costLogger.warn(
      `Unknown model: ${modelName} (Operation: ${operation}, Input: ${inputTokens}, Output: ${outputTokens})`,
    )
    return
  }

  const inputCost = (inputTokens / 1_000_000) * modelCosts.input
  const outputCost = (outputTokens / 1_000_000) * modelCosts.output
  const totalCost = inputCost + outputCost

  const costDetails = {
    operation,
    model: modelName,
    inputTokens: inputTokens.toLocaleString(),
    outputTokens: outputTokens.toLocaleString(),
    inputCost: `$${inputCost.toFixed(6)}`,
    outputCost: `$${outputCost.toFixed(6)}`,
    totalCost: `$${totalCost.toFixed(6)}`,
    ...metadata,
  }

  costLogger.info(
    `LLM Cost: $${totalCost.toFixed(6)} (${operation}) - Model: ${modelName}, Input: ${inputTokens.toLocaleString()} tokens ($${inputCost.toFixed(6)}), Output: ${outputTokens.toLocaleString()} tokens ($${outputCost.toFixed(6)})`,
  )

  // 詳細なコスト情報をデバッグレベルで記録
  costLogger.debug('Cost details:', costDetails)
}
