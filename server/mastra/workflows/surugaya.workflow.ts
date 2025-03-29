import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerStep } from './surugaya/page-crawler.surugaya.step'
import { mapProductEntityStep } from './surugaya/map-product-item.surugaya.step'
import { translateStep } from './common/translate.step'

const surugayaWorkflow = new Workflow({
  name: 'surugaya-workflow',
  triggerSchema: z.object({
    input: z.string(),
  }),
})

surugayaWorkflow
  .step(translateStep)
  .then(buildQueryStep)
  .then(pageCrawlerStep)
  .then(mapProductEntityStep)
  .commit()

export { surugayaWorkflow }
