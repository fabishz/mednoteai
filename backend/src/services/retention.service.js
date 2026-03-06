import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { Roles, normalizeRole } from '../constants/roles.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { runWithRequestContext } from '../middlewares/requestContext.js';
import { AuditService } from './audit.service.js';
import { logger } from '../config/logger.js';

const DEFAULT_RETENTION_YEARS = 7;
const SYSTEM_RETENTION_USER_ID = 'SYSTEM_RETENTION_JOB';
const ANONYMIZED_PATIENT_NAME = 'Deleted Patient';
const ANONYMIZED_PHONE = 'REDACTED';

let retentionSweepTimer = null;
let retentionSweepInProgress = false;

function assertCanUpdateRetention(user) {
  const role = normalizeRole(user?.role);
  if (role !== Roles.CLINIC_ADMIN && role !== Roles.SUPER_ADMIN) {
    throw Object.assign(new Error('You do not have permission to update retention policy'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }
}

function getCutoffDateFromYears(years) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return cutoff;
}

async function getAllPoliciesWithDefaults() {
  const clinics = await prisma.clinic.findMany({ select: { id: true } });
  const policies = [];

  for (const clinic of clinics) {
    const policy = await RetentionService.getOrCreatePolicy(clinic.id);
    policies.push(policy);
  }

  return policies;
}

export class RetentionService {
  static async getOrCreatePolicy(clinicId) {
    let policy = await prisma.retentionPolicy.findFirst({
      where: { clinicId }
    });

    if (!policy) {
      policy = await prisma.retentionPolicy.create({
        data: {
          clinicId,
          patientRecordRetentionYears: DEFAULT_RETENTION_YEARS,
          auditLogRetentionYears: DEFAULT_RETENTION_YEARS
        }
      });
    }

    return policy;
  }

  static async getPolicy(user) {
    return this.getOrCreatePolicy(user.clinicId);
  }

  static async updatePolicy(user, payload) {
    assertCanUpdateRetention(user);
    const existing = await this.getOrCreatePolicy(user.clinicId);

    return prisma.retentionPolicy.update({
      where: { id: existing.id },
      data: {
        patientRecordRetentionYears: payload.patientRecordRetentionYears,
        auditLogRetentionYears: payload.auditLogRetentionYears
      }
    });
  }

  static async anonymizeExpiredPatientsNow() {
    return runWithRequestContext(
      { user: { id: SYSTEM_RETENTION_USER_ID, role: Roles.SUPER_ADMIN, clinicId: null } },
      async () => {
        const policies = await getAllPoliciesWithDefaults();
        let totalAnonymized = 0;

        for (const policy of policies) {
          const cutoffDate = getCutoffDateFromYears(policy.patientRecordRetentionYears);
          const candidates = await prisma.patient.findMany({
            where: {
              clinicId: policy.clinicId,
              createdAt: { lt: cutoffDate },
              anonymizedAt: null
            },
            select: { id: true },
            __includeDeleted: true
          });

          if (!candidates.length) {
            continue;
          }

          for (const patient of candidates) {
            const anonymizedAt = new Date();
            await prisma.$transaction(async (tx) => {
              await tx.patient.update({
                where: { id: patient.id },
                data: {
                  fullName: ANONYMIZED_PATIENT_NAME,
                  phone: ANONYMIZED_PHONE,
                  deletedAt: anonymizedAt,
                  anonymizedAt
                },
                __includeDeleted: true
              });

              await tx.medicalNote.updateMany({
                where: { patientId: patient.id, deletedAt: null },
                data: { deletedAt: anonymizedAt }
              });

              await tx.voiceNote.updateMany({
                where: { patientId: patient.id, deletedAt: null },
                data: { deletedAt: anonymizedAt }
              });
            });

            await AuditService.logEvent({
              action: AuditAction.PATIENT_ANONYMIZED,
              entityType: AuditEntityType.PATIENT,
              entityId: patient.id,
              userId: SYSTEM_RETENTION_USER_ID,
              clinicId: policy.clinicId,
              metadata: {
                patientId: patient.id,
                retentionYears: policy.patientRecordRetentionYears,
                timestamp: anonymizedAt.toISOString(),
                source: 'retention_job'
              }
            });

            totalAnonymized += 1;
          }
        }

        return totalAnonymized;
      }
    );
  }

  static async purgeExpiredAuditLogsNow() {
    return runWithRequestContext(
      { user: { id: SYSTEM_RETENTION_USER_ID, role: Roles.SUPER_ADMIN, clinicId: null } },
      async () => {
        const policies = await getAllPoliciesWithDefaults();
        let totalDeleted = 0;

        for (const policy of policies) {
          const cutoffDate = getCutoffDateFromYears(policy.auditLogRetentionYears);
          const result = await prisma.auditLog.deleteMany({
            where: {
              clinicId: policy.clinicId,
              createdAt: { lt: cutoffDate }
            }
          });
          totalDeleted += result.count;
        }

        return totalDeleted;
      }
    );
  }

  static async runRetentionSweepNow() {
    const [anonymizedPatients, deletedAuditLogs] = await Promise.all([
      this.anonymizeExpiredPatientsNow(),
      this.purgeExpiredAuditLogsNow()
    ]);

    return {
      anonymizedPatients,
      deletedAuditLogs
    };
  }

  static startRetentionSweepJob() {
    if (retentionSweepTimer) {
      return retentionSweepTimer;
    }

    retentionSweepTimer = setInterval(async () => {
      if (retentionSweepInProgress) {
        return;
      }
      retentionSweepInProgress = true;
      try {
        const result = await RetentionService.runRetentionSweepNow();
        if (result.anonymizedPatients > 0 || result.deletedAuditLogs > 0) {
          logger.info(result, 'retention_sweep_completed');
        }
      } catch (err) {
        logger.error({ err }, 'retention_sweep_failed');
      } finally {
        retentionSweepInProgress = false;
      }
    }, env.retentionSweepIntervalMs);

    if (typeof retentionSweepTimer.unref === 'function') {
      retentionSweepTimer.unref();
    }

    return retentionSweepTimer;
  }
}
