# Security Audit

## Security Score
Overall security score: 42/100.

The application demonstrates important security ideas, including JWT login, bcrypt password hashes, account lockout, OTP verification, admin roles, audit logs, duplicate vote checks, local biometric capture, Helmet, CORS, and route-level rate limits. Production readiness is still blocked by sensitive data persistence, simulated/placeholder verification scoring, weak ballot anonymity design, incomplete request validation, and absent automated security tests.

## Critical Findings
1. Production cryptographic secrets now fail closed when missing.
   - `JWT_SECRET`, `BACKUP_ENCRYPTION_SECRET`, `BALLOT_ENCRYPTION_SECRET`, and `VOTE_HMAC_SECRET` are environment-managed for production.
   - Remaining recommendation: move these secrets to KMS/secret manager and rotate before real deployment.

2. Default credentials are seeded and exposed in UI helper login.
   - Default admin/officer/voter passwords exist in `dbService.ts`.
   - `App.tsx` includes preset login credentials.
   - Recommendation: move demo accounts to isolated seed fixtures and disable in production.

3. Biometric and identity data are stored as base64 in JSON collections.
   - `src/db/data/profile_drafts.json` is multi-megabyte base64-rich data.
   - Users, profiles, identity documents, and face verification records can duplicate sensitive material.
   - Recommendation: store files in encrypted object storage, store hashes/templates separately, enforce retention and deletion policy.

4. Core HTTP hardening has started.
   - Helmet, CORS allowlist support, API/auth/OTP rate limits, and env validation were added.
   - Remaining recommendation: add request IDs, CSRF if cookies are adopted, and schema validation for every route.

5. Ballot secrecy is incomplete.
   - Vote records keep both `candidateId` and `anonymousVoterHash`, so encrypted ballot is not the actual only source of choice.
   - Voter hash is deterministic from user id and election id without a secret pepper.
   - Recommendation: separate voter participation ledger from ballot ledger, remove candidate from audit-related vote rows, use secret pepper/HSM, and design verifiable anonymization.

## OWASP Top 10 Review
- Broken Access Control: Medium-high risk. RBAC exists but is route-level only, public endpoints expose data broadly, and admin functions need finer permissions.
- Cryptographic Failures: High risk. Hardcoded keys, fallback secrets, local biometric storage, and weak key lifecycle.
- Injection: Medium risk. MongoDB driver is not used with raw user filters broadly, but request validation is inconsistent.
- Insecure Design: High risk. Election systems require stronger separation of identity, eligibility, ballot, and audit trails.
- Security Misconfiguration: Medium-high risk. Helmet/CORS/rate-limit are present, but demo data and high-risk config/ops endpoints still require deeper policy controls.
- Vulnerable and Outdated Components: Low known vulnerability risk. `npm audit` reported zero known vulnerabilities, but several packages are outdated.
- Identification and Authentication Failures: Medium-high risk. JWT has 1 day TTL, no refresh rotation, no issuer/audience, localStorage token storage.
- Software and Data Integrity Failures: Medium risk. No CI signing, no model integrity verification, whole JSON files can be modified.
- Security Logging and Monitoring Failures: Medium risk. Audit logs exist but are mutable local records and not tamper-evident.
- SSRF: Low current risk. No generic server-side URL fetching found.

## Authentication and Authorization
Current behavior:
- JWT bearer tokens in `Authorization` header.
- Tokens stored in browser localStorage.
- bcryptjs password hashes.
- Account lockout after 5 failed attempts for 5 minutes.
- Role middleware supports Super Administrator, Administrator, Election Officer, Verification Officer, FAQ Manager, Candidate, Voter, and related roles.

Weaknesses:
- No refresh token implementation despite `.env.example` mentioning refresh secrets.
- No token revocation list, session database, device registry, or logout invalidation.
- localStorage token storage is vulnerable to XSS token theft.
- Admin creation can set broad roles without a central permission matrix.
- Password policy is partly frontend UX and not strongly centralized.

Recommendations:
- Use httpOnly secure sameSite cookies or hardened bearer storage plus strong CSP.
- Add short-lived access tokens and rotating refresh tokens.
- Add token issuer, audience, key id, and rotation.
- Introduce permission constants and policy checks per action.
- Add MFA for all admin/operator roles.

## Face Verification Review
Observed:
- `BiometricScanner.tsx` uses local browser camera, canvas, TensorFlow.js WebGL, and `@tensorflow-models/face-landmarks-detection`.
- Local face-api.js model files are bundled under `src/model/face-api.js`.
- No source import or runtime call to Gemini, OpenAI, or another cloud AI service was found in biometric code.
- `@google/genai` and `GEMINI_API_KEY` references were removed during hardening because the biometric flow does not use cloud AI.

Weaknesses:
- Liveness appears heuristic and client-side, with fallback simulation paths.
- Server only checks image length and stored template distance in limited places.
- Face comparison in voter dashboard compares downscaled pixel images, not robust embeddings.
- Verification report scores are randomly generated in `server.ts`, which is not acceptable for real identity assurance.

Recommendations:
- Remove cloud AI SDK if unused.
- Add server-side biometric verification or integrate a certified identity provider.
- Sign biometric captures with challenge nonce, timestamp, device binding, and anti-replay checks.
- Store templates encrypted with purpose limitation, not raw images by default.
- Add liveness challenge replay detection and model integrity checks.

## Email and SMS Security
Strengths:
- SMTP and Twilio integrations exist.
- OTP cooldown logic exists.
- Dispatch logging gives operational visibility.

Weaknesses:
- OTP records are stored in local JSON and are not clearly hashed.
- No durable queue, retry policy, dead-letter queue, or delivery status reconciliation.
- Dispatch logs may expose OTP content in dashboard.
- SMS/email endpoints lack global rate limiting.

Recommendations:
- Hash OTP codes at rest and expire/delete them aggressively.
- Mask OTP values in logs.
- Add per-user, per-IP, per-channel rate limits.
- Use a job queue such as BullMQ and capture delivery callbacks.

## Security Priorities
1. Remove hardcoded keys and default production credentials.
2. Add Helmet, CORS allowlist, rate limiting, request validation, and centralized error handling.
3. Redesign ballot/identity separation.
4. Encrypt or externalize biometric/document storage.
5. Remove simulated verification scores from production paths.
6. Add security tests for auth, RBAC, duplicate voting, OTP abuse, and upload payload limits.
