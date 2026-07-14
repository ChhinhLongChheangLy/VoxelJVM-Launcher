import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { ConfigStore } from './config-store.js'

test('persists and reloads stream configuration', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'stream-config-'))
  const store = new ConfigStore(path.join(directory, 'config.json'))
  const config = {
    streamUrl: 'rtmps://example.com/live',
    streamKey: 'secret',
    video: 'video.mp4',
    audio: 'audio.mp3',
  }

  try {
    await store.save(config)
    assert.deepEqual(await store.load(), config)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
