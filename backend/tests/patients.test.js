import request from 'supertest';
import { app } from '../src/app.js';
import { registerAndLogin } from './helpers/auth.js';

describe('patients', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('creates and lists patients', async () => {
    const token = await registerAndLogin();

    const create = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Jane Roe', age: 34, gender: 'female', phone: '555-0101' });

    expect(create.status).toBe(201);
    expect(create.body.success).toBe(true);

    const list = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    expect(list.body.data.patients.length).toBe(1);
    expect(list.body.meta.requestId).toBeTruthy();
  });

  it('returns 403 when a clinic user accesses a patient from another clinic', async () => {
    const clinicAToken = await registerAndLogin({
      name: 'Dr. Clinic A',
      email: 'clinic-a@example.com',
      password: 'StrongPass123',
      clinicName: 'Clinic A'
    });
    const clinicBToken = await registerAndLogin({
      name: 'Dr. Clinic B',
      email: 'clinic-b@example.com',
      password: 'StrongPass123',
      clinicName: 'Clinic B'
    });

    const create = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clinicAToken}`)
      .send({ fullName: 'Cross Tenant', age: 41, gender: 'male', phone: '555-0199' });

    const patientId = create.body.data.id;

    const forbidden = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${clinicBToken}`);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.success).toBe(false);
    expect(forbidden.body.error_code).toBe('FORBIDDEN');
  });
});
