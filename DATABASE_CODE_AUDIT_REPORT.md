# VoTex Election – Database and Codebase Audit Report

## Executive Summary

- Overall database health score: 72/100
- Overall code quality score: 68/100
- Technical debt estimate: Medium-High (roughly 6–8 person-weeks of cleanup and hardening)
- Findings by severity:
  - Critical: 1
  - High: 3
  - Medium: 5
  - Low: 2

### Audit scope

This review was performed as read-only analysis only. No schema, code, or data were modified.

### What was audited

- Persistence model and schema definitions in [src/db/schema.ts](src/db/schema.ts) and [src/db/dbService.ts](src/db/dbService.ts)
- API and service usage paths in [server.ts](server.ts)
- Frontend consumers in [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx) and [src/components/AdminPanel.tsx](src/components/AdminPanel.tsx)
- Supporting modules such as [routes/profiles.js](routes/profiles.js) and [services/faceVerification.service.ts](services/faceVerification.service.ts)

---

## Evidence Method

Each finding below is grounded in one or more of the following:

- Schema definitions in [src/db/schema.ts](src/db/schema.ts)
- Runtime persistence and index logic in [src/db/dbService.ts](src/db/dbService.ts)
- API handlers in [server.ts](server.ts)
- Frontend consumers in [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx), [src/components/AdminPanel.tsx](src/components/AdminPanel.tsx), and [src/components/CompleteProfile.tsx](src/components/CompleteProfile.tsx)
- Type-check output from `npm run lint`

Where the repository did not expose enough evidence to prove the runtime behavior of a live database, the finding is marked as “Needs Verification.”

---

## Findings with Evidence

### F001 – No enforced relationship integrity across collections
- Severity: Critical
- Collection/Table name: users, user_profiles, identity_documents, face_verifications, candidates, votes
- Related collections: users ↔ user_profiles; users ↔ identity_documents; users ↔ face_verifications; elections ↔ candidates; elections ↔ votes; candidates ↔ votes
- Description: The persistence design relies on application-side ID matching rather than database-enforced relationships.
- Why this is a problem: Orphaned or inconsistent records can be created and remain undetected until runtime validation fails.
- Evidence from the codebase:
  - [server.ts](server.ts) manually resolves related documents by `userId`, `electionId`, and `candidateId` in authentication, voting, and results routes.
  - [src/db/dbService.ts](src/db/dbService.ts) uses collection-specific accessors and custom indexes, but there are no relationship declarations or foreign-key enforcement helpers.
  - [server.ts](server.ts) validates candidate-to-election and user-to-profile associations in route handlers rather than at the data layer.
- Evidence from the database schema:
  - [src/db/schema.ts](src/db/schema.ts) documents fields such as `userId`, `electionId`, and `candidateId`, but the schema contains no relation metadata or constraint definitions.
- Confidence: High
- Recommended fix: Introduce a canonical domain model and enforce relationships at the persistence boundary, with validation before writes.
- Estimated impact: High
- Risk if left unchanged: Invalid or orphaned records can accumulate and produce inconsistent reports, approvals, and votes.

### F002 – Overlapping voter profile data across multiple collections
- Severity: High
- Collection/Table name: users, user_profiles, identity_documents
- Related collections: users ↔ user_profiles; users ↔ identity_documents
- Description: Core identity values are duplicated across the main user record and the profile/document collections.
- Why this is a problem: The same person’s data can diverge across collections when updates are made through different flows.
- Evidence from the codebase:
  - [server.ts](server.ts) updates the user record and the profile collection separately in registration, resubmission, and profile reset handlers.
  - [src/db/dbService.ts](src/db/dbService.ts) defines overlapping fields such as `dob`, `gender`, `nationalID`, `citizenshipNumber`, and `fingerprintImage` in different interfaces.
  - [src/components/CompleteProfile.tsx](src/components/CompleteProfile.tsx) and [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx) rely on profile-related API endpoints rather than a single normalized shape.
- Evidence from the database schema:
  - [src/db/schema.ts](src/db/schema.ts) includes `users.fullName`, `users.email`, `users.mobile`, `users.dob`, `users.gender`, `users.nationalID`, and also `user_profiles.dob`, `user_profiles.gender`, `user_profiles.permanentAddress`, `user_profiles.citizenshipNumber`.
- Confidence: High
- Recommended fix: Choose a single source of truth for core identity fields and consolidate updates into one write path.
- Estimated impact: High
- Risk if left unchanged: User onboarding, verification, and admin review can become inconsistent and harder to audit.

### F003 – Schema registry drift and undocumented runtime collections
- Severity: High
- Collection/Table name: user_preferences
- Related collections: users, config
- Description: The runtime persistence layer uses a collection that is not declared in the schema registry.
- Why this is a problem: The documented schema can drift away from the actual implementation and mislead future changes.
- Evidence from the codebase:
  - [src/db/dbService.ts](src/db/dbService.ts) includes `getUserPreferences()` and `saveUserPreferences()` and syncs a collection named `user_preferences`.
  - [src/db/schema.ts](src/db/schema.ts) does not define `user_preferences` in `databaseSchema`.
- Evidence from the database schema:
  - The schema registry in [src/db/schema.ts](src/db/schema.ts) omits `user_preferences` even though the service writes to it.
- Confidence: High
- Recommended fix: Add the missing collection to the schema registry and keep runtime and documentation in sync.
- Estimated impact: Medium
- Risk if left unchanged: Future schema changes may break the runtime persistence layer or create undocumented behavior.

### F004 – Mixed naming conventions across profile-related collections
- Severity: Medium
- Collection/Table name: profile_drafts
- Related collections: user_profiles, users
- Description: The draft collection uses snake_case field names while the rest of the system uses camelCase.
- Why this is a problem: It increases code complexity and forces extra mapping logic for every read/write path.
- Evidence from the codebase:
  - [src/db/dbService.ts](src/db/dbService.ts) defines the `ProfileDraft` interface with fields such as `draft_status`, `current_step`, `last_saved_at`, and `updated_at`.
  - [server.ts](server.ts) reads and writes these fields when saving and restoring draft state.
- Evidence from the database schema:
  - [src/db/schema.ts](src/db/schema.ts) lists `draft_status`, `current_step`, `last_saved_at`, `updated_at`, and `created_at` for `profile_drafts`.
- Confidence: High
- Recommended fix: Standardize field naming to camelCase across the schema and model definitions.
- Estimated impact: Medium
- Risk if left unchanged: New developers will spend more time translating field names, and future integrations will be error-prone.

### F005 – Performance risk from repeated full-collection scans in analytics endpoints
- Severity: Medium
- Collection/Table name: votes, candidates, elections, users
- Related collections: votes ↔ candidates; votes ↔ elections; users ↔ user_profiles
- Description: Several report and dashboard endpoints repeatedly scan the in-memory collection data to compute tallies and turnout.
- Why this is a problem: The runtime complexity grows as data volume increases, and the current index strategy does not cover all analytics read patterns.
- Evidence from the codebase:
  - [server.ts](server.ts) computes counts in `/api/dashboard/stats`, `/api/results/published-details`, and `/api/elections/:id/results` by iterating over `votes`, `candidates`, and `users`.
  - The data layer in [src/db/dbService.ts](src/db/dbService.ts) creates indexes for uniqueness and some filters, but the analytics read paths remain largely unoptimized.
- Evidence from the database schema:
  - [src/db/schema.ts](src/db/schema.ts) defines indexes only for collection-level identifiers and a few broad fields; the schema does not define indexes for common analytics filters such as `votes.candidateId` or `votes.electionId`.
- Confidence: Medium
- Recommended fix: Add targeted indexes and move aggregation logic into a service layer or query helper.
- Estimated impact: Medium-High
- Risk if left unchanged: Report endpoints will degrade as vote volume grows.

### F006 – Legacy profile route file is disconnected from the active runtime
- Severity: Medium
- Collection/Table name: None directly; profile-related state
- Related collections: users, user_profiles
- Description: A dedicated profile route file exists but is not imported by the runtime server.
- Why this is a problem: The application now has multiple ways to handle the same profile logic, which increases drift and maintenance risk.
- Evidence from the codebase:
  - [routes/profiles.js](routes/profiles.js) exists but is not referenced by [server.ts](server.ts).
  - The runtime behavior is implemented inline in [server.ts](server.ts) instead.
- Evidence from the database schema:
  - The schema in [src/db/schema.ts](src/db/schema.ts) defines the profile-related collections, but the inactive route file does not appear to add or change schema definitions.
- Confidence: Medium
- Recommended fix: Either remove the unused route file or integrate it with the active server entrypoint after verification.
- Estimated impact: Low-Medium
- Risk if left unchanged: Future changes may be applied in the wrong place and create duplicate behavior.

### F007 – TypeScript/build errors reduce confidence in the current codebase health
- Severity: High
- Collection/Table name: None directly
- Related collections: None directly
- Description: The existing TypeScript check is failing and therefore the current state is not fully build-safe.
- Why this is a problem: Build and static analysis confidence is reduced, which increases the risk of regressions in complex data flows.
- Evidence from the codebase:
  - Running `npm run lint` reported errors in [src/components/BiometricScanner.tsx](src/components/BiometricScanner.tsx) and [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx).
  - The reported errors relate to an interval timer type mismatch and duplicate `ThemeMode` imports.
- Evidence from the database schema:
  - No schema-level evidence was found for this issue; it is a code quality finding rather than a schema issue.
- Confidence: High
- Recommended fix: Resolve the TypeScript errors and keep the project on a clean lint/build path.
- Estimated impact: Medium
- Risk if left unchanged: UI and integration regressions will become harder to detect and fix.

### F008 – Backup/restore logic appears mismatched with the current persistence strategy
- Severity: Low
- Collection/Table name: config, users, votes, elections, candidates
- Related collections: users, elections, candidates, votes, config
- Description: The app still exposes backup/restore endpoints and file-based backup logic, while the runtime persistence layer is currently MongoDB-first.
- Why this is a problem: The operational model is split between a live database and legacy file-based concepts, which can confuse support and recovery work.
- Evidence from the codebase:
  - [server.ts](server.ts) still exposes `/api/system/backup` and `/api/system/restore` and uses file system paths under [src/db/data](src/db/data).
  - [src/db/dbService.ts](src/db/dbService.ts) explicitly states MongoDB-only mode and disables local JSON fallback writes.
- Evidence from the database schema:
  - The schema in [src/db/schema.ts](src/db/schema.ts) documents logical collections but does not define a backup or restore mechanism.
- Confidence: Medium
- Recommended fix: Clarify the supported backup strategy and align API behavior with the active storage model.
- Estimated impact: Low-Medium
- Risk if left unchanged: Recovery workflows may be inconsistent or misconfigured in operations.

---

## Collection Usage Matrix

| Collection | Read | Write | Update | Delete | Referenced By | Confidence |
|---|---|---|---|---|---|---|
| users | Yes | Yes | Yes | Yes | Auth routes, voter management, admin team APIs, profile reset flows in [server.ts](server.ts) | High |
| user_profiles | Yes | Yes | Yes | Yes | Profile loading, resubmission, and voter profile APIs in [server.ts](server.ts) | High |
| identity_documents | Yes | Yes | Yes | Yes | Voter profile and document review endpoints in [server.ts](server.ts) | High |
| face_verifications | Yes | Yes | Yes | Yes | Face verification and reset flows in [server.ts](server.ts) and [services/faceVerification.service.ts](services/faceVerification.service.ts) | Medium |
| elections | Yes | Yes | Yes | Yes | Election CRUD and results endpoints in [server.ts](server.ts) | High |
| candidates | Yes | Yes | Yes | Yes | Candidate CRUD, verification, and result endpoints in [server.ts](server.ts) | High |
| political_parties | Yes | Yes | Yes | Yes | Party management endpoints in [server.ts](server.ts) | High |
| votes | Yes | Yes | Yes | No | Voting, results, dashboard stats, and integrity endpoints in [server.ts](server.ts) | High |
| audit_logs | Yes | Yes | No | No | Admin audit and system logging routes in [server.ts](server.ts) | High |
| otps | Yes | Yes | Yes | No | Registration, email/SMS verification, and password reset flows in [server.ts](server.ts) | High |
| notifications | Yes | Yes | Yes | No | Notification inbox, admin alerts, and status change flows in [server.ts](server.ts) | High |
| faqs | Yes | Yes | Yes | Yes | FAQ public/admin APIs in [server.ts](server.ts) | High |
| profile_drafts | Yes | Yes | Yes | Yes | Draft save/resume flows in [server.ts](server.ts) | Medium |
| config | Yes | Yes | Yes | No | System config endpoints in [server.ts](server.ts) | Medium |
| user_preferences | Yes | Yes | Yes | No | Preferences management in [src/db/dbService.ts](src/db/dbService.ts) | Medium |

---

## Relationship Issues and Orphan Risk

### 1. users → user_profiles
- Missing foreign key/reference: No explicit database relation is declared.
- Expected relationship: One user should have zero or one profile record.
- Current implementation: The route layer finds a profile by `profile.userId === user.id` in [server.ts](server.ts).
- Files using the relationship: [server.ts](server.ts), [src/db/dbService.ts](src/db/dbService.ts)
- Possible orphan data risk: High. A user can exist without a profile, or a profile can point at a missing user.

### 2. users → identity_documents
- Missing foreign key/reference: No explicit database relation is declared.
- Expected relationship: One user should have zero or one identity document record.
- Current implementation: The route layer resolves docs by `doc.userId === user.id` in [server.ts](server.ts).
- Files using the relationship: [server.ts](server.ts), [src/db/dbService.ts](src/db/dbService.ts)
- Possible orphan data risk: Medium-High. The document record can drift from the user state after profile reset or re-submission.

### 3. users → face_verifications
- Missing foreign key/reference: No explicit database relation is declared.
- Expected relationship: One user can have many verification attempts, but each attempt should be traceable to a user.
- Current implementation: The route and service layer use `userId` matching in [server.ts](server.ts) and [services/faceVerification.service.ts](services/faceVerification.service.ts).
- Files using the relationship: [server.ts](server.ts), [services/faceVerification.service.ts](services/faceVerification.service.ts)
- Possible orphan data risk: Medium. Verification attempts can remain without a matching user if the user is deleted or account state changes.

### 4. elections → candidates
- Missing foreign key/reference: No explicit database relation is declared.
- Expected relationship: Each candidate should belong to an existing election.
- Current implementation: The code filters candidates by `candidate.electionId === election.id` in [server.ts](server.ts).
- Files using the relationship: [server.ts](server.ts), [src/db/dbService.ts](src/db/dbService.ts)
- Possible orphan data risk: High. Candidate records can reference elections that no longer exist.

### 5. elections → votes and candidates → votes
- Missing foreign key/reference: No explicit database relation is declared.
- Expected relationship: A vote should reference a valid election and a valid candidate in that election.
- Current implementation: The voting route validates both before creating a vote, but enforcement is manual and route-level only.
- Files using the relationship: [server.ts](server.ts)
- Possible orphan data risk: High. Invalid ballot data can persist if the candidate or election changes after a vote is recorded.

---

## Overlapping Profile Data

### Which collections overlap

- [src/db/dbService.ts](src/db/dbService.ts) shows overlapping fields between `users` and `user_profiles`.
- The document and verification flows also duplicate biometric and identity fields across `users`, `identity_documents`, and `face_verifications`.

### Which fields are duplicated

- Core identity fields: `dob`, `gender`, `address`/`permanentAddress`/`temporaryAddress`, `citizenshipNumber`, `nationalID`
- Biometric fields: `faceImage`, `fingerprintImage`, `fingerprintHash`
- Verification fields: `verificationReport`, `isVerified`, `isApproved`, `accountStatus`

### Which collection should become the source of truth

- For core identity fields, the evidence suggests `users` should remain the source of truth because it is already the primary account record used by authentication, admin review, and role-based access in [server.ts](server.ts).
- For document-specific details, `identity_documents` should remain a specialized child collection rather than a duplicate of the core user object.
- For extended profile address details, `user_profiles` should be treated as a profile extension rather than a second identity store.

### Migration considerations

- Backfill and reconcile values between `users` and `user_profiles` before any consolidation.
- Decide which fields must remain writable on the user record and which should be moved to a dedicated profile extension.
- Preserve historical document and biometric records while changing the write path to a single authoritative model.
- Needs Verification: The existing live data values and the exact migration scope cannot be confirmed from the repository alone.

---

## Performance Findings

### Indexes that should exist

Based on the usage patterns in [server.ts](server.ts) and [src/db/dbService.ts](src/db/dbService.ts), the following indexes would be appropriate:

- `votes.electionId`
- `votes.candidateId`
- `votes.anonymousVoterHash` (already present as a unique index in the runtime code)
- `candidates.electionId`
- `candidates.status`
- `users.role`
- `users.email`
- `users.nationalID`
- `users.mobile`
- `user_profiles.userId`
- `notifications.userId`
- `notifications.timestamp`
- `otps.expiresAt`
- `audit_logs.timestamp`

### Duplicate indexes

- No duplicate index definitions were found in the repository code.
- Needs Verification: the actual live MongoDB indexes should be inspected in a running environment to confirm there are no duplicates or overlapping indexes.

### Frequently queried fields

- `users.role` for role-based access and admin lists
- `users.email` and `users.mobile` for uniqueness checks and authentication
- `votes.electionId` and `votes.candidateId` for result aggregation
- `candidates.electionId` and `candidates.status` for candidate listings
- `otps.expiresAt` for expiry cleanup

### Large collections

- `votes` is likely to grow with every ballot cast and is used heavily for results summarization.
- `audit_logs` is likely to grow with every action and is read by admin endpoints.
- `users` can grow significantly as the system is used in real elections.

### Potential query bottlenecks

- Result endpoints in [server.ts](server.ts) use repeated collection scans and filters rather than pre-aggregated or indexed reads.
- Dashboard statistics recompute counts by iterating over the full collections.
- The current route-layer design makes these paths sensitive to data volume and can become slow as records accumulate.

---

## Safe Cleanup Candidates

The following appear safe to review and possibly archive, but not delete without broader confirmation:

- [routes/profiles.js](routes/profiles.js): no active import path was found in [server.ts](server.ts)
- [src/db/data](src/db/data): empty in the current workspace and not actively used by the MongoDB-first persistence layer in [src/db/dbService.ts](src/db/dbService.ts)

---

## Action Plan

### Phase A – Immediate

- Resolve the TypeScript/build issues in [src/components/BiometricScanner.tsx](src/components/BiometricScanner.tsx) and [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx).
- Document the authoritative profile model before changing any write paths.
- Review the active routing and persistence layers to confirm which profile-related collection is the source of truth.

### Phase B – Short Term

- Introduce explicit relationship validation for the core cross-collection references listed above.
- Consolidate overlapping profile fields and standardize naming conventions.
- Add targeted indexes for the vote, candidate, and audit read paths.

### Phase C – Long Term

- Rework the persistence layer around a clearer domain model and a single write path for profile data.
- Revisit backup/restore strategy so the active storage model and the operational flow are aligned.
