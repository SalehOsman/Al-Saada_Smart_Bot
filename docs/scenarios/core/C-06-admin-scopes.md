# C-06: إدارة صلاحيات Admin (Admin Scopes)

> **الملف المصدري:** `packages/core/src/bot/handlers/users.ts` → `showUserScopes()`
> **الحالة:** ✅ مُنفذ | **متاح لـ:** SUPER_ADMIN

## شجرة التدفق

```mermaid
flowchart TD
    A["Super Admin يضغط 'إدارة الصلاحيات'\nعلى مستخدم بدور ADMIN"] --> B["جلب الصلاحيات الحالية\nadminScopeService.getScopes()"]
    B --> C["جلب كل الأقسام النشطة\nprisma.section.findMany()"]
    C --> D["عرض شاشة الصلاحيات"]

    D --> E["📋 الصلاحيات الحالية:\n❌ قسم الموارد البشرية\n❌ قسم المالية\n(ضغط = إلغاء)"]
    D --> F["📋 أقسام متاحة للتعيين:\n➕ قسم العمليات\n➕ قسم المشتريات\n(ضغط = تعيين)"]

    E --> G["إلغاء صلاحية"]
    G --> G1["adminScopeService.revokeScope()"]
    G1 --> G2["📩 scope-revoked"]
    G2 --> D

    F --> H["تعيين صلاحية"]
    H --> H1["adminScopeService.assignScope()"]
    H1 --> H2["📩 scope-assigned"]
    H2 --> D

    D --> I["زر العودة → تفاصيل المستخدم"]

    style G fill:#e74c3c,color:#fff
    style H fill:#27ae60,color:#fff
```

## جدول الإجراءات

| الإجراء | Callback Data | التأثير |
|---------|--------------|--------|
| تعيين صلاحية قسم | `user:scope_assign:{telegramId}:{sectionId}` | إضافة سجل AdminScope |
| إلغاء صلاحية قسم | `user:scope_revoke:{telegramId}:{sectionId}` | حذف سجل AdminScope |
| العودة | `user:view:{telegramId}` | شاشة تفاصيل المستخدم |

## القواعد

- **فقط SUPER_ADMIN** يمكنه تعيين/إلغاء الصلاحيات.
- **فقط مستخدمي ADMIN** يظهر لهم زر "إدارة الصلاحيات" (يُخفى للأدوار الأخرى).
- **الصلاحيات على مستوى القسم فقط** حالياً (`moduleId = null`).
- **Unique Constraint**: لا يمكن تعيين نفس القسم مرتين لنفس المستخدم (`userId_sectionId_moduleId`).
- **لا يوجد حذف تلقائي**: عند تغيير دور Admin إلى دور آخر، الصلاحيات تبقى في DB (لكن لا تؤثر لأن RBAC يتحقق من الدور أولاً).
