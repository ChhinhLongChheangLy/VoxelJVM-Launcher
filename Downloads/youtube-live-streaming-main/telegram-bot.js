import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

const TEXT = {
  en: {
    denied: 'Access denied.',
    private: 'Use this bot in a private chat.',
    chooseLanguage: 'Choose language / ជ្រើសរើសភាសា',
    setupRunning: 'End the current live stream before setup.',
    streamUrl: 'Send the RTMP or RTMPS stream URL.',
    streamKey: 'Send the stream key. This message will be deleted.',
    videos: 'Add video files, paths, direct URLs, or public Google Drive links. Add as many as needed, then tap Done. Skip uses a cover image instead.',
    audios: 'Add audio files, paths, direct URLs, or public Google Drive links. At least one is required, then tap Done.',
    cover: 'Optionally send a cover image file, path, URL, or public Google Drive link. It is used when no video was added.',
    loop: 'Choose playback mode.',
    added: (kind, count) => `${kind} added. Total: ${count}.`,
    needAudio: 'Add at least one audio source.',
    needVisual: 'Add at least one video or a cover image.',
    saved: 'Setup saved. The stream key is hidden.',
    cancelled: 'Setup cancelled.',
    incomplete: 'Setup is incomplete. Use /setup first.',
    preparing: 'Preparing playlists and starting FFmpeg...',
    startFailed: (message) => `Unable to start: ${message}`,
    state: (state) => `Live stream state: ${state}`,
    commands: 'Commands:\n/setup - configure stream and playlists\n/startlive - start streaming\n/endlive - stop streaming\n/status - show state\n/language - choose language\n/cancel - cancel setup',
    labels: { start: 'Start live', end: 'End live', status: 'Status', setup: 'Setup', done: 'Done', skip: 'Skip', repeat: 'Loop 24/7', once: 'Play once' },
  },
  km: {
    denied: 'មិនមានសិទ្ធិប្រើប្រាស់។',
    private: 'សូមប្រើបូតនេះក្នុងការជជែកឯកជន។',
    chooseLanguage: 'ជ្រើសរើសភាសា / Choose language',
    setupRunning: 'សូមបញ្ចប់ការផ្សាយបច្ចុប្បន្ន មុនពេលកំណត់ថ្មី។',
    streamUrl: 'សូមផ្ញើ Stream URL ប្រភេទ RTMP ឬ RTMPS។',
    streamKey: 'សូមផ្ញើ Stream Key។ សារនេះនឹងត្រូវលុប។',
    videos: 'បន្ថែមវីដេអូ ឯកសារ path URL ផ្ទាល់ ឬតំណ Google Drive សាធារណៈ។ អាចបន្ថែមច្រើន រួចចុច រួចរាល់។ រំលងដើម្បីប្រើរូប Cover។',
    audios: 'បន្ថែមសំឡេង ឯកសារ path URL ផ្ទាល់ ឬតំណ Google Drive សាធារណៈ។ ត្រូវមានយ៉ាងតិចមួយ រួចចុច រួចរាល់។',
    cover: 'អាចផ្ញើរូប Cover ជាឯកសារ path URL ឬតំណ Google Drive។ រូបនេះប្រើនៅពេលគ្មានវីដេអូ។',
    loop: 'ជ្រើសរើសរបៀបចាក់។',
    added: (kind, count) => `បានបន្ថែម ${kind}។ សរុប៖ ${count}។`,
    needAudio: 'សូមបន្ថែមសំឡេងយ៉ាងតិចមួយ។',
    needVisual: 'សូមបន្ថែមវីដេអូ ឬរូប Cover យ៉ាងតិចមួយ។',
    saved: 'បានរក្សាទុកការកំណត់។ Stream Key ត្រូវបានលាក់។',
    cancelled: 'បានបោះបង់ការកំណត់។',
    incomplete: 'ការកំណត់មិនទាន់គ្រប់។ សូមប្រើ /setup។',
    preparing: 'កំពុងរៀបចំបញ្ជីមេឌៀ និងចាប់ផ្តើម FFmpeg...',
    startFailed: (message) => `មិនអាចចាប់ផ្តើម៖ ${message}`,
    state: (state) => `ស្ថានភាពផ្សាយ៖ ${state}`,
    commands: 'ពាក្យបញ្ជា៖\n/setup - កំណត់ការផ្សាយ និងបញ្ជីមេឌៀ\n/startlive - ចាប់ផ្តើមផ្សាយ\n/endlive - បញ្ចប់ការផ្សាយ\n/status - មើលស្ថានភាព\n/language - ជ្រើសភាសា\n/cancel - បោះបង់ការកំណត់',
    labels: { start: 'ចាប់ផ្តើម', end: 'បញ្ចប់', status: 'ស្ថានភាព', setup: 'កំណត់', done: 'រួចរាល់', skip: 'រំលង', repeat: 'ចាក់ម្តងទៀត 24/7', once: 'ចាក់ម្តង' },
  },
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeFilename(value) {
  return path.basename(value || 'telegram-media').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)
}

function languageKeyboard() {
  return { inline_keyboard: [[
    { text: 'English', callback_data: 'language:en' },
    { text: 'ខ្មែរ', callback_data: 'language:km' },
  ]] }
}

function controlKeyboard(status, t) {
  const active = ['running', 'preparing'].includes(status.state)
  return { inline_keyboard: [
    [
      active
        ? { text: t.labels.end, callback_data: 'end_live' }
        : { text: t.labels.start, callback_data: 'start_live' },
      { text: t.labels.status, callback_data: 'status' },
    ],
    [{ text: t.labels.setup, callback_data: 'setup' }],
  ] }
}

function collectionKeyboard(t, allowSkip = false) {
  const row = [{ text: t.labels.done, callback_data: 'collection_done' }]
  if (allowSkip) row.push({ text: t.labels.skip, callback_data: 'collection_skip' })
  return { inline_keyboard: [row] }
}

export class TelegramBot {
  constructor({ token, adminIds, manager, store, uploadDir = '.data/uploads' }) {
    this.token = token
    this.adminIds = new Set(adminIds.map(String))
    this.manager = manager
    this.store = store
    this.uploadDir = path.resolve(uploadDir)
    this.sessions = new Map()
    this.offset = 0
    this.stopped = true
    this.abortController = null
  }

  get language() {
    return this.manager.config.language === 'km' ? 'km' : 'en'
  }

  get t() {
    return TEXT[this.language]
  }

  async api(method, body = {}, signal) {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal,
    })
    const result = await response.json()
    if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed: ${result.description ?? response.status}.`)
    return result.result
  }

  sendMessage(chatId, text, extra = {}) {
    return this.api('sendMessage', { chat_id: chatId, text, disable_web_page_preview: true, ...extra })
  }

  isAdmin(id) { return this.adminIds.has(String(id)) }

  statusText(status) {
    return [
      `State: ${status.state}`,
      `Configured: ${status.configured ? 'yes' : 'no'}`,
      `Stream URL: ${status.streamUrl ?? 'not set'}`,
      `Videos: ${status.videos}`,
      `Audios: ${status.audios}`,
      `Cover: ${status.cover ? 'yes' : 'no'}`,
      `Loop: ${status.loop ? '24/7' : 'once'}`,
      status.error ? `Error: ${status.error}` : null,
    ].filter(Boolean).join('\n')
  }

  async showStatus(chatId) {
    const status = this.manager.getStatus()
    await this.sendMessage(chatId, this.statusText(status), { reply_markup: controlKeyboard(status, this.t) })
  }

  async setLanguage(chatId, language) {
    this.manager.config.language = language
    await this.store.save(this.manager.config)
    await this.sendMessage(chatId, TEXT[language].commands, {
      reply_markup: controlKeyboard(this.manager.getStatus(), TEXT[language]),
    })
  }

  async beginSetup(chatId) {
    if (['running', 'preparing'].includes(this.manager.getStatus().state)) {
      await this.sendMessage(chatId, this.t.setupRunning)
      return
    }
    this.sessions.set(String(chatId), {
      step: 'streamUrl',
      config: { language: this.language, videos: [], audios: [], cover: null },
    })
    await this.sendMessage(chatId, this.t.streamUrl)
  }

  async downloadTelegramFile(file, fallbackName) {
    const metadata = await this.api('getFile', { file_id: file.file_id })
    const destination = path.join(this.uploadDir, `${Date.now()}-${file.file_unique_id}-${safeFilename(file.file_name || fallbackName)}`)
    const temporary = `${destination}.part`
    await mkdir(this.uploadDir, { recursive: true })
    const response = await fetch(`https://api.telegram.org/file/bot${this.token}/${metadata.file_path}`)
    if (!response.ok || !response.body) throw new Error(`Telegram file download failed with HTTP ${response.status}.`)
    try {
      await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary))
      await rename(temporary, destination)
    } catch (error) {
      await rm(temporary, { force: true })
      throw error
    }
    return destination
  }

  async mediaValue(message, kind) {
    if (message.text && !message.text.startsWith('/')) return message.text.trim()
    let file = message.document ?? message[kind]
    if (kind === 'cover' && message.photo?.length) file = message.photo.at(-1)
    if (!file) throw new Error(`Send a ${kind} file, path, HTTP URL, or Google Drive link.`)
    const fallback = kind === 'video' ? 'video.mp4' : kind === 'audio' ? 'audio.mp3' : 'cover.jpg'
    return this.downloadTelegramFile(file, fallback)
  }

  async handleSetupInput(message) {
    const chatId = String(message.chat.id)
    const session = this.sessions.get(chatId)
    if (!session) return false

    if (session.step === 'streamUrl' || session.step === 'streamKey') {
      const value = message.text?.trim()
      if (!value || value.startsWith('/')) throw new Error(this.t[session.step])
      session.config[session.step] = value
      if (session.step === 'streamKey') {
        this.api('deleteMessage', { chat_id: message.chat.id, message_id: message.message_id }).catch(() => {})
        session.step = 'videos'
        await this.sendMessage(chatId, this.t.videos, { reply_markup: collectionKeyboard(this.t, true) })
      } else {
        session.step = 'streamKey'
        await this.sendMessage(chatId, this.t.streamKey)
      }
      return true
    }

    if (session.step === 'videos' || session.step === 'audios') {
      const kind = session.step === 'videos' ? 'video' : 'audio'
      const value = await this.mediaValue(message, kind)
      session.config[session.step].push(value)
      await this.sendMessage(chatId, this.t.added(kind, session.config[session.step].length), {
        reply_markup: collectionKeyboard(this.t, session.step === 'videos'),
      })
      return true
    }

    if (session.step === 'cover') {
      session.config.cover = await this.mediaValue(message, 'cover')
      return this.askLoop(chatId, session)
    }
    return false
  }

  async advanceCollection(chatId, skip = false) {
    const session = this.sessions.get(String(chatId))
    if (!session) return
    if (session.step === 'videos') {
      session.step = 'audios'
      await this.sendMessage(chatId, this.t.audios, { reply_markup: collectionKeyboard(this.t) })
      return
    }
    if (session.step === 'audios') {
      if (!session.config.audios.length) return this.sendMessage(chatId, this.t.needAudio)
      session.step = 'cover'
      await this.sendMessage(chatId, this.t.cover, { reply_markup: collectionKeyboard(this.t, true) })
      return
    }
    if (session.step === 'cover') return this.askLoop(chatId, session)
  }

  async askLoop(chatId, session) {
    if (!session.config.videos.length && !session.config.cover) {
      await this.sendMessage(chatId, this.t.needVisual)
      return
    }
    session.step = 'loop'
    await this.sendMessage(chatId, this.t.loop, { reply_markup: { inline_keyboard: [[
      { text: this.t.labels.repeat, callback_data: 'loop:true' },
      { text: this.t.labels.once, callback_data: 'loop:false' },
    ]] } })
  }

  async finishSetup(chatId, loop) {
    const session = this.sessions.get(String(chatId))
    if (!session || session.step !== 'loop') return
    session.config.loop = loop
    this.manager.configure(session.config)
    await this.store.save(this.manager.config)
    this.sessions.delete(String(chatId))
    await this.sendMessage(chatId, this.t.saved, { reply_markup: controlKeyboard(this.manager.getStatus(), this.t) })
  }

  async startLive(chatId) {
    if (!this.manager.getStatus().configured) return this.sendMessage(chatId, this.t.incomplete)
    await this.sendMessage(chatId, this.t.preparing)
    try {
      const status = await this.manager.start()
      await this.sendMessage(chatId, this.t.state(status.state), { reply_markup: controlKeyboard(status, this.t) })
    } catch (error) {
      await this.sendMessage(chatId, this.t.startFailed(error.message), { reply_markup: controlKeyboard(this.manager.getStatus(), this.t) })
    }
  }

  async endLive(chatId) {
    const status = await this.manager.stop()
    await this.sendMessage(chatId, this.t.state(status.state), { reply_markup: controlKeyboard(status, this.t) })
  }

  async handleMessage(message) {
    if (!message?.chat || !message.from) return
    const chatId = message.chat.id
    if (message.chat.type !== 'private') return this.sendMessage(chatId, this.t.private)
    if (!this.isAdmin(message.from.id)) return this.sendMessage(chatId, this.t.denied)
    const command = message.text?.trim().split(/\s+/, 1)[0].toLowerCase()
    if (command === '/cancel') {
      this.sessions.delete(String(chatId))
      return this.sendMessage(chatId, this.t.cancelled, { reply_markup: controlKeyboard(this.manager.getStatus(), this.t) })
    }
    if (command === '/language') return this.sendMessage(chatId, this.t.chooseLanguage, { reply_markup: languageKeyboard() })
    if (command === '/setup') return this.beginSetup(chatId)
    if (command === '/startlive') return this.startLive(chatId)
    if (command === '/endlive') return this.endLive(chatId)
    if (command === '/status') return this.showStatus(chatId)
    if (command === '/start' || command === '/help') {
      return this.sendMessage(chatId, this.t.commands, { reply_markup: controlKeyboard(this.manager.getStatus(), this.t) })
    }
    if (!(await this.handleSetupInput(message))) await this.showStatus(chatId)
  }

  async handleCallback(query) {
    if (!this.isAdmin(query.from.id)) return this.api('answerCallbackQuery', { callback_query_id: query.id, text: this.t.denied, show_alert: true })
    await this.api('answerCallbackQuery', { callback_query_id: query.id })
    const chatId = query.message?.chat.id
    if (!chatId) return
    if (query.data.startsWith('language:')) return this.setLanguage(chatId, query.data.split(':')[1])
    if (query.data === 'setup') return this.beginSetup(chatId)
    if (query.data === 'start_live') return this.startLive(chatId)
    if (query.data === 'end_live') return this.endLive(chatId)
    if (query.data === 'status') return this.showStatus(chatId)
    if (query.data === 'collection_done') return this.advanceCollection(chatId)
    if (query.data === 'collection_skip') return this.advanceCollection(chatId, true)
    if (query.data.startsWith('loop:')) return this.finishSetup(chatId, query.data === 'loop:true')
  }

  async handleUpdate(update) {
    try {
      if (update.message) await this.handleMessage(update.message)
      if (update.callback_query) await this.handleCallback(update.callback_query)
    } catch (error) {
      const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id
      console.error(`Telegram update failed: ${error.message}`)
      if (chatId) await this.sendMessage(chatId, `Error: ${error.message}`)
    }
  }

  async start() {
    this.stopped = false
    await this.api('setMyCommands', { commands: [
      { command: 'setup', description: 'Configure stream and playlists' },
      { command: 'startlive', description: 'Start the live stream' },
      { command: 'endlive', description: 'End the live stream' },
      { command: 'status', description: 'Show stream status' },
      { command: 'language', description: 'English / Khmer' },
      { command: 'cancel', description: 'Cancel setup' },
    ] })
    while (!this.stopped) {
      this.abortController = new AbortController()
      try {
        const updates = await this.api('getUpdates', {
          offset: this.offset, timeout: 25, allowed_updates: ['message', 'callback_query'],
        }, this.abortController.signal)
        for (const update of updates) {
          this.offset = update.update_id + 1
          await this.handleUpdate(update)
        }
      } catch (error) {
        if (this.stopped || error.name === 'AbortError') break
        console.error(`Telegram polling error: ${error.message}`)
        await sleep(3000)
      }
    }
  }

  stop() {
    this.stopped = true
    this.abortController?.abort()
  }
}
