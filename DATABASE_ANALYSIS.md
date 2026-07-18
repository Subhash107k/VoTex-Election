# Database Analysis

## Database Inventory
The project does not use Mongoose schemas. It uses the official `mongodb` driver through `src/db/dbService.ts` and falls back to JSON files under `src/db/data`.

Observed local collections:
- `users`: 4 records
- `user_profiles`: 1 record
- `identity_documents`: 1 record
- `face_verifications`: 4 records
- `candidates`: 3 records
- `elections`: 1 record
- `votes`: 13 records
- `audit_logs`: 19 records
- `otps`: 46 records
- `notifications`: 4 records
- `faqs`: 10 records
- `political_parties`: 5 records
- `profile_drafts`: 1 record, approximately 3.6 MB
- `config`: 1 record
- `pending_queue`: 0 records

## Current Persistence Model
- `Database.load(collection)` reads the whole JSON file into memory.
- `Database.save(collection, data)` writes the whole JSON file to disk.
- If MongoDB is connected, `save` deletes the whole MongoDB collection and reinserts all records.
- If MongoDB is offline, the system queues item-level writes to `pending_queue.json`.
- MongoDB bootstrap seeds empty collections from local JSON/default data.

## Strengths
- Simple local fallback is useful for demos and offline development.
- MongoDB connection health and failover state are visible in the admin security console.
- Basic backup encryption helpers use AES-256-GCM for fallback archives.
- Collection interfaces are typed in TypeScript.

## Critical Risks
- Whole-collection delete and reinsert is not safe for concurrent production traffic.
- No indexes are created in code.
- No uniqueness enforcement for emails, usernames, national IDs, voter participation, OTP uniqueness, or candidate/election references.
- JSON files contain sensitive identity, biometric, and OTP data.
- Local fallback and MongoDB can diverge, and last-write-wins can lose data.
- No schema validation at the database layer.
- No transactions around vote submission, duplicate-vote lock creation, and ballot insertion.

## Recommended MongoDB Collections
- `users`: login identity, role, status, password hash, MFA settings.
- `voter_profiles`: demographic and address fields, approval state.
- `identity_documents`: encrypted object references, document metadata, verification status.
- `biometric_templates`: encrypted templates only, no raw image by default.
- `elections`: lifecycle, eligibility rules, publication settings.
- `candidates`: candidate profile, status, election mapping.
- `voter_participation`: one record per `electionId + voterIdHash`.
- `ballots`: anonymous ballot records with encrypted candidate choice and integrity proof.
- `audit_logs`: append-only operational events.
- `otp_challenges`: hashed codes, TTL expiry, attempt count, channel, purpose.
- `notifications`: user/admin/public notification records.
- `parties`, `faqs`, `system_config`, `jobs`.

## Required Indexes
```js
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true, sparse: true })
db.users.createIndex({ nationalID: 1 }, { unique: true, sparse: true })
db.users.createIndex({ role: 1, accountStatus: 1 })

db.voter_profiles.createIndex({ userId: 1 }, { unique: true })
db.identity_documents.createIndex({ userId: 1 })
db.biometric_templates.createIndex({ userId: 1 }, { unique: true })
db.biometric_templates.createIndex({ templateHash: 1 }, { unique: true, sparse: true })

db.elections.createIndex({ status: 1, startDate: 1, endDate: 1 })
db.candidates.createIndex({ electionId: 1, status: 1 })
db.candidates.createIndex({ userId: 1 }, { sparse: true })

db.voter_participation.createIndex({ electionId: 1, voterHash: 1 }, { unique: true })
db.ballots.createIndex({ electionId: 1, candidateId: 1 })
db.ballots.createIndex({ ballotReceipt: 1 }, { unique: true })

db.audit_logs.createIndex({ timestamp: -1 })
db.audit_logs.createIndex({ userId: 1, timestamp: -1 })
db.otp_challenges.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.otp_challenges.createIndex({ channel: 1, targetHash: 1, purpose: 1, createdAt: -1 })
```

## Voting Data Model Recommendation
Use two-phase records:
1. `voter_participation`: proves a voter used their right once. Contains election id, voter hash, timestamp, verification method, and audit references.
2. `ballots`: contains anonymous ballot id, election id, encrypted candidate id, candidate tally projection where needed, timestamp, and integrity signature.

Do not store raw `candidateId` next to the deterministic voter hash in the same record for real elections.

## Data Retention Recommendations
- OTP challenges: expire within 5 to 10 minutes and delete by TTL.
- Dispatch logs: redact OTP content and retain for a short operational window.
- Raw biometric images: avoid storing; retain encrypted only if legally required.
- Identity documents: store in encrypted object storage with access audit.
- Audit logs: append-only and tamper-evident, preferably WORM storage or signed chain hashes.
- Profile drafts: set expiry and size limits.

## Production Database Roadmap
1. Replace JSON fallback for production with MongoDB repositories.
2. Add migration/index bootstrap.
3. Use transactions for voting and admin approval state transitions.
4. Add database validation or schema validators.
5. Add field-level encryption for PII and biometrics.
6. Add backups, restore drills, and PITR strategy.
