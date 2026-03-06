import request from 'supertest';
import { app } from '../../src/app.js';

export async function registerAndLogin({
  name = 'Dr. Test',
  email = 'doctor@example.com',
  password = 'StrongPass123',
  clinicName = 'Test Clinic'
} = {}) {
  await request(app).post('/api/auth/register').send({ name, email, password, clinicName });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.data.accessToken;
}
