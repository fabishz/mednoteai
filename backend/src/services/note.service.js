import { prisma } from '../config/prisma.js';

export class NoteService {
    static async list(doctorId, { page = 1, limit = 10, patientId }) {
        const skip = (page - 1) * limit;
        const where = { doctorId };
        if (patientId) where.patientId = patientId;

        const [total, notes] = await Promise.all([
            prisma.medicalNote.count({ where }),
            prisma.medicalNote.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: { patient: { select: { fullName: true } } },
                skip,
                take: limit
            })
        ]);

        return {
            notes,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
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
