import { StreamManager } from './stream-manager.js'

export default async function youtube(streamKey, video, audio, options = {}) {
  const manager = new StreamManager({
    ...options,
    streamKey,
    videos: options.videos ?? [video],
    audios: options.audios ?? [audio],
  })
  await manager.start()
  return manager
}
