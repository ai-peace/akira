import { mastra } from '@/server/mastra'
import { Readable } from 'node:stream'

export async function POST(req: Request) {
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File

  const arrayBuffer = await audioFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const readable = Readable.from(buffer)

  const noteTakerAgent = mastra.getAgent('textAgent')
  const text = (await noteTakerAgent.voice?.listen(readable)) as string

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
