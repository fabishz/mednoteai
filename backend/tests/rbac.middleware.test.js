import { authorize } from '../src/middlewares/authorize.js';
import { Permissions } from '../src/constants/permissions.js';
import { Roles } from '../src/constants/roles.js';
import { jest } from '@jest/globals';

function createMockResponse() {
  const response = {};
  response.statusCode = 200;
  response.body = null;
  response.status = jest.fn((code) => {
    response.statusCode = code;
    return response;
  });
  response.json = jest.fn((payload) => {
    response.body = payload;
    return response;
  });
  return response;
}

describe('authorize middleware', () => {
  it('DOCTOR cannot delete patient', () => {
    const middleware = authorize(Permissions.PATIENT_DELETE);
    const req = {
      user: { id: 'u1', role: Roles.DOCTOR },
      requestId: 'req-1'
    };
    const res = createMockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error_code).toBe('FORBIDDEN');
  });

  it('CLINIC_ADMIN can delete patient', () => {
    const middleware = authorize(Permissions.PATIENT_DELETE);
    const req = {
      user: { id: 'u2', role: Roles.CLINIC_ADMIN },
      requestId: 'req-2'
    };
    const res = createMockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('SUPER_ADMIN bypass works', () => {
    const middleware = authorize(Permissions.BILLING_MANAGE);
    const req = {
      user: { id: 'u3', role: Roles.SUPER_ADMIN },
      requestId: 'req-3'
    };
    const res = createMockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
