# Feature Specification: AI Operational Assistant (Layer 4) - Multi-Modal Hybrid Architecture

**Feature Branch**: `004-ai-assistant`
**Created**: 2026-02-24
**Status**: Draft — التحضير يبدأ من Phase 6، التكامل الكامل في Phase 11
**Input**: قرار معماري 2026-02-27 — Multi-Modal Hybrid AI Architecture with Voice, Vision, and Document Capabilities

---

## نظرة عامة

مساعد تشغيلي ذكي متعدد الوسائط داخل بوت Telegram يتيح للمستخدمين:
1. **سؤال بالعربية** — إرسال نص وأجابات ذكية باللغة العربية
2. **تحليل الملفات** — رفع PDFs، Excel، صور مستندات، وتحليل محتوها
3. **ملاحظات صوتية** — Admins/Super Admins يمكن إرسال ملاحظات صوتية بدلاً من الكتابة
4. **البحث المعرفي** — البحث في بيانات الشركة وقاعدة المعرفة المبينة (RAG)

**الهدف:** "مُساعد ذكي متعدد الوسائط يجيبك من بيانات شركتك، يحلل ملفاتك، ويساعدك في إدارة العمل."

---

## البنية التقنية

### المكونات الأساسية

```
المستخدم (Telegram)
      ↓
Bot Handler (grammY)
      ↓
AI Router (packages/ai-assistant/) ← MULTI-MODAL: Text + Voice + Vision + Document Parsing
      ↓
RAG Service (packages/ai-assistant/)
      ├── Embedding Search (pgvector)
      ├── Context Builder
      ├── Document Parser ← NEW: OCR, Text extraction from uploads
      └── LLM Query (Ollama OR External API)
            ↓
        Local: Qwen2.5:7b/Llama3 (محلي)
        External: Gemini, Claude, OpenAI (APIs)
```

### الخيارات التقنية

| المكون | التقنية | السبب |
|---|---|------|
| LLM | Local: Qwen2.5:7b/Llama3, External: Gemini/Claude/OpenAI APIs | Hybrid approach — Super Admin can switch |
| Inference Server | Local: Ollama, External: REST APIs | Dynamic routing via AI Router |
| Embeddings | nomic-embed-text | دعم عربي، مجاني، محلي — ALL embeddings stored locally |
| Vector DB | pgvector | فوق PostgreSQL الموجود — لا DB إضافي |
| Document Parser | Tesseract/PaddleOCR | تحليل PDFs، Excel، Images مع OCR عربي |
| Voice Command | Whisper API (محلي) أو خارجي | تحويل الصوت إلى نص عربي |
| Package | packages/ai-assistant/ | منفصل عن packages/core/ |
```

### مصادر البيانات (RAG Sources)

| المصدر | النوع | متى يُضاف |
|---|---|---|
| AuditLog | سجل الحركات | بعد Phase 8 |
| User | بيانات المستخدمين | بعد Phase 5 |
| HR Records | بيانات الموظفين | بعد Phase 11 |
| Company Docs | ملفات الشركة | بعد Phase 11 (NEW) |
| وحدات أخرى | حسب الوحدة | تدريجياً |
```

### صلاحيات الوصول إلى الـ RAG

| الدور | ما يراه |
|---|---|---|
| SUPER_ADMIN | كل البيانات + ملفات شركة |
| ADMIN | بيانات قسمه فقط (AdminScope) + ملفات شركة |
| EMPLOYEE | بياناته الشخصية فقط + ملفات قسمه |
| VISITOR | لا وصول |

---

## User Stories

### US-AI-1 — سؤال بالعربية

**Given** أنا مستخدم مسجّل
**When** أكتب "كم يوم إجازة تبقى لي؟"
**Then** البوت يبحث في بياناتي ويجيب بالعربية بدقة

### US-AI-2 — تحليل الملفات

**Given** أنا موظف أو SUPER_ADMIN
**When** أرفع ملف (PDF, Excel, Image)
**Then** النظام يحلل الملف ويعرض ملخص في الرد
  - NEW: يدعم PDFs، Excel، Images
  - NEW: يستخدم OCR للنصوص من الصور (Tesseract/PaddleOCR)
  - NEW: يستخرج بيانات هيكلية (أرقام هواتف، أسماء موظفين)
  - NEW: يحفظ الملف في جدول `CompanyDoc` في قاعدة البيانات

### US-AI-3 — ملاحظات صوتية

**Given** أنا SUPER_ADMIN أو ADMIN
**When** أريد إرسال ملاحظة لموظف
**Then** البوت يعرض خيار "إرسال ملاحظة صوتية"
**When** أسجّل، يُرسل رسالة صوتية للموظف
  - NEW: يستخدم Whisper API (محلي) أو خارجي لتحويل الصوت

### US-AI-4 — البحث المعرفي

**Given** أنا موظف (أي دور له وصول للبيانات)
**When** أسأل سؤال عن بيانات الشركة
**Then** البوت يبحث في RAG ويجيب

---

## Functional Requirements

### الأسئلة والبحث

- **FR-AI-001**: النظام يجب أن يقبل أسئلة نصية بالعربية من المستخدمين عبر Telegram
- **FR-AI-002**: النظام يجب أن يبحث في vector embeddings المرتبطة بصلاحيات المستخدم فقط
- **FR-AI-003**: النظام يجب أن يُرسل السؤال + السياق المسترجع إلى Qwen2.5:7b عبر Ollama أو External API (Gemini, Claude, OpenAI)
  - NEW: دعم الوسائط المتعددة (Text + Voice + Vision + Documents)
  - NEW: الـ Router يختار الموفّر تلقائياً من إعداد `AI_PROVIDER` في قاعدة البيانات
- **FR-AI-004**: النظام يجب أن يُرجع الإجابة بالعربية خلال أقل من 10 ثوان

- **FR-AI-005 (NEW)**: نظام تحليل الملفات — دعم رفع الملفات (PDFs, Excel, Images)
  - NEW: يجب تحليل الملف المرفق باستخدام OCR (Tesseract/PaddleOCR) لنصوص من الصور
  - NEW: يجب استخراج البيانات الهيكلية من الملفات (أرقام هواتف، أسماء موظفين)
  - NEW: يجب حفظ الملف المحلل في جدول `CompanyDoc` في قاعدة البيانات
  - NEW: يعرض ملخص للمستخدم في الرد على السؤال

- **FR-AI-006 (NEW)**: نظام الملاحظات الصوتية — Admins/Super Admins يمكن إرسال ملاحظات صوتية
  - NEW: يجب توفير خيار "إرسال ملاحظة صوتية" للمستخدمين في محادثة الملف
  - NEW: عند إرسال الملاحظة، يتم تسجيل صوتي في AuditLog
  - NEW: يستخدم Whisper API (محلي) أو خارجي لتحويل الصوت إلى نص عربي

- **FR-AI-007**: النظام يجب أن يطبّق RBAC على نتائج البحث — لا يعرض بيانات خارج صلاحية المستخدم
  - NEW: Admins/Super Admins: وصول كامل لجميع البيانات
  - NEW: EMPLOYEE: وصول فقط لبياناته الشخصية + بيانات قسمه
  - NEW: VISITOR: لا وصول

- **FR-AI-008 (UPDATED)**: النظام يجب أن يسجّل كل استعلام AI في AuditLog بدون حفظ محتوى السؤال
  - NEW: يجب تسجيل نوع الوسائط المستخدمة (Text, Voice, Vision, Document)

- **FR-AI-009 (NEW)**: نظام Context Redaction Layer — طبقة أمان جديدة
  - NEW: للنماذج الخارجية فقط (Gemini, Claude, OpenAI): تطبيق الفلاتر
  - NEW: الفلاتر قابل للتشغيل/الإيقاف عبر إعدادات Super Admin (`/ai-settings privacy-filters`)
  - NEW: الفلاتر تُحفظ في جدول `PrivacyFilter` في قاعدة البيانات
  - NEW: أنواع الفلاتر: `national_id`, `phone`, `company`, `personal_name`
  - NEW: البيانات المفلترة تُستبدل بـ `[REDACTED]` أو `[TOKEN]` قبل الإرسال
  - NEW: نماذج محلية (Ollama) تستلم السياق الكامل بدون أي تصفية

- **FR-AI-010 (NEW)**: إرسال ملاحظات صوتية للموظفين
  - NEW: يُسجل نوع الحدث `VOICE_NOTE_SENT` في AuditLog مع التفاصيل (المستلم، الموظف)
  - NEW: يحفظ الملف الصوتي في `CompanyDoc` جدول

- **FR-AI-011 (NEW)**: تحديث إعدادات AI
  - NEW: مُعدّل `User.AI_PROVIDER` في قاعدة البيانات (local, openai, gemini, claude)
  - NEW: السماح بإرسال الملاحظات الصوتية (EMPLOYEE + ADMIN فقط)
  - NEW: السماح بإرفع الملفات للتحليل (ADMIN + SUPER ADMIN فقط)

---

## Constraints & Roadmap

| المرحلة | ما يحدث | يوازي |
|---|---|---|
| A (Phase 6-7) | إضافة pgvector + Ollama، إنشاء packages/ai-assistant/ فارغ | Phase 6 Sections |
| B (Phase 8-9) | جدول Embeddings + Document Parser + Voice STT | Phase 8 Audit |
| C (Phase 11) | تكامل كامل مع البوت، RBAC على RAG، الملفات، الملاحظات الصوتية | Phase 11 HR Module |

---

## Key Entities

**NEW: CompanyDoc**

```prisma
model CompanyDoc {
  id           String   @id @default(cuid())
  companyId    BigInt   @map("company_id")  // References User or HR record
  uploadedBy   BigInt   @map("uploaded_by")  // User or Admin who uploaded
  fileName     String   @map("file_name")
  fileType     String   // 'pdf' | 'excel' | 'image'
  filePath     String   @map("file_path")
  fileSize     Int      @map("file_size") // bytes
  extractedData Json?  // OCR results, extracted fields
  ocrText      String?  @map("ocr_text") // Arabic text from images
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([companyId])
  @@index([uploadedBy])
  @@index([createdAt])
  @@map("company_docs")
}
```

---

## Constraints & Roadmap

| المرحلة | عدد المهام | الحالة |
|---|---|---|
| A — التحضير الأساسي | 6 | Phase 6-7 |
| B — بناء الخدمات | 12 | Phase 8-9 |
| C — التكامل الكامل | 7 | بعد Phase 11 |

**الإجمالي:** 25 | ⏳ |
