import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { extractTagsStep } from './common/extract-tags.step'
import { translateStep } from './common/translate.step'
import { buildQueryMandarakeStep } from './mandarake/build-query.mandarake.step'
import { pageCrawlerMandarakeStep } from './mandarake/page-crawler.mandarake.step'
import { buildQuerySurugayaStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerSurugayaStep } from './surugaya/page-crawler.surugaya.step'
import { buildQueryTreasureFStep } from './treasure-f/build-query.treasure-f.step'
import { pageCrawlerTreasureFStep } from './treasure-f/page-crawler.treasure-f.step'

const sourcingWorkflow: Workflow = new Workflow({
  name: 'sourcing-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

/* prettier-ignore */ http://localhost:4111/tools
sourcingWorkflow
  .step(translateStep)
  .after(translateStep)
    .step(buildQueryMandarakeStep)
    .then(pageCrawlerMandarakeStep)
  .after(translateStep)
    .step(buildQuerySurugayaStep)
    .then(pageCrawlerSurugayaStep)
  .after(translateStep)
    .step(buildQueryTreasureFStep)
    .then(pageCrawlerTreasureFStep)
  .after([pageCrawlerMandarakeStep, pageCrawlerSurugayaStep, pageCrawlerTreasureFStep])
  // .after([pageCrawlerTreasureFStep])
  .step(extractTagsStep)
  .commit()

export { sourcingWorkflow }
