# 🎓 VoTex — Project Viva & Defense Guide

**Author:** **Subhash Sharma**

---

# 📌 Executive Summary for Viva Presentation

**VoTex** is a full-stack digital election management platform designed to provide a structured, secure, and transparent voting workflow.

The platform combines:

* **Client-side facial landmark detection**
* **128-dimensional facial embedding comparison**
* **Biometric verification and liveness-oriented checks**
* **JWT-based authentication**
* **Role-Based Access Control (RBAC)**
* **MongoDB database-level duplicate-vote protection**
* **SHA-256 vote receipt generation**
* **Voter identity and document verification**
* **Election and candidate management**
* **Administrative auditing**
* **Responsive voter and administrator interfaces**

The system is designed around the following principle:

```text
Registration
     ↓
Profile Completion
     ↓
Identity Verification
     ↓
Admin Approval
     ↓
Biometric Enrollment
     ↓
Election Eligibility
     ↓
Live Face Verification
     ↓
Ballot Access
     ↓
Vote Submission
     ↓
Receipt + Audit Record
```

> **Important viva note:** VoTex is a software project and research/academic platform. It demonstrates security mechanisms and election workflows, but it should not be described as a certified public-election system without independent security audits, biometric validation, privacy/legal review, accessibility testing, and election-security certification.

---

# 📑 Table of Contents

1. [Project Purpose & Problem Statement](#category-1-project-purpose--problem-statement)
2. [System Architecture & Framework Selection](#category-2-system-architecture--framework-selection)
3. [Biometric AI Engine & Face Recognition](#category-3-biometric-ai-engine--face-recognition)
4. [Security, Cryptography & Anti-Fraud](#category-4-security-cryptography--anti-fraud)
5. [Database Engineering & Query Optimization](#category-5-database-engineering--query-optimization)
6. [Electoral Integrity & Profile Verification](#category-6-electoral-integrity--profile-verification)
7. [Frontend Engineering & Performance](#category-7-frontend-engineering--performance)
8. [Tough Examiner Questions & Defense Scenarios](#category-8-tough-examiner-questions--defense-scenarios)
9. [Additional Advanced Viva Questions](#additional-advanced-viva-questions)

---

# Category 1: Project Purpose & Problem Statement

## Q1: What is VoTex?

### Answer

VoTex is a full-stack digital election platform that manages the voter lifecycle from registration and identity verification through election eligibility, biometric verification, ballot casting, and audit logging.

Its primary goal is to demonstrate how modern web technologies, database constraints, authentication, and biometric verification can be combined to create a controlled digital voting workflow.

---

## Q2: What problems does VoTex attempt to address?

### Answer

VoTex focuses on several common challenges:

### 1. Voter Identity Verification

Traditional credential-based systems may not provide sufficient assurance that the person using an account is the registered voter.

VoTex adds biometric verification as an additional identity signal.

### 2. Duplicate Voting

The system uses application-level checks together with a MongoDB compound unique index based on:

```javascript
{
  userId: 1,
  electionId: 1
}
```

This prevents the same voter from creating multiple vote records for the same election.

### 3. Election Administration

Administrators can manage:

* Voter verification
* Elections
* Candidates
* Voting periods
* Notifications
* Audit records

### 4. Auditability

Important system operations can be recorded with timestamps and contextual information so administrators can investigate system activity.

---

## Q3: What are the major user roles?

### Answer

VoTex defines three primary roles:

### `voter`

A voter can:

* Create an account
* Complete their profile
* Submit identity information
* Complete biometric enrollment
* View eligible elections
* View candidate information
* Complete face verification
* Cast a ballot
* Receive a voting receipt

### `candidate`

A candidate can be associated with an election and maintain permitted campaign information such as:

* Profile
* Photo
* Party affiliation
* Manifesto

### `admin`

An administrator manages:

* Voter verification
* Elections
* Candidates
* Notifications
* System activity
* Audit logs

Role-based access is enforced on protected backend routes.

---

# Category 2: System Architecture & Framework Selection

## Q4: Describe the overall architecture.

### Answer

VoTex follows a **Client–Server Single Page Application architecture**.

```text
┌──────────────────────────────┐
│        CLIENT LAYER          │
│                              │
│ React + TypeScript + Vite    │
│ Tailwind CSS                 │
│ Face Processing              │
│ Camera Interface             │
└──────────────┬───────────────┘
               │ HTTPS / REST
               ↓
┌──────────────────────────────┐
│         SERVER LAYER         │
│                              │
│ Node.js + Express            │
│ JWT Authentication           │
│ RBAC                         │
│ Validation                   │
│ Biometric Verification       │
│ Audit Services               │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│          DATA LAYER          │
│                              │
│ MongoDB                      │
│ Users                        │
│ Elections                    │
│ Candidates                   │
│ Votes                        │
│ Audit Logs                   │
└──────────────────────────────┘
```

The frontend is responsible for presentation and browser-based processing, while the backend remains responsible for authorization, business rules, database operations, and security-sensitive validation.

---

## Q5: Why did you choose React?

### Answer

React was selected because it provides:

* Component-based development
* Reusable UI components
* Efficient state-driven rendering
* Strong TypeScript integration
* Suitable support for complex dashboards
* Good support for responsive interfaces
* Easy integration with APIs and browser camera functionality

The application contains many interactive interfaces, such as dashboards, forms, election cards, candidate lists, biometric verification, and administrative tables, making a component-based framework appropriate.

---

## Q6: Why TypeScript instead of plain JavaScript?

### Answer

TypeScript provides static typing and improves maintainability.

For a project containing:

* User profiles
* Election objects
* Candidate objects
* API responses
* Biometric data
* Authentication state

TypeScript helps detect incorrect data structures during development rather than waiting for runtime failures.

---

## Q7: Why use a separate backend?

### Answer

Separating frontend and backend provides clear security boundaries.

The browser should not be trusted with sensitive business rules.

For example:

```text
Frontend:
"Can I vote?"
       ↓
Backend:
"Is this user actually eligible?"
       ↓
Database:
"Has this user already voted?"
```

The final decision must be made by the backend/database rather than by the UI.

---

# Category 3: Biometric AI Engine & Face Recognition

## Q8: Explain the face-verification workflow.

### Answer

The biometric workflow follows several stages:

```text
Camera
  ↓
Video Stream
  ↓
Face Detection
  ↓
Landmark Detection
  ↓
Face Alignment / Quality Check
  ↓
Feature Extraction
  ↓
128-Dimensional Embedding
  ↓
Similarity Comparison
  ↓
Verification Decision
```

The browser requests camera access using:

```javascript
navigator.mediaDevices.getUserMedia()
```

The video stream is displayed through an HTML video element.

TensorFlow.js and the configured face-processing models perform the required detection and feature extraction.

---

## Q9: What is a facial embedding?

### Answer

A facial embedding is a numerical representation of facial characteristics.

Instead of comparing two images pixel-by-pixel, the system converts the face into a vector such as:

```text
[
  0.124,
 -0.031,
  0.281,
  ...
]
```

In the documented VoTex design, the embedding contains **128 numerical values**.

The live embedding is compared against the registered biometric representation.

---

## Q10: Why use embeddings instead of storing only raw face images?

### Answer

Embeddings provide a compact mathematical representation that can be compared efficiently.

Advantages include:

* Smaller representation
* Faster numerical comparison
* Easier similarity calculations
* Reduced dependence on direct image comparison

However, an important security point is that **biometric embeddings are still sensitive biometric information**. They should therefore be protected using appropriate access control, encryption, retention, and privacy policies.

---

## Q11: What mathematical methods are used for face comparison?

### Answer

VoTex uses a hybrid similarity approach involving:

### Cosine Similarity

[
Cosine(A,B)=
\frac{A\cdot B}
{|A||B|}
]

It measures the directional similarity between two vectors.

### RMSE

[
RMSE=
\sqrt{
\frac{1}{n}
\sum_{i=1}^{n}(A_i-B_i)^2
}
]

An inverse distance score can then be calculated:

[
InverseDistance=
\max(0,1-RMSE)
]

### Hybrid Score

The documented configuration combines them as:

[
FinalScore =
0.65(Cosine)
+
0.35(InverseDistance)
]

A configurable threshold is then applied.

For example:

```text
FACE_MATCH_THRESHOLD = 0.82
```

> **Viva caution:** 0.82 is a project configuration value, not a universal biometric-security standard. A production system would need empirical threshold calibration and false-acceptance/false-rejection testing.

---

## Q12: How does the system perform liveness-oriented verification?

### Answer

VoTex uses behavioral and geometric signals such as:

* Head rotation
* Pitch
* Yaw
* Roll
* Face position
* Bounding-box behavior
* Required user movement

For example:

```text
Look forward
     ↓
Turn slightly left
     ↓
Turn slightly right
     ↓
Return to center
     ↓
Capture
```

This makes a simple static photograph less likely to pass the workflow.

However, these checks should be described as **liveness-oriented protections**, not as a guarantee against every presentation attack.

---

# Category 4: Security, Cryptography & Anti-Fraud

## Q13: How is duplicate voting prevented?

### Answer

VoTex uses multiple layers.

### Layer 1 — Eligibility Check

The backend verifies whether the voter is eligible.

### Layer 2 — Previous Vote Check

The backend checks whether a vote already exists.

### Layer 3 — Database Constraint

MongoDB enforces a compound unique index:

```javascript
db.votes.createIndex(
  {
    userId: 1,
    electionId: 1
  },
  {
    unique: true
  }
)
```

If a second vote is submitted for the same voter and election, MongoDB rejects the duplicate record.

This is important because application-only validation can suffer from race conditions.

---

## Q14: Why is the database constraint important?

### Answer

Consider two requests arriving almost simultaneously:

```text
Request A → Check: no previous vote
Request B → Check: no previous vote
```

Both could theoretically pass an application-level check.

A unique database index provides a final integrity boundary:

```text
Request A → INSERT → SUCCESS
Request B → INSERT → DUPLICATE KEY ERROR
```

Therefore, the database participates directly in enforcing the one-vote-per-election rule.

---

## Q15: How are passwords protected?

### Answer

Passwords are never stored as plaintext.

The documented implementation uses BcryptJS with a configurable number of hashing rounds.

Conceptually:

```javascript
const hash = await bcrypt.hash(password, saltRounds);
```

Only the resulting password hash is stored.

During login:

```text
Entered Password
       ↓
bcrypt.compare()
       ↓
Stored Hash
       ↓
Match / Reject
```

---

## Q16: What is JWT used for?

### Answer

JWT is used to authenticate API requests.

A simplified workflow is:

```text
Login
 ↓
Credentials Validated
 ↓
JWT Generated
 ↓
Client Sends Bearer Token
 ↓
Middleware Verifies JWT
 ↓
User Identity + Role
 ↓
Protected Controller
```

JWT should not be treated as proof that the voter is currently eligible to vote. Eligibility and election state must still be checked by the backend.

---

## Q17: How is the voting receipt generated?

### Answer

The documented design generates a SHA-256 receipt based on relevant voting transaction information and a server-side secret.

Conceptually:

[
Receipt =
SHA256(
UserId +
ElectionId +
CandidateId +
Timestamp +
ServerSecret
)
]

The receipt can provide evidence that a voting transaction was processed.

However, a receipt system must be carefully designed so that the receipt does not unintentionally reveal the voter's ballot choice.

---

# Category 5: Database Engineering & Query Optimization

## Q18: Why use the MongoDB native driver?

### Answer

The native MongoDB driver provides direct access to:

* Collections
* Indexes
* Queries
* Aggregations
* Transactions
* Cursors

This can reduce abstraction overhead and provides direct control over database operations.

It is also suitable when the application needs flexible document structures.

---

## Q19: What indexes are important?

### Answer

Important indexes include:

### Users

```text
email
username
nationalID
citizenshipNumber
```

These support uniqueness and fast identity lookups.

### Votes

```javascript
{
  userId: 1,
  electionId: 1
}
```

This provides duplicate-vote protection.

An election index such as:

```javascript
{
  electionId: 1
}
```

can support election-specific queries and result calculations.

### Audit Logs

An index involving:

```text
createdAt
category
```

helps administrators retrieve recent and categorized events efficiently.

---

## Q20: How do you maintain database integrity?

### Answer

Database integrity is maintained through:

* Required field validation
* Unique indexes
* Referential identifiers
* Controlled update operations
* Backend validation
* Election-state checks
* Duplicate-vote constraints
* Atomic database operations where appropriate
* Audit logging

The principle is:

> **Never rely only on the frontend to protect important data.**

---

# Category 6: Electoral Integrity & Profile Verification

## Q21: Describe the complete voter verification workflow.

### Answer

The voter workflow is:

```text
1. Registration
       ↓
2. Login
       ↓
3. Complete Profile
       ↓
4. Submit Identity Information
       ↓
5. Upload Required Documents
       ↓
6. Administrative Review
       ↓
7. Approval / Rejection
       ↓
8. Biometric Enrollment
       ↓
9. Election Eligibility
       ↓
10. Live Face Verification
       ↓
11. Ballot Access
```

The documented profile workflow includes personal information, Nepali address information, citizenship documentation, and NID information.

---

## Q22: What does the administrator verify?

### Answer

The administrator can review:

* Voter identity information
* Profile completeness
* Citizenship documents
* NID information
* Address information
* Verification status
* Biometric status where applicable

The administrator can then approve or reject the submitted profile according to the configured workflow.

---

## Q23: Why should voter approval happen before voting?

### Answer

Voting should not be available to every newly registered account.

A controlled workflow separates:

```text
Account Created
```

from:

```text
Voter Approved
```

This provides an administrative verification stage before election participation.

---

# Category 7: Frontend Engineering & Performance

## Q24: How do you handle TensorFlow.js performance?

### Answer

TensorFlow.js and face-processing libraries can be large.

The application can separate heavy dependencies into dedicated chunks.

For example:

```text
vendor-react
vendor-tensorflow
vendor-ui
vendor-charts
```

This prevents the entire biometric stack from unnecessarily blocking the initial application load.

---

## Q25: Why is client-side face processing useful?

### Answer

Client-side processing can:

* Reduce repeated transmission of camera frames
* Provide immediate feedback
* Use the user's GPU/WebGL capabilities
* Reduce server-side video-processing workload
* Improve interactive camera guidance

The backend should still make the final authorization and voting decisions.

---

## Q26: How does the UI support different devices?

### Answer

The interface is designed responsively for:

```text
Mobile
   ↓
Tablet
   ↓
Laptop
   ↓
Desktop
```

Important components such as:

* Voter dashboard
* Election cards
* Candidate cards
* Forms
* Camera interface
* Admin tables
* Charts

should adapt to available screen size.

---

# Category 8: Tough Examiner Questions & Defense Scenarios

## Q27: What happens if the network disconnects after biometric verification?

### Answer

The biometric verification state is time-limited.

If the voter loses connection before submitting the ballot:

```text
Face Verification
       ↓
Network Failure
       ↓
No Vote Created
       ↓
Reconnect
       ↓
Re-verify if Required
       ↓
Submit Vote
```

The important principle is:

> **A successful face verification must not automatically mean that a vote has been cast.**

A vote should only exist after the backend successfully completes the voting transaction.

---

## Q28: What happens if the user clicks “Vote” twice?

### Answer

The frontend can disable the button while the request is being processed, but frontend protection alone is insufficient.

The backend and database provide the real integrity control.

```text
First Request
    ↓
Vote Created

Second Request
    ↓
Unique Constraint
    ↓
Rejected
```

This protects against accidental double-clicks as well as repeated malicious requests.

---

## Q29: What happens if the election is already closed?

### Answer

The backend checks the election state before accepting the vote.

For example:

```text
Election Status
      ↓
OPEN?
 ┌────┴────┐
YES       NO
 ↓         ↓
Continue   Reject
```

The frontend may hide or disable the voting interface, but the backend must independently enforce the rule.

---

## Q30: Can an administrator vote on behalf of a voter?

### Answer

The system should separate administrative privileges from voter privileges.

An administrator can manage election operations but should not automatically receive permission to cast another user's ballot.

Every sensitive endpoint should verify:

* Authentication
* User identity
* Role
* Election eligibility
* Required verification state

---

## Q31: Is a face match alone enough to authorize a vote?

### Answer

No.

Face matching should be only one part of the overall workflow.

A valid voting request should satisfy multiple conditions:

```text
Authenticated
      +
Profile Approved
      +
Election Open
      +
Voter Eligible
      +
Not Already Voted
      +
Biometric Verification
      +
Valid Ballot
      ↓
Vote Accepted
```

This layered approach is significantly stronger than relying on face recognition alone.

---

## Q32: Is voter anonymity preserved if votes contain user IDs?

### Answer

This is an important architectural consideration.

If a vote record directly contains:

```text
userId + candidateId
```

then the database administrator could potentially associate the voter with their selected candidate.

A privacy-preserving production architecture should separate:

### Participation Record

```text
userId
electionId
receiptHash
timestamp
```

from:

### Ballot Record

```text
electionId
candidateId
ballotIdentifier
```

The exact implementation depends on the required election model and threat assumptions.

For a real public election, ballot secrecy requires substantially more than simply hashing fields.

---

## Q33: What if someone gets direct access to MongoDB?

### Answer

Database access should be protected using:

* Authentication
* Network restrictions
* Encryption
* Least-privilege database accounts
* Backups
* Monitoring
* Audit logging

Application-level hashes alone should not be described as making the database tamper-proof.

A production election system would require stronger independent integrity controls and operational security.

---

## Q34: What happens if MongoDB goes down during voting?

### Answer

The system should fail safely.

The preferred behavior is:

```text
Vote Request
    ↓
Database Unavailable
    ↓
Transaction Not Confirmed
    ↓
No Success Receipt
    ↓
User Receives Clear Error
```

The system must never display:

> “Vote successfully recorded”

unless the backend has actually confirmed successful persistence.

---

## Q35: What happens if the browser is closed after the user clicks Submit?

### Answer

The server should be responsible for completing the database operation.

If the request reaches the backend and the vote is successfully committed, the vote exists even if the browser closes immediately afterward.

If the request never reaches the server or the transaction fails, no successful receipt should be shown.

This is why the client should treat the backend's confirmed response as the source of truth.

---

# Additional Advanced Viva Questions

## Q36: Why should election state be checked on the backend?

### Answer

Because frontend code can be modified or bypassed.

A malicious user could manually send:

```http
POST /api/elections/123/vote
```

even if the UI says the election is closed.

Therefore:

```text
Frontend Check
     +
Backend Check
```

is required.

The backend must remain authoritative.

---

## Q37: Why is input validation necessary?

### Answer

Input validation prevents malformed or unexpected data from reaching business logic.

Examples include:

* Invalid IDs
* Invalid email addresses
* Incorrect dates
* Missing required fields
* Oversized inputs
* Invalid election identifiers

Schema validation also creates consistent API behavior.

---

## Q38: What is the difference between authentication and authorization?

### Answer

### Authentication

Answers:

> **Who are you?**

Example:

```text
JWT → User ID
```

### Authorization

Answers:

> **What are you allowed to do?**

Example:

```text
User Role = admin
```

Therefore:

```text
Authentication → Identity
Authorization  → Permission
```

---

## Q39: What is RBAC?

### Answer

RBAC means **Role-Based Access Control**.

Instead of assigning permissions individually to every user, permissions are associated with roles.

For VoTex:

```text
Voter
 ├── View eligible elections
 ├── Complete verification
 └── Cast eligible ballot

Candidate
 ├── Manage permitted profile
 └── Manage campaign information

Admin
 ├── Manage voters
 ├── Manage elections
 ├── Manage candidates
 └── Review audit information
```

---

## Q40: What is the most important security principle in VoTex?

### Answer

The most important principle is:

> **Never trust the client.**

The browser can display the interface and collect information, but important decisions must be validated on the backend and, where appropriate, enforced at the database level.

For example:

```text
UI says:
"You are eligible."

Backend verifies:
"You are actually eligible."

Database verifies:
"You have not already voted."
```

---

# 🎯 Final Viva Summary

If the examiner asks:

> **“Explain VoTex in one minute.”**

Use this answer:

> **“VoTex is a full-stack digital election management platform built with React, TypeScript, Node.js, Express, and MongoDB. It manages the complete voter lifecycle from registration and profile verification to election eligibility, biometric verification, and ballot submission. The platform uses JWT authentication and role-based access control to protect APIs, while MongoDB compound unique indexes help prevent duplicate voting. The biometric workflow uses browser-based face detection and 128-dimensional facial embeddings with configurable similarity scoring and liveness-oriented checks. Administrators can manage voters, elections, candidates, notifications, and audit records. The main design principle is defense in depth: authentication, profile approval, election validation, biometric verification, application checks, and database constraints all work together rather than relying on a single security mechanism.”**

---

# 🧠 Five Points to Remember During Viva

If you forget everything else, remember these five points:

### 1. Authentication

**Who is the user?**

### 2. Authorization

**What can the user do?**

### 3. Eligibility

**Is the user allowed to vote in this election?**

### 4. Biometric Verification

**Does the live person correspond to the enrolled identity?**

### 5. Database Integrity

**Has this voter already voted?**

The complete voting decision is therefore:

```text
Authentication
       +
Authorization
       +
Eligibility
       +
Biometric Verification
       +
Election Status
       +
Database Integrity
       ↓
    BALLOT
```

---

# 🏁 Final Defense Statement

> **“VoTex is not based on a single security mechanism. Its main strength is layered verification. The system combines authentication, authorization, identity verification, biometric verification, election-state validation, duplicate-vote prevention, database constraints, and auditability. This layered architecture provides a strong foundation for demonstrating secure digital election workflows while leaving clear areas for further research, independent security testing, privacy validation, and production hardening.”**

---

**Author:** Subhash Sharma

**Project:** VoTex — Digital Election & Biometric Voting Platform
