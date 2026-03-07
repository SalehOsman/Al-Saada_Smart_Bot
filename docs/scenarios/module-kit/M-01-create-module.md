# M-01: إنشاء موديول جديد عبر CLI

> **الأمر:** `npm run module:create`
> **الحالة:** ✅ مُنفذ

## شجرة التدفق

```mermaid
flowchart TD
    A["المطور يكتب npm run module:create"] --> B["CLI يسأل: اسم الموديول (slug)"]
    B --> C["CLI يسأل: الاسم المعروض (i18n key)"]
    C --> D["CLI يسأل: القسم (sectionSlug)"]
    D --> E["CLI يسأل: الأيقونة (emoji)"]
    E --> F["CLI يسأل: الحقول (fields)"]
    F --> G{"تأكيد الإعدادات؟"}

    G -->|نعم| H["📁 إنشاء مجلد الموديول\nmodules/{slug}/"]
    H --> I["📄 إنشاء الملفات:\n• module.config.ts\n• conversation.ts\n• index.ts"]
    I --> J["✅ الموديول جاهز!\nشغّل npm run dev"]

    G -->|لا| K["❌ إلغاء"]

    style J fill:#27ae60,color:#fff
    style K fill:#e74c3c,color:#fff
```

## البنية الناتجة

```
modules/{slug}/
├── module.config.ts    # تعريف الموديول (ModuleConfig)
├── conversation.ts     # مسار المحادثة (الخطوات)
└── index.ts           # نقطة التصدير
```

## أوامر أخرى

| الأمر | الوصف |
|-------|-------|
| `npm run module:list` | عرض كل الموديولات المُعرّفة |
| `npm run module:remove` | حذف موديول (تفاعلي) |
