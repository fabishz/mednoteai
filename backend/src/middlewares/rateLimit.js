import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const createLimiter = (windowMs, max, message, code) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message,
      error_code: code,
      meta: {
        requestId: req.requestId
      }
    });
  },
  skip: (req) => {
    // Keep health checks available for load balancers/uptime probes.
    return req.path === '/health';
  }
});

export const generalLimiter = createLimiter(
  env.rateLimitWindowMs,
  env.rateLimitMax,
  'Too many requests, please try again later',
  'TOO_MANY_REQUESTS'
);

export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  5,
  'Too many login/register attempts, please try again after 15 minutes',
  'AUTH_RATE_LIMIT'
);

export const aiLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  'Too many AI generation requests, please try again after an hour',
  'AI_RATE_LIMIT'
);
