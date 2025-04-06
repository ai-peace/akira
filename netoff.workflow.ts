import { Workflow } from '@mastra/core/workflows'
import { translateStep } from '../common/translate.step'
import { buildQueryNetoffStep } from './build-query.netoff.step'
import { pageCrawlerNetoffStep } from './page-crawler.netoff.step'

const netoffWorkflow = new Workflow({
  id: 'netoffWorkflow',
  name: 'Netoff Workflow',
  description: 'ネットオフのフィギュア買取サイト「もえたく！」からの商品情報取得ワークフロー',
})

netoffWorkflow
  .step(translateStep)
  .after(translateStep)
  .step(buildQueryNetoffStep)
  .then(pageCrawlerNetoffStep)
  .commit()

export { netoffWorkflow }
