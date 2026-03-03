# C-08: الرسائل غير المدعومة (Fallback)

> **الملف المصدري:** `packages/core/src/bot/handlers/fallback.ts`
> **الحالة:** ✅ مُنفذ

## شجرة التدفق

```mermaid
flowchart TD
    A["المستخدم يرسل رسالة"] --> B{"هل تطابق أي handler؟"}
    B -->|"نعم (/start, /cancel, callback, etc.)"| C["يُعالج بواسطة الـ handler المناسب"]
    B -->|لا| D["fallbackHandler()"]
    D --> E["📩 رسالة: 'العملية غير مدعومة'\n(errors-unsupported-message)"]

    style E fill:#95a5a6,color:#fff
```

## أمثلة على الرسائل التي تصل للـ Fallback

| نوع الرسالة | مثال | السبب |
|------------|------|-------|
| نص عشوائي | "مرحبا" | ليس أمر معروف |
| صورة بدون سياق | إرسال صورة | لا يوجد handler للصور حالياً |
| ملصق (Sticker) | إرسال ملصق | غير مدعوم |
| أمر غير موجود | `/settings` | لم يُسجّل كأمر |
