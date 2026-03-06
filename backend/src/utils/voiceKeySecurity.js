export function sanitizePatientId(patientId) {
  if (!patientId || typeof patientId !== 'string') {
    throw Object.assign(new Error('Invalid patient id'), { status: 400, code: 'INVALID_PATIENT_ID' });
  }
  if (patientId.includes('..') || patientId.includes('/') || patientId.includes('\\')) {
    throw Object.assign(new Error('Invalid patient id'), { status: 400, code: 'INVALID_PATIENT_ID' });
  }
  return patientId;
}

export function assertSafeVoiceObjectKey({ clinicId, patientId, audioKey }) {
  if (!audioKey || typeof audioKey !== 'string') {
    throw Object.assign(new Error('Invalid audio key'), { status: 400, code: 'INVALID_AUDIO_KEY' });
  }

  if (audioKey.includes('..') || audioKey.includes('\\')) {
    throw Object.assign(new Error('Invalid audio key path'), { status: 400, code: 'INVALID_AUDIO_KEY' });
  }

  const safePatientId = sanitizePatientId(patientId);
  const expectedPrefix = `${clinicId}/patients/${safePatientId}/voice-notes/`;
  if (!audioKey.startsWith(expectedPrefix)) {
    throw Object.assign(new Error('Audio key does not belong to tenant'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }

  return audioKey;
}
