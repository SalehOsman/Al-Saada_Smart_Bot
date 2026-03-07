# Contributing to Al-Saada Smart Bot

Thank you for your interest in contributing! This document outlines the conventions and workflow for contributing to the project.

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

See the [Getting Started Guide](docs/developer/getting-started.md) for full setup instructions.

## Development Workflow

```bash
# 1. Fork & clone the repository
git clone https://github.com/<your-username>/Al-Saada_Smart_Bot.git
cd Al-Saada_Smart_Bot

# 2. Install dependencies
npm install

# 3. Start infrastructure
npm run docker:up

# 4. Setup database
npm run db:migrate
npm run db:generate

# 5. Start the bot in development mode
npm run dev
```

## Before Submitting

Run all quality checks before opening a pull request:

```bash
npm run typecheck   # TypeScript strict mode check
npm run lint        # ESLint
npm test            # Vitest (all tests must pass)
```

## Git Conventions

### Branch Naming

```
feat/<short-description>     # New features
fix/<short-description>      # Bug fixes
docs/<short-description>     # Documentation changes
chore/<short-description>    # Maintenance, dependencies, tooling
refactor/<short-description> # Code refactoring (no behavior change)
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`

**Scopes:** `core`, `module-kit`, `validators`, `prisma`, `i18n`, `spec`

**Examples:**
```
feat(core): add maintenance mode toggle command
fix(module-kit): handle Redis connection timeout in draft middleware
docs(spec): add language field to User Key Entity definition
chore: upgrade grammY to v1.25
```

## Code Style

- **TypeScript**: Strict mode enabled. No `any` types.
- **Semicolons**: No semicolons (ESLint enforced).
- **i18n**: All user-facing strings must use Fluent `.ftl` keys — never hardcoded strings.
- **Logging**: Use [Pino](https://github.com/pinojs/pino) logger. No `console.log`.

## Project Architecture

The project follows a **3-layer architecture**:

| Layer | Package | Description |
|-------|---------|-------------|
| Layer 1 | `packages/core/` | Platform Core (Bot, RBAC, Auth, Audit) |
| Layer 2 | `packages/module-kit/` | Module Kit (validate, confirm, save, drafts) |
| Layer 3 | `modules/` | Business modules (custom per organization) |

See [Architecture Overview](docs/developer/architecture.md) for details.

## Adding a New Module

```bash
npm run module:create    # Interactive CLI
```

See [Module Development Guide](docs/developer/module-development-guide.md) for the full guide.

## Documentation

- **Developer docs**: `docs/developer/` (English)
- **User docs**: `docs/user/` (Arabic)
- **Project docs**: `docs/project/` (English)
- **Full index**: [docs/README.md](docs/README.md)

## Need Help?

- Review the [FAQ](docs/user/faq.md)
- Check the [CLI Cheatsheet](docs/developer/cli-cheatsheet.md)
- Open an issue on GitHub
