import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { writeConcatPlaylist } from './media-playlist.js'

test('writes ordered FFmpeg concat playlist entries', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'media-playlist-'))
  try {
    const output = await writeConcatPlaylist(
      'video',
      ['first.mp4', "second's.mp4"],
      directory,
    )
    const content = await readFile(output, 'utf8')
    assert.match(content, /file 'first\.mp4'/)
    assert.match(content, /file 'second'\\''s\.mp4'/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
