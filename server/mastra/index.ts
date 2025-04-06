import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'
import { PostgresStore } from '@mastra/pg'
import { weatherAgent, tagExtractorAgent } from './agents'
import { sourcingWorkflow } from './workflows/sourcing.workflow'
import { moetakuWorkflow } from './workflows/moetaku/moetaku.workflow'
export const mastra = new Mastra({
  workflows: { sourcingWorkflow, moetakuWorkflow },
  agents: { weatherAgent, tagExtractorAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL ?? '',
  }),
})
