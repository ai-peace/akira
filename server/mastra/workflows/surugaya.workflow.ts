import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerStep } from './surugaya/page-crawler.surugaya.step'
import { mapProductEntityStep } from './surugaya/map-product-item.step'

const surugayaWorkflow = new Workflow({
  name: 'surugaya-workflow',
  triggerSchema: z.object({
    input: z.string(),
  }),
})

surugayaWorkflow.step(buildQueryStep).then(pageCrawlerStep).then(mapProductEntityStep).commit()

export { surugayaWorkflow }
