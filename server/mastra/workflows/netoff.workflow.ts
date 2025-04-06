import { Workflow } from '@mastra/core/workflows'
import { translateStep } from './common/translate.step'
import { buildQueryNetoffStep } from './netoff/build-query.step'
import { pageCrawlerNetoffStep } from './netoff/page-crawler.step'

export const netoffWorkflow = new Workflow({
  name: 'Netoff Workflow',
  description: 'ネットオフのフィギュア買取サイト「もえたく！」からの商品情報取得ワークフロー',
})
  .step(translateStep)
  .after(translateStep)
  .step(buildQueryNetoffStep)
  .then(pageCrawlerNetoffStep)
  .commit()
