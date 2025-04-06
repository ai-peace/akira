import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { extractTagsStep } from './common/extract-tags.step'
import { translateStep } from './common/translate.step'
import { buildQueryMoetakuStep } from './moetaku/build-query.moetaku.step'
import { pageCrawlerMoetakuStep } from './moetaku/page-crawler.moetaku.step'

const moetakuWorkflow: Workflow = new Workflow({
  name: 'moetaku-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

/* prettier-ignore */ http://localhost:4111/tools
moetakuWorkflow
  .step(translateStep)
  .after(translateStep)
    .step(buildQueryMoetakuStep)
    .then(pageCrawlerMoetakuStep)
  .after([pageCrawlerMoetakuStep])
  .step(extractTagsStep)
  .commit()

export { moetakuWorkflow }
