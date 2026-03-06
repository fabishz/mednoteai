import { prisma } from '../config/prisma.js';
import { Roles } from '../constants/roles.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { runWithRequestContext } from '../middlewares/requestContext.js';
import { AuditService } from './audit.service.js';
import { DashboardService } from './dashboard.service.js';
import { buildPaginatedResult, getPaginationParams } from '../utils/pagination.js';

export class PatientService {
    static async ensurePatientExistsWithTenantCheck(id, options = {}) {
        const patient = await prisma.patient.findFirst({
            where: { id },
            __includeDeleted: options.includeDeleted === true
        });

        if (patient) {
            return patient;
        }

        const existsInAnotherClinic = await runWithRequestContext(
            { user: { role: Roles.SUPER_ADMIN } },
            async () => prisma.patient.findUnique({ where: { id }, __includeDeleted: true })
        );

        if (existsInAnotherClinic) {
            throw Object.assign(new Error('Access to this patient is forbidden'), { status: 403, code: 'FORBIDDEN' });
        }

        throw Object.assign(new Error('Patient not found'), { status: 404, code: 'PATIENT_NOT_FOUND' });
    }

    static async createPatient(doctorId, payload) {
        const patient = await prisma.patient.create({
            data: { ...payload, doctorId }
        });
        await DashboardService.invalidateClinicStats(patient.clinicId);
        await AuditService.logEvent({
            action: AuditAction.PATIENT_CREATED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName }
        });
        return patient;
    }

    static async getPatients({ page = 1, limit = 20 }) {
        const paginationParams = getPaginationParams({ page, limit });

        const [total, patients] = await Promise.all([
            prisma.patient.count(),
            prisma.patient.findMany({
                orderBy: { createdAt: 'desc' },
                skip: paginationParams.skip,
                take: paginationParams.limit
            })
        ]);

        return buildPaginatedResult(patients, {
            page: paginationParams.page,
            limit: paginationParams.limit,
            total
        });
    }

    static async getById(id) {
        return this.ensurePatientExistsWithTenantCheck(id);
    }

    static async updatePatient(id, payload) {
        await this.getById(id);
        const patient = await prisma.patient.update({
            where: { id },
            data: payload
        });
        await AuditService.logEvent({
            action: AuditAction.PATIENT_UPDATED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName }
        });
        return patient;
    }

    static async create(doctorId, payload) {
        return this.createPatient(doctorId, payload);
    }

    static async list(_doctorId, query) {
        return this.getPatients(query);
    }

    static async update(_doctorId, id, payload) {
        return this.updatePatient(id, payload);
    }

    static async softDeletePatient(id) {
        const patient = await this.getById(id);
        const deletedAt = new Date();

        const deleted = await prisma.$transaction(async (tx) => {
            const updatedPatient = await tx.patient.update({
                where: { id },
                data: { deletedAt }
            });

            await tx.medicalNote.updateMany({
                where: { patientId: id, deletedAt: null },
                data: { deletedAt }
            });

            await tx.voiceNote.updateMany({
                where: { patientId: id, deletedAt: null },
                data: { deletedAt }
            });

            return updatedPatient;
        });

        await AuditService.logEvent({
            action: AuditAction.PATIENT_DELETED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName }
        });
        return deleted;
    }

    static async restorePatient(id) {
        const patient = await this.ensurePatientExistsWithTenantCheck(id, { includeDeleted: true });
        if (!patient.deletedAt) {
            return patient;
        }

        const restored = await prisma.$transaction(async (tx) => {
            const restoredPatient = await tx.patient.update({
                where: { id },
                data: { deletedAt: null },
                __includeDeleted: true
            });

            await tx.medicalNote.updateMany({
                where: { patientId: id },
                data: { deletedAt: null },
                __includeDeleted: true
            });

            await tx.voiceNote.updateMany({
                where: { patientId: id },
                data: { deletedAt: null },
                __includeDeleted: true
            });

            return restoredPatient;
        });

        await AuditService.logEvent({
            action: AuditAction.PATIENT_UPDATED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName, restored: true }
        });

        return restored;
    }

    static async delete(_doctorId, id) {
        return this.softDeletePatient(id);
    }
}
