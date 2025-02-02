import { ApiRoutes } from '@/server/router/types'
import { hc } from 'hono/client'

type ClientOptions = {
  headers?: Record<string, string>
}

export const hcClient = (options: ClientOptions = {}) => {
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_URL

  return hc<ApiRoutes>(`${baseUrl}/api`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
