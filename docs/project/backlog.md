# Improvement Backlog

**Last Updated**: 2026-03-03

## Module Kit Improvements (from /speckit.clarify session)

| ID | Title | Current Behavior | Planned Improvement | Priority | Affected Files |
|----|-------|-----------------|---------------------|----------|---------------|
| BL-001 | Redis failure user warning | Draft middleware catches errors silently (log only) | Warn user via module-kit-draft-save-unavailable | LOW | packages/core/src/bot/middleware/draft.ts |
| BL-002 | save() automatic retry | Throws error immediately, draft preserved | Max 1 retry before throwing, show module-kit-save-failed-persistent | LOW | packages/module-kit/src/persistence.ts |
| BL-003 | Conversation inactivity timeout | No timeout — handler stays active | 15-min timeout, release handler, keep draft | LOW | packages/core/src/bot/middleware/draft.ts |
| BL-004 | confirm() empty data guard | No validation | Throw developer error if data is empty | LOW | packages/module-kit/src/confirmation.ts |
| BL-005 | FR-007 doc alignment | FR-007 says "no standalone notifyScopedAdmins" | Update to reflect actual private helper | LOW | specs/003-module-kit/spec.md |

## Platform Core — Not Yet Implemented

| ID | Feature | Spec Reference | Phase |
|----|---------|---------------|-------|
| BL-010 | BullMQ notification queue | T053/T054 | Phase 1 remaining |
| BL-011 | Full RBAC with canAccess() | spec 001 | Phase 1 remaining |
| BL-012 | Section management via bot | spec 001 | Phase 1 remaining |
| BL-013 | Maintenance mode | spec 001 | Phase 1 remaining |
| BL-014 | Integration tests for join flow | spec 001 | Phase 1 remaining |

## Future i18n Keys (Not Yet Implemented)

- module-kit-draft-save-unavailable (ar + en)
- module-kit-save-failed-persistent (ar + en)
- module-kit-conversation-timeout (ar + en)
