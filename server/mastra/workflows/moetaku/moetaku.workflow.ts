import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { translateStep } from '../common/translate.step'
import { buildMoetakuQueryStep } from './build-query.moetaku.step'
import { pageCrawlerMoetakuStep } from './page-crawler.moetaku.step'

const moetakuWorkflow = new Workflow({
  name: 'moetaku-workflow',
  triggerSchema: z.object({
    input: z.string(),
    promptUniqueKey: z.string(),
  }),
})

moetakuWorkflow
  .step(translateStep)
  .after(translateStep)
  .step(buildMoetakuQueryStep)
  .then(pageCrawlerMoetakuStep)
  .commit()

export { moetakuWorkflow }
