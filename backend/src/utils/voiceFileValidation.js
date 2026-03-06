export const ALLOWED_VOICE_MIME_TYPES = Object.freeze([
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4'
]);

export const MAX_VOICE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function assertAllowedVoiceMimeType(mimeType) {
  if (!ALLOWED_VOICE_MIME_TYPES.includes(mimeType)) {
    throw Object.assign(new Error('Unsupported audio MIME type'), {
      status: 400,
      code: 'INVALID_MIME_TYPE'
    });
  }
}

export function assertAllowedVoiceFileSize(fileSizeBytes) {
  if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0 || fileSizeBytes > MAX_VOICE_FILE_SIZE_BYTES) {
    throw Object.assign(new Error('Invalid audio file size'), {
      status: 400,
      code: 'INVALID_FILE_SIZE'
    });
  }
}

export function assertValidVoiceUpload({ mimeType, fileSizeBytes }) {
  assertAllowedVoiceMimeType(mimeType);
  assertAllowedVoiceFileSize(fileSizeBytes);
}
