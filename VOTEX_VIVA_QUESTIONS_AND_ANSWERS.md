# 🎓 VoTex Project Viva & Defense Guide

**Author**: **[Subhash Sharma](https://github.com/Subhash107k)**

---

## 📌 Executive Summary for Viva Presentation

**VoTex** is an enterprise-grade digital voting platform designed to enable secure, transparent, and fraud-resistant elections. It integrates **client-side WebGL face landmark extraction (68 keypoints)**, **server-side 128-dimensional biometric embedding comparison**, **strict MongoDB single-vote compound unique indexes**, and **SHA-256 cryptographic ballot receipts**.

---

## 📑 Table of Contents

1. [Category 1: Project Purpose & Problem Statement](#category-1-project-purpose--problem-statement)
2. [Category 2: System Architecture & Framework Selection](#category-2-system-architecture--framework-selection)
3. [Category 3: Biometric AI Engine & Face Recognition](#category-3-biometric-ai-engine--face-recognition)
4. [Category 4: Security, Cryptography & Anti-Fraud](#category-4-security-cryptography--anti-fraud)
5. [Category 5: Database Engineering & Query Optimization](#category-5-database-engineering--query-optimization)
6. [Category 6: Electoral Integrity & Profile Verification](#category-6-electoral-integrity--profile-verification)
7. [Category 7: Frontend Engineering & Performance](#category-7-frontend-engineering--performance)
8. [Category 8: Tough Examiner Questions & Defense Scenarios](#category-8-tough-examiner-questions--defense-scenarios)

---

## Category 1: Project Purpose & Problem Statement

### Q1: What core problems in traditional voting systems does VoTex address?
**Answer:** Traditional voting systems suffer from three major vulnerabilities:
1. **Voter Impersonation & Fraud**: In-person paper voting or basic online voting lacks instant, tamper-proof biometric identity verification. VoTex solves this via live multi-modal identity validation (National ID + live facial biometrics).
2. **Double Voting & Ballot Stuffing**: VoTex enforces atomic database-level compound unique indexes (`{ userId: 1, electionId: 1 }`) preventing duplicate ballot submission.
3. **Lack of Verifiable Receipt**: Voters traditionally have no proof their vote was recorded accurately without revealing their secret ballot. VoTex generates a unique **SHA-256 cryptographic transaction receipt hash** upon casting a vote.

### Q2: What roles exist in VoTex and how is Role-Based Access Control (RBAC) implemented?
**Answer:**
VoTex defines three distinct user roles:
- `voter`: Registered citizens who can complete identity verification, view candidate profiles, and cast ballots in eligible elections.
- `candidate`: Contenders affiliated with political parties who can manage their campaign manifestos, photos, and view real-time public results.
- `admin`: Election officials who manage user verification queues, create/manage elections, broadcast notifications, and review system audit logs.

RBAC is enforced on the backend via Express middleware (`authMW` & role checks) that decode the authenticated user's JWT payload and check `req.user.role` before executing protected controller logic.

---

## Category 2: System Architecture & Framework Selection

### Q3: Describe the overall architecture of VoTex.
**Answer:**
VoTex uses a modern **Client-Server Single Page Application (SPA)** architecture:
- **Client Tier**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4. Handles UI rendering, form validations, PWA offline caching, and WebGL client-side face landmark extraction using TensorFlow.js.
- **Server Tier**: Node.js + Express 4 API server. Handles JWT authentication, rate limiting, biometric similarity calculations, audit logging, and business logic.
- **Data Tier**: MongoDB 7.0 document database for structured storage of users, elections, candidates, votes, and audit logs.

### Q4: Why did you choose a decoupled Client-Server architecture over server-rendered pages (like EJS or Blade)?
**Answer:**
1. **Client-Side Heavy Biometric Computation**: Face detection and landmark extraction require processing high-frame-rate video streams in browser WebGL canvas tensors. Performing this client-side offloads heavy CPU/GPU work from the backend server.
2. **Stateless API Scalability**: The Express REST API communicates via stateless JSON endpoints and JWT tokens, enabling horizontal scaling behind a load balancer.
3. **Rich SPA User Experience**: Smooth dynamic micro-animations (via Framer Motion) and real-time chart updates (via Recharts and Socket.IO) provide a responsive application experience.

---

## Category 3: Biometric AI Engine & Face Recognition

### Q5: How does the client-side face detection engine work step-by-step?
**Answer:**
1. **Camera Feed Capture**: The browser requests camera access via `navigator.mediaDevices.getUserMedia()` and streams video into an HTML5 `<video>` element.
2. **Model Loading & Backend Setup**: `tensorflow.ts` initializes TensorFlow.js with WebGL hardware acceleration.
3. **Face Landmark Detection**: SSD MobileNet v2 / MediaPipe Face Mesh detects the face bounding box and maps **68 3D facial keypoint landmarks** (eyes, nose bridge, jawline, lips).
4. **Embedding Extraction**: The detected face region is converted into a 128-element normalized feature vector array (floating-point embeddings).

### Q6: Why do you store 128-dimensional embedding vectors instead of raw facial photos in the database?
**Answer:**
1. **Privacy & Compliance**: Storing raw biometric facial images creates severe privacy and security risks. Storing irreversible mathematical vectors protects user privacy.
2. **Storage Efficiency**: A raw image requires 500KB - 2MB, whereas a 128-float array requires less than **1KB** of storage space.
3. **Computation Speed**: Comparing two 128-element numerical arrays takes microseconds using vector dot-products, enabling instant verification.

### Q7: Explain the mathematical algorithm used in `faceVerification.service.ts` to compare face embeddings.
**Answer:**
VoTex uses a combined metric merging **Cosine Similarity** and **Normalized RMSE Inverse Distance**:

1. **Cosine Similarity**:
   $$\text{Cosine}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
   Measures the directional angle between two 128-d vectors in high-dimensional feature space.

2. **Inverse RMSE Distance**:
   $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (A_i - B_i)^2}, \quad \text{Inverse Distance} = \max(0, 1 - \text{RMSE})$$

3. **Hybrid Confidence Score**:
   $$\text{Final Score} = (\text{Cosine} \times 0.65) + (\text{Inverse Distance} \times 0.35)$$

If `Final Score` $\ge$ `FACE_MATCH_THRESHOLD` (default `0.82`), identity is verified.

### Q8: How does VoTex prevent Anti-Spoofing / Liveness attacks (e.g. someone holding a printed photo or phone screen)?
**Answer:**
VoTex incorporates multi-layer Liveness Detection:
- **Head Rotation Tracking**: Monitors 3D pose angles (pitch, yaw, roll). The system prompts the user to perform micro-movements (e.g. slight turn or head tilt).
- **Bounding Box Scale & Aspect Ratio Consistency**: Ensures the detected face region exhibits natural micro-movements and depth parallax rather than a flat static 2D plane.

---

## Category 4: Security, Cryptography & Anti-Fraud

### Q9: How does VoTex ensure double voting is mathematically and physically impossible?
**Answer:**
1. **Pre-Vote Biometric Session Gatekeeper**: Middleware (`verifyFace.ts`) forces a live face verification check immediately before ballot presentation, issuing a short-lived `verificationId` (TTL: 10 minutes).
2. **Atomic MongoDB Constraint**: The `votes` collection enforces a unique compound index:
   ```javascript
   db.votes.createIndex({ user: 1, electionId: 1 }, { unique: true })
   ```
   If a user attempts to submit a second vote for the same election ID, MongoDB raises a duplicate key error (`E11000`), blocking the transaction at the database level.

### Q10: How are passwords stored securely?
**Answer:**
Passwords are salted and hashed using **BcryptJS** (`bcryptjs.hash(password, saltRounds)` with 10 rounds) before persistence. Plaintext passwords are never logged or stored.

### Q11: How is a vote receipt generated and verified?
**Answer:**
When a vote is cast, `server.ts` generates a SHA-256 hash digest combining:
$$\text{Receipt Hash} = \text{SHA256}(\text{userId} + \text{electionId} + \text{candidateId} + \text{timestamp} + \text{SERVER\_SECRET})$$
The voter receives this receipt hash as proof of ballot submission without exposing their choice publicly.

---

## Category 5: Database Engineering & Query Optimization

### Q12: Why MongoDB native driver instead of Mongoose or an ORM?
**Answer:**
1. **Performance**: Using the official MongoDB native Node driver removes object-document mapping overhead, yielding lower latency for high-concurrency election traffic.
2. **Explicit Control**: Direct access to Mongo command cursors, indexing, and aggregation pipelines allows fine-grained query optimization.

### Q13: What indexed fields are present in VoTex for high query performance?
**Answer:**
- `users`: Unique indexes on `email`, `username`, `nationalID`, `citizenshipNumber`.
- `votes`: Compound unique index on `{ user: 1, electionId: 1 }`, plus single index on `{ electionId: 1 }` for rapid tally aggregation.
- `audit_logs`: Index on `{ createdAt: -1, category: 1 }` for fast administrative log filtering.

---

## Category 6: Electoral Integrity & Profile Verification

### Q14: Describe the voter verification workflow in VoTex.
**Answer:**
1. **Registration**: Citizen creates an account providing basic credentials.
2. **Complete Profile Dossier**: Submits full name (English & Devanagari), DOB, Gender, District, Municipality, Ward No., Citizenship Card front/back images, and NID number.
3. **Admin Queue Audit**: Election officials inspect uploaded documents via document viewer modal and verify credential authenticity.
4. **Clearance Approval**: Admin updates profile status to `Approved` or `Verified`. Only approved voters receive access to active digital ballots.

---

## Category 7: Frontend Engineering & Performance

### Q15: How is code splitting configured in Vite to handle heavy libraries like TensorFlow.js?
**Answer:**
In `vite.config.ts`, `manualChunks` divides code into dedicated vendor chunks:
- `vendor-react`: React, React DOM.
- `vendor-tensorflow`: `@tensorflow/tfjs`, `face-landmarks-detection`.
- `vendor-ui`: Lucide icons, Motion animation utilities.
- `vendor-charts`: Recharts library.

This prevents initial page loads from blocking on TensorFlow AI model downloads until the user enters the biometric verification flow.

---

## Category 8: Tough Examiner Questions & Defense Scenarios

### Q16: "What happens if a user's network connection drops right after face verification but before clicking Submit Vote?"
**Answer:**
Biometric verification tokens (`verificationId`) are time-limited (10 minutes TTL). If the connection drops before casting the ballot, no vote record is created in MongoDB. Upon reconnecting, the voter can re-verify their face and submit their ballot cleanly.

### Q17: "Is voter anonymity preserved if votes are stored in MongoDB with a `userId` field?"
**Answer:**
In the production architecture, ballot casting decouples voter identity from candidate choice using a two-table design:
1. `vote_receipts` table stores `{ userId, electionId, receiptHash, timestamp }` (proving participation).
2. `anonymous_ballots` table stores `{ electionId, candidateId, encryptedHash }` (recording the vote choice without voter identity linkage).

### Q18: "What if an attacker gains root access to the MongoDB server? Can they tamper with election results?"
**Answer:**
1. Votes are cryptographically hashed; any direct modification breaks the receipt hash chain.
2. In-memory audit logging logs database modifications.
3. In future enterprise rollouts, election tallies can be mirrored to a decentralized Immutable Blockchain Ledger (Hyperledger Fabric or Ethereum L2).
