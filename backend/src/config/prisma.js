import { PrismaClient } from '@prisma/client';
import { getRequestContext } from '../middlewares/requestContext.js';
import { ignoreSoftDeleted } from './prismaSoftDelete.js';

export const prisma = new PrismaClient();

const TENANT_MODELS = new Set(['Patient', 'MedicalNote', 'VoiceNote', 'Report', 'AuditLog', 'Template']);
const SCOPED_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findUnique',
  'count',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'create',
  'createMany',
  'upsert'
]);
const IMMUTABLE_AUDIT_ACTIONS = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

function tenantError(message, status = 403, code = 'FORBIDDEN') {
  return Object.assign(new Error(message), { status, code });
}

function mergeWhereWithClinic(where, clinicId) {
  if (!where) {
    return { clinicId };
  }
  return { AND: [where, { clinicId }] };
}

function scopeUniqueWhere(where, clinicId, model) {
  if (!where || typeof where !== 'object') {
    throw tenantError('Missing unique filter for tenant-scoped operation', 400, 'BAD_REQUEST');
  }

  if (model === 'AuditLog') {
    throw tenantError('Use tenant-scoped list queries for audit logs', 400, 'BAD_REQUEST');
  }

  if (where.clinicId_id) {
    const id = where.clinicId_id.id;
    return { clinicId_id: { clinicId, id } };
  }

  if (where.id) {
    return { clinicId_id: { clinicId, id: where.id } };
  }

  throw tenantError('Unsupported unique selector for tenant-scoped operation', 400, 'BAD_REQUEST');
}

function ensureClinicIdMatch(inputClinicId, contextClinicId) {
  if (typeof inputClinicId === 'undefined' || inputClinicId === null) {
    return;
  }
  if (inputClinicId !== contextClinicId) {
    throw tenantError('Cross-tenant write is not allowed');
  }
}

function scopeCreateData(data, clinicId) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  ensureClinicIdMatch(data.clinicId, clinicId);
  return { ...data, clinicId };
}

export function assertAuditLogActionAllowed(params) {
  if (params.model === 'AuditLog' && IMMUTABLE_AUDIT_ACTIONS.has(params.action)) {
    throw tenantError('Audit logs are immutable', 403, 'IMMUTABLE_AUDIT_LOG');
  }
}

prisma.$use(ignoreSoftDeleted());

prisma.$use(async (params, next) => {
  assertAuditLogActionAllowed(params);

  if (!params.model || !TENANT_MODELS.has(params.model) || !SCOPED_ACTIONS.has(params.action)) {
    return next(params);
  }

  const ctx = getRequestContext();
  const currentUser = ctx?.user;
  const isAuditLogCreate = params.model === 'AuditLog' && params.action === 'create';
  const isAuditLogCreateMany = params.model === 'AuditLog' && params.action === 'createMany';

  if ((isAuditLogCreate || isAuditLogCreateMany) && !currentUser) {
    return next(params);
  }

  if (!currentUser) {
    throw tenantError('Missing authenticated user context', 401, 'UNAUTHORIZED');
  }

  if (currentUser.role === 'SUPER_ADMIN') {
    return next(params);
  }

  if (!currentUser.clinicId) {
    throw tenantError('Missing tenant context for authenticated user', 401, 'UNAUTHORIZED');
  }

  const clinicId = currentUser.clinicId;
  params.args ??= {};

  if (params.model === 'AuditLog' && (isAuditLogCreate || isAuditLogCreateMany)) {
    if (isAuditLogCreate) {
      params.args.data = scopeCreateData(params.args.data, clinicId);
    } else if (Array.isArray(params.args.data)) {
      params.args.data = params.args.data.map((item) => scopeCreateData(item, clinicId));
    } else {
      params.args.data = [scopeCreateData(params.args.data, clinicId)];
    }
    return next(params);
  }

  if (params.action === 'create') {
    params.args.data = scopeCreateData(params.args.data, clinicId);
    return next(params);
  }

  if (params.action === 'createMany') {
    if (!Array.isArray(params.args.data)) {
      params.args.data = [scopeCreateData(params.args.data, clinicId)];
    } else {
      params.args.data = params.args.data.map((item) => scopeCreateData(item, clinicId));
    }
    return next(params);
  }

  if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'count') {
    params.args.where = mergeWhereWithClinic(params.args.where, clinicId);
    return next(params);
  }

  if (params.action === 'findUnique') {
    params.args.where = scopeUniqueWhere(params.args.where, clinicId, params.model);
    return next(params);
  }

  if (params.action === 'updateMany') {
    if (params.args.data) {
      params.args.data = scopeCreateData(params.args.data, clinicId);
    }
    params.args.where = mergeWhereWithClinic(params.args.where, clinicId);
    return next(params);
  }

  if (params.action === 'update' || params.action === 'upsert') {
    if (params.args.data) {
      params.args.data = scopeCreateData(params.args.data, clinicId);
    }
    params.args.where = scopeUniqueWhere(params.args.where, clinicId, params.model);
    if (params.action === 'upsert' && params.args.create) {
      params.args.create = scopeCreateData(params.args.create, clinicId);
    }
    return next(params);
  }

  if (params.action === 'deleteMany') {
    params.args.where = mergeWhereWithClinic(params.args.where, clinicId);
    return next(params);
  }

  if (params.action === 'delete') {
    params.args.where = scopeUniqueWhere(params.args.where, clinicId, params.model);
    return next(params);
  }

  return next(params);
});
