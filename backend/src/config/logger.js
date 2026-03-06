import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './env.js';

export const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization']
});

export const httpLogger = pinoHttp({
  logger,
  redact: ['req.headers.authorization']
});
