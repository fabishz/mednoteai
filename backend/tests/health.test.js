import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const prismaMock = {
  $queryRaw: jest.fn(),
};

const redisMock = {
  ping: jest.fn(),
  isOpen: true,
};

const ensureRedisConnectedMock = jest.fn();

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock,
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: redisMock,
  ensureRedisConnected: ensureRedisConnectedMock,
}));

const { default: healthRoutes } = await import('../src/routes/health.routes.js');

describe('health endpoint', () => {
  let app;

  beforeEach(() => {
    prismaMock.$queryRaw.mockReset();
    redisMock.ping.mockReset();
    ensureRedisConnectedMock.mockReset();

    app = express();
    app.use('/health', healthRoutes);
  });

  it('returns ok when database and redis are connected', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    ensureRedisConnectedMock.mockResolvedValue(undefined);
    redisMock.ping.mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'connected',
    });
  });

  it('returns degraded when redis check fails', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    ensureRedisConnectedMock.mockResolvedValue(undefined);
    redisMock.ping.mockRejectedValue(new Error('redis down'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'down',
    });
  });
});
