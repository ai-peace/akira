import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'
import { PostgresStore } from '@mastra/pg'
import { weatherAgent } from './agents'
import { sourcingWorkflow } from './workflows/sourcing.workflow'

export const mastra = new Mastra({
  workflows: { sourcingWorkflow },
  agents: { weatherAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL ?? '',
  }),
})
