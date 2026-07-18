# API Documentation and Review

## API Summary
The backend exposes REST-style JSON endpoints from `server.ts`. Routes are not versioned and do not have an OpenAPI specification. Authentication uses bearer JWT for protected endpoints. Validation is implemented inline per route and is inconsistent.

## Endpoint Inventory
Method | Path | Auth | Purpose | Review
--- | --- | --- | --- | ---
GET | `/api/system/dispatches` | No | View email/SMS dispatch log | Should be admin-only because it can expose sensitive messages.
POST | `/api/system/dispatches/clear` | No | Clear dispatch log | Should be admin-only and audited.
GET | `/api/public/stats` | No | Public metrics | OK, but avoid fallback inflated demo numbers in production.
POST | `/api/auth/send-email-code` | No | Registration email OTP | Add rate limit and hash OTP.
POST | `/api/auth/verify-email-code` | No | Verify email OTP | Add attempt limits.
POST | `/api/auth/send-sms-otp` | No | Registration SMS OTP | Add per-IP and per-mobile rate limits.
POST | `/api/auth/verify-sms-otp` | No | Verify SMS OTP | Add attempt limits.
POST | `/api/auth/register` | No | Register voter/candidate | Server should require verified OTP state, not only client flow.
POST | `/api/auth/login` | No | Login | Add MFA for admin roles and token metadata.
GET | `/api/auth/me` | JWT | Current user | Good basic endpoint.
GET | `/api/profile/my-profile` | JWT | Current profile | Good, but sensitive fields need minimization.
GET | `/api/profile/draft` | JWT | Profile draft | Add size limits and expiry.
POST | `/api/profile/draft` | JWT | Save profile draft | Validate schema and file sizes.
POST | `/api/fingerprint/validate` | JWT | Fingerprint duplicate/match check | Current hash method is image-hash based, not biometric-grade.
POST | `/api/profile/complete` | JWT | Complete voter profile | Very large body, needs multipart/object storage and validation.
POST | `/api/auth/otp/send` | No | Generic OTP | Rate-limit and scope by purpose.
POST | `/api/auth/otp/verify` | No | Generic OTP verify | Add attempt counters.
POST | `/api/auth/forgot-password` | No | Send reset OTP | Avoid user enumeration, rate-limit.
POST | `/api/auth/reset-password` | No | Reset password | Hash OTP and enforce password policy server-side.
GET | `/api/elections` | No | List elections | Add pagination/filtering and public/admin field separation.
POST | `/api/elections` | Admin roles | Create election | Validate dates/status transitions.
PUT | `/api/elections/:id` | Admin roles | Update election | Enforce lifecycle state machine.
DELETE | `/api/elections/:id` | Admin roles | Delete election | Prevent delete after votes exist.
GET | `/api/candidates` | No | List candidates | Public exposure should filter unpublished fields.
GET | `/api/candidates/profile/me` | Candidate/admin | Candidate profile | OK.
POST | `/api/candidates/profile/me` | Candidate/admin | Upsert candidate profile | Validate election and party.
PUT | `/api/candidates/:id/verify` | Admin/officer roles | Verify candidate | Audit and require reason.
POST | `/api/candidates` | Admin/officer roles | Create candidate | Validate uniqueness and election status.
PUT | `/api/candidates/:id` | Admin/officer roles | Update candidate | Validate status transitions.
DELETE | `/api/candidates/:id` | Admin roles | Delete candidate | Prevent delete after ballot availability.
GET | `/api/parties` | No | List parties | OK for public data.
POST | `/api/parties` | Admin/officer roles | Create party | Validate uniqueness.
PUT | `/api/parties/:id` | Admin/officer roles | Update party | Validate fields.
DELETE | `/api/parties/:id` | Admin roles | Delete party | Block if candidates use party.
POST | `/api/vote` | JWT | Cast vote | Needs transaction, stronger biometrics, ballot secrecy redesign.
GET | `/api/users/voting-status` | JWT | Voter election status | OK, avoid leaking excess details.
GET | `/api/dashboard/stats` | No | Dashboard stats | Should be admin-only or return public-safe aggregate only.
GET | `/api/notifications` | No | Notifications | Should filter by role/user.
POST | `/api/notifications` | Admin roles | Create notification | OK with validation.
GET | `/api/audit-logs` | Admin roles | Audit logs | Add pagination and immutable backend.
GET | `/api/faqs` | Conditional | FAQ list | Public/admin mixed behavior should be split.
POST | `/api/faqs` | FAQ/admin roles | Create FAQ | OK with validation.
PUT | `/api/faqs/:id` | FAQ/admin roles | Update FAQ | OK with validation.
DELETE | `/api/faqs/:id` | FAQ/admin roles | Delete FAQ | OK.
POST | `/api/faqs/bulk` | FAQ/admin roles | Bulk action | Validate allowed actions.
POST | `/api/faqs/sort` | FAQ/admin roles | Sort FAQs | OK.
GET | `/api/admin/team` | Admin roles | List team | Should hide sensitive fields.
POST | `/api/admin/team` | Admin roles | Create admin | Super admin should approve high privilege roles.
PUT | `/api/admin/team/:id` | Admin roles | Update admin | Add self-demotion/lockout protections.
DELETE | `/api/admin/team/:id` | Admin roles | Delete admin | Prefer deactivate over delete.
GET | `/api/voters` | Admin/officer roles | List voters | Add pagination and search server-side.
GET | `/api/voters/:id/profile` | Admin/officer roles | Voter dossier | Highly sensitive; add purpose logging and finer RBAC.
PUT | `/api/voters/:id` | Admin/officer roles | Approve/reject/suspend voter | Add reason and dual-control for high-risk actions.
POST | `/api/voters/resubmit` | JWT | Voter correction resubmit | Ensure only own record can be changed.
POST | `/api/profile/reset` | JWT | Reset profile | Dangerous; add stronger confirmation and audit.
PUT | `/api/voter/profile` | JWT | Edit voter profile | Add field-level validation.
GET | `/api/results/published-details` | No | Public published results | Good, but verify publication gating.
GET | `/api/elections/:id/results` | No | Election result details | Good public endpoint with publication check.
GET | `/api/system/config` | Admin roles | Config status | Do not expose secrets, even masked, beyond super admin.
POST | `/api/system/config` | Admin roles | Save SMTP/Twilio config | Should be super admin-only and use secrets manager.
POST | `/api/system/backup` | Super admin | Backup collections | OK for prototype; production needs secure backup jobs.
POST | `/api/system/restore` | Super admin | Restore collections | High-risk; require offline approval.
GET | `/api/secops/db-status` | JWT | DB status | Should require admin/operator role.
POST | `/api/secops/reconnect` | Admin roles | DB reconnect | OK.
POST | `/api/secops/force-failover` | Admin roles | Toggle failover | Super admin-only recommended.
POST | `/api/secops/clear-queue` | Admin roles | Clear sync queue | Super admin-only recommended.
POST | `/api/secops/backup` | Admin roles | Encrypted backup | Super admin-only recommended.
POST | `/api/secops/restore` | Admin roles | Restore backup | Super admin-only recommended.
POST | `/api/secops/integrity-check` | Admin roles | Integrity check | OK, expand cryptographic verification.

## API Design Recommendations
- Add `/api/v1` version prefix.
- Generate OpenAPI from route schemas.
- Use a standard error envelope: `{ code, message, details, requestId }`.
- Add request validation with Zod, Valibot, or express-validator.
- Add pagination, filtering, sorting, and field selection to list endpoints.
- Split public and admin endpoints instead of conditional response shape.
- Add idempotency keys for vote submission and notification/backup operations.
- Add centralized error handling and request correlation IDs.
- Add response DTOs to avoid returning internal user/profile records.
