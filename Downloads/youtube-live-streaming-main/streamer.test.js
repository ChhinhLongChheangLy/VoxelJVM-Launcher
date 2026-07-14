import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFfmpegArguments } from './streamer.js'

function baseOptions(overrides = {}) {
  return {
    streamKey: 'test-key',
    videoPlaylist: 'video.ffconcat',
    audioPlaylist: 'audio.ffconcat',
    ...overrides,
  }
}

test('builds looping mapped playlist inputs for YouTube', () => {
  const args = buildFfmpegArguments(baseOptions())

  assert.deepEqual(args.slice(-2), [
    'flv',
    'rtmp://a.rtmp.youtube.com/live2/test-key',
  ])
  assert.equal(args.filter((value) => value === '-stream_loop').length, 2)
  assert.ok(args.includes('0:v:0'))
  assert.ok(args.includes('1:a:0'))
  assert.ok(args.includes('yuv420p'))
})

test('supports a custom RTMPS stream URL', () => {
  const args = buildFfmpegArguments(
    baseOptions({ streamUrl: 'rtmps://live.example.com/app/' }),
  )
  assert.equal(args.at(-1), 'rtmps://live.example.com/app/test-key')
})

test('uses a cover image and stops after one audio playlist pass', () => {
  const args = buildFfmpegArguments({
    streamKey: 'test-key',
    cover: 'cover.jpg',
    audioPlaylist: 'audio.ffconcat',
    loop: false,
  })

  assert.ok(args.includes('-loop'))
  assert.ok(args.includes('cover.jpg'))
  assert.ok(args.includes('-shortest'))
  assert.equal(args.includes('-stream_loop'), false)
})

test('rejects missing required configuration', () => {
  assert.throws(
    () => buildFfmpegArguments(baseOptions({ streamKey: '' })),
    /streamKey is required/,
  )
})

test('rejects a non-RTMP stream URL', () => {
  assert.throws(
    () =>
      buildFfmpegArguments(
        baseOptions({ streamUrl: 'https://example.com/live' }),
      ),
    /must use the rtmp:\/\/ or rtmps:\/\//,
  )
})
