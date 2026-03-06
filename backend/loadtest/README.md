# k6 Load Test (MedNoteAI)

## What This Script Tests

- 100 concurrent virtual users (default)
- Flow per user iteration:
  1. `POST /api/auth/login`
  2. `GET /api/patients`
  3. `POST /api/notes/generate`

## Metrics Captured

- Latency:
  - `http_req_duration`
  - `login_duration`
  - `fetch_patients_duration`
  - `create_note_duration`
  - `flow_duration`
- Error rate:
  - `http_req_failed`
  - custom `errors`
- Throughput:
  - built-in `http_reqs`
  - custom `flows_completed`

## Threshold Targets

- Median API latency target: `http_req_duration p(50) < 300ms`
- Additional safeguards:
  - `http_req_failed rate < 5%`
  - `errors rate < 5%`

## Prerequisites

1. Backend running (default expected base URL: `http://localhost:4000/api`).
2. Database and AI dependencies configured.
3. k6 installed:

```bash
sudo gpg -k
sudo apt-get update
sudo apt-get install -y gnupg ca-certificates
curl -s https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install -y k6
```

## Run

From `backend/`:

```bash
k6 run loadtest/mednote-loadtest.js
```

Optional overrides:

```bash
BASE_URL="http://localhost:4000/api" VUS=100 DURATION=2m k6 run loadtest/mednote-loadtest.js
```

## Notes

- Script bootstraps one clinic user and one patient in `setup()`.
- It sends varying `X-Forwarded-For` values to reduce auth limiter bottlenecks during login-heavy load tests.
- If login requests are still throttled (`429`), temporarily adjust auth rate limits in test/staging.
