# Research Report: Platform Core (Layer 1)

**Date**: 2026-02-17
**Feature**: Platform Core (Layer 1) for Al-Saada Smart Bot
**Research Focus**: Technical stack validation, architecture decisions, and best practices

## Technology Stack Decisions

### 1. Bot Framework: grammY 1.x
**Decision**: Use grammY 1.x with @grammyjs/conversations and @grammyjs/hydrate
**Rationale**:
- grammY is the most mature, actively maintained TypeScript bot framework
- Excellent TypeScript support with strict type safety
- @grammyjs/conversations provides conversation handling capabilities
- @grammyjs/hydrate enables session state management
- Middlewares architecture aligns with our security requirements
- Proven performance in production environments

**Alternatives Considered**:
- Telegraf: More complex, heavier footprint
- BotKit: Less TypeScript-focused, declining community support
- Custom implementation: Too much development overhead

### 2. Webhook Server: Hono
**Decision**: Use Hono for webhook endpoint
**Rationale**:
- Lightweight (only 10kB bundle size)
- Built-in TypeScript support
- Excellent performance for webhook handling
- Compatible with grammY middleware ecosystem
- No unnecessary dependencies

### 3. Database: PostgreSQL 16 with Prisma ORM
**Decision**: PostgreSQL 16 with Prisma ORM
**Rationale**:
- Strong typing required for audit trail and user management
- Prisma provides excellent TypeScript integration
- Migrations support schema evolution
- Performance suitable for 200 users
- JSONB support for audit log details
- Production-ready with robust transaction support

**Alternatives Considered**:
- MongoDB: Weaker typing, less suitable for audit trails
- SQLite: Not suitable for production use
- MySQL: Similar to PostgreSQL but Prisma support is better

### 4. Caching/Session: Redis 7 with ioredis
**Decision**: Redis 7 with ioredis client
**Rationale**:
- Fast session access required for bot state persistence
- 24-hour TTL support matches session requirements
- ioredis provides TypeScript support and connection pooling
- Performance critical for 100+ concurrent users
- Session storage adapter available for grammY

### 5. Task Queue: BullMQ
**Decision**: BullMQ for background notifications
**Rationale**:
- Queue-based processing prevents blocking main bot thread
- Persistent job queue survives bot restarts
- Built-in rate limiting and retry mechanisms
- TypeScript support with proper typing
- Mature ecosystem with good documentation

### 6. Validation: Zod
**Decision**: Zod for all input and environment validation
**Rationale**:
- TypeScript-first validation with excellent type inference
- Runtime validation with clear error messages
- Environment variable schema validation
- Perfect integration with form validation (future Flow Blocks)
- Schema composition and reuse capabilities

### 7. Internationalization: @grammyjs/i18n with Fluent
**Decision**: @grammyjs/i18n with Fluent (.ftl) files
**Rationale**:
- Fluent provides advanced localization capabilities
- .ftl files allow translators to work independently
- Support for complex Arabic formatting
- Pluralization and gender-aware messages
- Integration with grammY's middleware system

## Architecture Decisions

### 1. Monorepo Structure
**Decision**: packages/core/ for Platform Core
**Rationale**:
- Clear separation between Platform Core and future packages
- Shared dependencies across packages (Prisma schema)
- Easy testing and deployment strategy
- Scalable for future packages (flow-engine, validators, ai-builder)

### 2. Layered Architecture
**Decision**: Strict separation between middleware, handlers, services, and database layers
**Rationale**:
- Clear responsibility boundaries
- Testability at each layer
- Maintenance and debugging ease
- Single Responsibility Principle compliance

### 3. RBAC Implementation
**Decision**: Role-based access with AdminScope table for scoped permissions
**Rationale**:
- Egyptian business context requires fine-grained admin control
- Section and module-level permissions essential
- First user bootstrap requires automatic Super Admin assignment
- Audit trail required for permission changes

### 4. Module Discovery System
**Decision**: Runtime scanning with configuration validation
**Rationale**:
- Config-driven architecture requires dynamic loading
- Invalid configs should not crash the bot (log warnings only)
- Module registry provides menu generation capability
- Extensible for future Phase 2+ modules

### 5. Session Management
**Decision**: Redis with grammY session storage adapter
**Rationale**:
- State persistence across bot interactions
- 24-hour expiry matches business requirements
- Performance optimization for 100+ concurrent users
- Session data includes navigation state (currentSection, currentModule)

## Egyptian Business Context Research

### 1. Phone Number Validation
**Requirements**: Egyptian mobile numbers (010/011/012/015 prefixes)
**Implementation**: Regex pattern `/^01[0125][0-9]{8}$/`
**Rationale**: All Egyptian mobile operators use this format

### 2. Arabic Name Processing
**Requirements**: Support compound Arabic names
**Implementation**: Unicode-aware string handling
**Rationale**: Arabic names often include multiple words and special characters

### 3. Timezone and Calendar
**Requirements**: Africa/Cairo timezone, Gregorian + Hijri calendar support
**Implementation**: dayjs with timezone plugin
**Rationale**: Egyptian business operates in Cairo timezone with Hijri calendar for religious purposes

### 4. Right-to-Left (RTL) Support
**Requirements**: Arabic-first UI with proper RTL layout
**Implementation**: CSS direction: rtl, proper text alignment
**Rationale**: Arabic text requires RTL layout for correct reading order

## Security and Privacy Decisions

### 1. Audit Logging
**Decision**: Log all significant actions with exclusion of sensitive data
**Rationale**:
- Required for compliance and debugging
- Sensitive data (passwords, tokens) never logged
- JSONB storage allows flexible audit queries

### 2. Session Security
**Decision**: Redis sessions with 24-hour TTL
**Rationale**:
- Prevents stale session accumulation
- Security balance between usability and risk
- Automatic cleanup reduces security surface

### 3. Input Sanitization
**Decision**: Zod validation for all user inputs
**Rationale**:
- Prevents injection attacks
- Consistent validation across all inputs
- Clear error messages in Arabic

## Performance and Scalability Decisions

### 1. Concurrency Targets
**Decision**: 100 concurrent users with <1s response time
**Rationale**: Matches expected user base and business requirements

### 2. Database Optimization
**Decision**: Prisma with connection pooling
**Rationale**:
- Efficient database connections for 200 users
- Connection reuse reduces connection overhead
- Proper connection management for production

### 3. Caching Strategy
**Decision**: Redis for sessions and frequent data access
**Rationale**:
- Sub-millisecond response times for session data
- Reduces database load for common queries
- Critical for bot responsiveness

## Testing Strategy Decisions

### 1. Testing Framework: Vitest
**Decision**: Vitest for all testing
**Rationale**:
- Same API as Jest but faster execution
- Excellent TypeScript support
- Built-in coverage reporting
- Hot module replacement for development

### 2. Coverage Requirements
**Decision**: 80% code coverage for engine code
**Rationale**:
- Balances thorough testing with development speed
- Critical for RBAC and audit logging reliability
- Minimum acceptable for production code

### 3. Test Categories
**Unit Tests**: RBAC middleware, permission checks, session management, module loader
**Integration Tests**: User registration flow, join request flow, section CRUD
**End-to-End Tests**: Complete user journey from bootstrap to section navigation

## Development Workflow Decisions

### 1. Build Tools: tsup
**Decision**: tsup for production builds
**Rationale**:
- Fast TypeScript bundling
- ES modules support
- Minimal configuration required
- Excellent TypeScript declaration generation

### 2. Development Tools: tsx
**Decision**: tsx with watch mode
**Rationale**:
- TypeScript execution without compilation
- Hot module replacement
- Fast development iterations
- Full TypeScript type checking

### 3. Code Quality: ESLint + Husky
**Decision**: ESLint with @antfu/eslint-config + Husky + lint-staged
**Rationale**:
- Consistent code style across team
- Pre-commit checks prevent CI failures
- Modern TypeScript ruleset
- Automatic formatting with Prettier integration

## Risk Assessment and Mitigation

### 1. Database Connection Failures
**Risk**: Bot fails to start if database unavailable
**Mitigation**: Retry logic with exponential backoff, graceful degradation

### 2. Redis Unavailability
**Risk**: Session state lost, poor user experience
**Mitigation**: Fallback to in-memory sessions with warning logs

### 3. Invalid Module Configurations
**Risk**: Malformed modules cause bot crashes
**Mitigation**: Validation with graceful skipping, detailed error logging

### 4. High Load Performance
**Risk**: 100+ concurrent users cause performance degradation
**Mitigation**: Redis caching, database connection pooling, efficient queries

## Research Conclusion

All technical decisions align with constitutional principles and business requirements. The chosen stack provides:

- TypeScript strict mode compliance
- Arabic-first UI support
- Scalable architecture for future growth
- Security and audit capabilities
- Development efficiency with modern tools

The architecture supports the Platform-First principle while maintaining flexibility for future Flow Engine and module development.

## Recommendations

1. Proceed with implementation as specified
2. Monitor performance metrics during early deployment
3. Establish database backup procedures
4. Set up monitoring for Redis and PostgreSQL
5. Create incident response procedures for service failures