import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryMandarakeStep } from './mandarake/build-query.mandarake.step'
import { pageCrawlerMandarakeStep } from './mandarake/page-crawler.mandarake.step'
import { translateStep } from './common/translate.step'

const mandarakeWorkflow = new Workflow({
  name: 'mandarake-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

mandarakeWorkflow
  .step(translateStep)
  .then(buildQueryMandarakeStep)
  .then(pageCrawlerMandarakeStep)
  .commit()

export { mandarakeWorkflow }
