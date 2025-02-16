export const applicationServerConst = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
} as const
