import { writeFile } from 'fs/promises'
import { join } from 'path'
import { createLocalDirectories } from './create-local-directories'

export const saveHtml = async (prefix: string, html: string, paths: string[]) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await createLocalDirectories(...paths)
    const cachePath = join(process.cwd(), ...paths)
    const htmlFilePath = join(cachePath, `${prefix}-${timestamp}.html`)
    await writeFile(htmlFilePath, html, 'utf-8')
  } catch (error) {
    console.error('Failed to save HTML content:', error)
    throw error
  }
}
