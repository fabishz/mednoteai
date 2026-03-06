import { prisma } from '../config/prisma.js';
import { deleteCache, getCache, setCache } from '../lib/cache.js';

const DASHBOARD_CACHE_TTL_SECONDS = 60;

function dashboardCacheKey(clinicId) {
  return `dashboard:${clinicId}`;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export class DashboardService {
  static async getStats(clinicId) {
    const key = dashboardCacheKey(clinicId);
    const cached = await getCache(key);
    if (cached) {
      return cached;
    }

    const [totalPatients, notesCreatedToday, activeDoctors] = await Promise.all([
      prisma.patient.count(),
      prisma.medicalNote.count({
        where: {
          createdAt: {
            gte: startOfTodayUtc(),
          },
        },
      }),
      prisma.user.count({
        where: {
          role: 'DOCTOR',
        },
      }),
    ]);

    const stats = {
      totalPatients,
      notesCreatedToday,
      activeDoctors,
    };

    await setCache(key, stats, DASHBOARD_CACHE_TTL_SECONDS);
    return stats;
  }

  static async invalidateClinicStats(clinicId) {
    if (!clinicId) return;
    await deleteCache(dashboardCacheKey(clinicId));
  }
}
