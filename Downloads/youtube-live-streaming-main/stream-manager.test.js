import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeConfig, StreamManager } from './stream-manager.js'

test('migrates legacy single media sources to playlists', () => {
  const config = normalizeConfig({
    streamKey: 'key',
    video: 'video.mp4',
    audio: 'audio.mp3',
  })

  assert.deepEqual(config.videos, ['video.mp4'])
  assert.deepEqual(config.audios, ['audio.mp3'])
  assert.equal(config.loop, true)
})

test('accepts multiple media sources with a cover fallback', () => {
  const manager = new StreamManager()
  manager.configure({
    streamUrl: 'rtmps://example.com/live',
    streamKey: 'key',
    videos: [],
    audios: ['one.mp3', 'two.mp3'],
    cover: 'cover.jpg',
    loop: false,
  })

  assert.deepEqual(manager.getStatus(), {
    state: 'stopped',
    configured: true,
    streamUrl: 'rtmps://example.com/live',
    videos: 0,
    audios: 2,
    cover: true,
    loop: false,
    language: 'en',
    error: null,
  })
})
