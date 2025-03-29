import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from './common/translate.step'
import { buildQueryMandarakeStep } from './mandarake/build-query.mandarake.step'
import { pageCrawlerMandarakeStep } from './mandarake/page-crawler.mandarake.step'
import { mapProductEntityMandarakeStep } from './mandarake/map-product-item.mandarake.step'
import { buildQuerySurugayaStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerSurugayaStep } from './surugaya/page-crawler.surugaya.step'
import { mapProductEntitySurugayaStep } from './surugaya/map-product-item.surugaya.step'
import { saveProductsStep } from './common/save-products.step'

const sourcingWorkflow = new Workflow({
  name: 'sourcing-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

/* prettier-ignore */
sourcingWorkflow
  .step(translateStep)
    .then(buildQueryMandarakeStep)
    .then(pageCrawlerMandarakeStep)
    .then(mapProductEntityMandarakeStep)
  .after(translateStep)
    .step(buildQuerySurugayaStep)
    .then(pageCrawlerSurugayaStep)
    .then(mapProductEntitySurugayaStep)
  .after([mapProductEntityMandarakeStep, mapProductEntitySurugayaStep])
    .step(saveProductsStep)
  .commit()

export { sourcingWorkflow }
