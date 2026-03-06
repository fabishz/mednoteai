import { prisma } from '../config/prisma.js';
import { Roles } from '../constants/roles.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { runWithRequestContext } from '../middlewares/requestContext.js';
import { AuditService } from './audit.service.js';

export class PatientService {
    static async createPatient(doctorId, payload) {
        const patient = await prisma.patient.create({
            data: { ...payload, doctorId }
        });
        await AuditService.logEvent({
            action: AuditAction.PATIENT_CREATED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName }
        });
        return patient;
    }

    static async getPatients({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const [total, patients] = await Promise.all([
            prisma.patient.count(),
            prisma.patient.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        return {
            patients,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getById(id) {
        const patient = await prisma.patient.findFirst({ where: { id } });
        if (!patient) {
            const existsInAnotherClinic = await runWithRequestContext(
                { user: { role: Roles.SUPER_ADMIN } },
                async () => prisma.patient.findUnique({ where: { id } })
            );

            if (existsInAnotherClinic) {
                throw Object.assign(new Error('Access to this patient is forbidden'), { status: 403, code: 'FORBIDDEN' });
            }

            throw Object.assign(new Error('Patient not found'), { status: 404, code: 'PATIENT_NOT_FOUND' });
        }
        return patient;
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

    static async delete(_doctorId, id) {
        const patient = await this.getById(id);
        const deleted = await prisma.patient.delete({ where: { id } });
        await AuditService.logEvent({
            action: AuditAction.PATIENT_DELETED,
            entityType: AuditEntityType.PATIENT,
            entityId: patient.id,
            metadata: { fullName: patient.fullName }
        });
        return deleted;
    }
}
