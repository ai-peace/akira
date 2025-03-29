import { Mastra } from '@mastra/core/mastra'
import { createLogger } from '@mastra/core/logger'
import { weatherWorkflow } from './workflows'
import { weatherAgent } from './agents'
import { mandarakeWorkflow } from './workflows/mandarake.workflow'
import { surugayaWorkflow } from './workflows/surugaya.workflow'

export const mastra = new Mastra({
  workflows: { weatherWorkflow, mandarakeWorkflow, surugayaWorkflow },
  agents: { weatherAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
