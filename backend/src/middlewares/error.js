import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const isValidationError = err instanceof ZodError;
  const isPrismaInitError = err instanceof Prisma.PrismaClientInitializationError;
  const isPrismaKnownError = err instanceof Prisma.PrismaClientKnownRequestError;

  let statusCode = isValidationError ? 400 : (err.status || 500);
  let errorCode = isValidationError ? 'VALIDATION_ERROR' : (err.code || 'INTERNAL_SERVER_ERROR');
  let message = isValidationError ? 'Validation failed' : (err.message || 'Internal Server Error');

  if (isPrismaInitError) {
    statusCode = 503;
    errorCode = 'DB_UNAVAILABLE';
    message = 'Database service unavailable. Please try again shortly.';
  } else if (isPrismaKnownError && err.code === 'P2002') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'Resource already exists';
  } else if (statusCode >= 500 && env.nodeEnv === 'production') {
    // Never leak internal implementation details to end users in production.
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    message,
    error_code: errorCode,
    meta: {
      requestId: req.requestId
    }
  };

  if (isValidationError) {
    response.errors = err.errors.map((item) => ({
      path: item.path.join('.'),
      message: item.message
    }));
  }

  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  // Log error (avoid logging 4xx as errors in some cases, but here we log all for audit)
  if (statusCode >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.path, method: req.method });
  } else {
    logger.warn({
      message: err.message,
      code: err.code,
      requestId: req.requestId,
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json(response);
};
