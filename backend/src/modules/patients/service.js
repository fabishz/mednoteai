import { prisma } from '../../config/prisma.js';
import { Roles } from '../../constants/roles.js';
import { runWithRequestContext } from '../../middlewares/requestContext.js';

export async function createPatient(doctorId, payload) {
  return prisma.patient.create({
    data: { ...payload, doctorId }
  });
}

export async function listPatients() {
  return prisma.patient.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function getPatient(id) {
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

export async function updatePatient(id, payload) {
  await getPatient(id);
  return prisma.patient.update({
    where: { id },
    data: payload
  });
}

export async function deletePatient(id) {
  await getPatient(id);
  const deletedAt = new Date();
  return prisma.$transaction(async (tx) => {
    const patient = await tx.patient.update({
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

    return patient;
  });
}
