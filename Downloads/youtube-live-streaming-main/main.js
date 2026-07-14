import express from 'express'
import 'dotenv/config'
import { ConfigStore } from './config-store.js'
import { StreamManager } from './stream-manager.js'
import { DEFAULT_STREAM_URL } from './streamer.js'
import { TelegramBot } from './telegram-bot.js'

const port = Number.parseInt(process.env.PORT ?? '3000', 10)
const store = new ConfigStore(process.env.CONFIG_PATH)
const savedConfig = await store.load()

function sourceList(value, name) {
  if (!value?.trim()) return undefined
  let parsed
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`${name} must be a JSON array of strings.`)
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error(`${name} must be a JSON array of strings.`)
  }
  return parsed
}

const environmentConfig = {
  streamUrl: process.env.STREAM_URL,
  streamKey: process.env.STREAM_KEY ?? process.env.streamkey,
  videos: sourceList(process.env.VIDEO_SOURCES, 'VIDEO_SOURCES'),
  audios: sourceList(process.env.AUDIO_SOURCES, 'AUDIO_SOURCES'),
  video: process.env.VIDEO_SOURCE,
  audio: process.env.AUDIO_SOURCE,
  cover: process.env.COVER_SOURCE,
  loop: process.env.LOOP ? process.env.LOOP.toLowerCase() !== 'false' : undefined,
  language: process.env.BOT_LANGUAGE,
  ffmpegPath: process.env.FFMPEG_PATH,
}
const configuredEnvironment = Object.fromEntries(
  Object.entries(environmentConfig).filter(
    ([, value]) => value !== undefined && value !== '',
  ),
)

const manager = new StreamManager({
  streamUrl: DEFAULT_STREAM_URL,
  ...configuredEnvironment,
  ...savedConfig,
})

const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
const telegramAdminIds = (process.env.TELEGRAM_ADMIN_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
let telegramBot = null

const app = express()

app.get('/', (_request, response) => {
  response.json({
    service: 'youtube-live-streaming',
    status: manager.getStatus(),
    telegram: telegramBot ? 'enabled' : 'disabled',
  })
})

app.get('/health', (_request, response) => {
  const status = manager.getStatus()
  response.status(status.state === 'error' ? 503 : 200).json({
    ok: status.state !== 'error',
    stream: status.state,
    configured: status.configured,
    telegram: telegramBot ? 'enabled' : 'disabled',
  })
})

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

if (telegramToken && telegramAdminIds.length > 0) {
  telegramBot = new TelegramBot({
    token: telegramToken,
    adminIds: telegramAdminIds,
    manager,
    store,
  })
  telegramBot.start().catch((error) => {
    console.error(`Telegram bot stopped: ${error.message}`)
  })
  console.log('Telegram control bot enabled.')
} else {
  console.warn(
    'Telegram bot disabled. Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_IDS to enable it.',
  )
}

if (process.env.AUTO_START?.toLowerCase() === 'true') {
  manager.start().catch((error) => {
    console.error(`Automatic stream start failed: ${error.message}`)
  })
}

let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Received ${signal}; shutting down.`)
  telegramBot?.stop()

  try {
    await manager.stop()
  } catch (error) {
    console.error(`Unable to stop stream cleanly: ${error.message}`)
  }

  server.close(() => process.exit(0))
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
