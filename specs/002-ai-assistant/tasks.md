# مهام AI Operational Assistant — Feature 002

**Branch**: `004-ai-assistant`
**Created**: 2026-02-24
**Strategy**: بناء موازٍ — التحضير يبدأ من Phase 6، التكامل الكامل بعد Phase 11

---

## المرحلة A — التحضير الأساسي (يوازي Phase 6-7)

> الهدف: إعداد البنية التحتية لإتاحة الطرق المحلية والخارجية بدون أي تأثير على التطوير الرئيسي

- [ ] T-AI-01 [P] **تحديث docker-compose.yml**
  - استبدال `postgres:16` بـ `pgvector/pgvector:pg16`
  - إضافة Ollama service:
    ```yaml
    ollama:
      image: ollama/ollama
      ports: ["11434:11434"]
      volumes:
        - ollama_data:/root/.ollama
    ```
  - إضافة `ollama_data` لقسم volumes

- [ ] T-AI-02 [P] **إنشاء هيكل packages/ai-assistant/**
  ```
`
  packages/ai-assistant/
  ├── src/
  │   ├── embedding/     # توليد وتخزين vectors
  │   ├── rag/           # البحث + RBAC filter
  │   ├── router/         # NEW: AI Router for dynamic provider switching
  │   ├── llm/           # Ollama client + External API clients
  │   └── bot/           # grammY handler للمحادثة
  ├── package.json
  └── tsconfig.json
  ```
  ملفات فارغة فقط — لا كود بعد

- [ ] T-AI-03 [P] **تحديث .env.example**
  ```env
  # AI Assistant (Hybrid)
  OLLAMA_BASE_URL=http://localhost:11434
  AI_EMBEDDING_MODEL=nomic-embed-text
  AI_LLM_MODEL=qwen2.5:7b
  AI_ENABLED=false
  # NEW: External API Keys
  OPENAI_API_KEY=sk-xxx
  GEMINI_API_KEY=xxx
  CLAUDE_API_KEY=sk-xxx
  AI_PROVIDER=local  # NEW: 'local' | 'openai' | 'gemini' | 'claude'
  ```

- [ ] T-AI-04 [P] **تحديث quickstart.md**
  - إضافة قسم "إعداد AI Provider":
    ```bash
    # تحديد موفّر AI
    echo "Select AI Provider:"
    echo "1. Local (Ollama) - Private embeddings, no data leaves infra"
    echo "2. OpenAI - Best general-purpose, paid API"
    echo "3. Gemini - Good multi-modal, Google ecosystem"
    echo "4. Claude - Strong reasoning, Anthropic"
    # عند اختيار موفّر خارجي، يتم حفظ في User.AI_PROVIDER
    ```

**Checkpoint A**: docker-compose يشغّل pgvector + Ollama — الهيكل جاهز

---

## المرحلة B — بناء الخدمات (يوازي Phase 8-9)

> الهدف: بناء كامل خدمات AI جاهزة للتكامل

- [ ] T-AI-05 [P] **إضافة جدول Embedding لـ Prisma**
  ```prisma
  model Embedding {
    id         String   @id @default(cuid())
    sourceType String   // 'user' | 'audit_log' | 'hr_record' | 'expense'
    sourceId   String
    content    String   // النص الأصلي قبل التحويل
    vector     Unsupported("vector(768)")  // NEW: Use pgvector type instead
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt

    @@index([sourceType, sourceId])
  }
  ```
  - تشغيل migration
  - تفعيل pgvector extension في migration:
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```

- [ ] T-AI-06 [P] **بناء LLM Client** (`packages/ai-assistant/src/llm/client.ts`)
  - NEW: دالة `askLLM(prompt: string, context: string, provider?: string): Promise<string>`
  - تتصل بـ Ollama على `OLLAMA_BASE_URL`
  - تستخدم `AI_LLM_MODEL` من env
  - NEW: دالة `askExternalLLM(prompt: string, context: string, provider: 'openai'|'gemini'|'claude'): Promise<string>`
    - تتصل بـ External API بناءً على `provider` و API key
  - timeout 15 ثانية

- [ ] T-AI-07 [P] **بناء Embedding Service** (`packages/ai-assistant/src/embedding/service.ts`)
  - دالة `embedText(text: string): Promise<number[]>`
  - تستخدم `nomic-embed-text` عبر Ollama
  - NEW: حفظ جميع الـ embeddings محلياً في PostgreSQL باستخدام `pgvector` (Data Privacy)
  - دالة `saveEmbedding(sourceType, sourceId, vector)`

- [ ] T-AI-08 [P] **بناء RAG Service** (`packages/ai-assistant/src/rag/service.ts`)
  - دالة `search(query: string, userId: string, role: Role): Promise<string[]>`
  - يُحوّل السؤال لـ vector
  - يبحث في `pgvector` باستخدام similarity search
  - NEW: دالة `redactContext(context: string, userId: string, role: Role): string`
    - طبقة "Context Redaction" — تزيل البيانات الحساسة
    - تستخدم الفلاتر القابلة (انظر spec.md Context Redaction Layer)

- [ ] T-AI-09 [P] **بناء RBAC Filter** (`packages/ai-assistant/src/rag/rbac-filter.ts`)
  - `SUPER_ADMIN` → لا فلتر — يرى كل شيء
  - `ADMIN` → يرى sourceType المرتبط بـ AdminScope فقط
  - `EMPLOYEE` → يرى sourceId يساوي userId فقط
  - `VISITOR` → يُرفض قبل الوصول للبحث
  - NEW: دالة `shouldRedact(userId, role): boolean` — تقرر الفلترة القابلة

**Checkpoint B**: جميع خدمات AI جاهزة ومختبرة — في انتظار التكامل

---

## المرحلة C — التكامل الكامل (بعد Phase 11)

> الهدف: تشغيل AI فعلياً في البوت بعد توفر بيانات حقيقية

- [ ] T-AI-10 [P] **بناء Bot Handler** (`packages/ai-assistant/src/bot/handler.ts`)
  - يستقبل رسائل نصية من المستخدم
  - يُرسل للـ RAG Service ويحصل على سياق
  - يُرسل للـ LLM Client ويحصل على إجابة
  - NEW: يُرسل لـ AI Router لتحديد الموفّر (Local/External)
  - يُسجّل الاستعلام في AuditLog (بدون حفظ محتوى السؤال)
  - يُرجع الإجابة للمستخدم

- [ ] T-AI-11 [P] **تسجيل Handler في البوت الرئيسي**
  - إضافة `/ai` command أو تفعيل المحادثة الحرة
  - حماية بـ RBAC middleware (VISITOR يُرفض)
  - NEW: دالة `checkPrivacyFilter(userId): boolean` — يطبّق الفلاتر القابلة

- [ ] T-AI-12 [P] **بناء AI Router** (`packages/ai-assistant/src/router/index.ts`) ← NEW
  - NEW: المكون يختار الموفّر تلقائياً من إعداد `AI_PROVIDER` في قاعدة البيانات
  - NEW: دالة `getProvider(): 'local' | 'openai' | 'gemini' | 'claude'`
  - NEW: دالة `switchProvider(provider: string): void` — حفظ في User.AI_PROVIDER
  - NEW: واجهة موحدة لجميع الموفّرين — `askLLM()` لـ Ollama، `askExternalLLM()` لـ APIs

- [ ] T-AI-13 [P] **بناء External API Clients** (`packages/ai-assistant/src/llm/external/`) ← NEW
  - NEW: `openai-client.ts` — يتصل بـ OpenAI API
  - NEW: `gemini-client.ts` — يتصل بـ Gemini API
  - NEW: `claude-client.ts` — يتصل بـ Anthropic Claude API
  - جميع الـ clients تستخدم فلاتر "Context Redaction Layer"

- [ ] T-AI-14 [P] **تسجيل Privacy Filters** في البوت الرئيسي (`packages/core/`)
  - NEW: إضافة `/ai-settings privacy-filters` command
  - NEW: حفظ حالة كل فلتر في جدول `PrivacyFilter` في Prisma:
    ```prisma
    model PrivacyFilter {
      id       String   @id @default(cuid())
      userId   BigInt   @map("user_id")
      filterType String  // 'national_id' | 'phone' | 'company' | 'personal_name'
      isActive Boolean @default(true) @map("is_active")
      createdAt DateTime @default(now()) @map("created_at")

      @@unique([userId, filterType])
      @@index([userId])
      @@map("privacy_filters")
    }
    ```
  - NEW: فلاتر مُنشّط تلقائياً لـ SUPER_ADMIN، مُعطّل لـ ADMIN و EMPLOYEE فقط
  - NEW: دالة `checkPrivacyFilter(userId, filterType): boolean` في RBAC Filter

**Checkpoint C**: AI Operational Assistant جاهز للإنتاج

---

## ملخص المهام

| المرحلة | عدد المهام | الحالة |
|---|---|---|
| A — التحضير الأساسي | 4 | Phase 6-7 |
| B — بناء الخدمات | 9 | Phase 8-9 |
| C — التكامل الكامل | 8 | بعد Phase 11 |

**الإجمالي:** 21 | ⏳ |
