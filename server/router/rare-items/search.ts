import { RareItemSearchService } from '@/server/server-service/rare-item-search.service'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { applicationServerConst } from '@/server/server-const/appilication.server-const'
import { generateUniqueKey } from '@/server/server-lib/uuid'

export const searchRareItems = new Hono()

const searchSchema = z.object({
  keyword: z.string().min(1, '検索キーワードを入力してください'),
})

const route = searchRareItems.post(
  '/rare-items/search',
  zValidator('json', searchSchema),
  async (c) => {
    try {
      const { keyword } = await c.req.json()

      const service = await RareItemSearchService.create(applicationServerConst.openai.apiKey)
      const result = await service.searchItems(keyword, generateUniqueKey())

      return c.json({ data: result })
    } catch (error) {
      console.error('Error searching rare items:', error)
      return c.json({ error: 'Failed to search rare items' }, 500)
    }
  },
)

export type SearchRareItemsRoute = typeof route
