# Al-Saada Smart Bot — Documentation

**Al-Saada Smart Bot** is an extensible, 3-layer Telegram bot platform focusing on strict i18n, structured module development, and a planned AI Assistant layer.

**Tech Stack**: Node.js (>= 20), TypeScript (Strict), grammY (Conversations & Hydrate), PostgreSQL + Prisma, Redis, Docker.

## Quick Links

| Document | Description | Audience | Lang |
|----------|-------------|----------|------|
| [Architecture](developer/architecture.md) | 3-Layer Architecture and Infrastructure | Developer | EN |
| [Getting Started](developer/getting-started.md) | Developer onboarding (Local setup, Docker, Scripts) | Developer | EN |
| [CLI Cheatsheet](developer/cli-cheatsheet.md) | Complete command reference for development & operations | Developer | EN |
| [Platform Core Reference](developer/platform-core-reference.md) | Layer 1 API reference (Services, Utilities, Middleware) | Developer | EN |
| [Module Kit Reference](developer/module-kit-reference.md) | Layer 2 API reference (validate, confirm, save, draft) | Developer | EN |
| [Module Development Guide](developer/module-development-guide.md) | Guide for building new modules | Developer | EN |
| [Database Schema](developer/database-schema.md) | Prisma multi-file schema and Entity Relationships | Developer | EN |
| [i18n Guide](developer/i18n-guide.md) | Internationalization guide and Fluent key catalogs | Developer | EN |
| [Testing Guide](developer/testing-guide.md) | Vitest testing strategies and patterns | Developer | EN |
| [AI Assistant Roadmap](developer/ai-assistant-roadmap.md) | Layer 4 Roadmap (Ollama, pgvector, Qwen) | Developer | EN |
| [User Guide](user/user-guide.md) | دليل استخدام البوت للمستخدم النهائي | User | AR |
| [Admin Guide](user/admin-guide.md) | دليل المشرف والمدير | User | AR |
| [FAQ](user/faq.md) | الأسئلة الشائعة | User | AR |
| [Methodology](project/methodology.md) | Project principles and development approach | PM | EN |
| [Project Backlog](project/backlog.md) | Pending features and improvement backlog | PM | EN |
| [Changelog](project/changelog.md) | Semantic versioning changelog | PM | EN |
| [SpecKit Reference](project/speckit-reference.md) | Custom tool commands for requirement specs | PM | EN |

## Project Status
- **Implemented**: Layer 1 (Platform Core), Layer 2 (Module Kit).
- **Planned**: Layer 3 (Modules), Layer 4 (AI Assistant), BullMQ notifications, Section Management.

## Available Specifications
- `001-platform-core`: Foundation of the bot, RBAC, services.
- `002-ai-assistant`: AI layer using LLMs and RAG.
- `003-module-kit`: Strict validation and drafting flow framework.

## API Reference
**Run `npm run docs:api` to generate TypeDoc API reference locally.** The generated static site will be placed in `docs/api/`.
