# Release Gate Checklist - 6 Layer Review Process
**Effective Date**: April 20, 2026  
**Version**: 1.0  
**Purpose**: Mandatory review gates for all features before merge to main branch

---

## Overview
Every feature must pass 6 layers of review gates before being merged. Each layer has explicit checkpoints that must be verified and signed off. This ensures production stability, security, and maintainability.

---

## Layer 1: API Contract & Backward Compatibility

**Responsible**: Backend Lead  
**Checklist**:
- [ ] All API endpoints documented in OpenAPI spec (or equivalent)
- [ ] Request/response schemas are versioned (v1, v2 if breaking changes)
- [ ] Breaking changes are explicitly listed with migration path
- [ ] Deprecated endpoints have sunset timeline (minimum 2 versions)
- [ ] Query parameters and body fields match documentation
- [ ] HTTP status codes are correct (200, 201, 400, 401, 403, 404, 422, 500, etc.)
- [ ] CORS headers are correct if API is public-facing
- [ ] Rate limiting is applied to sensitive endpoints
- [ ] All error responses have error codes and localized messages
- [ ] Backward compatibility with N-1 client version verified

**Sign-off**: Backend Lead  
**Date**: ___________  
**Signature**: ___________

---

## Layer 2: Business Rule Correctness

**Responsible**: Product Manager / Business Analyst  
**Checklist**:
- [ ] Feature implements all requirements in specification
- [ ] Edge cases and boundary conditions are documented and tested
- [ ] Business logic is mathematically correct (pricing, discounts, etc.)
- [ ] Concurrent operations handled correctly (no race conditions)
- [ ] State transitions are valid (order status flow, payment lifecycle)
- [ ] Data consistency maintained across operations (idempotency)
- [ ] Audit trail captures all business-critical changes
- [ ] Rollback/compensating transaction logic exists if needed
- [ ] Customer-facing behavior matches specification
- [ ] No conflicting rules with existing business logic

**Sign-off**: Product Owner  
**Date**: ___________  
**Signature**: ___________

---

## Layer 3: Security & Permission Checks

**Responsible**: Security Engineer / Team Lead  
**Checklist**:
- [ ] Authentication required on all endpoints that need it
- [ ] Authorization checks use role-based access control (RBAC)
- [ ] SQL injection protection (parameterized queries used)
- [ ] Cross-Site Request Forgery (CSRF) tokens validated
- [ ] Input validation on all user-supplied data
- [ ] Sensitive data is never logged (passwords, tokens, PII)
- [ ] Rate limiting prevents brute force attacks
- [ ] File upload restrictions in place (type, size)
- [ ] No hardcoded secrets in code (check git history)
- [ ] External API calls use secure channels (HTTPS)
- [ ] Database credentials use environment variables
- [ ] Least privilege principle applied to database user permissions

**Sign-off**: Security Lead  
**Date**: ___________  
**Signature**: ___________

---

## Layer 4: Performance Baseline

**Responsible**: DevOps / Performance Engineer  
**Checklist**:
- [ ] Database query N+1 problems identified and fixed
- [ ] Indexes added for filtering/sorting columns
- [ ] Cache strategy in place for frequently accessed data
- [ ] Page load time meets SLA (< 3s for typical page)
- [ ] API endpoint response time < 500ms for 95th percentile
- [ ] Memory usage does not leak (verified via profiling)
- [ ] Database connection pooling configured correctly
- [ ] Bulk operations use batch processing (not row-by-row)
- [ ] No unnecessary data transferred (pagination, field filtering)
- [ ] Database query execution plan reviewed for efficiency
- [ ] CDN configured for static assets if applicable

**Sign-off**: DevOps Lead  
**Date**: ___________  
**Signature**: ___________

---

## Layer 5: Observability & Alerting

**Responsible**: Platform / Monitoring Engineer  
**Checklist**:
- [ ] Structured logging added at key decision points
- [ ] Log levels correct (DEBUG, INFO, WARN, ERROR)
- [ ] Business metrics exposed (counter, gauge, histogram)
- [ ] Distributed trace spans configured if async
- [ ] Error tracking integration works (Sentry/equivalent)
- [ ] Alert rules defined for failure scenarios
- [ ] Dashboard created for health monitoring
- [ ] SLA/SLO targets documented
- [ ] Runbook created for operational issues
- [ ] Oncall playbook references this feature
- [ ] Metrics retention policy understood

**Sign-off**: Monitoring Lead  
**Date**: ___________  
**Signature**: ___________

---

## Layer 6: Rollback Readiness

**Responsible**: Release Manager  
**Checklist**:
- [ ] Database migrations are reversible (down migration exists)
- [ ] Feature flag or dark launch ready (can be disabled)
- [ ] Canary deployment strategy defined (e.g., 5% → 25% → 100%)
- [ ] Rollback procedure documented and tested
- [ ] Rollback success criteria defined
- [ ] Dependent services can handle rollback scenario
- [ ] Data migration/cleanup plan exists if needed
- [ ] Backup taken before deployment to production
- [ ] Communication template ready for any incident
- [ ] Estimated time to rollback < 15 minutes
- [ ] Post-deployment verification checklist completed

**Sign-off**: Release Manager  
**Date**: ___________  
**Signature**: ___________

---

## Phase Testing Requirements

### After Each Feature (Unit + Integration)
- [ ] Unit tests: > 80% code coverage
- [ ] Integration tests: all happy paths + error cases
- [ ] Database: schema migration up/down tested
- [ ] API: all endpoints responding with correct status/payload

### After Each Phase (Regression)
- [ ] Full user journey (login → browse → add cart → checkout → order tracking)
- [ ] Admin operations (CRUD all resources, filters, exports)
- [ ] Payment methods: COD, VNPay, MoMo
- [ ] Promotions: vouchers apply, reject reasons shown, no conflicts
- [ ] Shipping: address validation, store selection, fee calculation
- [ ] Notifications: email/in-app delivered for order status changes
- [ ] Performance: page load time within SLA
- [ ] Security: no sensitive data in logs, auth enforced

### Post-Release Verification (24-48h)
- [ ] Error rate normal
- [ ] Response time normal
- [ ] Database growth normal
- [ ] No customer complaints on support channel
- [ ] Metrics match expected baseline
- [ ] Log analysis for any anomalies

---

## Approval Workflow

```
Feature Branch
    ↓ (Developer submits PR)
Code Review (1-2 reviewers)
    ↓ (approved)
Layer 1: API Contract (Backend Lead) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
Layer 2: Business Rules (PM) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
Layer 3: Security (Security Lead) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
Layer 4: Performance (DevOps) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
Layer 5: Observability (Monitoring) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
Layer 6: Rollback Ready (Release Manager) → ✓ or ✗ (fix and resubmit)
    ↓ (approved)
MERGE TO MAIN
    ↓
Staging Deployment + Regression Testing
    ↓ (all pass)
Production Deployment (Canary: 5% → 25% → 100%)
    ↓
Post-Release Monitoring (24-48h)
```

---

## Escalation & Exception Process

**If a checkpoint is not applicable** to your feature:
- Document why in the checklist (e.g., "No new API endpoint")
- Get explicit sign-off from the layer lead (initial or email)

**If a checkpoint cannot be met before merge**:
- Create a follow-up issue with target date
- Risk assessment: why is it safe to deploy without this checkpoint?
- Get approval from 2+ layer leads + tech lead
- Document exception in release notes

**If issues found post-release**:
- Initiate rollback within 15 minutes
- Root cause analysis within 4 hours
- Prevent-fix + test before redeployment
- Post-mortem within 2 business days

---

## Audit Trail
Use this section to record all gate reviews for traceability.

| Feature | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 | Layer 6 | Merge Date | Deploy Date |
|---------|---------|---------|---------|---------|---------|---------|------------|-------------|
| Voucher Audit Backend | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-04-20 | 2026-04-20 |
| Voucher Outcome Breakdown | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-04-20 | 2026-04-20 |
| ... | | | | | | | | |

---

## Contact & Questions
- **Architecture**: architecture-team@novax.local
- **Security**: security@novax.local
- **DevOps**: devops@novax.local
- **Product**: product@novax.local

---

**Last Updated**: April 20, 2026  
**Next Review**: April 30, 2026
