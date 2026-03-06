import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || process.env.DATABASE_URL
  || 'postgresql://user:password@localhost:5432/mednoteai_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_long_random_value';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.AI_API_URL = process.env.AI_API_URL || 'https://api.example.com/v1/generate';
process.env.AI_API_KEY = process.env.AI_API_KEY || 'test_key';
process.env.AI_MODEL = process.env.AI_MODEL || 'test-model';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '30';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.S3_VOICE_BUCKET = process.env.S3_VOICE_BUCKET || 'mednoteai-test-voice';

if (!global.fetch) {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ output: 'Chief Complaint:\nHistory of Present Illness:\nPast Medical History:\nExamination Findings:\nDiagnosis:\nTreatment Plan:\nRecommendations:' })
  });
}
