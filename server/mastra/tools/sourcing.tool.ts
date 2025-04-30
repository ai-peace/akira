import { createTool } from '@mastra/core'
import { z } from 'zod'
import { mastra } from '..'

export const sourcingTool = createTool({
  id: 'get-weather',
  description: '商品を検索する',
  inputSchema: z.object({
    input: z.string().describe('商品名'),
    // promptUniqueKey: z.string().describe('プロンプトのユニークキー'),
  }),
  outputSchema: z.string(),
  execute: async ({ context }) => {
    // return await getWeather(context.location)
    const sourcingWorkflow = mastra.getWorkflow('sourcingWorkflow')
    const run = sourcingWorkflow.createRun()
    const workflowResult = await run.start({
      triggerData: {
        input: context.input,
        promptUniqueKey: '618f94b6-fa37-46d6-bc62-f1b0c27d95f2',
      },
    })

    return 'sourcingTool'
    // return workflowResult
  },
})
