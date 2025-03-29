import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQuerySurugayaStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerSurugayaStep } from './surugaya/page-crawler.surugaya.step'
import { mapProductEntitySurugayaStep } from './surugaya/map-product-item.surugaya.step'
import { translateStep } from './common/translate.step'

const surugayaWorkflow = new Workflow({
  name: 'surugaya-workflow',
  triggerSchema: z.object({
    input: z.string(),
  }),
})

surugayaWorkflow
  .step(translateStep)
  .then(buildQuerySurugayaStep)
  .then(pageCrawlerSurugayaStep)
  .then(mapProductEntitySurugayaStep)
  .commit()

export { surugayaWorkflow }
