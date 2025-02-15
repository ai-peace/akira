import { ChatOpenAI } from '@langchain/openai'

export const translateToJpService = async (
  text: string,
  translator: ChatOpenAI,
): Promise<string> => {
  if (!translator) throw new Error('Translator not initialized')

  // 既に日本語の場合はそのまま返す
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return text

  const response = await translator.invoke([
    [
      'system',
      'You are a translator. Translate the following text to Japanese, keeping product names in their original form.',
    ],
    ['human', text],
  ])

  return response.content as string
}
