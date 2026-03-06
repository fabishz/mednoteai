import { prisma } from '../src/config/prisma.js';
import { runWithRequestContext } from '../src/middlewares/requestContext.js';
import { Prisma } from '@prisma/client';

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  try {
    await runWithRequestContext({ user: { role: 'SUPER_ADMIN', clinicId: null } }, async () => {
    await prisma.report.deleteMany();
    await prisma.voiceNote.deleteMany();
    await prisma.medicalNote.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.patient.deleteMany();
      await prisma.user.deleteMany();
      await prisma.clinic.deleteMany();
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return;
    }
    throw error;
  }
});
