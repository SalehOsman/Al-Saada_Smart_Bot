# C-03: مراجعة طلبات الانضمام (Join Approval)

> **الملف المصدري:** `packages/core/src/bot/handlers/approvals.ts`
> **الحالة:** ✅ مُنفذ

## شجرة التدفق

```mermaid
flowchart TD
    A["📩 إشعار للـ Admin/Super Admin\nبطلب انضمام جديد"] --> B["المدير يضغط على الطلب"]
    B --> C{"الزر المضغوط؟"}

    C -->|"approve:{requestId}"| D{"هل الطلب لا يزال PENDING؟"}
    C -->|"reject:{requestId}"| E{"هل الطلب لا يزال PENDING؟"}

    D -->|لا| F["⚠️ تم التعامل مع الطلب مسبقاً\n(errors-join-request-already-handled)"]
    D -->|نعم| G["✅ Transaction:\n1. إنشاء/تحديث User (role=EMPLOYEE)\n2. تحديث الطلب → APPROVED"]
    G --> H["📩 إشعار للمستخدم: تمت الموافقة\n(JOIN_REQUEST_APPROVED)"]
    H --> I["تحديث رسالة المدير\n(join-request-approved-msg)"]

    E -->|لا| F
    E -->|نعم| J["❌ تحديث الطلب → REJECTED"]
    J --> K["📩 إشعار للمستخدم: تم الرفض\n(JOIN_REQUEST_REJECTED)"]
    K --> L["تحديث رسالة المدير\n(join-request-rejected-msg)"]

    style G fill:#27ae60,color:#fff
    style J fill:#e74c3c,color:#fff
    style F fill:#f39c12,color:#fff
```

## جدول الخطوات

| # | فعل المدير | استجابة البوت | إشعار المستخدم | مفتاح i18n |
|---|-----------|-------------|---------------|-----------|
| 1 | يضغط "قبول" | إنشاء حساب User بدور EMPLOYEE | إشعار بالموافقة + اسم المدير + التاريخ | `join-request-approved-success` |
| 2 | يضغط "رفض" | تحديث حالة الطلب إلى REJECTED | إشعار بالرفض + اسم المدير + التاريخ | `join-request-rejected-success` |
| 3 | يضغط على طلب تم التعامل معه | رسالة: "تم التعامل مع هذا الطلب مسبقاً" | — | `errors-join-request-already-handled` |

## التفاصيل التقنية

- **Atomic Transaction**: القبول يتم داخل `prisma.$transaction` لضمان إنشاء المستخدم وتحديث الطلب معاً.
- **Upsert**: يستخدم `user.upsert` بدلاً من `create` لتجنب التكرار إذا كان المستخدم موجوداً.
- **Race Condition Protection**: يتحقق من `status === PENDING` داخل الـ Transaction لمنع قبول/رفض نفس الطلب مرتين.
- **الإشعارات**: تُرسل عبر `queueNotification` (BullMQ) وليس مباشرة.
