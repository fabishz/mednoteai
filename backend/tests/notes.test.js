import request from 'supertest';
import { app } from '../src/app.js';
import { registerAndLogin } from './helpers/auth.js';

describe('notes', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/notes/generate').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('generates a structured note', async () => {
    const token = await registerAndLogin();

    const patient = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'John Doe', age: 45, gender: 'male', phone: '555-0202' });

    const note = await request(app)
      .post('/api/notes/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId: patient.body.data.id,
        rawInputText: 'Patient complains of headache for 3 days.'
      });

    expect(note.status).toBe(201);
    expect(note.body.success).toBe(true);
    expect(note.body.data.structuredOutput).toContain('Chief Complaint:');
    expect(note.body.meta.requestId).toBeTruthy();
  });
});
