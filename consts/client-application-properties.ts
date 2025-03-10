export const clientApplicationProperties = {
  appUrl: process.env.NEXT_PUBLIC_API_URL!,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  dailyPromptUsageLimit: {
    perUser: Number(process.env.NEXT_PUBLIC_DAILY_PROMPT_USAGE_LIMIT_PER_USER) || 50,
    allUsers: Number(process.env.NEXT_PUBLIC_DAILY_PROMPT_USAGE_LIMIT_ALL_USERS) || 10000,
  },
}
