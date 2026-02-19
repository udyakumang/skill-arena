# AGENTS.md

## Project Overview
**Skill Arena (Train-Your-Mind)** is a cognitive growth engine disguised as a competitive game.
It enforces strict mastery (Math first) using a deterministic generator, adaptive difficulty, and a ranked ladder system.

## Stack
- **Framework**: Next.js 14 App Router
- **DB**: Neon Postgres aimed (via Prisma)
- **Auth**: Auth.js (v5)
- **Cache**: Upstash Redis
- **Language**: TypeScript (Strict)

## Setup & Run
1. `npm install`
2. `cp .env.example .env.local` (Get keys from 1Password or ask User)
3. `npx prisma generate`
4. `npm run dev` in one terminal.
5. `npm test` to run logic tests (Jest/Vitest).

## Coding Conventions
- **core/**: PURE FUNCTIONS ONLY. No DB calls. No React. Testable math/logic.
- **components/**: UI only. Use Framer Motion for 2D feel.
- **app/**: Server actions and route handlers live here.
- **lib/**: Database/Auth adapters.

## Critical Workflows
- **Mastery Update**: Occurs after every `SessionItem`. Must be atomic.
- **Rank Update**: Occurs after `RankedSession` completion. Uses ELO-like CR system.
- **Content Generation**: Deterministic. `(seed, difficulty, skill) -> { question, answer }`.

## Testing
- valid: `npm run lint`
- test: `npm test`

## Phase 11: Offline-First PWA & Sync Strategy

### 1. Local Content Engine
- **Purpose**: Generates questions/challenges deterministically on the client without internet or LLM access.
- **Mechanism**:
    - `src/core/localContentEngine/engine.ts`: Main engine.
    - `Blueprints`: Templates for questions (e.g., Math Addition, Logic Puzzles).
    - `SeededSampler`: Ensures the same seed produces the same content, crucial for anti-cheat and replayability.
    - **Usage**: `localEngine.generateContent(skillId, difficulty, seed)`

### 2. Offline Queue (Idempotency)
- **Purpose**: Ensures critical user actions (purchases, submissions) are not lost when offline.
- **Mechanism**:
    - `src/lib/api-client.ts`: Wraps `fetch`. Intercepts POST requests when offline.
    - `src/lib/offline-sync/queue.ts`: Persists requests to IndexedDB.
    - `src/lib/offline-sync/storage.ts`: IndexedDB wrapper.
    - **Replay**: Auto-replays queued requests when `navigator.onLine` becomes true or via manual "Sync Now" button.
    - **Safety**: Uses `idempotencyKey` to prevent duplicate processing on server (handled by `src/lib/idempotency.ts` and middleware).

### 3. Sync Protocol
- **Push**: `POST /api/sync/push`
    - Client sends local state changes (completed levels, coins spent locally).
    - Server merges with simple "Server Wins" or "Max Value" strategy (e.g., for high scores).
- **Pull**: `GET /api/sync/pull`
    - Client fetches latest server state on load/online.
    - Hydrates local Redux/Context state.

### 4. PWA Features
- **Manifest**: `public/manifest.json` for installability.
- **Service Worker**: `public/sw.js` (Workbox) caches App Shell and API GET requests.
- **UI**: `OfflineIndicator` and `SyncStatus` components provide real-time feedback.
