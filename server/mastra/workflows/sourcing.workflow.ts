import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { saveProductsStep } from './common/save-products.step'
import { translateStep } from './common/translate.step'
import { buildQueryMandarakeStep } from './mandarake/build-query.mandarake.step'
import { pageCrawlerMandarakeStep } from './mandarake/page-crawler.mandarake.step'
import { buildQuerySurugayaStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerSurugayaStep } from './surugaya/page-crawler.surugaya.step'

const sourcingWorkflow: Workflow = new Workflow({
  name: 'sourcing-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

/* prettier-ignore */
sourcingWorkflow
  .step(translateStep)
  .after(translateStep)
    .step(buildQueryMandarakeStep)
    .then(pageCrawlerMandarakeStep)
  .after(translateStep)
    .step(buildQuerySurugayaStep)
    .then(pageCrawlerSurugayaStep)
  .step(saveProductsStep)
  .after([pageCrawlerMandarakeStep, pageCrawlerSurugayaStep])
  .commit()

export { sourcingWorkflow }
