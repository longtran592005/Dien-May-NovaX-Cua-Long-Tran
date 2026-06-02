# PostgreSQL Cutover Runbook

This runbook describes a safe SQLite to PostgreSQL cutover for NovaX backend services.

## Targets
- RTO: <= 15 minutes
- RPO: <= 5 minutes
- Environment: staging rehearsal first, production second

## Preconditions
- [ ] PostgreSQL instance reachable and sized for expected workload.
- [ ] DATABASE_URL points to PostgreSQL with schema=novax.
- [ ] Current code deployed to all backend services.
- [ ] Release owner, rollback owner, and on-call engineer assigned.

## Tools
- SQLite backup: npm run db:backup:sqlite
- PostgreSQL env validation: npm run db:check:postgres-env
- Migration: npm run prisma:migrate:pg
- Prisma client generation: npm run prisma:generate
- Seed baseline data: npm run prisma:seed
- Smoke test: ./scripts/smoke-test.ps1

## Rehearsal Steps (Staging)
1. Freeze write operations to avoid data drift during rehearsal.
2. Run SQLite backup and confirm backup file is created.
3. Export DATABASE_URL for PostgreSQL in backend shell.
4. Run PostgreSQL environment check.
5. Apply migrations and generate Prisma client.
6. Run seed if required for baseline accounts/products.
7. Start backend services and verify /health for all services.
8. Run smoke test and verify 100 percent pass.
9. Execute one end-to-end order flow and one admin audit flow.
10. Record total cutover time and any deviations.

## Production Cutover Steps
1. Announce maintenance window and freeze writes.
2. Run final SQLite backup and verify backup size > 0.
3. Switch DATABASE_URL to PostgreSQL in deployment config.
4. Apply migrations on production database.
5. Roll services in this order:
   - auth-service
   - catalog-service
   - cart-service
   - order-service
   - payment-service
   - api-gateway
6. Run smoke test from gateway entrypoint.
7. Validate critical user journeys:
   - login
   - browse products
   - create order
   - payment method flow
   - admin order audit
8. Lift maintenance window when all checks pass.

## Rollback Procedure
1. Re-enable previous deployment artifact (last-known-good).
2. Restore SQLite backup if data divergence must be reverted.
3. Re-point DATABASE_URL back to previous stable target.
4. Restart services in normal dependency order.
5. Run smoke test and targeted checkout/admin tests.
6. Publish incident summary with root cause and next actions.

## Validation Checklist
- [ ] All services healthy.
- [ ] Smoke test pass 100 percent.
- [ ] API error rate normalized.
- [ ] P95 latency within baseline.
- [ ] No unexpected migration drift.

## Rehearsal Report Template
- Date/time:
- Duration:
- RTO achieved:
- RPO achieved:
- Issues found:
- Rollback tested: yes/no
- Owner sign-off:
