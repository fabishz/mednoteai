import { prisma } from '../config/prisma.js';
import { buildPaginatedResult, getPaginationParams } from '../utils/pagination.js';

export class NoteService {
    static async list(doctorId, { page = 1, limit = 20, patientId }) {
        const paginationParams = getPaginationParams({ page, limit });
        const where = { doctorId };
        if (patientId) where.patientId = patientId;

        const [total, notes] = await Promise.all([
            prisma.medicalNote.count({ where }),
            prisma.medicalNote.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: { patient: { select: { fullName: true } } },
                skip: paginationParams.skip,
                take: paginationParams.limit
            })
        ]);

        return buildPaginatedResult(notes, {
            page: paginationParams.page,
            limit: paginationParams.limit,
            total
        });
    }

    static async getById(doctorId, id) {
        const note = await prisma.medicalNote.findFirst({
            where: { id, doctorId },
            include: {
                doctor: { select: { name: true, clinicName: true } },
                patient: { select: { fullName: true, age: true, gender: true } }
            }
        });

        if (!note) {
            throw Object.assign(new Error('Note not found'), { status: 404, code: 'NOTE_NOT_FOUND' });
        }

        return note;
    }
}
