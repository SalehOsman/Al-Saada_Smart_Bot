# Getting Started Guide

**Last Updated:** 2026-03-03

Welcome to the Al-Saada Smart Bot team! This guide will take you from a fresh git clone to running the bot locally.

---

## 1. Prerequisites

Ensure you have the exact versions of these tools installed:
- **Node.js**: `>=20`
- **npm**: `>=10`
- **Docker & Docker Compose**: Latest versions (for local infrastructure)
- **Git**

---

## 2. Step-by-Step Setup

### Step 1: Clone the Repository
```bash
git clone <repository_url>
cd _Al-Saada_Smart_Bot
```

### Step 2: Install Dependencies
The project uses strict npm workspaces to manage monorepo packages.
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file and configure it.
```bash
cp .env.example .env
```
Open `.env` and fill in the values (see the Environment Variables section below). At a minimum, you must supply your `BOT_TOKEN` obtained from [@BotFather](https://t.me/BotFather).

### Step 4: Start Infrastructure
Start the local PostgreSQL and Redis containers using Docker Compose.
```bash
npm run docker:up
```

### Step 5: Database Setup
Apply migrations and generate the Prisma Client for the database schemas.
```bash
npm run db:migrate
npm run db:generate
```

### Step 6: Start the Bot
Run the bot in development mode with hot-reloading.
```bash
npm run dev
```
*(Alternative: `npm run dev:watch` for file surveillance)*

---

## 3. Environment Variables Reference

Below are all variables found in `.env.example` with descriptions.

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `BOT_TOKEN` | Required: Telegram API Token from BotFather | `12345:ABC-def1234ghIkl-zyx5` |
| `WEBHOOK_URL` | Optional: Set to run in webhook mode instead of long polling. | `https://mybot.example.com` |
| `DATABASE_URL` | Required: Prisma connection string (Pointed at standard docker instance) | `postgresql://al_saada_user:secure_password_here@localhost:5434/al_saada_bot` |
| `REDIS_URL` | Optional: Redis connection string | `redis://localhost:6379` |
| `PORT` | Optional: Port for Hono HTTP server healthchecks | `3000` |
| `NODE_ENV` | Optional: development, production, test | `development` |
| `LOG_LEVEL` | Optional: Pino log verbosity (debug, info, warn, error) | `info` |
| `POSTGRES_USER` | Docker initialization parameter | `al_saada_user` |
| `POSTGRES_PASSWORD` | Docker initialization parameter | `secure_password_here` |
| `POSTGRES_DB` | Docker initialization parameter | `al_saada_bot` |

---

## 4. NPM Scripts Reference

All standard `npm run <script>` commands defined in `package.json`.

### General Scripts
- `npm run dev` — Starts the bot directly via `tsx`.
- `npm run dev:watch` — Starts the bot with `tsx watch` for auto-restarts on save.
- `npm run build` — Compiles the typescript bot into ESM formats via `tsup`.
- `npm run typecheck` — Runs `tsc --noEmit` across workspaces.

### Database Scripts
- `npm run db:migrate` — Executes `prisma migrate dev` to update the active dev schema.
- `npm run db:generate` — Executes `prisma generate` to update the TS Prisma Client after schema changes.
- `npm run db:studio` — Opens `prisma studio` on `localhost:5555` to view/edit database records graphically.

### Container Scripts
- `npm run docker:up` — Runs `docker-compose up -d` (spins up postgres/redis layers).
- `npm run docker:down` — Shuts down the local containers network.

### Quality and Testing
- `npm test` — Executes `vitest`.
- `npm run test:coverage` — Executes vitest coverage reports.
- `npm run test:watch` — Runs vitest watcher logic.
- `npm run lint` — Runs `eslint .` across all workspaces.
- `npm run lint:fix` — Formats and repairs basic ESLint violations automatically.
- `npm run docs:api` — Uses TypeDoc to generate technical codebase documents.

### Module Kit Scripts
- `npm run module:create` — Interactively scaffolds a new business feature layer.
- `npm run module:remove` — Reversibly removes an active module layer.
- `npm run module:list` — Utility logging of all registered Layer 3 modules.

---

## 5. Common Troubleshooting

### "Database Connection Refused"
- **Cause:** `POSTGRES_PASSWORD` in `.env` doesn't match the one you started Docker with, or Docker container is explicitly shut down.
- **Solution:** Verify the `.env` settings against `docker-compose.yml`, run `npm run docker:down`, then restart `npm run docker:up` to re-initialize containers correctly. Wait 10 seconds.

### "PrismaClient setup error" / Unknown Database fields
- **Cause:** Your DB Schema generated client is out of date versus `prisma/schema/*`.
- **Solution:** Run `npm run db:generate`.

### "Bot immediately exits with 'Already running'"
- **Cause:** A phantom node process is holding the bot connection or polling handle open.
- **Solution:** Force kill old node processes (`taskkill /F /IM node.exe` / `killall node`).

### Module Kit / CLI Generation Errors
- **Cause:** Scripts unable to find the `prisma` database locally when verifying relationships.
- **Solution:** The CLI hooks generally degrade gracefully with warning logs. Ensure `docker:up` is actually running prior to creating new modules.
