import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'
import { Memory } from '@mastra/memory'
import { PostgresStore, PgVector } from '@mastra/pg'
import { weatherAgent, tagExtractorAgent } from './agents'
import { voiceAgent } from './agents/voice.agent'
import { textAgent } from './agents/text.agent'
import { sourcingWorkflow } from './workflows/sourcings/sourcing.workflow'
import { moetakuWorkflow } from './workflows/sourcings/moetaku/moetaku.workflow'

// const connectionString = process.env.DATABASE_URL ?? ''

// const memory = new Memory({
//   storage: new PostgresStore({
//     connectionString,
//   }),
//   options: {
//     lastMessages: 10,
//     semanticRecall: {
//       topK: 3,
//       messageRange: 2,
//     },
//   },
// })

export const mastra = new Mastra({
  workflows: { sourcingWorkflow, moetakuWorkflow },
  agents: { weatherAgent, tagExtractorAgent, voiceAgent, textAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  // storage: memory.storage,
})
