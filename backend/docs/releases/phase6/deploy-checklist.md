# Phase 6 Deploy Checklist

Date: 2026-04-20
Scope: Gateway hardening (RBAC, rate limit, idempotency, runtime observability)

## Pre-Deploy
- [ ] Confirm database env variables are set in runtime environment.
- [ ] Confirm all backend services are running on expected ports.
- [ ] Confirm latest migrations are applied.
- [ ] Confirm API gateway build/start is healthy.

## Runtime Health Checks
- [ ] GET /api/v1/health returns healthy payload.
- [ ] GET /api/v1/health/dependencies returns status=healthy (or expected degraded with reason).
- [ ] GET /api/v1/admin/runtime/limits is accessible with admin token.

## Security/RBAC Checks
- [ ] Customer token gets 403 on admin analytics.
- [ ] Admin token can access admin analytics and runtime limits.

## Rate Limit Checks
- [ ] Login endpoint emits headers:
  - x-ratelimit-limit
  - x-ratelimit-remaining
  - x-ratelimit-reset-at
- [ ] Repeated invalid login attempts eventually return 429.

## Idempotency Checks
- [ ] Same Idempotency-Key + same payload returns replay response.
- [ ] Same Idempotency-Key + different payload returns 400.

## Smoke Gate
- [ ] Run scripts/smoke-test.ps1 once, result pass=33 fail=0.
- [ ] Run scripts/smoke-test.ps1 again, result pass=33 fail=0.

## Rollout
- [ ] Deploy via canary.
- [ ] Monitor 429 rate, auth errors, and gateway 5xx for 30-60 minutes.
- [ ] If stable, complete rollout.

## Rollback Criteria
- [ ] Sustained gateway 5xx increase.
- [ ] Widespread auth/login failures.
- [ ] Repeated admin path failures.

## Rollback Action
- [ ] Revert to previous gateway artifact/config.
- [ ] Restart gateway service.
- [ ] Re-run smoke test and critical login/order path checks.
