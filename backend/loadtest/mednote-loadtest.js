import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '2m';

const errors = new Rate('errors');
const flowsCompleted = new Counter('flows_completed');
const flowDuration = new Trend('flow_duration', true);
const loginDuration = new Trend('login_duration', true);
const fetchPatientsDuration = new Trend('fetch_patients_duration', true);
const createNoteDuration = new Trend('create_note_duration', true);

export const options = {
  scenarios: {
    load_test: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_duration: ['p(50)<300', 'p(95)<800'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    flow_duration: ['p(50)<1000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
};

function jsonHeaders(ip, token) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': ip,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function randomIp() {
  return `10.${(__VU % 250) + 1}.${(__ITER % 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;
}

export function setup() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const clinicName = `LoadTest Clinic ${suffix}`;
  const email = `loadtest-${suffix}@example.com`;
  const password = __ENV.LOADTEST_PASSWORD || 'StrongPass123!';
  const ip = randomIp();

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      name: 'Load Test User',
      email,
      password,
      clinicName,
    }),
    { headers: jsonHeaders(ip) }
  );

  const registerOk = check(registerRes, {
    'setup register status is 201': (r) => r.status === 201,
  });
  errors.add(!registerOk);
  if (!registerOk) {
    throw new Error(`Setup register failed: ${registerRes.status} ${registerRes.body}`);
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(ip) }
  );

  const loginOk = check(loginRes, {
    'setup login status is 200': (r) => r.status === 200,
    'setup login has access token': (r) => !!r.json('data.accessToken'),
  });
  errors.add(!loginOk);
  if (!loginOk) {
    throw new Error(`Setup login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const accessToken = loginRes.json('data.accessToken');
  const patientRes = http.post(
    `${BASE_URL}/patients`,
    JSON.stringify({
      fullName: `Load Test Patient ${suffix}`,
      age: 30,
      gender: 'male',
      phone: '555-0100',
    }),
    { headers: jsonHeaders(ip, accessToken) }
  );

  const patientOk = check(patientRes, {
    'setup create patient status is 201': (r) => r.status === 201,
    'setup create patient has id': (r) => !!r.json('data.id'),
  });
  errors.add(!patientOk);
  if (!patientOk) {
    throw new Error(`Setup patient create failed: ${patientRes.status} ${patientRes.body}`);
  }

  return {
    email,
    password,
    fallbackPatientId: patientRes.json('data.id'),
  };
}

export default function (setupData) {
  const flowStart = Date.now();
  const ip = randomIp();

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: setupData.email,
      password: setupData.password,
    }),
    { headers: jsonHeaders(ip) }
  );
  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => !!r.json('data.accessToken'),
  });
  errors.add(!loginOk);
  if (!loginOk) {
    sleep(1);
    return;
  }

  const token = loginRes.json('data.accessToken');

  const patientsRes = http.get(`${BASE_URL}/patients?page=1&limit=20`, {
    headers: jsonHeaders(ip, token),
  });
  fetchPatientsDuration.add(patientsRes.timings.duration);

  const patientsOk = check(patientsRes, {
    'fetch patients status is 200': (r) => r.status === 200,
    'fetch patients has list': (r) => Array.isArray(r.json('data')),
  });
  errors.add(!patientsOk);
  if (!patientsOk) {
    sleep(1);
    return;
  }

  const firstPatientId = patientsRes.json('data.0.id') || setupData.fallbackPatientId;

  const createNoteRes = http.post(
    `${BASE_URL}/notes/generate`,
    JSON.stringify({
      patientId: firstPatientId,
      rawInputText: `Load test note text for VU ${__VU}, iteration ${__ITER}.`,
    }),
    { headers: jsonHeaders(ip, token) }
  );
  createNoteDuration.add(createNoteRes.timings.duration);

  const createNoteOk = check(createNoteRes, {
    'create note status is 201': (r) => r.status === 201,
    'create note has id': (r) => !!r.json('data.id'),
  });
  errors.add(!createNoteOk);

  flowDuration.add(Date.now() - flowStart);
  if (createNoteOk) {
    flowsCompleted.add(1);
  }

  sleep(1);
}
