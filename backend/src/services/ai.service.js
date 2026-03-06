import { prisma } from '../config/prisma.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { AIClient } from '../utils/aiClient.js';
import { AuditService } from './audit.service.js';

export class AIService {
    static FREE_TIER_LIMIT = 10;

    static async generateNote(doctorId, { patientId, rawInputText }) {
        // 1. Check free tier limit
        const user = await prisma.user.findUnique({
            where: { id: doctorId },
            select: { noteCount: true }
        });

        if (user.noteCount >= this.FREE_TIER_LIMIT) {
            throw Object.assign(new Error('Free tier limit reached (10 reports max)'), {
                status: 403,
                code: 'LIMIT_EXCEEDED'
            });
        }

        // 2. Ensure patient exists and belongs to doctor
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, doctorId }
        });
        if (!patient) {
            throw Object.assign(new Error('Patient not found'), { status: 404 });
        }

        // 3. Generate note via AI
        const structuredOutput = await AIClient.generateStructuredNote(rawInputText);

        // 4. Save note and increment counter atomically
        const [note] = await prisma.$transaction([
            prisma.medicalNote.create({
                data: {
                    doctorId,
                    patientId,
                    rawInputText,
                    structuredOutput
                }
            }),
            prisma.user.update({
                where: { id: doctorId },
                data: { noteCount: { increment: 1 } }
            })
        ]);

        await AuditService.logEvent({
            action: AuditAction.NOTE_CREATED,
            entityType: AuditEntityType.NOTE,
            entityId: note.id,
            metadata: { patientId: note.patientId }
        });

        return note;
    }
}
