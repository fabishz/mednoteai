import { logger } from '../config/logger.js';

export function auditEvent(req, payload) {
  logger.info({
    event: 'audit_event',
    requestId: req.requestId,
    actorId: req.user?.id || null,
    actorEmail: req.user?.email || null,
    actorRole: req.user?.role || null,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    ...payload
  });
}
