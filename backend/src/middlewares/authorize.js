import { Roles, normalizeRole } from '../constants/roles.js';
import { hasPermission as roleHasPermission } from '../constants/rolePermissions.js';

export function authorize(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error_code: 'UNAUTHORIZED',
        meta: { requestId: req.requestId }
      });
    }

    const effectiveRole = normalizeRole(req.user.role);

    if (effectiveRole === Roles.SUPER_ADMIN) {
      return next();
    }

    if (!roleHasPermission(effectiveRole, requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        error_code: 'FORBIDDEN',
        meta: { requestId: req.requestId }
      });
    }

    return next();
  };
}
