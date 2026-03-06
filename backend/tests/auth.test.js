import request from 'supertest';
import { app } from '../src/app.js';

describe('auth', () => {
  it('registers and logs in', async () => {
    const register = await request(app).post('/api/auth/register').send({
      name: 'Dr. House',
      email: 'house@example.com',
      password: 'StrongPass123',
      clinicName: 'Princeton Plainsboro'
    });

    expect(register.status).toBe(201);
    expect(register.body.success).toBe(true);
    expect(register.body.data.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({
      email: 'house@example.com',
      password: 'StrongPass123'
    });

    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    expect(login.body.data.token).toBeTruthy();
  });

  it('returns current user profile', async () => {
    const register = await request(app).post('/api/auth/register').send({
      name: 'Dr. Carter',
      email: 'carter@example.com',
      password: 'StrongPass123',
      clinicName: 'County General'
    });

    const token = register.body.data.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.success).toBe(true);
    expect(me.body.data.email).toBe('carter@example.com');
    expect(me.body.meta.requestId).toBeTruthy();
  });

  it('rejects invalid login', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'missing@example.com',
      password: 'NopeNope123'
    });

    expect(login.status).toBe(401);
    expect(login.body.success).toBe(false);
  });
});
