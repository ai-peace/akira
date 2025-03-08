export const applicationServerConst = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    enableCostLogging: process.env.ENABLE_LLM_COST_LOGGING === 'true',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    secret: process.env.PRIVY_APP_SECRET || '',
  },
  dailyPromptUsageLimit: {
    perUser: Number(process.env.NEXT_PUBLIC_DAILY_PROMPT_USAGE_LIMIT_PER_USER) || 50,
    allUsers: Number(process.env.NEXT_PUBLIC_DAILY_PROMPT_USAGE_LIMIT_ALL_USERS) || 10000,
  },
} as const
