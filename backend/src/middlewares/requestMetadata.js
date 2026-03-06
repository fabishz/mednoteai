import { setRequestContextMetadata } from './requestContext.js';

function getForwardedIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function requestMetadata(req, _res, next) {
  const ipAddress = getForwardedIp(req);
  const userAgentHeader = req.headers['user-agent'];
  const userAgent = typeof userAgentHeader === 'string' && userAgentHeader.trim() ? userAgentHeader : 'unknown';

  req.ipAddress = ipAddress;
  req.userAgent = userAgent;
  req.clinicId = req.user?.clinicId ?? null;

  setRequestContextMetadata({ ipAddress, userAgent });
  return next();
}
