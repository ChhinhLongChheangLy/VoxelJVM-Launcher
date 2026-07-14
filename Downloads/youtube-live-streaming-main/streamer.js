import { spawn } from 'node:child_process'

export const DEFAULT_STREAM_URL = 'rtmp://a.rtmp.youtube.com/live2'

function requireValue(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} is required.`)
  }
  return value.trim()
}

export function buildFfmpegArguments({
  streamKey,
  streamUrl = DEFAULT_STREAM_URL,
  videoPlaylist,
  audioPlaylist,
  cover,
  loop = true,
  videoBitrate = '2500k',
  audioBitrate = '128k',
  frameRate = 30,
}) {
  const key = requireValue('streamKey', streamKey)
  const targetUrl = requireValue('streamUrl', streamUrl).replace(/\/+$/, '')
  const audioSource = requireValue('audioPlaylist', audioPlaylist)
  const videoSource = videoPlaylist?.trim()
  const coverSource = cover?.trim()

  if (!videoSource && !coverSource) {
    throw new TypeError('At least one video or cover image is required.')
  }
  if (!/^rtmps?:\/\//i.test(targetUrl)) {
    throw new TypeError('streamUrl must use the rtmp:// or rtmps:// protocol.')
  }

  const args = ['-hide_banner', '-loglevel', 'warning']
  if (videoSource) {
    if (loop) args.push('-stream_loop', '-1')
    args.push(
      '-re',
      '-f',
      'concat',
      '-safe',
      '0',
      '-protocol_whitelist',
      'file,http,https,tcp,tls,crypto',
      '-i',
      videoSource,
    )
  } else {
    args.push('-loop', '1', '-framerate', String(frameRate), '-i', coverSource)
  }

  if (loop) args.push('-stream_loop', '-1')
  args.push(
    '-re',
    '-f',
    'concat',
    '-safe',
    '0',
    '-protocol_whitelist',
    'file,http,https,tcp,tls,crypto',
    '-i',
    audioSource,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(frameRate),
    '-g',
    String(frameRate * 2),
    '-b:v',
    videoBitrate,
    '-maxrate',
    videoBitrate,
    '-bufsize',
    '5000k',
    '-c:a',
    'aac',
    '-b:a',
    audioBitrate,
    '-ar',
    '44100',
  )
  if (!loop) args.push('-shortest')
  args.push('-f', 'flv', `${targetUrl}/${key}`)
  return args
}

export function startStream(options) {
  const ffmpegPath = options.ffmpegPath?.trim() || 'ffmpeg'
  const args = buildFfmpegArguments(options)
  const streamKey = requireValue('streamKey', options.streamKey)
  const child = spawn(ffmpegPath, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  })

  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (message) => {
    process.stderr.write(`[ffmpeg] ${message.replaceAll(streamKey, '[STREAM_KEY]')}`)
  })
  return child
}
