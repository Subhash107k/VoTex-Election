# 🗳️ VoTex - Secure Digital Voting & Biometric Election Management Platform

<div align="center">

![VoTex Header Banner](https://img.shields.io/badge/VoTex-Digital%20Democracy%20Platform-059669?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bS0xLTVoMnY2aC0ydi02em0wLTRoMnYyaC0ydi0yeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express 4.22](https://img.shields.io/badge/Express-4.22-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB 7.3](https://img.shields.io/badge/MongoDB-7.3-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22-FF6F00?style=flat-square&logo=tensorflow)](https://www.tensorflow.org/js)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Author](https://img.shields.io/badge/Author-Subhash%20Sharma-007ACC?style=flat-square&logo=github)](https://github.com/Subhash107k)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**An enterprise-grade, secure digital voting platform engineered with real-time biometric face verification, multi-layer identity validation, and tamper-proof ballot tallying.**

**Author**: **[Subhash Sharma](https://github.com/Subhash107k)**

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Biometric Engine](#-biometric-face-verification-engine) • [Tech Stack](#-technology-stack) • [Installation](#-getting-started) • [API Guide](#-api-endpoints) • [Viva Q&A](#-viva--project-defense-guide) • [Author](#-author)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [🔒 Biometric Identity & Verification](#-biometric-identity--verification)
  - [🇳🇵 Nepali Electoral & Census System](#-nepali-electoral--census-system)
  - [🗳️ Voter & Ballot Casting Engine](#-voter--ballot-casting-engine)
  - [👨‍💼 Candidate Management Portal](#-candidate-management-portal)
  - [🛡️ Administrative Control Console](#-administrative-control-console)
- [System Architecture](#-system-architecture)
- [Biometric Face Verification Engine](#-biometric-face-verification-engine)
- [Project Directory Topology](#-project-directory-topology)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Running Development Server](#running-development-server)
  - [Building for Production](#building-for-production)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Security Posture](#-security-posture)
- [Viva & Project Defense Guide](#-viva--project-defense-guide)
- [Author](#-author)
- [License](#-license)

---

## 🌟 Overview

**VoTex** is a modern, end-to-end digital election and biometric voter authentication platform designed to eliminate electoral fraud, voter impersonation, and ballot tampering. By combining **client-side WebGL-accelerated facial landmark analysis**, **server-side 128-dimensional embedding matching**, and **strict MongoDB atomic single-vote constraints**, VoTex enables transparent, accessible, and tamper-resistant elections.

### Core Objectives
1. **Prevent Fraud & Impersonation**: Multi-factor identity validation matching official National ID (NID), Citizenship credentials, and live facial biometrics.
2. **One Voter, One Vote Guarantee**: Enforced via cryptographic vote receipt generation and atomic compound indexes (`{ user: 1, electionId: 1 }`).
3. **Accessibility & Usability**: Full Nepali localization support (Devanagari script input, address pickers for 7 Provinces and 77 Districts), responsive mobile-first UI, and offline-capable PWA capabilities.
4. **Auditability**: Immutable audit trail logging all registration reviews, biometric checks, login attempts, and election lifecycle changes.

---

## ✨ Key Features

### 🔒 Biometric Identity & Verification
- **Real-Time Facial Landmark Tracking**: Uses MediaPipe Face Mesh & `@vladmandic/face-api` (SSD MobileNet v2) to extract 68 3D facial landmarks directly in browser WebGL canvas.
- **Anti-Spoofing & Liveness Detection**: Monitors head rotation (pitch, yaw, roll), eye blink patterns, and bounding box ratios to prevent photo/video replay attacks.
- **Biometric Matching**: Compares live captured facial feature embeddings (128-d vector) against registered ID photos using Cosine Similarity and Inverse RMSE distance metric algorithms with configurable confidence thresholds.
- **Biometric Consent Protocol**: GDPR/Privacy-compliant explicit consent tracking before camera initialization and embedding storage.

### 🇳🇵 Nepali Electoral & Census System
- **Hierarchical Address Resolution**: Cascading pickers covering all 7 Provinces, 77 Districts, Municipalities/Gaunpalikas, and Ward numbers.
- **Permanent & Temporary Residence**: Handles both permanent voter roll addresses and temporary migration tracking.
- **Official Credentials Validation**: Formats and validates Citizenship Certificate Numbers, National Identity (NID) numbers, and Voter Card Numbers.
- **Family Demographics Linkage**: Supports linking spouse, parents, and children for census verification.

### 🗳️ Voter & Ballot Casting Engine
- **Active Election Feed**: Filterable list of ongoing, upcoming, and past national, provincial, and local elections.
- **Pre-Vote Biometric Gatekeeper**: Mandatory real-time face scan prior to revealing active digital ballot.
- **Cryptographic Ballot Receipt**: Generates a unique SHA-256 vote transaction hash upon ballot submission for voter verification.
- **Live Result Telemetry**: Real-time turnout counters and interactive vote distribution charts powered by Recharts and WebSockets.

### 👨‍💼 Candidate Management Portal
- **Candidate Profiles**: Comprehensive party affiliation, manifesto publication, education background, and campaign logo/photo management.
- **Public Profile Verification**: Dedicated candidate landing pages for voter education.

### 🛡️ Administrative Control Console
- **Voter Approval Workflow**: Review queues for pending voter registrations with document previewers (Citizenship front/back, NID, Photo).
- **Election Lifecycle Management**: Full CRUD operations to create elections, add candidates, configure voting start/end windows, pause/resume, or finalize results.
- **Audit Console**: Comprehensive, searchable audit logs tracking system events with IP address, user-agent, and status metadata.
- **Notification Broadcaster**: In-app, SMS (Twilio), and Email (Nodemailer) notification engine.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Client Layer (React 19 + Vite 6)
        UI[React Single Page App]
        PWA[Service Worker PWA]
        TF[TensorFlow.js / MediaPipe]
        Canvas[WebGL Facial Mesh Canvas]
    end

    subgraph API Gateway & Server (Node.js + Express)
        Router[Express Router]
        AuthMW[JWT Auth & RBAC Middleware]
        BioMW[Biometric Consent & Gatekeeper]
        RateMW[Rate Limiters & Helmet Security]
        Validator[Zod & Express Validator]
    end

    subgraph Service & Processing Layer
        BioService[Face Verification Service]
        AuditService[Audit Log Service]
        NotifService[Notification Engine - Email/SMS]
        FraudService[Fraud Detection Engine]
    end

    subgraph Data Store (MongoDB 7.3)
        UserCol[(Users & Profiles)]
        ElectionCol[(Elections & Candidates)]
        VoteCol[(Votes Ledger)]
        AuditCol[(Audit Logs)]
    end

    UI --> TF
    TF --> Canvas
    UI --> Router
    Router --> RateMW
    RateMW --> AuthMW
    AuthMW --> BioMW
    BioMW --> Validator
    Validator --> BioService
    Validator --> AuditService
    Validator --> NotifService
    Validator --> FraudService
    BioService --> UserCol
    AuditService --> AuditCol
    NotifService --> UserCol
    FraudService --> UserCol
    Validator --> ElectionCol
    Validator --> VoteCol
```

---

## 🔬 Biometric Face Verification Engine

The facial recognition engine operates in a hybrid client-server model:

1. **Client-Side Landmark Capture**:
   - Camera stream rendered to HTML5 Canvas.
   - SSD MobileNet v2 detects face bounding box.
   - 68 keypoint facial landmarks mapped in real-time.
   - Head orientation angles (yaw, pitch, roll) calculated to ensure user faces camera.

2. **Embedding Extraction & Matching Algorithm**:
   - 128-element normalized feature vector extracted from face canvas tensor.
   - Normalized feature vector sent to backend over HTTPS.
   - Backend compares live vector $\vec{L}$ against registered vector $\vec{R}$:
     $$\text{Cosine Similarity} = \frac{\vec{L} \cdot \vec{R}}{\|\vec{L}\| \|\vec{R}\|}$$
     $$\text{RMSE Inverse Distance} = \max\left(0, 1 - \sqrt{\frac{1}{n} \sum_{i=1}^{n} (L_i - R_i)^2}\right)$$
     $$\text{Final Score} = (\text{Cosine} \times 0.65) + (\text{Inverse Distance} \times 0.35)$$
   - Verification succeeds if Final Score $\ge \text{FACE\_MATCH\_THRESHOLD}$ (default `0.82`).

---

## 📁 Project Directory Topology

```
VoTex-Election/
├── controllers/                  # Backend Controller Modules
│   ├── auth.controller.ts        # Registration, Login, Profile updates
│   └── faceVerification.controller.ts # Biometric matching API endpoints
├── middleware/                   # Express Request Middleware
│   ├── audit.middleware.ts       # Automated audit trail logging
│   ├── biometricConsent.middleware.ts # Privacy consent verification
│   ├── deviceFingerprint.middleware.ts # Client hardware fingerprinting
│   ├── validation.middleware.ts  # Zod schema validation hooks
│   └── verifyFace.ts             # Pre-vote face scan authorization
├── routes/                       # Express Route Handlers
│   ├── auth.routes.ts            # Authentication & session routes
│   ├── faceVerification.routes.ts# Biometric verification routes
│   └── profiles.js               # Legacy profile REST endpoints
├── services/                     # Core Backend Domain Services
│   ├── audit.service.ts          # Audit collection wrapper
│   ├── cache.service.ts          # In-memory LRU key-value cache
│   ├── faceVerification.service.ts # Biometric comparison & similarity math
│   ├── fraudDetection.service.ts # Anomaly & duplicate account detection
│   ├── notification.service.ts   # Nodemailer & SMS transport
│   └── security.service.ts       # Crypto hashing & token utilities
├── src/                          # Frontend Application Code (React 19)
│   ├── App.tsx                   # Main Routing & App Shell Layout
│   ├── main.tsx                  # Application Entrypoint & Providers
│   ├── components/               # UI Component Hierarchy
│   │   ├── Admin/                # Admin Panel & Stats Dashboards
│   │   ├── auth/                 # Login, Register, Forgot Password
│   │   ├── common/               # Document Previews, Toast, Address Picker
│   │   ├── dashboard/            # Voter Dashboard, BiometricScanner, EditProfile
│   │   ├── documents/            # Citizenship Upload Previews
│   │   ├── elections/            # Election Card & Voting Interface
│   │   ├── face-verification/    # Camera View, Liveness Guide, Target Overlay
│   │   ├── public/               # Landing Page, Hero, Features, FAQ, Footer
│   │   └── ui/                   # Reusable Primitive UI Elements
│   ├── data/                     # Nepal Address & Geo JSON Data
│   ├── db/                       # Frontend & Server DB Abstractions
│   │   ├── dbService.ts          # MongoDB Connection & Native Driver Queries
│   │   └── schema.ts             # TypeScript Type & Validation Schemas
│   ├── hooks/                    # Custom React Hooks (useProfile, useAdmin, etc.)
│   ├── pages/                    # Top-Level Page Components
│   ├── services/                 # Frontend API Client & TensorFlow Loaders
│   └── utils/                    # Input Normalization & Form Validation Schemas
├── public/                       # Static Assets & ML Model Files
│   └── models/                   # TensorFlow / face-api pre-trained models
├── server.ts                     # Express App Initialization & API Gateway
├── vite.config.ts                # Vite 6 Configuration & Chunk Splitting Rules
├── tsconfig.json                 # TypeScript Compiler Options
└── package.json                  # Dependencies & Build Scripts
```

---

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.2.7` | User Interface & State Management |
| **Build Tooling** | Vite | `^6.4.3` | Bundling, HMR, Module Optimization |
| **Language** | TypeScript | `~5.8.3` | Strict Type Safety across Client & Server |
| **Styling** | Tailwind CSS | `^4.3.1` | Utility-first CSS Styling & Animations |
| **UI Motion** | Motion (Framer) | `^12.40.0` | Micro-interactions & Smooth Transitions |
| **Biometrics / AI** | `@vladmandic/face-api` | `^1.7.15` | Facial Detection & Feature Extraction |
| **AI Backend** | TensorFlow.js | `^4.22.0` | WebGL-accelerated Tensor Math |
| **Backend Server** | Node.js / Express | `^4.22.2` | REST API Server & Middleware Pipeline |
| **Database** | MongoDB Native Driver | `^7.3.0` | High-throughput Document Database |
| **Data Validation** | Zod | `^4.4.3` | Runtime Schema Validation |
| **Security Hashing** | BcryptJS / Crypto | `^3.0.3` | Password Hashing & SHA-256 Receipts |
| **Token Auth** | JsonWebToken | `^9.0.3` | Stateless Bearer Authentication |
| **Visualization** | Recharts | `^3.8.1` | Real-time Election Result Graphics |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (v20+ recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` OR MongoDB Atlas URI.
- **Webcam**: Functional camera for biometric face scan features.

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/votex/election-platform.git
   cd VoTex-Election
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `MONGODB_URI` points to your running MongoDB service).*

### Running Development Server

Start both the API server (`server.ts`) and Vite client:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000` (API proxying `/api` calls).

### Building for Production

Compile both the React SPA static assets and bundled Node server:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

---

## ⚙️ Environment Variables

Key configuration parameters in `.env`:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for Express API server |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/votex` | MongoDB Connection String |
| `JWT_SECRET` | `secret_key` | Secret used to sign authentication tokens |
| `JWT_EXPIRES_IN` | `24h` | Validity duration of access tokens |
| `FACE_MATCH_THRESHOLD` | `0.82` | Minimum similarity score required for face pass |
| `ENABLE_SMS_NOTIFICATIONS` | `false` | Enable Twilio SMS dispatch |
| `ENABLE_EMAIL_NOTIFICATIONS` | `false` | Enable Nodemailer email dispatch |

---

## 📡 API Endpoints Summary

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Create new voter account with baseline details.
- `POST /api/auth/login` - Authenticate user & receive JWT token.
- `GET /api/auth/me` - Retrieve authenticated user profile.
- `PUT /api/auth/complete-profile` - Submit comprehensive voter verification dossier.

### Biometric Routes (`/api/face-verification`)
- `POST /api/face-verification/enroll` - Store initial baseline facial biometric embedding.
- `POST /api/face-verification/verify` - Compare live face capture against baseline embedding.
- `GET /api/face-verification/status` - Check current user biometric verification state.

### Election & Voting Routes (`/api/elections`)
- `GET /api/elections` - Fetch list of published elections.
- `GET /api/elections/:id` - Fetch detailed election details & candidates.
- `POST /api/elections/:id/vote` - Cast ballot (requires pre-verified biometric session token).
- `GET /api/elections/:id/results` - Fetch real-time vote tally breakdown.

---

## 🛡️ Security Posture

- **Zero-Trust Token Model**: Protected routes require valid `Bearer <JWT>` tokens.
- **Biometric Security**: Raw face images are processed locally in WebGL canvas tensors; only mathematical embeddings (128-d arrays) and SHA-256 hashes are stored.
- **Double Voting Prevention**: MongoDB compound unique index `{ userId: 1, electionId: 1 }` prevents duplicate ballot entries at the database level.
- **Protection Headers**: Configured with `Helmet` (CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff).
- **Rate Limiting**: Express rate limiters protect authentication endpoints against brute force attacks.

---

## 🎓 Viva & Project Defense Guide

Planning to present VoTex for an academic project defense or technical viva? Refer to our comprehensive guide containing **30+ detailed questions & answers** covering architecture, biometric AI, security, and database design:

👉 **[Read the Full VoTex Viva Questions & Defense Guide](VOTEX_VIVA_QUESTIONS_AND_ANSWERS.md)**

---

## 👨‍💻 Author

Created & Maintained by **[Subhash Sharma](https://github.com/Subhash107k)**

- **GitHub Profile**: [github.com/Subhash107k](https://github.com/Subhash107k)
- **Repository**: [VoTex-Election Platform](https://github.com/Subhash107k/VoTex-Election)

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.