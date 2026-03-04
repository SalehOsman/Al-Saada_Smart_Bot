# Improvement Backlog

**Last Updated**: 2026-03-04  
**Status**: Reviewed and validated against actual codebase

---

## ✅ Module Kit Improvements (Valid — Not Yet Implemented)

These are minor UX improvements for the Module Kit. All are LOW priority and can be deferred to Phase 6.

| ID | Title | Current Behavior | Planned Improvement | Priority | Estimated Time | Affected Files |
|----|-------|-----------------|---------------------|----------|----------------|----------------|
| BL-001 | Redis failure user warning | Draft middleware catches errors silently (log only) | Warn user via `module-kit-draft-save-unavailable` | LOW | 1 hour | `packages/core/src/bot/middleware/draft.ts` |
| BL-002 | save() automatic retry | Throws error immediately, draft preserved | Max 1 retry before throwing, show `module-kit-save-failed-persistent` | LOW | 2 hours | `packages/module-kit/src/persistence.ts` |
| BL-003 | Conversation inactivity timeout | No timeout — handler stays active indefinitely | 15-min timeout, release handler, keep draft in Redis | LOW | 3-4 hours | `packages/core/src/bot/middleware/draft.ts` |
| BL-004 | confirm() empty data guard | No validation on empty data object | Throw developer error if data is empty: "confirm() called with empty data object" | LOW | 30 minutes | `packages/module-kit/src/confirmation.ts` |
| BL-005 | FR-007 doc alignment | FR-007 says "no standalone notifyScopedAdmins" | Update spec.md to reflect actual private helper implementation | LOW | 15 minutes | `specs/003-module-kit/spec.md` |

**Total Estimated Time:** ~7 hours

---

## ❌ Previously Listed — Already Implemented

The following items were listed in the backlog but are **already fully implemented** in the codebase:

| ID | Feature | Status | Evidence |
|----|---------|--------|----------|
| ~~BL-010~~ | BullMQ notification queue | ✅ IMPLEMENTED | `packages/core/src/services/notifications.ts` (queueNotification), `packages/core/src/workers/notification.ts` (Worker with rate limiting) |
| ~~BL-011~~ | Full RBAC with canAccess() | ✅ IMPLEMENTED | `packages/core/src/services/rbac.ts` (canAccess, canPerformAction with full hierarchy support) |
| ~~BL-012~~ | Section management via bot | ✅ IMPLEMENTED | `packages/core/src/bot/handlers/sections.ts` (add, edit, delete, toggle sections) |
| ~~BL-013~~ | Maintenance mode | ✅ IMPLEMENTED | `packages/core/src/bot/middlewares/maintenance.ts` (middleware), `packages/core/src/bot/handlers/maintenance.ts` (handler) |
| ~~BL-014~~ | Integration tests for join flow | ✅ IMPLEMENTED | `packages/core/tests/integration/bot/start-to-join-flow.test.ts`, `packages/core/tests/e2e/user-journey.test.ts` |

**Action:** These items have been removed from the backlog.

---

## 🌐 Future i18n Keys (Required for BL-001, BL-002, BL-003)

The following i18n keys need to be added when implementing the Module Kit improvements:

**Arabic (`packages/core/src/locales/ar.ftl`):**
```fluent
# BL-001
module-kit-draft-save-unavailable = ⚠️ لا يمكن حفظ تقدمك حالياً. إذا أغلقت المحادثة، ستفقد البيانات.

# BL-002
module-kit-save-failed-persistent = ❌ فشل الحفظ. بياناتك محفوظة مؤقتاً. حاول مرة أخرى.
button-retry = 🔄 إعادة المحاولة

# BL-003
module-kit-conversation-timeout = ⏱️ انتهت المهلة. بياناتك محفوظة.
button-resume = ▶️ استئناف
button-start-fresh = 🆕 بداية جديدة
```

**English (`packages/core/src/locales/en.ftl`):**
```fluent
# BL-001
module-kit-draft-save-unavailable = ⚠️ Cannot save your progress. If you close, data will be lost.

# BL-002
module-kit-save-failed-persistent = ❌ Save failed. Data preserved temporarily. Try again.
button-retry = 🔄 Retry

# BL-003
module-kit-conversation-timeout = ⏱️ Session timed out. Your data is saved.
button-resume = ▶️ Resume
button-start-fresh = 🆕 Start Fresh
```

---

## 📋 Implementation Priority

**Recommendation:** Defer all Module Kit improvements (BL-001 to BL-005) to **Phase 6** (after Dashboard MVP).

**Rationale:**
- All are LOW priority UX enhancements
- Core functionality works without them
- Focus should be on Production Readiness (Phase 3) and AI Assistant (Phase 4) first

---

## 🔄 Next Review

**Scheduled:** After Phase 5 (Dashboard MVP) completion  
**Focus:** Re-evaluate if these improvements are still needed based on user feedback
