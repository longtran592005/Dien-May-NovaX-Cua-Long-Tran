# Phase 6 Merge Commands (Non-Interactive)

## 1) Inspect changes
```powershell
cd "d:/1_Tran Van Long/NCKH/Dien-May-NovaX-Cua-Long-Tran"
git status --short
```

## 2) Stage targeted files
```powershell
git add backend/apps/api-gateway/src/gateway.controller.ts
git add scripts/smoke-test.ps1
git add backend/docs/releases/phase6/release-ready.md
git add backend/docs/releases/phase6/deploy-checklist.md
git add backend/docs/releases/phase6/merge-commands.md
git add backend/docs/releases/phase6/go-no-go.md
```

## 3) Commit
```powershell
git commit -m "feat(gateway): harden phase6 with rbac throttling, idempotency guard, runtime metrics, and smoke coverage"
```

## 4) Push
```powershell
git push origin <your-branch>
```

## 5) PR checklist summary
- Two consecutive smoke runs: pass=33 fail=0
- Added runtime limits endpoint for admin
- Added rate-limit telemetry headers
- Added idempotency mismatch negative test
