import crypto from 'crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env.js';
import { getRequestContext } from '../middlewares/requestContext.js';

const LOG_LEVEL = env.nodeEnv === 'production' ? 'info' : 'debug';

const baseLoggerOptions = {
  level: LOG_LEVEL,
  base: {
    service: 'mednote-api',
    environment: env.nodeEnv,
  },
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: ['req.headers.authorization'],
  mixin() {
    const ctx = getRequestContext?.();
    if (!ctx) return {};

    return {
      requestId: ctx.requestId,
      userId: ctx.user?.id,
      clinicId: ctx.user?.clinicId ?? ctx.clinicId ?? null,
    };
  },
};

export const logger = pino(baseLoggerOptions);

export const httpLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incomingId = req.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' && incomingId.trim()
      ? incomingId
      : req.requestId || req.id || crypto.randomUUID();

    req.id = requestId;
    req.requestId = requestId;
    if (!res.getHeader('X-Request-Id')) {
      res.setHeader('X-Request-Id', requestId);
    }
    return requestId;
  },
  customProps(req) {
    return {
      requestId: req.requestId || req.id,
      userId: req.user?.id,
      clinicId: req.user?.clinicId ?? req.clinicId ?? null,
    };
  },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return err?.message || `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.originalUrl || req.url,
      requestId: req.requestId || req.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

export function errorLoggingMiddleware(err, req, _res, next) {
  const requestLogger = req.log || logger;
  const status = err?.status || err?.statusCode || 500;
  const level = status >= 500 ? 'error' : 'warn';

  requestLogger[level](
    {
      err,
      stack: err?.stack,
      requestId: req.requestId || req.id,
      userId: req.user?.id,
      clinicId: req.user?.clinicId ?? req.clinicId ?? null,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: status,
    },
    err?.message || 'request_error'
  );

  next(err);
}
