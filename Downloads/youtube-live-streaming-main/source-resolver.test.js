import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getGoogleDriveFileId,
  isRemoteSource,
} from './source-resolver.js'

test('extracts IDs from common public Google Drive links', () => {
  assert.equal(
    getGoogleDriveFileId(
      'https://drive.google.com/file/d/1AbC_def-123/view?usp=sharing',
    ),
    '1AbC_def-123',
  )
  assert.equal(
    getGoogleDriveFileId(
      'https://drive.google.com/uc?export=download&id=second-file-id',
    ),
    'second-file-id',
  )
})

test('does not treat unrelated URLs as Google Drive links', () => {
  assert.equal(getGoogleDriveFileId('https://example.com/file/d/id'), null)
  assert.equal(isRemoteSource('C:\\media\\video.mp4'), false)
  assert.equal(isRemoteSource('https://example.com/video.mp4'), true)
})
