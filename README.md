# بوت السعادة الذكي | Al-Saada Smart Bot

> منصة ذكية ومعيارية لإدارة الأعمال المصرية عبر تيليجرام

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-≥20-green.svg)]()
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

---

## ما هو بوت السعادة؟

بوت السعادة هو **محرك فارغ** يتحول إلى نظام إدارة أعمال متكامل عبر تيليجرام، مع **مساعد ذكاء اصطناعي تشغيلي** مدرّب على بيانات الشركة. بدلاً من كتابة كود لكل وظيفة، تقوم بتعريف **موديولات مستقلة** باستخدام **Module Kit** والمحرك يحولها تلقائياً إلى شاشات بوت كاملة.

### الفكرة الأساسية

```
موديولات (Modules) ──▶ مجموعة أدوات الموديول (Module Kit) ──▶ شاشات بوت تيليجرام
                                                           + مساعد ذكي (AI Assistant)
```

### لمن هذا المشروع؟

- **المنظمات المصرية** (مقاولات، صيانة، نقل، أعمال عامة)
- **~200 مستخدم** لكل مؤسسة
- **اللغة العربية** كلغة أساسية مع دعم الإنجليزية

---

## المعمارية (Three-Layer Architecture)

```
┌─────────────────────────────────────────────┐
│           Layer 3: الموديولات               │
│     (ملفات تكوين + حوارات مخصصة)            │
│   HR │ Finance │ Fleet │ Inventory │ ...    │
├─────────────────────────────────────────────┤
│           Layer 2: Module Kit               │
│  Validations │ Confirmations │ Persistence  │
├─────────────────────────────────────────────┤
│           Layer 1: نواة المنصة              │
│  Bot │ RBAC │ Sections │ Auth │ Audit       │
├─────────────────────────────────────────────┤
│         المساعد الذكي (AI Assistant)         │
│  Qwen3-8B │ RAG │ Voice │ Cloud Fallback    │
├─────────────────────────────────────────────┤
│              البنية التحتية                  │
│  PostgreSQL │ Redis │ Ollama │ Docker        │
└─────────────────────────────────────────────┘
```

| الطبقة | الوصف | حالة الكود |
|--------|-------|------------|
| **Layer 1** — نواة المنصة | بوت، مصادقة، صلاحيات، أقسام، تدقيق | ثابت — لا يتغير حسب العمل |
| **Layer 2** — Module Kit | أدوات التحقق، التأكيد، الحفظ التلقائي، المسودات | ثابت — منصة التطوير |
| **Layer 3** — الموديولات | تعريف الموديول + مسارات الحوار (Conversations) | متغير — مخصص لكل عمل |
| **AI Assistant** — المساعد الذكي | Qwen3-8B + RAG + صوت | مساعد تشغيلي على بيانات الشركة |

---

## التقنيات

| المجال | التقنية |
|--------|---------|
| Runtime | Node.js ≥20, TypeScript 5.x (strict) |
| Bot | grammY + conversations + hydrate |
| Module Kit | @al-saada/module-kit (Internal Package) |
| Database | PostgreSQL 16 + Prisma ORM (Multi-File Schema) |
| Cache | Redis 7 + ioredis (Draft Management) |
| Validation | Zod |
| i18n | @grammyjs/i18n (Fluent .ftl support) |
| Logging | Pino |
| Testing | Vitest (80% coverage) |
| Infrastructure | Docker Compose |
| AI Local Model | Qwen3-8B via Ollama (Apache 2.0) |
| AI Cloud Models | Gemini (free) / Claude / GPT |
| RAG | pgvector (PostgreSQL extension) |

---

## البدء السريع

### المتطلبات

- Node.js ≥20
- Docker & Docker Compose
- Telegram Bot Token (من [@BotFather](https://t.me/BotFather))

### التثبيت

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd _Al-Saada_Smart_Bot

# 2. نسخ ملف الإعدادات
cp .env.example .env
# عدّل .env وأضف BOT_TOKEN الخاص بك

# 3. تثبيت المكتبات
npm install

# 4. تشغيل البنية التحتية
npm run docker:up

# 5. تشغيل قاعدة البيانات
npm run db:migrate
npm run db:generate

# 6. تشغيل البوت
npm run dev
```

### إدارة الموديولات (CLI)

يوفر النظام أدوات CLI لتسريع تطوير الموديولات:

```bash
# إنشاء موديول جديد (تفاعلي)
npm run module:create my-module

# حذف موديول
npm run module:remove my-module

# عرض كافة الموديولات وحالتها
npm run module:list
```

---

## الأوامر المتاحة

### أوامر npm

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل البوت (development) |
| `npm test` | تشغيل الاختبارات |
| `npm run lint` | فحص جودة الكود |
| `npm run module:create` | إنشاء موديول جديد |
| `npm run module:list` | عرض الموديولات المحملة |
| `npm run db:migrate` | تشغيل migrations |
| `npm run docker:up` | تشغيل Docker services |

### أوامر البوت (في تيليجرام)

| الأمر | الدور | الوصف |
|-------|-------|-------|
| `/start` | الكل | بدء التسجيل أو عرض القائمة |
| `/sections` | Super Admin | إدارة الأقسام |
| `/maintenance on\|off` | Super Admin | وضع الصيانة |
| `/audit` | Super Admin | عرض سجل التدقيق |
| `/ai` | Super Admin | إعدادات المساعد الذكي (النموذج، الصوت، RAG) |

---

## نظام الصلاحيات (RBAC)

| الدور | الصلاحيات |
|-------|----------|
| **Super Admin** | تحكم كامل — أقسام، موديولات، مستخدمين، إعدادات + إعدادات AI من البوت |
| **Admin** | صلاحيات محددة على أقسام/موديولات معينة + AI للاستعلام ضمن نطاقه |
| **Employee** | بياناته الشخصية + تقديم طلبات + AI للاستعلام عن بياناته |
| **Visitor** | طلب انضمام فقط |

---

## المساعد الذكي (AI Assistant)

مساعد تشغيلي مدرّب على بيانات الشركة — وليس ذكاء اصطناعي عام.

### كيف يعمل؟

```
المستخدم يسأل (نص أو صوت)
        │
        ▼
   STT (إذا صوت) ──▶ نص
        │
        ▼
   RAG (بحث في بيانات الشركة via pgvector)
        │
        ▼
   Qwen3-8B (محلي) أو Cloud Model (احتياطي)
        │
        ▼
   إجابة بالعربي (نص + صوت اختياري)
```

---

## هيكل المشروع

```
al-saada-smart-bot/
├── packages/
│   ├── core/                 # Layer 1 — نواة المنصة
│   ├── module-kit/           # Layer 2 — أدوات تطوير الموديولات
│   └── validators/           # محققات البيانات المشتركة
├── modules/                  # Layer 3 — الموديولات المخصصة
│   └── fuel-entry/           # مثال: موديول تسجيل الوقود
├── prisma/
│   └── schema/               # تعريف قاعدة البيانات (Multi-File)
├── scripts/                  # أدوات CLI للمطورين
├── specs/                    # مواصفات Spec Kit
├── .specify/                 # إعدادات Spec Kit + الدستور
└── ...
```

---

## مراحل التطوير

| المرحلة | الوصف | الإصدار | الحالة |
|---------|-------|---------|--------|
| **Phase 1** | نواة المنصة (Bot, RBAC, Sections, Audit) | v0.1.0 | ✅ مكتمل |
| **Phase 2** | Module Kit (Scaffolding, Helpers, Drafts) | v0.2.0 | ✅ مكتمل |
| **Phase 3** | موديولات تجريبية (HR, Operations) | v0.3.0 | ⏳ قادم |
| **Phase 4** | مساعد ذكاء اصطناعي تشغيلي (Qwen3-8B + RAG) | v1.0.0 | ⏳ قادم |

---

## المنهجية

يتبع المشروع منهجية **Spec Kit** للتطوير المدفوع بالمواصفات:

1. **الدستور** — المرجع الأعلى لكل القرارات
2. **المواصفات** — تعريف دقيق لكل ميزة
3. **الخطة** — قرارات تقنية وهيكلية
4. **المهام** — تفصيل خطوة بخطوة
5. **التنفيذ** — كتابة الكود
6. **التحليل** — مراجعة التناسق

للمزيد: [`.specify/methodology.md`](.specify/methodology.md)

---

## السياق المصري

- ✅ التحقق من أرقام الهاتف المصرية (010/011/012/015)
- ✅ الرقم القومي المصري (14 رقم) مع استخراج تاريخ الميلاد والجنس والمحافظة
- ✅ أسماء عربية مركبة
- ✅ المحافظات المصرية كبيانات أساسية
- ✅ العملة: جنيه مصري (EGP)
- ✅ المنطقة الزمنية: Africa/Cairo
- ✅ التقويم: ميلادي + هجري

---

## الدستور

المشروع يحكمه [دستور v1.4.1](.specify/memory/constitution.md) يحتوي على 8 مبادئ أساسية:

1. **المنصة أولاً** — اكتمال المحرك قبل أي موديول
2. **التكوين أولاً** — موديولات مستقلة باستخدام Module Kit
3. **الاختبار أولاً** — 80% تغطية للكود الأساسي
4. **السياق المصري** — كل المحققات تدعم الصيغ المصرية
5. **الأمان والخصوصية** — لا بيانات حساسة في السجلات (PII Masking)
6. **البساطة فوق الذكاء** — YAGNI
7. **Monorepo** — فصل واضح بين الحزم
8. **المسودات التلقائية** — حفظ حالة الحوار لضمان عدم ضياع البيانات
