# Improvement Roadmap

## Critical
- Done: Remove hardcoded JWT, backup, ballot, and HMAC keys from production runtime.
- Done: Remove seeded production credentials and preset login helpers from production runtime.
- Done: Protect `/api/system/dispatches`, `/api/dashboard/stats`, `/api/notifications`, and SecOps status endpoints.
- Done: Add Helmet, strict CORS support, and route-specific API/auth/OTP rate limiting.
- Remaining: Add centralized request validation across all routes.
- Redesign vote storage to separate voter participation from anonymous ballot choice.
- Encrypt/externalize biometric and identity document storage.
- Hash OTPs at rest and remove OTP content from logs.
- Add unique indexes for users and voting locks.
- Remove random verification scores from production behavior.

## High Priority
- Split `server.ts` into routes, controllers, services, repositories, validators, and middleware.
- Split `AdminPanel`, `CompleteProfile`, `PublicLanding`, and `BiometricScanner` into smaller feature modules.
- Add React Router and lazy route modules.
- Lazy-load TensorFlow/Recharts/motion-heavy screens.
- Add OpenAPI documentation.
- Add admin MFA and refresh token rotation.
- Add MongoDB transaction flow for vote submission.
- Add job queue for email/SMS with retries.
- Add role/permission matrix for admin actions.
- Add Dockerfile, CI pipeline, and environment validation.

## Medium Priority
- Enable stricter TypeScript.
- Add ESLint, Prettier, and import boundaries.
- Add Vitest, Supertest, Playwright, and accessibility tests.
- Add server-side pagination/filtering/sorting.
- Add reusable frontend design system components.
- Add security event dashboards and tamper-evident audit logs.
- Add formal documentation: deployment, admin manual, voter manual, database guide.
- Add image/document size checks, MIME validation, and malware scanning before object storage upload.

## Low Priority
- Add multi-language support for Nepali/English.
- Add PWA/offline read-only public result support.
- Add PDF/Excel export templates.
- Add election calendar subscription.
- Add notification preference center.
- Add analytics trend dashboards.
- Add public transparency portal for certified result publication.

## Missing Enterprise Features Checklist
Feature | Status | Recommendation
--- | --- | ---
Complete Profile Wizard | Present | Improve step validation, recovery, accessibility.
Admin Approval Workflow | Present | Add maker-checker and detailed reason capture.
Face Verification Dashboard | Partial | Add real verification metrics and review queue.
Public Election Results | Present | Add certification metadata and downloadable reports.
Election Calendar | Partial | Add calendar view and subscription/export.
Multi-language Support | Missing | Add i18n framework.
Accessibility Compliance | Partial | Add WCAG 2.2 AA testing and fixes.
Offline/PWA Support | Missing | Add PWA only for public read-only areas.
PDF/Excel/CSV Reports | Partial | CSV-like export exists; add PDF/XLSX.
Dashboard Analytics | Present | Use real aggregation and filters.
Audit Dashboard | Present | Make tamper-evident and paginated.
Activity Timeline | Present in SecOps | Persist and audit.
Session Management | Partial | Add server-side sessions/revocation.
Notification Center | Present | Add targeting, read state, preferences.
Email Templates | Partial inline strings | Move to versioned templates.
SMS Templates | Partial inline strings | Move to versioned templates.
Backup & Restore | Present prototype | Harden with runbooks and restricted access.
Monitoring Dashboard | Partial SecOps | Add real metrics and alerting.

## Prioritized Action Plan
Immediate, 0 to 2 weeks:
- Remove secrets/default credentials.
- Add security middleware and validation.
- Protect exposed system endpoints.
- Remove unused AI SDK.
- Add indexes for users and vote locks.
- Add tests for auth, vote duplicate prevention, OTP, and admin RBAC.

Short term, 2 to 8 weeks:
- Refactor backend into modules.
- Add OpenAPI and schema validation.
- Split frontend routes and lazy-load heavy modules.
- Move biometric/doc storage to encrypted object storage.
- Add CI/CD, Docker, and env validation.
- Add structured logging and monitoring.

Long term, 2 to 6 months:
- Redesign election-grade ballot secrecy.
- Add tamper-evident audit ledger.
- Add certified biometric/identity provider integration or manual review workflow.
- Add comprehensive accessibility compliance.
- Add disaster recovery drills and production SRE runbooks.
- Conduct third-party penetration test and privacy impact assessment.
