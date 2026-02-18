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
