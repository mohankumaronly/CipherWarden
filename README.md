# 🔐 CipherWarden

A zero-knowledge, Bitwarden-style password manager built with React, Express, and WebCrypto.

[![Version](https://img.shields.io/badge/version-v2.0.0-blue.svg)](https://github.com/mohankumaronly/CipherWarden)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

---

## Overview

CipherWarden is an end-to-end encrypted, self-hosted password and credential vault designed with a strict zero-knowledge architecture. All sensitive data is encrypted client-side in the browser using the Web Cryptography API before any payload reaches the network. **The server never sees your master key, your DEK, or your plaintext data.**

---

## Features (Version 2.0)

- **Multi-Item Vault:** Store both Logins and Payment Cards in a unified, strongly typed vault schema.
- **Organization:** Custom Folders, Favorites, and Type filters (Login/Card).
- **Bitwarden-Style UI:** Full-width data table with a responsive collapsible sidebar for mobile.
- **Password Generator:** Built-in CSPRNG generator (Password, Passphrase, PIN) with rejection sampling. See the [Password Generator documentation](frontend/src/features/generator/README.md) for configuration and entropy details.
- **Privacy-First Favicons:** Backend proxy fetches site icons without leaking user IPs to third parties.
- **Session Security:** HttpOnly cookies, CSRF protection, and auto-lock on inactivity.

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser ["Client Browser (WebCrypto, VaultContext)"]
        direction TB
        UI["Bitwarden UI / VaultContext"]
        Crypto["Argon2id (KEK) + AES-256-GCM (DEK)"]
        UI <--> Crypto
    end

    subgraph Backend ["Express Server (VaultItem API, Favicon Proxy)"]
        direction TB
        API["VaultItem API (/credentials)"]
        FolderAPI["Folder API (/folders)"]
        Favicon["Favicon Proxy (/favicon)"]
        Session["Session & CSRF Middleware"]
    end

    subgraph Database ["PostgreSQL (Prisma ORM)"]
        direction TB
        DB[("vault_items, folders, sessions, vaults")]
    end

    Crypto <--"Encrypted Ciphertext & Nonce"--> API
    API <--> DB
    FolderAPI <--> DB
    Session <--> DB
```

The AAD for AES-GCM binds every item to `vaultId + itemId + encryptionVersion`. Ciphertext is not portable between items or vaults.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, TypeScript, React Router, Lucide React, Web Cryptography API |
| **Backend** | Node.js 24 (Node >=20), Express 5, TypeScript, Prisma ORM, Zod, Helmet, express-rate-limit |
| **Database** | PostgreSQL (Neon serverless compatible) via Prisma ORM |
| **Crypto** | Argon2id (`hash-wasm`), AES-256-GCM (`crypto.subtle`), server-side Argon2 verifier hashing |
| **Tooling** | Oxlint, Jest / Node.js test runner, TSX, Postman |

---

## Project Structure

```text
CipherWarden/
├── backend/
│   ├── prisma/
│   │   ├── migrations/              # Prisma schema migrations
│   │   └── schema.prisma            # Vault, VaultItem, Folder, Session, AuditLog models
│   └── src/
│       ├── common/                  # Error handling, response utilities, middleware
│       ├── config/                  # Environment validation & Prisma client instance
│       ├── modules/
│       │   ├── audit/               # Security audit logging
│       │   ├── favicon/             # Privacy-preserving favicon proxy
│       │   ├── folders/             # Folder CRUD operations
│       │   ├── items/               # Unified VaultItem CRUD (Logins & Cards)
│       │   ├── session/             # Session store & lifecycle management
│       │   └── vault/               # Vault setup, unlock, lock & key-envelope rotation
│       ├── app.ts                   # Express application setup & middleware pipeline
│       └── server.ts                # Bootstrap & database connectivity check
├── frontend/
│   └── src/
│       ├── components/ui/           # Common UI elements (Button, Input, Dialog, Toast, Spinner, Logo)
│       ├── contexts/
│       │   └── VaultContext.tsx     # In-memory DEK state, favorites toggle & folder assignment
│       ├── crypto/                  # WebCrypto AES-GCM, Argon2id KDF & key-wrapping helpers
│       ├── features/
│       │   ├── cards/               # CardFormDialog, CardRow
│       │   ├── credentials/         # CredentialFormDialog, CredentialRow
│       │   ├── dashboard/           # Sidebar, VaultTable, NewItemMenu, QuickFolderMenu
│       │   └── generator/           # Password, Passphrase & PIN controls and README
│       ├── layouts/                 # AppLayout, VaultLayout, MarketingLayout
│       ├── pages/                   # LandingPage, SetupVaultPage, UnlockVaultPage, DashboardPage
│       └── services/                # API clients (api, vaultApi, folderApi, vaultItemApi)
├── CipherWarden.postman_collection.json
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js **>= 20** (tested on Node 22 and 24)
- PostgreSQL database (local instance or [Neon](https://neon.tech))
- npm or pnpm

### 2. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure your environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` contains:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://user:password@host:5432/cipherwarden?sslmode=require"
   CLIENT_ORIGIN=http://localhost:5173
   SESSION_SECRET=your_64_byte_hex_session_secret
   SESSION_DURATION_MINUTES=30
   COOKIE_NAME=CipherWarden
   COOKIE_SECURE=false
   COOKIE_SAME_SITE=lax
   TEST_MODE=true
   TEST_API_KEY=test_sk_your_random_key_here
   MASTER_KEY=YourSelfHostedMasterKeyHere
   ```
3. Run migrations and generate the Prisma client:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000/api/v1`.

### 3. Frontend Setup
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
2. Configure environment settings in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open **http://localhost:5173** in your browser.

> **Note on CORS:** The frontend must run on the exact port specified in the backend's `CLIENT_ORIGIN` (default `http://localhost:5173`) or CORS will block requests.

---

## API Reference

Base URL: `/api/v1`

| Module | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Vault** | `GET` | `/vault/metadata` | Public | Returns KDF parameters, salt, and wrapped key envelope |
| **Vault** | `POST` | `/vault/setup` | Public | Initializes vault configuration and master key verifier |
| **Vault** | `POST` | `/vault/unlock` | Verifier | Validates auth verifier proof and establishes HTTP session cookie |
| **Vault** | `POST` | `/vault/lock` | Session | Destroys current session and clears server session token |
| **Vault** | `PUT` | `/vault/key-envelope` | Session | Rotates wrapped DEK envelope |
| **Vault Items** | `GET` | `/credentials` | Session | Lists all encrypted vault items for the authenticated vault |
| **Vault Items** | `POST` | `/credentials` | Session | Creates a new encrypted vault item (LOGIN or CARD) |
| **Vault Items** | `GET` | `/credentials/:id` | Session | Fetches a single encrypted vault item by ID |
| **Vault Items** | `PUT` | `/credentials/:id` | Session | Updates item ciphertext or metadata (optimistic concurrency via `expectedRecordVersion`) |
| **Vault Items** | `DELETE` | `/credentials/:id` | Session | Permanently deletes a vault item |
| **Folders** | `GET` | `/folders` | Session | Lists all user-created organizational folders |
| **Folders** | `POST` | `/folders` | Session | Creates a new folder |
| **Folders** | `DELETE` | `/folders/:id` | Session | Deletes a folder (items in the folder revert to unassigned) |
| **Favicon Proxy**| `GET` | `/favicon?domain=example.com` | Public | Proxies and caches 64px website favicons without leaking user IP |
| **Security** | `GET` | `/csrf` | Session | Returns CSRF token for the active session |
| **Health** | `GET` | `/health` | Public | Liveness probe returning status and uptime |

*(Note: The vault items endpoint path remains `/credentials` for backward compatibility, while the underlying data model and wire schema represent the polymorphic `VaultItem`).*

---

## Testing

### Unit & Security Test Suite
CipherWarden includes test suites for client-side cryptographic primitives and CSPRNG generation:
```bash
cd frontend
node --test src/crypto/__tests__/passwordGenerator.test.ts
```
The test suite runs 19 automated tests verifying:
- CSPRNG character distribution and statistical entropy.
- Ambiguous character omission (`Il1O0o`).
- PIN and passphrase generation formatting.
- Rejection sampling correctness.
- Static assertion that `Math.random`, `console.*`, and persistent storage APIs (`localStorage`/`sessionStorage`) are never touched by the generator.

### API Integration Testing with Postman
A comprehensive, ready-to-run Postman collection is located at the root of the repository:
**`CipherWarden.postman_collection.json`**

Import the collection into Postman, set the `baseUrl` collection variable to `http://localhost:5000/api/v1`, and provide your `testApiKey` to run end-to-end API workflows across vault setup, unlock, item CRUD, folder assignment, and locking.

---

## Security & Threat Model

- **The Master Key is Never Transmitted:** Key derivation happens entirely on the client using Argon2id. Only an authentication verifier proof is ever sent to the backend.
- **Envelope Encryption (DEK Wrapped by KEK):** The Data Encryption Key (DEK) is generated on the client, wraps vault secrets with AES-256-GCM, and is stored on the server only in wrapped form using the Key Encryption Key (KEK).
- **Authenticated Additional Data (AAD) Binding:** Every vault item binds `vaultId + itemId + encryptionVersion` as AAD during AES-GCM encryption. Ciphertext cannot be copied or replayed across records or vaults.
- **Hardened Session Isolation:** Sessions use HttpOnly, SameSite=Lax cookies with server-side token hashing and custom CSRF protection tokens for state-mutating requests.
- **Zero-Knowledge Design (No Password Reset):** There is no account recovery or password reset mechanism by design. Without the master key, ciphertext cannot be decrypted.

---

## License

This project is licensed under the [MIT License](LICENSE).
