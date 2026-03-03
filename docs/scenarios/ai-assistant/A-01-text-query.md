# A-01: سؤال نصي بالعربية (RAG Query)

> **الحالة:** ⏳ مخطط (Layer 4 — AI Assistant)

## شجرة التدفق المخططة

```mermaid
flowchart TD
    A["المستخدم يكتب سؤال بالعربية\n'كم لتر سولار استهلكنا هذا الشهر؟'"] --> B["AI Handler يستقبل النص"]
    B --> C["🔍 RBAC Check\nهل المستخدم مصرح بالوصول للبيانات؟"]
    C -->|لا| C1["⛔ رفض — لا يملك صلاحية"]
    C -->|نعم| D

    D["📊 RAG Pipeline:\n1. Embedding السؤال (pgvector)\n2. البحث في البيانات المصرح بها\n3. تجميع السياق"] --> E["🤖 إرسال للنموذج\n(Ollama/Qwen2.5:7b أو Cloud)"]

    E --> F["Context Redaction:\nتصفية البيانات الحساسة\nقبل الإرسال للنموذج الخارجي"]
    F --> G["📩 عرض الإجابة للمستخدم"]

    style G fill:#27ae60,color:#fff
    style C1 fill:#e74c3c,color:#fff
```

## التقنيات المخططة

| المكون | التقنية |
|--------|---------|
| Embedding | pgvector في PostgreSQL |
| LLM محلي | Ollama + Qwen2.5:7b |
| LLM سحابي | Gemini / Claude / OpenAI (اختياري) |
| حماية البيانات | Context Redaction + RBAC filtering |
