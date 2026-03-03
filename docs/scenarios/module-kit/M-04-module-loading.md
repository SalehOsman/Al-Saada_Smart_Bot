# M-04: تحميل الموديولات تلقائياً (Module Loading)

> **الملف:** `packages/core/src/bot/module-loader.ts`
> **الحالة:** ✅ مُنفذ

## شجرة التدفق

```mermaid
flowchart TD
    A["البوت يبدأ التشغيل\nnpm run dev"] --> B["moduleLoader.discover()\nمسح مجلد modules/"]
    B --> C{"لكل مجلد في modules/:"}

    C --> D["قراءة module.config.ts"]
    D --> D1{"config صالح؟"}
    D1 -->|لا| D2["⚠️ تسجيل تحذير\n+ تخطي الموديول"]
    D1 -->|نعم| E

    E["البحث عن Section بالـ slug\nprisma.section.findUnique()"] --> E1{"القسم موجود في DB؟"}
    E1 -->|لا| E2["⚠️ تحذير: القسم غير موجود\n+ تخطي مزامنة DB"]
    E1 -->|نعم| F

    F["prisma.module.upsert()\nمزامنة الموديول مع DB"] --> G["تسجيل الموديول في الذاكرة\nLoadedModule[]"]
    G --> H["تسجيل conversation handler\nفي grammY"]
    H --> I["✅ الموديول جاهز للاستخدام"]

    style I fill:#27ae60,color:#fff
    style D2 fill:#f39c12,color:#fff
    style E2 fill:#f39c12,color:#fff
```

## الشروط المسبقة

1. **القسم (Section) يجب أن يكون موجوداً في DB** — الموديول يشير لـ `sectionSlug` ويحتاج قسم حقيقي للمزامنة.
2. **`module.config.ts` يجب أن يُصدّر `ModuleConfig` صالح** — يتحقق من `slug`, `sectionSlug`, `permissions`, `fields`.

## ما يحدث عند الـ Upsert

```typescript
prisma.module.upsert({
  where: { slug: config.slug },
  create: { slug, name, icon, sectionId, isActive: true },
  update: { name, icon, sectionId },
})
```

- إذا الموديول **جديد**: يُنشأ في DB مع `isActive: true`.
- إذا الموديول **موجود**: يُحدّث الاسم والأيقونة والقسم فقط.
