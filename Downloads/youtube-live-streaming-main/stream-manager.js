import { EventEmitter, once } from 'node:events'
import { writeConcatPlaylist } from './media-playlist.js'
import { prepareSource } from './source-resolver.js'
import { buildFfmpegArguments, DEFAULT_STREAM_URL, startStream } from './streamer.js'

function asList(value, legacyValue) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return legacyValue ? [legacyValue] : []
}

export function normalizeConfig(config = {}) {
  const { video, audio, ...current } = config
  const definedCurrent = Object.fromEntries(
    Object.entries(current).filter(([, value]) => value !== undefined),
  )
  return {
    streamUrl: DEFAULT_STREAM_URL,
    loop: true,
    language: 'en',
    ...definedCurrent,
    videos: asList(config.videos, video),
    audios: asList(config.audios, audio),
    cover: config.cover || null,
  }
}

export class StreamManager extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = normalizeConfig(config)
    this.process = null
    this.abortController = null
    this.state = 'stopped'
    this.lastError = null
  }

  validate(config) {
    if (!config.streamKey?.trim()) throw new TypeError('streamKey is required.')
    if (!/^rtmps?:\/\//i.test(config.streamUrl || '')) {
      throw new TypeError('streamUrl must use the rtmp:// or rtmps:// protocol.')
    }
    if (!config.audios?.length) throw new TypeError('At least one audio source is required.')
    if (!config.videos?.length && !config.cover) {
      throw new TypeError('At least one video or cover image is required.')
    }
  }

  configure(config) {
    if (this.state === 'preparing' || this.state === 'running') {
      throw new Error('End the current stream before changing configuration.')
    }
    const nextConfig = normalizeConfig({ ...this.config, ...config })
    this.validate(nextConfig)
    this.config = nextConfig
    this.lastError = null
  }

  getStatus() {
    let configured = true
    try {
      this.validate(this.config)
    } catch {
      configured = false
    }
    return {
      state: this.state,
      configured,
      streamUrl: this.config.streamUrl || null,
      videos: this.config.videos.length,
      audios: this.config.audios.length,
      cover: Boolean(this.config.cover),
      loop: this.config.loop !== false,
      language: this.config.language,
      error: this.lastError?.message ?? null,
    }
  }

  async start() {
    if (this.state === 'preparing' || this.state === 'running') {
      throw new Error('A stream is already active.')
    }
    this.validate(this.config)
    this.state = 'preparing'
    this.lastError = null
    this.abortController = new AbortController()
    this.emit('status', this.getStatus())

    try {
      const options = { signal: this.abortController.signal }
      const [videos, audios, cover] = await Promise.all([
        Promise.all(this.config.videos.map((source) => prepareSource(source, options))),
        Promise.all(this.config.audios.map((source) => prepareSource(source, options))),
        this.config.cover ? prepareSource(this.config.cover, options) : null,
      ])
      if (this.abortController.signal.aborted) throw new Error('Stream start was cancelled.')

      const [videoPlaylist, audioPlaylist] = await Promise.all([
        videos.length ? writeConcatPlaylist('video', videos) : null,
        writeConcatPlaylist('audio', audios),
      ])
      const processOptions = {
        ...this.config,
        videoPlaylist,
        audioPlaylist,
        cover,
      }
      buildFfmpegArguments(processOptions)
      this.process = startStream(processOptions)
      this.state = 'running'
      this.emit('status', this.getStatus())

      this.process.once('error', (error) => this.handleProcessError(error))
      this.process.once('exit', (code, signal) => this.handleProcessExit(code, signal))
      return this.getStatus()
    } catch (error) {
      this.lastError = error
      this.state = error.name === 'AbortError' ? 'stopped' : 'error'
      this.emit('status', this.getStatus())
      throw error
    } finally {
      this.abortController = null
    }
  }

  handleProcessError(error) {
    this.lastError = error
    this.state = 'error'
    this.process = null
    this.emit('status', this.getStatus())
  }

  handleProcessExit(code, signal) {
    if (this.state !== 'stopping') {
      this.lastError = code === 0 ? null : new Error(
        `FFmpeg exited with code ${code ?? 'none'} and signal ${signal ?? 'none'}.`,
      )
    }
    this.state = this.lastError ? 'error' : 'stopped'
    this.process = null
    this.emit('status', this.getStatus())
  }

  async stop() {
    if (this.state === 'preparing') {
      this.abortController?.abort()
      this.state = 'stopped'
      this.emit('status', this.getStatus())
      return this.getStatus()
    }
    if (!this.process || this.state !== 'running') {
      this.state = 'stopped'
      return this.getStatus()
    }

    const process = this.process
    this.state = 'stopping'
    this.emit('status', this.getStatus())
    process.kill('SIGTERM')
    const timeout = setTimeout(() => {
      if (process.exitCode === null) process.kill('SIGKILL')
    }, 10_000)
    timeout.unref()
    await once(process, 'exit')
    clearTimeout(timeout)
    this.lastError = null
    this.state = 'stopped'
    this.process = null
    this.emit('status', this.getStatus())
    return this.getStatus()
  }
}
