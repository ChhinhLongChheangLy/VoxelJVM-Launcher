import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class ConfigStore {
  constructor(filePath = '.data/stream-config.json') {
    this.filePath = path.resolve(filePath)
  }

  async load() {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') return {}
      throw error
    }
  }

  async save(config) {
    await mkdir(path.dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.tmp`
    const data = `${JSON.stringify(config, null, 2)}\n`

    await writeFile(temporaryPath, data, { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryPath, this.filePath)
  }
}
