# مهام AI Operational Assistant — Feature 002

**Branch**: `004-ai-assistant`
**Created**: 2026-02-24
**Strategy**: بناء موازٍ — التحضير يبدأ من Phase 6، التكامل الكامل بعد Phase 11

---

## المرحلة A — التحضير الأساسي (يوازي Phase 6-7)

> الهدف: إعداد البنية التحتية بدون أي تأثير على التطوير الرئيسي

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
  packages/ai-assistant/
  ├── src/
  │   ├── embedding/     # توليد وتخزين vectors
  │   ├── rag/           # البحث + RBAC filter
  │   ├── llm/           # Ollama client + prompts
  │   └── bot/           # grammY handler للمحادثة
  ├── package.json
  └── tsconfig.json
  ```
  ملفات فارغة فقط — لا كود بعد

- [ ] T-AI-03 [P] **تحديث .env.example**
  ```env
  # AI Assistant
  OLLAMA_BASE_URL=http://localhost:11434
  AI_EMBEDDING_MODEL=nomic-embed-text
  AI_LLM_MODEL=qwen2.5:7b
  AI_ENABLED=false
  ```

- [ ] T-AI-04 [P] **تحديث quickstart.md**
  - إضافة قسم "تحميل نماذج AI":
    ```bash
    # بعد تشغيل docker-compose
    docker exec ollama ollama pull nomic-embed-text
    docker exec ollama ollama pull qwen2.5:7b
    ```

**Checkpoint A**: docker-compose يشغّل pgvector + Ollama — الهيكل جاهز

---

## المرحلة B — بناء الخدمات (يوازي Phase 8-9)

> الهدف: بناء كامل خدمات AI جاهزة للتكامل

- [ ] T-AI-05 [P] **إضافة جدول Embedding لـ Prisma**
  ```prisma
  model Embedding {
    id         String   @id @default(cuid())
    sourceType String   // 'audit_log' | 'user' | 'hr_record' | 'expense'
    sourceId   String
    content    String   // النص الأصلي قبل التحويل
    vector     Unsupported("vector(768)")
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
  - دالة `askLLM(prompt: string, context: string): Promise<string>`
  - تتصل بـ Ollama على `OLLAMA_BASE_URL`
  - تستخدم `AI_LLM_MODEL` من env
  - timeout 15 ثانية

- [ ] T-AI-07 [P] **بناء Embedding Service** (`packages/ai-assistant/src/embedding/service.ts`)
  - دالة `embedText(text: string): Promise<number[]>`
  - دالة `saveEmbedding(sourceType, sourceId, content)` — تُنشئ vector وتحفظه
  - دالة `updateEmbedding(sourceType, sourceId, content)` — تُحدّث عند تغيير البيانات
  - تستخدم `nomic-embed-text` عبر Ollama

- [ ] T-AI-08 [P] **بناء RAG Service** (`packages/ai-assistant/src/rag/service.ts`)
  - دالة `search(query: string, userId: string, role: Role): Promise<string[]>`
  - يُحوّل السؤال لـ vector ثم يبحث في pgvector
  - يطبّق RBAC filter (انظر قواعد الصلاحيات في spec.md)
  - يُرجع أقرب 5 نتائج كسياق

- [ ] T-AI-09 [P] **بناء RBAC Filter** (`packages/ai-assistant/src/rag/rbac-filter.ts`)
  - `SUPER_ADMIN` → لا فلتر — يرى كل شيء
  - `ADMIN` → يرى sourceType المرتبط بـ AdminScope فقط
  - `EMPLOYEE` → يرى sourceId يساوي userId فقط
  - `VISITOR` → يُرفض قبل الوصول للبحث

- [ ] T-AI-10 [P] **Unit tests لكل الخدمات**
  - اختبار LLM Client (mock Ollama)
  - اختبار Embedding Service (mock pgvector)
  - اختبار RBAC Filter (لكل role)

**Checkpoint B**: جميع خدمات AI جاهزة ومختبرة — في انتظار التكامل

---

## المرحلة C — التكامل الكامل (بعد Phase 11)

> الهدف: تشغيل AI فعلياً في البوت بعد توفر بيانات حقيقية

- [ ] T-AI-11 **بناء Bot Handler** (`packages/ai-assistant/src/bot/handler.ts`)
  - يستقبل رسائل نصية من المستخدم
  - يُرسل للـ RAG Service ويحصل على سياق
  - يُرسل للـ LLM Client ويحصل على إجابة
  - يُسجّل الاستعلام في AuditLog (بدون حفظ محتوى السؤال)
  - يُرجع الإجابة للمستخدم

- [ ] T-AI-12 **تسجيل Handler في البوت الرئيسي**
  - إضافة `/ai` command أو تفعيل المحادثة الحرة
  - حماية بـ RBAC middleware (VISITOR يُرفض)

- [ ] T-AI-13 **Embedding Pipeline للبيانات الموجودة**
  - عند تفعيل AI لأول مرة: بناء embeddings لكل البيانات الموجودة
  - Cron job لتحديث embeddings كل 60 ثانية عند وجود تغييرات

- [ ] T-AI-14 **Integration Tests**
  - سؤال بالعربية → إجابة صحيحة
  - EMPLOYEE لا يرى بيانات غيره
  - ADMIN يرى قسمه فقط
  - سؤال خارج النطاق → رسالة واضحة

- [ ] T-AI-15 **قياس الأداء**
  - التحقق من NFR-AI-001: زمن استجابة < 10 ثوانٍ لـ 95% من الاستعلامات
  - التحقق من SC-AI-001: إجابة صحيحة لـ 80%+ من الأسئلة

**Checkpoint C**: AI Operational Assistant جاهز للإنتاج

---

## ملخص المهام

| المرحلة | عدد المهام | يوازي | الحالة |
|---|---|---|---|
| A — تحضير أساسي | 4 | Phase 6-7 | ⏳ |
| B — بناء خدمات | 6 | Phase 8-9 | ⏳ |
| C — تكامل كامل | 5 | بعد Phase 11 | ⏳ |
| **الإجمالي** | **15** | | |
