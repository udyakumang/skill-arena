# Skill Arena (Train-Your-Mind)

> A cognitive growth engine wrapped inside a competitive arena.

## The Vision
We are building a system where learning feels like a sport.
- **Mastery Engine**: Measures true skill depth, not just correct answers.
- **Adaptive Arena**: Difficulty scales dynamically with your performance.
- **Global Ladders**: Compete in leagues based on skill (CR), not grind.

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma + Neon Postgres**
- **Auth.js**
- **Upstash Redis**

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env.local` and properly configure:
   - `DATABASE_URL` (Neon Postgres)
   - `AUTH_SECRET` (Auth.js)
   - `UPSTASH_REDIS_REST_URL` & `TOKEN`

3. **Database**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Run Tests**:
   ```bash
   npm test
   ```

## Architecture
- `src/core`: **The Brain**. Domain logic for mastery, rating, and adaptive difficulty.
- `src/app`: **The Body**. Next.js routes and pages.
- `src/components`: **The Face**. UI and animations.
