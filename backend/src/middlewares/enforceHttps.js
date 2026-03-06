import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD']);

export function enforceHttps(req, res, next) {
  if (!env.enforceHttps) {
    return next();
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const isHttps = req.secure || String(protocol || '').split(',')[0].trim() === 'https';

  if (isHttps) {
    return next();
  }

  const host = req.headers.host;
  if (!host) {
    return next();
  }

  const redirectUrl = `https://${host}${req.originalUrl || req.url || '/'}`;
  const statusCode = SAFE_METHODS.has(req.method) ? 301 : 308;
  return res.redirect(statusCode, redirectUrl);
}
