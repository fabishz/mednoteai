import request from 'supertest';
import { app } from '../../src/app.js';

export async function registerAndLogin({
  name = 'Dr. Test',
  email = 'doctor@example.com',
  password = 'StrongPass123',
  clinicName = 'Test Clinic'
} = {}) {
  const registerRes = await request(app).post('/api/auth/register').send({ name, email, password, clinicName });
  if (registerRes.status >= 400) {
    throw new Error(`register failed: ${registerRes.status} ${registerRes.body?.message || 'unknown error'}`);
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  if (loginRes.status >= 400 || !loginRes.body?.data?.accessToken) {
    throw new Error(`login failed: ${loginRes.status} ${loginRes.body?.message || 'missing access token'}`);
  }

  return loginRes.body.data.accessToken;
}
