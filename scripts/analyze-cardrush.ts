// scripts/analyze-cardrush.ts
import { analyzeArchivedHtml } from '../server/mastra/workflows/cardrush-pokemon/page-crawler.cardrush-pokemon.step'

async function main() {
  // デバッグコマンドで指定されたpromptUniqueKeyを使用
  const promptUniqueKey = 'dec25340-f547-4148-99e3-df9fce4e0e1d'
  console.log(`Analyzing HTML files with promptUniqueKey: ${promptUniqueKey}`)

  await analyzeArchivedHtml(promptUniqueKey)
}

main().catch(console.error)
