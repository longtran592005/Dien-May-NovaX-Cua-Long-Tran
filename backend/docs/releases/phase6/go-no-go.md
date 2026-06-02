# Phase 6 Go/No-Go (Quick Close)

Date: 2026-04-21
Decision: GO

## Evidence Snapshot
- Consecutive smoke runs: 2/2 green
- Smoke result each run: pass=33 fail=0
- Dependencies probe: healthy
- Runtime limits endpoint: reachable with admin token
- Login probe response headers:
  - x-ratelimit-limit=10
  - x-ratelimit-remaining=9
  - x-ratelimit-reset-at=<valid-iso>

## Scope Closed in This Batch
- Gateway RBAC hardening + admin mutation throttling
- Rate-limit telemetry headers for login/search/suggestions
- Idempotency replay + mismatch guard + cache hygiene
- Runtime observability endpoint for in-memory limiter/idempotency stats
- Expanded smoke coverage (negative and throttle checks)

## Exact Files for Staging
- backend/apps/api-gateway/src/gateway.controller.ts
- scripts/smoke-test.ps1
- backend/docs/releases/phase6/release-ready.md
- backend/docs/releases/phase6/deploy-checklist.md
- backend/docs/releases/phase6/merge-commands.md
- backend/docs/releases/phase6/go-no-go.md

## Fast Path Commands
```powershell
cd "d:/1_Tran Van Long/NCKH/Dien-May-NovaX-Cua-Long-Tran"

git add backend/apps/api-gateway/src/gateway.controller.ts

git add scripts/smoke-test.ps1

git add backend/docs/releases/phase6/release-ready.md

git add backend/docs/releases/phase6/deploy-checklist.md

git add backend/docs/releases/phase6/merge-commands.md

git add backend/docs/releases/phase6/go-no-go.md

git commit -m "feat(gateway): phase6 hardening (rbac throttle, idempotency guard, runtime metrics, smoke 33/33)"

git push origin <your-branch>
```

## Post-Merge Watch (30-60 min)
- Gateway 5xx rate
- Login 401/429 ratio
- Admin mutation 429 spikes
- Idempotency mismatch 400 count
