# NovaX Review Gate Checklist

Use this checklist before promoting a backend change from dev to staging or from staging to production.

## Gate 1: API Contract
- [ ] OpenAPI or endpoint contract updated for new/changed fields.
- [ ] Request/response examples validated against real service output.
- [ ] Backward compatibility reviewed for existing frontend clients.
- [ ] Pagination/filter/sort behavior documented and deterministic.

## Gate 2: Business Rules
- [ ] Primary business flow verified with happy-path tests.
- [ ] Edge cases validated (empty inputs, boundary values, invalid state transitions).
- [ ] Monetary calculations verified (rounding, totals, discounts, taxes).
- [ ] Idempotency rules verified for write APIs.

## Gate 3: Security
- [ ] Authentication enforced for protected endpoints.
- [ ] Authorization checked for role-specific resources.
- [ ] Input validation present and tested for malformed payloads.
- [ ] Sensitive data is not leaked in responses or logs.

## Gate 4: Performance
- [ ] Query plan reviewed for heavy endpoints.
- [ ] Endpoint P95 latency measured on staging-like data.
- [ ] Load test run for critical paths (checkout/order/payment/admin).
- [ ] Connection pool limits verified for expected concurrency.

## Gate 5: Observability
- [ ] Structured logs include correlation id and key business identifiers.
- [ ] Error metrics and rate alerts configured for changed services.
- [ ] Health checks and dependency checks return reliable status.
- [ ] Dashboard panel added or updated for this release.

## Gate 6: Rollback
- [ ] Rollback steps documented with owner and target time.
- [ ] Database rollback strategy validated (forward-fix or restore path).
- [ ] Last-known-good artifact identified and accessible.
- [ ] Smoke test script selected for post-rollback validation.

## Release Readiness Sign-off
- [ ] Engineering owner approved.
- [ ] QA owner approved.
- [ ] Product owner approved.
- [ ] On-call owner aware of release window.

## Evidence
Attach links to:
- Test report
- Migration logs
- Smoke test output
- Dashboard snapshot
- Rollback rehearsal output
