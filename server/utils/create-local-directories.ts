import { mkdir } from 'fs/promises'
import { join } from 'path'

export async function createLocalDirectories(...paths: string[]) {
  const dirs = paths.map((path) => join(process.cwd(), path))

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true }).catch((err) => {
      if (err.code !== 'EEXIST') {
        console.error(`Failed to create directory: ${dir}`, err)
      }
    })
  }
}
