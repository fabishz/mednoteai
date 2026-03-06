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
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBe(1);
    expect(list.body.pagination).toEqual(expect.objectContaining({
      page: 1,
      limit: 20,
      total: 1,
      pages: 1
    }));
    expect(list.body.meta.requestId).toBeTruthy();
  });

  it('soft deletes and restores a patient', async () => {
    const token = await registerAndLogin();

    const create = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Soft Delete', age: 40, gender: 'female', phone: '555-1111' });

    expect(create.status).toBe(201);
    const patientId = create.body.data.id;

    const remove = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(remove.status).toBe(200);
    expect(remove.body.success).toBe(true);

    const getDeleted = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getDeleted.status).toBe(404);
    expect(getDeleted.body.error_code).toBe('PATIENT_NOT_FOUND');

    const listAfterDelete = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(listAfterDelete.status).toBe(200);
    expect(listAfterDelete.body.data).toHaveLength(0);

    const restore = await request(app)
      .post(`/api/patients/${patientId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restore.status).toBe(200);
    expect(restore.body.success).toBe(true);
    expect(restore.body.data.id).toBe(patientId);
    expect(restore.body.data.deletedAt).toBeNull();

    const getRestored = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRestored.status).toBe(200);
    expect(getRestored.body.data.id).toBe(patientId);
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
