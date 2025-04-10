import { Workflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { extractTagsStep } from './common/extract-tags.step'
import { selectSourcesStep } from './common/select-sources.step'
import { translateStep } from './common/translate.step'
import { buildQueryMandarakeStep } from './mandarake/build-query.mandarake.step'
import { pageCrawlerMandarakeStep } from './mandarake/page-crawler.mandarake.step'
import { buildQuerySurugayaStep } from './surugaya/build-query.surugaya.step'
import { pageCrawlerSurugayaStep } from './surugaya/page-crawler.surugaya.step'
import { buildQueryTreasureFStep } from './treasure-f/build-query.treasure-f.step'
import { pageCrawlerTreasureFStep } from './treasure-f/page-crawler.treasure-f.step'
import { buildQueryToysrusStep } from './toysrus/build-query.toysrus.step'
import { pageCrawlerToysrusStep } from './toysrus/page-crawler.toysrus.step'
import { pageCrawlerCardrushPokemonStep } from './cardrush-pokemon/page-crawler.cardrush-pokemon.step'
import { buildQueryCardrushPokemonStep } from './cardrush-pokemon/build-query.cardrush-pokemon.step'

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
  .then(selectSourcesStep)
  .after(selectSourcesStep)
    .step(buildQueryMandarakeStep, {
      when: async ({ context }) => {
        const selectedSources = context.getStepResult(selectSourcesStep)?.selectedSources || []
        return selectedSources.includes('mandarake')
      }
    })
    .then(pageCrawlerMandarakeStep)
  .after(selectSourcesStep)
    .step(buildQuerySurugayaStep, {
      when: async ({ context }) => {
        const selectedSources = context.getStepResult(selectSourcesStep)?.selectedSources || []
        return selectedSources.includes('surugaya')
      }
    })
    .then(pageCrawlerSurugayaStep)
  .after(selectSourcesStep)
    .step(buildQueryTreasureFStep, {
      when: async ({ context }) => {
        const selectedSources = context.getStepResult(selectSourcesStep)?.selectedSources || []
        return selectedSources.includes('treasureF')
      }
    })
    .then(pageCrawlerTreasureFStep)
  .after(selectSourcesStep)
    .step(buildQueryToysrusStep, {
      when: async ({ context }) => {
        const selectedSources = context.getStepResult(selectSourcesStep)?.selectedSources || []
        return selectedSources.includes('toysrus')
      }
    })
    .then(pageCrawlerToysrusStep)
  .after(selectSourcesStep)
    .step(buildQueryCardrushPokemonStep, {
      when: async ({ context }) => {
        const selectedSources = context.getStepResult(selectSourcesStep)?.selectedSources || []
        return selectedSources.includes('cardrushPokemon')
      }
    })
    .then(pageCrawlerCardrushPokemonStep)

  .after([pageCrawlerMandarakeStep, pageCrawlerSurugayaStep, pageCrawlerTreasureFStep, pageCrawlerToysrusStep, pageCrawlerCardrushPokemonStep])
  .step(extractTagsStep)
  .commit()

export { sourcingWorkflow }
