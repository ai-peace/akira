import { executeAgentService } from '@/server/server-service/execute-agent.service'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createChatPromptGroupSchema } from './schema/create.schema'

export const createChatPromptGroup = new Hono()

const route = createChatPromptGroup.post(
  '/chats/:uniqueKey/prompt-groups',
  zValidator('json', createChatPromptGroupSchema),
  async (c) => {
    try {
      const uniqueKey = c.req.param('uniqueKey')
      const { question } = c.req.valid('json')

      const promptGroupEntity = await executeAgentService.execute(uniqueKey, question)

      return c.json({ data: promptGroupEntity }, 201)
    } catch (error) {
      console.error('Error creating chat:', error)
      return c.json({ error: 'Failed to create chat' }, 500)
    }
  },
)

export type CreateChatPromptGroupRoute = typeof route
