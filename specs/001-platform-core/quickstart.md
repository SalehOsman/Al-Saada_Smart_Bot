# Platform Core Quick Start

**Feature**: Platform Core (Layer 1)
**Branch**: `001-platform-core`
**Date**: 2026-02-17

## Prerequisites

- Node.js ≥20 (check with `node --version`)
- Docker & Docker Compose (v2.3+)
- Git (for repository operations)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Setup Instructions

### 1. Requirements

- Node.js 20+ (check with `node --version`)
- Docker & Docker Compose
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### 2. Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd _Al-Saada_Smart_Bot

# Copy environment template
cp .env.example .env

# Start infrastructure services (PostgreSQL, Redis)
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Start the bot
npm run dev
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Environment Variables:**

```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/al_saada_bot"
DATABASE_SSL=false

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
LOG_FORMAT=pino-pretty

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Admin Configuration
INITIAL_SUPER_ADMIN_ID=123456789  # Telegram ID of first Super Admin (see spec.md FR-014)
```

### 4. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### 5. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Verify database connection
npx prisma db seed  # If you have seed files
```

### 6. Development Mode

```bash
# Start in development mode with hot reload
npm run dev

# Or start specific package
cd packages/core
npm run dev
```

**Expected Output:**
```
🚀 Al-Saada Smart Bot - Platform Core
📝 Environment: development
🔗 Database: Connected (PostgreSQL)
🔄 Redis: Connected
🌐 Webhook: http://localhost:3000/webhook
✅ Bot started successfully
Bot is running in webhook mode...
```

### 7. Test Bot Functionality

1. **Open Telegram** and find your bot
2. **Send `/start`** to the bot
3. **First user experience:**
   - You should see a welcome message in Arabic
   - Bot asks for your name and phone number
   - Submit the join request
   - You automatically become Super Admin
   - Bot shows admin menu

4. **Test features:**
   - Run verification `curl http://localhost:3000/health`. Should return a healthy status if the bot is running properly.
   - Run `/start` to trigger the bootstrap or standard menu flow.
   - Run `/sections` to manage section hierarchies (Super Admin only).
   - Run `/users` to manage and assign scopes to users (Super Admin only).
   - Run `/maintenance` to toggle the maintenance mode filter (Super Admin only).
   - Run `/settings` to configure global language, notifications and backup configurations.
   - Run `/audit` to view system events trailing.

### 8. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "RBAC"
```

**Expected Coverage:** Minimum 80% for engine code

### 9. Build for Production

```bash
# Build for production
npm run build

# Test production build
npm start
```

## Backup & Restore (FR-036)

The bot supports an automated backup system integrated with PostgreSQL via the Settings menu (`/settings`). 
Docker is configured with a `backup_data` volume mounted at `/backups` so PostgreSQL `pg_dump`/`pg_restore` binaries can easily extract raw databases.
Through the bot's interface, Super Admins can interactively:
1. Trigger a manual `.sql` backup on-the-fly.
2. Download historical backups through Telegram interface.
3. Automatically restore a selected point-in-time configuration using an interactive keyword challenge confirmation prompt.

## Production Deployment & Monitoring

### Uptime Monitoring (SC-008, T101)

For production deployment health and automatic alerts, external uptime monitoring is strictly recommended to maintain 99.9% application uptime:

**Recommended Tools:**
- **UptimeRobot** (Free tier): Monitor HTTP/HTTPS endpoints.
- **Healthchecks.io**: Monitor webhook endpoints natively.

**Configuration:**
- It is highly recommended to monitor the `/health` endpoint (`http://localhost:3000/health`) closely at an interval of **every 60 seconds**.
- Docker `healthcheck` attributes are already statically configured within `docker-compose.yml` for PostgreSQL, Redis, and the main Bot instance ensuring auto-restart propagation capabilities locally.

**Alert Setup:**
- Notify the maintainers on consecutive failures (e.g. 2-3 consecutive health failures)
- Set up notification channels natively for Discord, Slack, or Email.

### Common Commands

### Bot Commands (in Telegram)
- `/start` - Bootstrap new user or show main menu
- `/sections` - View and manage sections, and sub-sections (Super Admin only)
- `/users` - View and manage users and Admin Scopes (Super Admin only)
- `/maintenance` - Show maintenance mode options control (Super Admin only)
- `/settings` - Show core platform settings, language defaults, and backups configuration. (Super Admin only)
- `/audit` - View recent system audit trail logs (Super Admin only)

### Development Commands
```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

## Troubleshooting

### Bot Not Responding
1. Check bot token is correct
2. Verify webhook URL is accessible
3. Check bot status in Telegram
4. Review logs: `docker-compose logs bot`

### Database Connection Issues
1. Ensure PostgreSQL is running: `docker-compose logs postgres`
2. Check database URL in .env file
3. Verify credentials have correct permissions
4. Run migrations: `npx prisma migrate dev`

### Redis Connection Issues
1. Ensure Redis is running: `docker-compose logs redis`
2. Check Redis URL in .env file
3. Verify Redis password if configured

### Module Discovery Not Working
1. Ensure modules/ directory exists at project root
2. Check module.config.ts files are valid
3. Review logs for module discovery warnings

### Tests Failing
1. Ensure all dependencies are installed
2. Check database is running for integration tests
3. Verify environment variables are set correctly
4. Run tests with verbose output: `npm test -- --verbose`

## Next Steps

1. **Deploy to production** when testing is complete
2. **Set up monitoring** for database and Redis
3. **Configure backups** for PostgreSQL data
4. **Set up CI/CD** pipeline for automated deployments
5. **Document API** for integration with future modules

## Support

For issues related to this feature:
1. Check existing issues in the repository
2. Create new issue with detailed description
3. Include logs and reproduction steps
4. Specify environment and version information

## Related Documentation

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [Research Report](./research.md)
- [Constitution](../../.specify/memory/constitution.md)