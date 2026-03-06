import { jest } from '@jest/globals';

const prismaMock = {
  patient: { count: jest.fn() },
  medicalNote: { count: jest.fn() },
  user: { count: jest.fn() },
};

const cacheMock = {
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock,
}));

jest.unstable_mockModule('../src/lib/cache.js', () => ({
  getCache: cacheMock.getCache,
  setCache: cacheMock.setCache,
  deleteCache: cacheMock.deleteCache,
}));

const { DashboardService } = await import('../src/services/dashboard.service.js');

describe('DashboardService', () => {
  beforeEach(() => {
    prismaMock.patient.count.mockReset();
    prismaMock.medicalNote.count.mockReset();
    prismaMock.user.count.mockReset();
    cacheMock.getCache.mockReset();
    cacheMock.setCache.mockReset();
    cacheMock.deleteCache.mockReset();
  });

  it('returns cached stats when present', async () => {
    cacheMock.getCache.mockResolvedValue({
      totalPatients: 10,
      notesCreatedToday: 4,
      activeDoctors: 2,
    });

    const result = await DashboardService.getStats('clinic-1');

    expect(result).toEqual({
      totalPatients: 10,
      notesCreatedToday: 4,
      activeDoctors: 2,
    });
    expect(prismaMock.patient.count).not.toHaveBeenCalled();
    expect(prismaMock.medicalNote.count).not.toHaveBeenCalled();
    expect(prismaMock.user.count).not.toHaveBeenCalled();
  });

  it('queries db and caches stats when cache is empty', async () => {
    cacheMock.getCache.mockResolvedValue(null);
    prismaMock.patient.count.mockResolvedValue(12);
    prismaMock.medicalNote.count.mockResolvedValue(5);
    prismaMock.user.count.mockResolvedValue(3);

    const result = await DashboardService.getStats('clinic-1');

    expect(result).toEqual({
      totalPatients: 12,
      notesCreatedToday: 5,
      activeDoctors: 3,
    });
    expect(cacheMock.setCache).toHaveBeenCalledWith(
      'dashboard:clinic-1',
      {
        totalPatients: 12,
        notesCreatedToday: 5,
        activeDoctors: 3,
      },
      60
    );
  });

  it('invalidates clinic stats cache key', async () => {
    await DashboardService.invalidateClinicStats('clinic-1');
    expect(cacheMock.deleteCache).toHaveBeenCalledWith('dashboard:clinic-1');
  });
});
