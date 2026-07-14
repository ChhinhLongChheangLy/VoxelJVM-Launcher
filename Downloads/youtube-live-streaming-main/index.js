import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import youtube from './app.js'

const prompt = readline.createInterface({ input, output })
let manager

try {
  const streamUrl =
    (await prompt.question(
      'Stream URL (default: rtmp://a.rtmp.youtube.com/live2): ',
    )) || undefined
  const streamKey = await prompt.question('Stream key: ')
  const video = await prompt.question('Video filename or URL: ')
  const audio =
    (await prompt.question('Audio filename or URL: ')) ||
    'https://stream.zeno.fm/ez4m4918n98uv'
  const loop = (await prompt.question('Loop 24/7? (Y/n): ')).toLowerCase() !== 'n'

  manager = await youtube(streamKey, video, audio, { streamUrl, loop })
  console.log('Live stream started.')
} finally {
  prompt.close()
}

async function shutdown() {
  await manager?.stop()
  process.exit(0)
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
