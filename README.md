# 🗳️ VoTex - Secure Digital Voting Platform

<div align="center">

![VoTex Logo](https://img.shields.io/badge/VoTex-Secure%20Digital%20Democracy-059669?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bS0xLTVoMnYyaC0ydi0yem0wLTRoMnY2aC0ydi02eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Biometric Voting Flow](#-biometric-voting-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**VoTex** is a full-stack digital voting platform designed for secure, transparent, and accessible elections. Built with modern web technologies, it combines biometric verification, cryptographic ballot protection, and an intuitive user interface to deliver a trustworthy voting experience.

### Key Principles

- **🔒 Security First** - Multi-factor biometric verification, encrypted ballots, and audit trails
- **👁️ Transparency** - Verifiable voting records with blockchain-ready receipts
- **♿ Accessibility** - WCAG-compliant interface with high-contrast and screen reader support
- **📱 Responsive** - Works on desktop, tablet, and mobile devices
- **🌐 Offline-Ready** - PWA support with service worker caching

---

## ✨ Features

### 🗳️ Voter Experience
- **Multi-step registration** with identity verification
- **Live face verification** with liveness detection
- **Fingerprint matching** for ballot authentication
- **Real-time election results** with visual charts
- **Personal voting history** and audit trail
- **Email/SMS notifications** for voting confirmations

### 👨‍💼 Candidate Portal
- **Campaign profile management** with photo and manifesto
- **Political party** affiliation and logo integration
- **Real-time vote counting** and analytics
- **Public profile** sharing with unique URLs
- **Verification status** tracking with history

### 🛡️ Admin Dashboard
- **User management** with approval workflows
- **Election creation** and lifecycle management
- **Candidate verification** and status updates
- **Audit logs** with advanced filtering
- **System statistics** and reporting
- **Notification broadcasting** to users

### 🔐 Security
- **Biometric verification** (face + fingerprint)
- **JWT authentication** with refresh tokens
- **Rate limiting** on all API endpoints
- **Account lockout** after failed attempts
- **2FA support** (SMS, email, authenticator)
- **Encrypted data** at rest and in transit
- **Audit logging** for all sensitive operations

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Frontend
        React[React 18 + Vite]
        Tailwind[TailwindCSS]
        TF[TensorFlow.js Face Detection]
        PWA[PWA Service Worker]
    end
    
    subgraph Backend
        Express[Express.js API]
        JWT[JWT Authentication]
        RateLimit[Rate Limiting]
        Validators[Zod Validation]
    end
    
    subgraph Database
        MongoDB[(MongoDB)]
        Cache[Redis Cache]
    end
    
    subgraph Services
        Email[Email Service]
        SMS[SMS Service]
        Biometric[Biometric Service]
        Audit[Audit Service]
    end
    
    React --> Express
    Express --> MongoDB
    Express --> Cache
    Express --> Email
    Express --> SMS
    Express --> Biometric
    Express --> Audit