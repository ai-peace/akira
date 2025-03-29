import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryStep } from './mandarake/build-query.mandarake.step'
import { mapProductEntityStep } from './mandarake/map-product-item.mandarake.step'
import { pageCrawlerStep } from './mandarake/page-crawler.mandarake.step'
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
  .then(buildQueryStep)
  .then(pageCrawlerStep)
  .then(mapProductEntityStep)
  .commit()

export { mandarakeWorkflow }
