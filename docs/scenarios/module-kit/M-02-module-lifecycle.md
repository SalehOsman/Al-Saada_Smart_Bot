# M-02: دورة حياة الموديول (Module Lifecycle)

> **الملفات:** `packages/module-kit/src/validation.ts`, `confirmation.ts`, `persistence.ts`
> **الحالة:** ✅ مُنفذ

## شجرة التدفق

```mermaid
flowchart TD
    A["المستخدم يختار موديول من القائمة"] --> B["بدء محادثة الموديول"]
    B --> C["الخطوة 1: إدخال البيانات"]
    C --> D["🔍 validate()\nتحقق من كل حقل"]

    D --> D1{"البيانات صحيحة؟"}
    D1 -->|لا| D2["⚠️ رسالة خطأ\n+ إعادة الطلب"]
    D2 --> C
    D1 -->|نعم| E

    E["الخطوة 2: شاشة التأكيد\n📋 confirm()"] --> E1{"المستخدم يؤكد؟"}
    E1 -->|لا| F["❌ إلغاء\n+ حفظ مسودة في Redis"]
    E1 -->|نعم| G

    G["الخطوة 3: الحفظ\n💾 save()"] --> G1["1. حفظ في PostgreSQL\n2. تسجيل في Audit\n3. إشعار المدراء المختصين\n4. حذف المسودة من Redis"]
    G1 --> H["✅ رسالة نجاح"]

    style H fill:#27ae60,color:#fff
    style F fill:#e74c3c,color:#fff
    style D2 fill:#f39c12,color:#fff
```

## المراحل الثلاث

| المرحلة | الوظيفة | المدخلات | المخرجات |
|---------|--------|---------|---------|
| **Validate** | `validate(field, value, rules)` | قيمة الحقل + قواعد التحقق | `{ valid, error? }` |
| **Confirm** | `confirm(ctx, data)` | البيانات المُجمّعة | `boolean` (تأكيد/إلغاء) |
| **Save** | `save(ctx, data, config)` | البيانات المؤكدة + إعدادات الموديول | `SaveResult` |

## PII Masking

- قبل تسجيل البيانات في الـ Audit، يتم تمرير القيم عبر `piiMasker`.
- الحقول المحددة كـ `sensitive: true` في config تُخفى (`***`).
- مثال: رقم الهاتف `01012345678` → `010****5678`
