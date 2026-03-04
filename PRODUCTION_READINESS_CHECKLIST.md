# MedNoteAI Production Readiness Checklist (Phased)

Use this plan in order. Do not move to the next phase until the current phase gate is fully green.

## Phase 1: Safe MVP Launch (Now)

### Backend safety baseline
- [ ] Set strong secrets and production env vars (`JWT_SECRET`, `DATABASE_URL`, `AI_API_KEY`, `NODE_ENV=production`)
- [ ] Set `CORS_ORIGIN` to exact frontend domain(s), never `*` in production
- [ ] Set `ENABLE_SWAGGER=false` in production unless API docs must be public
- [ ] Set `TRUST_PROXY` correctly for your hosting setup (usually `1` behind one proxy)
- [ ] Confirm rate limiting works for `/api/auth/login`, `/api/auth/register`, and `/api/auth/refresh`
- [ ] Confirm backend health endpoint `/health` remains available under load

### Frontend auth/session baseline
- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Confirm login persists across page refresh (`/auth/me` succeeds after reload)
- [ ] Confirm expired access token triggers refresh and user remains logged in
- [ ] Confirm invalid refresh token logs user out and redirects to `/login`

### Release gate (must pass)
- [ ] Frontend production build passes (`npm run build`)
- [ ] Backend tests pass in CI with a reachable test database
- [ ] Manual smoke test: register, login, create patient, create note, logout
- [ ] Error responses include `X-Request-Id` for traceability

## Phase 2: Reliability & Observability

### Monitoring
- [ ] Add centralized error tracking (Sentry or equivalent) for frontend and backend
- [ ] Add uptime checks on `/health`
- [ ] Add structured dashboards for 5xx, latency, and 429 rate limit spikes

### Data safety
- [ ] Enable daily database backups and restore test drills
- [ ] Add migration rollback strategy and migration runbook
- [ ] Add environment-specific Prisma migration workflow (`migrate deploy` in prod)

### Release gate (must pass)
- [ ] Alerting is configured and tested with a synthetic failure
- [ ] Backup restore test completed successfully
- [ ] P95 latency and error budgets defined

## Phase 3: Scale & Hardening

### Security hardening
- [ ] Add refresh token rotation and server-side token revocation list
- [ ] Add account lockout/step-up controls for repeated failed auth attempts
- [ ] Add audit trail for security-sensitive actions (auth, note export, settings)
- [ ] Add dependency and container vulnerability scanning in CI

### Performance and scale
- [ ] Add Redis for rate limit storage and hot-path caching
- [ ] Add background queues for heavy AI/note generation tasks
- [ ] Add CDN and static asset caching policy
- [ ] Add DB indexing review from real production query metrics

### Release gate (must pass)
- [ ] Load test at target concurrency with stable latency and low error rate
- [ ] No critical/high vulnerabilities open in dependency scan
- [ ] Incident response runbook tested with one game day

## Non-negotiable loophole checks (every release)

- [ ] No secrets in frontend bundle or git history
- [ ] No wildcard CORS in production
- [ ] No unauthenticated access to protected routes
- [ ] No stack traces exposed to end users in production
- [ ] No public debug endpoints enabled by accident
- [ ] No deploy without DB backup verification

## Current Status Snapshot (March 4, 2026)

Implemented in code this session:
- Backend: configurable trust proxy (`TRUST_PROXY`)
- Backend: optional Swagger exposure (`ENABLE_SWAGGER`)
- Backend: stricter CORS allowlist enforcement
- Backend: improved 429 payload includes request metadata
- Backend: stricter JWT verification in auth middleware
- Frontend: API default base URL aligned to backend port 4000
- Frontend: session restore now rehydrates API auth token before `/auth/me`
- Frontend: auth register request typing corrected (`clinicName` required)

Still required before real user launch:
- Backend tests with live test database (currently failing locally due to DB unavailable)
- CI/CD release gates and monitoring setup
