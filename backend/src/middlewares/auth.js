import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ROLE_VALUES, Roles, normalizeRole } from '../constants/roles.js';
import { setRequestContextMetadata, setRequestContextUser } from './requestContext.js';
import { getAccessTokenFromCookies } from '../utils/authCookies.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const headerToken = header && header.startsWith('Bearer ')
    ? header.split(' ')[1]
    : null;
  const cookieToken = getAccessTokenFromCookies(req);
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error_code: 'UNAUTHORIZED',
      meta: { requestId: req.requestId }
    });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    if (!payload?.sub || !payload?.email || !payload?.role) {
      throw new Error('Invalid token payload');
    }
    if (payload?.type && payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    if (!ROLE_VALUES.includes(payload.role)) {
      throw new Error('Invalid role in token');
    }
    const normalizedRole = normalizeRole(payload.role);
    if (normalizedRole !== Roles.SUPER_ADMIN && !payload?.clinicId) {
      throw new Error('Missing tenant in token');
    }
    req.user = { id: payload.sub, email: payload.email, role: normalizedRole, clinicId: payload.clinicId ?? null };
    req.clinicId = payload.clinicId ?? null;
    setRequestContextUser(req.user);
    setRequestContextMetadata({ clinicId: req.clinicId });
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error_code: 'INVALID_TOKEN',
      meta: { requestId: req.requestId }
    });
  }
}
