import dotenv from 'dotenv';
import pino from 'pino';
import { z } from 'zod';

dotenv.config();

const parseBoolean = (val, defaultValue = false) => {
  if (val === undefined || val === null || val === '') return defaultValue;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess((val) => Number(val), z.number().default(4000)),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('24h'),
  AI_API_URL: z.string().url(),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 1 : Number(val)),
    z.number().int().min(0).default(1)
  ),
  ENABLE_SWAGGER: z.preprocess((val) => parseBoolean(val, true), z.boolean().default(true)),
  RATE_LIMIT_WINDOW_MS: z.preprocess((val) => Number(val), z.number().default(60000)),
  RATE_LIMIT_MAX: z.preprocess((val) => Number(val), z.number().default(30)),
  HEALTHCHECK_TIMEOUT_MS: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 40 : Number(val)),
    z.number().int().positive().max(5000).default(40)
  ),
  AWS_REGION: z.string().min(1),
  S3_VOICE_BUCKET: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const bootstrapLogger = pino({
    level: 'error',
    base: {
      service: 'mednote-api',
      environment: process.env.NODE_ENV || 'development',
    },
    messageKey: 'message',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
  bootstrapLogger.error({ issues: parsed.error.format() }, 'Invalid environment variables');
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  aiApiUrl: parsed.data.AI_API_URL,
  aiApiKey: parsed.data.AI_API_KEY,
  aiModel: parsed.data.AI_MODEL,
  corsOrigin: parsed.data.CORS_ORIGIN,
  trustProxy: parsed.data.TRUST_PROXY,
  enableSwagger: parsed.data.ENABLE_SWAGGER,
  rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
  healthcheckTimeoutMs: parsed.data.HEALTHCHECK_TIMEOUT_MS,
  awsRegion: parsed.data.AWS_REGION,
  s3VoiceBucket: parsed.data.S3_VOICE_BUCKET
};
