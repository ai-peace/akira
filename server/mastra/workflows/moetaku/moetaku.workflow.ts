import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { buildQueryMoetakuStep } from './build-query.moetaku.step'
import { translateStep } from '../common/translate.step'
import { pageCrawlerMoetakuStep } from './page-crawler.moetaku.step'

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
  .commit()

export { moetakuWorkflow }
