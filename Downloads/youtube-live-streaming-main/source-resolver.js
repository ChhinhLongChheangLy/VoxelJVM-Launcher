import { createWriteStream } from 'node:fs'
import { access, mkdir, rename, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

const GOOGLE_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'drive.usercontent.google.com',
])

export function isRemoteSource(source) {
  return /^https?:\/\//i.test(source)
}

export function getGoogleDriveFileId(source) {
  if (!isRemoteSource(source)) return null

  let url
  try {
    url = new URL(source)
  } catch {
    return null
  }

  if (!GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null

  const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/)
  return pathMatch?.[1] ?? url.searchParams.get('id')
}

function driveDownloadUrl(fileId) {
  const url = new URL('https://drive.usercontent.google.com/download')
  url.searchParams.set('id', fileId)
  url.searchParams.set('export', 'download')
  url.searchParams.set('confirm', 't')
  return url.toString()
}

async function downloadFile(url, destination, signal) {
  const response = await fetch(url, { redirect: 'follow', signal })

  if (!response.ok || !response.body) {
    throw new Error(`Download failed with HTTP ${response.status}.`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    throw new Error(
      'The source returned an HTML page instead of media. Check sharing permissions or use a direct download URL.',
    )
  }

  const temporaryPath = `${destination}.part`
  try {
    await pipeline(
      Readable.fromWeb(response.body),
      createWriteStream(temporaryPath),
      { signal },
    )
    await rename(temporaryPath, destination)
  } catch (error) {
    await rm(temporaryPath, { force: true })
    throw error
  }
}

export async function prepareSource(
  source,
  { cacheDir = '.data/cache', signal } = {},
) {
  const value = source?.trim()
  if (!value) throw new TypeError('Media source is required.')

  const driveFileId = getGoogleDriveFileId(value)
  if (driveFileId) {
    const directory = path.resolve(cacheDir)
    const destination = path.join(directory, `google-drive-${driveFileId}`)
    await mkdir(directory, { recursive: true })

    try {
      await access(destination)
    } catch {
      await downloadFile(driveDownloadUrl(driveFileId), destination, signal)
    }

    return destination
  }

  if (isRemoteSource(value)) return value

  const localPath = path.resolve(value)
  try {
    await access(localPath)
  } catch {
    throw new Error(`Local media file does not exist: ${localPath}`)
  }

  return localPath
}
