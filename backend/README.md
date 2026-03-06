# MedNote AI Backend

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run Prisma migration and generate client:

```bash
npx prisma migrate dev --name init
```

4. Start dev server:

```bash
npm run dev
```

## Tests

Set `DATABASE_URL` to a test database and run:

```bash
npm test
```

## Dockerized Tests (CI-friendly)

Run the test suite with Postgres in Docker:

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

Tear down:

```bash
docker compose -f docker-compose.test.yml down -v
```

## CI

GitHub Actions workflow:

- `.github/workflows/tests.yml`

## Render Deployment Notes

- Set `NODE_ENV=production`.
- Configure `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL` in Render environment variables.
- Use the build command: `npm install && npx prisma generate`.
- Use the start command: `npm start`.
- For migrations, run `npx prisma migrate deploy` as a one-off job or in the deploy pipeline.

## API Response Format

All successful responses:

```json
{ "success": true, "message": "optional", "data": {}, "meta": { "requestId": "uuid" } }
```

All error responses:

```json
{ "success": false, "message": "Error message", "error_code": "CODE", "errors": [], "meta": { "requestId": "uuid" } }
```

## Frontend Session Bootstrap

- Use `POST /api/auth/login` to obtain a Bearer token.
- Use `GET /api/auth/me` with `Authorization: Bearer <token>` to fetch the current user profile.
- Every response contains `X-Request-Id` header for tracing UI-reported errors in backend logs.
