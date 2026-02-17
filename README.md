# بوت السعادة الذكي | Al-Saada Smart Bot

> منصة ذكية ومعيارية لإدارة الأعمال المصرية عبر تيليجرام

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-≥20-green.svg)]()
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

---

## ما هو بوت السعادة؟

بوت السعادة هو **محرك فارغ** يتحول إلى نظام إدارة أعمال متكامل عبر تيليجرام، مع **مساعد ذكاء اصطناعي تشغيلي** مدرّب على بيانات الشركة. بدلاً من كتابة كود لكل وظيفة، تقوم بتعريف **ملفات تكوين** (Configuration) والمحرك يحولها تلقائياً إلى شاشات بوت كاملة.

### الفكرة الأساسية

```
ملفات تكوين (Config) ──▶ محرك التدفق (Flow Engine) ──▶ شاشات بوت تيليجرام
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
│     (ملفات تكوين + Hooks اختيارية)          │
│   HR │ Finance │ Fleet │ Inventory │ ...    │
├─────────────────────────────────────────────┤
│           Layer 2: محرك التدفق              │
│  Flow Blocks │ Wizard │ Lists │ Reports     │
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
| **Layer 2** — محرك التدفق | Flow Blocks، المعالج، القوائم، التقارير | ثابت — دماغ المنصة |
| **Layer 3** — الموديولات | تكوين فقط + hooks اختيارية | متغير — قاعدة 90/10 |
| **AI Assistant** — المساعد الذكي | Qwen3-8B + RAG + صوت | مساعد تشغيلي على بيانات الشركة |

---

## التقنيات

| المجال | التقنية |
|--------|---------|
| Runtime | Node.js ≥20, TypeScript 5.x (strict) |
| Bot | grammY + conversations + hydrate |
| Server | Hono (webhook) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 + ioredis |
| Queue | BullMQ |
| Validation | Zod |
| i18n | @grammyjs/i18n (Arabic + English) |
| Logging | Pino |
| Testing | Vitest (80% coverage) |
| Infrastructure | Docker Compose |
| AI Framework | Vercel AI SDK (@ai-sdk/*) |
| AI Local Model | Qwen3-8B via Ollama (Apache 2.0) |
| AI Cloud Models | Gemini (free) / Claude / GPT |
| RAG | pgvector (PostgreSQL extension) |
| STT | OpenAI Whisper / Google STT |
| TTS | Google TTS / OpenAI TTS |

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

### التحقق من التشغيل

1. افتح تيليجرام وابحث عن البوت
2. أرسل `/start`
3. أول مستخدم يصبح **Super Admin** تلقائياً

---

## الأوامر المتاحة

### أوامر npm

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل البوت (development) |
| `npm run dev:watch` | تشغيل مع مراقبة التغييرات |
| `npm run build` | بناء للإنتاج |
| `npm test` | تشغيل الاختبارات |
| `npm run test:coverage` | اختبارات مع تقرير التغطية |
| `npm run lint` | فحص جودة الكود |
| `npm run typecheck` | فحص الأنواع |
| `npm run db:migrate` | تشغيل migrations |
| `npm run db:studio` | فتح Prisma Studio |
| `npm run docker:up` | تشغيل Docker services |
| `npm run docker:down` | إيقاف Docker services |

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

### الخصائص

- **نموذج محلي أساسي:** Qwen3-8B عبر Ollama — خصوصية كاملة، بدون تكلفة
- **نماذج سحابية احتياطية:** Gemini (مجاني) / Claude / GPT
- **RAG:** مدرّب على قاعدة بيانات الشركة (موظفين، معدات، مالية، إلخ)
- **صوت:** إرسال سؤال صوتي والحصول على رد صوتي بالعربي
- **RBAC-aware:** كل مستخدم يرى فقط البيانات المصرح له بها
- **قراءة فقط:** لا يعدّل بيانات — استعلامات وتقارير فقط
- **إدارة من البوت:** Super Admin يتحكم في كل الإعدادات بدون لمس الكود

### أمثلة على الاستعلامات

| السؤال | من يسأل |
|--------|---------|
| "كم موظف في إجازة اليوم؟" | Admin / Super Admin |
| "ما حالة المعدة رقم 105؟" | Admin / Super Admin |
| "كم رصيد إجازاتي؟" | Employee |
| "أعطني تقرير المصروفات الشهر الماضي" | Admin / Super Admin |
| "هل سالم سجّل حضوره اليوم؟" | Admin (في نطاقه) |

---

## هيكل المشروع

```
al-saada-smart-bot/
├── packages/
│   ├── core/                 # Layer 1 — نواة المنصة
│   │   ├── src/
│   │   │   ├── main.ts       # نقطة الدخول
│   │   │   ├── bot/          # إعداد البوت والـ middleware
│   │   │   ├── services/     # خدمات الأعمال
│   │   │   ├── database/     # Prisma client
│   │   │   ├── cache/        # Redis client
│   │   │   ├── config/       # إعدادات البيئة
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # أدوات مساعدة
│   │   └── tests/            # اختبارات
│   └── ai-assistant/         # Phase 4 — المساعد الذكي
│       └── src/
│           ├── rag/          # pgvector + embeddings
│           ├── chat/         # معالجة المحادثات
│           ├── voice/        # STT + TTS
│           └── providers/    # Qwen3/Gemini/Claude/GPT
├── prisma/
│   └── schema.prisma         # تعريف قاعدة البيانات
├── modules/                  # موديولات (فارغ حالياً)
├── specs/                    # مواصفات Spec Kit
├── .specify/                 # إعدادات Spec Kit + الدستور
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## مراحل التطوير

| المرحلة | الوصف | الإصدار | الحالة |
|---------|-------|---------|--------|
| **Phase 1** | نواة المنصة (Bot, RBAC, Sections, Audit) | v0.1.0 | 🔄 قيد التنفيذ |
| **Phase 2** | محرك التدفق (Flow Blocks, Wizard, Lists) | v0.2.0 | ⏳ قادم |
| **Phase 3** | موديول تجريبي (HR Employee Registration) | v0.3.0 | ⏳ قادم |
| **Phase 4** | مساعد ذكاء اصطناعي تشغيلي (Qwen3-8B + RAG + صوت) | v1.0.0 | ⏳ قادم |

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
2. **التكوين أولاً** — 90% تكوين + 10% hooks اختيارية
3. **إعادة استخدام Flow Blocks** — غير قابل للتفاوض
4. **الاختبار أولاً** — 80% تغطية للكود الأساسي
5. **السياق المصري** — كل المحققات تدعم الصيغ المصرية
6. **الأمان والخصوصية** — لا بيانات حساسة في السجلات
7. **البساطة فوق الذكاء** — YAGNI
8. **Monorepo** — فصل واضح بين الحزم
