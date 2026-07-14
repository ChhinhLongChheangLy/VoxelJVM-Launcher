import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function escapeConcatValue(value) {
  return value.replaceAll("'", "'\\''")
}

export async function writeConcatPlaylist(
  kind,
  sources,
  directory = '.data/runtime',
) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new TypeError(`${kind} playlist requires at least one source.`)
  }

  const outputDirectory = path.resolve(directory)
  const destination = path.join(outputDirectory, `${kind}.ffconcat`)
  const content = [
    'ffconcat version 1.0',
    ...sources.map((source) => `file '${escapeConcatValue(source)}'`),
    '',
  ].join('\n')

  await mkdir(outputDirectory, { recursive: true })
  await writeFile(destination, content, 'utf8')
  return destination
}
