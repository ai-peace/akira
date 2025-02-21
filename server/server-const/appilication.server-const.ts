export const applicationServerConst = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    enableCostLogging: process.env.ENABLE_LLM_COST_LOGGING === 'true',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
} as const
