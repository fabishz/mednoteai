import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let initialized = false;
let processHandlersRegistered = false;

function toError(reason) {
  if (reason instanceof Error) {
    return reason;
  }

  return new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
}

function attachScopeContext(scope, req) {
  const requestId = req.requestId || req.id;
  const userId = req.user?.id ?? null;
  const clinicId = req.user?.clinicId ?? req.clinicId ?? null;

  if (requestId) {
    scope.setTag('requestId', requestId);
    scope.setContext('request', {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
    });
  }

  if (userId) {
    scope.setUser({ id: String(userId) });
  }

  if (clinicId) {
    scope.setContext('tenant', { clinicId: String(clinicId) });
  }
}

export function initSentry() {
  if (initialized) {
    return;
  }

  if (!env.sentryDsn) {
    logger.info('sentry_disabled_missing_dsn');
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
  });

  initialized = true;
  logger.info('sentry_initialized');
}

export function registerSentryProcessHandlers() {
  if (processHandlersRegistered) {
    return;
  }

  process.on('unhandledRejection', (reason) => {
    const error = toError(reason);

    if (initialized) {
      Sentry.captureException(error);
    }

    logger.error({ err: error, stack: error.stack }, 'unhandled_rejection');
  });

  process.on('uncaughtException', async (error) => {
    if (initialized) {
      Sentry.captureException(error);
      await Sentry.flush(2000);
    }

    logger.error({ err: error, stack: error.stack }, 'uncaught_exception');
    process.exit(1);
  });

  processHandlersRegistered = true;
}

export function sentryErrorMiddleware(err, req, _res, next) {
  if (!initialized) {
    return next(err);
  }

  Sentry.withScope((scope) => {
    attachScopeContext(scope, req);
    Sentry.captureException(err);
  });

  return next(err);
}
