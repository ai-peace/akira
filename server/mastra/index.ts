import { Mastra } from '@mastra/core/mastra'
import { createLogger } from '@mastra/core/logger'
import { sourcingWorkflow } from './workflows/sourcing.workflow'
import { weatherAgent } from './agents'
import { mandarakeWorkflow } from './workflows/mandarake.workflow'
import { surugayaWorkflow } from './workflows/surugaya.workflow'
import { PostgresStore } from '@mastra/pg'

export const mastra = new Mastra({
  workflows: { sourcingWorkflow, mandarakeWorkflow, surugayaWorkflow },
  agents: { weatherAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL ?? '',
  }),
})
