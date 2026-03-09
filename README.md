<div align="center">

# بوت السعادة الذكي | Al-Saada Smart Bot

**منصة ذكية وجاهزة لتسجيل وإدارة الأعمال اليومية للشركات المصرية عبر تيليجرام**

**A smart, ready-made platform for recording and managing daily business operations for Egyptian companies via Telegram**

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-≥20-green.svg)]()
[![Tests](https://img.shields.io/badge/tests-274%20passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

[عربي](#ما-هو-بوت-السعادة) · [English](#what-is-al-saada-bot)

📚 [التوثيق الكامل | Documentation](docs/README.md)

</div>

---

<!-- ==================== القسم العربي ==================== -->

## ما هو بوت السعادة؟

بوت السعادة هو **منصة جاهزة** تتكيّف مع طبيعة عملك عبر تيليجرام. بدلاً من كتابة كود لكل وظيفة، تقوم بتعريف **موديولات مستقلة** حسب تخصصك ومجال عملك، والمنصة تحولها تلقائياً إلى شاشات بوت كاملة مع تحقق من البيانات، تأكيد، حفظ، وتدقيق — مدعومة بمساعد ذكاء اصطناعي تشغيلي.

```
الموظف يفتح البوت ──▶ يختار القسم ──▶ يختار الموديول ──▶ يسجّل بياناته ──▶ تأكيد ──▶ حفظ + إشعار المدير
```

### لمن هذا المشروع؟

- 🏢 **كل الشركات والأعمال المصرية** — تجارية، صناعية، خدمية، مهنية (مقاولات، صيانة، نقل، محاسبة، عقارات، طب، محاماة، وغيرها)
- 👥 **~200 مستخدم** لكل مؤسسة
- 🇪🇬 **اللغة العربية** كلغة أساسية مع دعم الإنجليزية

### أمثلة على الاستخدام

| الموديول | ماذا يفعل الموظف؟ |
|----------|-------------------|
| تسجيل الوقود | يسجّل كمية السولار + رقم اللوحة + القراءة |
| حضور وانصراف | يسجّل وقت الحضور مع الموقع GPS |
| طلبات الإجازة | يقدّم طلب إجازة → يصل إشعار للمدير → موافقة/رفض |
| مصروفات يومية | يسجّل مصروف + يرفق الفاتورة → يُراجع من المحاسب |

> **ملاحظة:** هذه أمثلة على موديولات يمكن بناؤها. المنصة حالياً تحتوي على المحرك وأدوات التطوير، والموديولات تُبنى حسب احتياج كل شركة.

---

## المعمارية

```
┌─────────────────────────────────────────────┐
│         Layer 3: الموديولات (مخصصة)          │
│   وقود │ حضور │ إجازات │ مصروفات │ ...      │
├─────────────────────────────────────────────┤
│         Layer 2: Module Kit (ثابت)          │
│  validate │ confirm │ save │ drafts │ PII   │
├─────────────────────────────────────────────┤
│         Layer 1: نواة المنصة (ثابت)          │
│  Bot │ RBAC │ Sections │ Auth │ Audit       │
├─────────────────────────────────────────────┤
│              البنية التحتية                  │
│  PostgreSQL │ Redis │ Docker                 │
└─────────────────────────────────────────────┘
```

| الطبقة | الوصف | الحالة |
|--------|-------|--------|
| **Layer 1** — نواة المنصة | بوت، مصادقة، صلاحيات، أقسام، تدقيق | ✅ مكتمل |
| **Layer 2** — Module Kit | أدوات التحقق، التأكيد، الحفظ، المسودات | ✅ مكتمل |
| **Layer 3** — الموديولات | تعريف الموديول + مسارات الحوار | 🔧 جاهز للبناء |

---

## البدء السريع

### المتطلبات

- Node.js ≥20
- Docker & Docker Compose
- Telegram Bot Token (من [@BotFather](https://t.me/BotFather))

### التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/SalehOsman/Al-Saada_Smart_Bot.git
cd Al-Saada_Smart_Bot

# 2. نسخ ملف الإعدادات
cp .env.example .env
# عدّل .env وأضف BOT_TOKEN الخاص بك

# 3. تثبيت المكتبات
npm install

# 4. تشغيل البنية التحتية
npm run docker:up

# 5. إعداد قاعدة البيانات
npm run db:migrate
npm run db:generate

# 6. تشغيل البوت
npm run dev
```

### إنشاء أول موديول

```bash
# إنشاء موديول جديد (تفاعلي)
npm run module:create

# عرض كافة الموديولات
npm run module:list

# حذف موديول
npm run module:remove
```

---

## التقنيات

| المجال | التقنية |
|--------|---------|
| Runtime | Node.js ≥20, TypeScript 5.x (strict) |
| Bot | grammY + @grammyjs/conversations + hydrate |
| Module Kit | @al-saada/module-kit (حزمة داخلية) |
| Database | PostgreSQL 16 + Prisma ORM (Multi-File Schema) |
| Cache | Redis 7 + ioredis |
| i18n | @grammyjs/i18n (Fluent .ftl) |
| Monitoring | Sentry (اختياري) |
| CI/CD | GitHub Actions |
| Logging | Pino |
| Testing | Vitest (274 اختبار) |
| Infrastructure | Docker Compose |

---

## نظام الصلاحيات (RBAC)

| الدور | الصلاحيات |
|-------|----------|
| **Super Admin** | تحكم كامل — أقسام، موديولات، مستخدمين، إعدادات |
| **Admin** | صلاحيات محددة على أقسام/موديولات معينة |
| **Employee** | بياناته الشخصية + تقديم طلبات |
| **Visitor** | طلب انضمام فقط |

---

## السياق المصري 🇪🇬

- ✅ أرقام الهاتف المصرية (010/011/012/015)
- ✅ الرقم القومي (14 رقم) — استخراج تاريخ الميلاد والجنس والمحافظة
- ✅ أسماء عربية مركبة
- ✅ العملة: جنيه مصري (EGP)
- ✅ المنطقة الزمنية: Africa/Cairo
- ✅ التقويم: ميلادي + هجري

---

## هيكل المشروع

```
al-saada-smart-bot/
├── .github/workflows/        # CI/CD (lint, test, typecheck)
├── packages/
│   ├── core/                 # Layer 1 — نواة المنصة
│   ├── module-kit/           # Layer 2 — أدوات تطوير الموديولات
│   └── validators/           # محققات البيانات المشتركة
├── modules/                  # Layer 3 — الموديولات المخصصة
├── prisma/
│   └── schema/               # Multi-File Prisma Schema
├── scripts/                  # أدوات CLI (module:create/remove/list)
└── specs/                    # مواصفات SpecKit
```

---

## الأوامر

### أوامر npm

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل البوت |
| `npm test` | تشغيل الاختبارات |
| `npm run lint` | فحص جودة الكود |
| `npm run module:create` | إنشاء موديول جديد |
| `npm run module:list` | عرض الموديولات |
| `npm run db:migrate` | تشغيل migrations |
| `npm run docker:up` | تشغيل Docker |

### أوامر البوت

| الأمر | الدور | الوصف |
|-------|-------|-------|
| `/start` | الكل | بدء التسجيل أو عرض القائمة |
| `/cancel` | الكل | إلغاء العملية الحالية (تُحفظ كمسودة) |
| `/help` | الكل | مساعدة سياقية حسب الخطوة الحالية |
| `/sections` | Super Admin | إدارة الأقسام |
| `/maintenance on\|off` | Super Admin | وضع الصيانة |
| `/audit` | Super Admin | عرض سجل التدقيق |
| `/backup` | Super Admin | إنشاء نسخة احتياطية فورية |
| `/backups` | Super Admin | عرض واستعادة النسخ الاحتياطية |

---

## خارطة الطريق 🗺️

| المرحلة | الوصف | الإصدار | الحالة |
|---------|-------|---------|--------|
| **Phase 1** | نواة المنصة (Bot, RBAC, Sections, Audit) | v0.1.0 | ✅ مكتمل |
| **Phase 2** | Module Kit (Helpers, Drafts, CLI) | v0.2.0 | ✅ مكتمل |
| **Phase 3** | Production Readiness (Sentry, CI/CD, Backups) | v0.3.0 | ✅ مكتمل |
| **Phase 4** | مساعد ذكاء اصطناعي تشغيلي | v0.4.0 | ⏳ قادم |
| **Phase 5** | لوحة القيادة الذكية (Dashboard MVP) | v0.5.0 | ⏳ قادم |
| **Phase 6** | ميزات متقدمة (Advanced Features) | v1.0.0 | ⏳ قادم |

📋 **للتفاصيل الكاملة:** راجع [`docs/project/roadmap.md`](docs/project/roadmap.md)

### Phase 4 — المساعد الذكي (قادم)

مساعد تشغيلي متعدد الوسائط مدرّب على بيانات الشركة:

| الميزة | الوصف | التقنية |
|---------|-------|---------|
| 💬 أسئلة بالعربية | اكتب سؤال عن بيانات شركتك واحصل على إجابة | RAG + pgvector |
| 📄 تحليل ملفات | ارفع PDF/Excel/صورة وحلّلها | Tesseract/PaddleOCR |
| 🎤 ملاحظات صوتية | أرسل ملاحظة صوتية بدلاً من الكتابة | Whisper |
| 🤖 نماذج مرنة | محلي (Qwen2.5:7b) أو سحابي (Gemini/Claude/OpenAI) | Ollama + REST APIs |
| 🔒 خصوصية | تصفية البيانات الحساسة قبل إرسالها للنماذج الخارجية | Context Redaction |

> راجع المواصفات الكاملة: [`specs/002-ai-assistant/spec.md`](specs/002-ai-assistant/spec.md)

---

## المنهجية

يتبع المشروع منهجية **[SpecKit](https://github.com/github/spec-kit)** للتطوير المدفوع بالمواصفات:

1. 📜 **الدستور** — المرجع الأعلى لكل القرارات ([v2.5.0](.specify/memory/constitution.md))
2. 📋 **المواصفات** — تعريف دقيق لكل ميزة
3. 📐 **الخطة** — قرارات تقنية وهيكلية
4. ✅ **المهام** — تفصيل خطوة بخطوة
5. 🔍 **التحليل** — مراجعة التناسق

---

<!-- ==================== ENGLISH SECTION ==================== -->

<div align="center">

## What is Al-Saada Bot?

</div>

Al-Saada Smart Bot is a **ready-made platform** that adapts to your business via Telegram. Instead of writing code for every function, you define **independent modules** tailored to your industry and workflow, and the platform automatically turns them into full bot screens with validation, confirmation, persistence, and auditing — powered by an AI operational assistant.

```
Employee opens bot ──▶ selects section ──▶ selects module ──▶ records data ──▶ confirm ──▶ save + notify manager
```

### Who is this for?

- 🏢 **All Egyptian businesses** — commercial, industrial, services, professional (construction, maintenance, transport, accounting, real estate, medical, legal, and more)
- 👥 **~200 users** per organization
- 🇪🇬 **Arabic-first** with English support

### Usage Examples

| Module | What does the employee do? |
|--------|--------------------------|
| Fuel Entry | Records fuel quantity + plate number + meter reading |
| Attendance | Records check-in time with GPS location |
| Leave Requests | Submits leave request → manager gets notified → approve/reject |
| Daily Expenses | Records expense + attaches receipt → reviewed by accountant |

> **Note:** These are examples of modules that can be built. The platform currently contains the engine and development tools. Modules are built per company's needs.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│        Layer 3: Modules (Custom)             │
│   Fuel │ Attendance │ Leave │ Expenses │ ... │
├─────────────────────────────────────────────┤
│        Layer 2: Module Kit (Fixed)           │
│  validate │ confirm │ save │ drafts │ PII   │
├─────────────────────────────────────────────┤
│        Layer 1: Platform Core (Fixed)        │
│  Bot │ RBAC │ Sections │ Auth │ Audit        │
├─────────────────────────────────────────────┤
│              Infrastructure                  │
│  PostgreSQL │ Redis │ Docker                 │
└─────────────────────────────────────────────┘
```

| Layer | Description | Status |
|-------|-------------|--------|
| **Layer 1** — Platform Core | Bot, Auth, RBAC, Sections, Audit | ✅ Complete |
| **Layer 2** — Module Kit | Validation, Confirmation, Persistence, Drafts | ✅ Complete |
| **Layer 3** — Modules | Module definitions + Conversation flows | 🔧 Ready to build |

---

## Quick Start

### Prerequisites

- Node.js ≥20
- Docker & Docker Compose
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SalehOsman/Al-Saada_Smart_Bot.git
cd Al-Saada_Smart_Bot

# 2. Copy environment file
cp .env.example .env
# Edit .env and add your BOT_TOKEN

# 3. Install dependencies
npm install

# 4. Start infrastructure
npm run docker:up

# 5. Setup database
npm run db:migrate
npm run db:generate

# 6. Start the bot
npm run dev
```

### Create your first module

```bash
# Create a new module (interactive)
npm run module:create

# List all modules
npm run module:list

# Remove a module
npm run module:remove
```

---

## Tech Stack

| Area | Technology |
|------|-----------|
| Runtime | Node.js ≥20, TypeScript 5.x (strict) |
| Bot | grammY + @grammyjs/conversations + hydrate |
| Module Kit | @al-saada/module-kit (internal package) |
| Database | PostgreSQL 16 + Prisma ORM (Multi-File Schema) |
| Cache | Redis 7 + ioredis |
| i18n | @grammyjs/i18n (Fluent .ftl) |
| Monitoring | Sentry |
| CI/CD | GitHub Actions |
| Logging | Pino |
| Testing | Vitest (274 tests) |
| Infrastructure | Docker Compose |

---

## RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-----------|
| **Super Admin** | Full control — sections, modules, users, settings |
| **Admin** | Scoped access to assigned sections/modules |
| **Employee** | Personal data + submit requests |
| **Visitor** | Join request only |

---

## Egyptian Context 🇪🇬

- ✅ Egyptian phone numbers (010/011/012/015)
- ✅ National ID (14 digits) — extracts birth date, gender, governorate
- ✅ Compound Arabic names
- ✅ Currency: Egyptian Pound (EGP)
- ✅ Timezone: Africa/Cairo
- ✅ Calendar: Gregorian + Hijri

---

## Roadmap 🗺️

| Phase | Description | Version | Status |
|-------|-------------|---------|--------|
| **Phase 1** | Platform Core (Bot, RBAC, Sections, Audit) | v0.1.0 | ✅ Complete |
| **Phase 2** | Module Kit (Helpers, Drafts, CLI) | v0.2.0 | ✅ Complete |
| **Phase 3** | Production Readiness (Sentry, CI/CD, Backups) | v0.3.0 | ✅ Complete |
| **Phase 4** | AI Operational Assistant | v0.4.0 | ⏳ Coming |
| **Phase 5** | Smart Admin Dashboard (MVP) | v0.5.0 | ⏳ Coming |
| **Phase 6** | Advanced Features | v1.0.0 | ⏳ Coming |

📋 **Full Details:** See [`docs/project/roadmap.md`](docs/project/roadmap.md)

### Phase 4 — AI Assistant (Coming)

A multi-modal operational assistant trained on company data:

| Feature | Description | Technology |
|---------|-------------|-----------|
| 💬 Arabic Q&A | Ask questions about your company data | RAG + pgvector |
| 📄 File Analysis | Upload PDF/Excel/Image for analysis | Tesseract/PaddleOCR |
| 🎤 Voice Notes | Send voice notes instead of typing | Whisper |
| 🤖 Flexible Models | Local (Qwen2.5:7b) or Cloud (Gemini/Claude/OpenAI) | Ollama + REST APIs |
| 🔒 Privacy | Filter sensitive data before sending to external models | Context Redaction |

> See full specs: [`specs/002-ai-assistant/spec.md`](specs/002-ai-assistant/spec.md)

---

## Methodology

This project follows **[SpecKit](https://github.com/github/spec-kit)** for specification-driven development:

1. 📜 **Constitution** — Supreme reference for all decisions ([v2.5.0](.specify/memory/constitution.md))
2. 📋 **Specification** — Precise feature definition
3. 📐 **Plan** — Technical and structural decisions
4. ✅ **Tasks** — Step-by-step breakdown
5. 🔍 **Analysis** — Consistency review

---

<div align="center">

**Built with ❤️ for Egyptian businesses**

</div>
