# A-02: تحليل ملف مرفق (File Analysis)

> **الحالة:** ⏳ مخطط (Layer 4 — AI Assistant)

## شجرة التدفق المخططة

```mermaid
flowchart TD
    A["المستخدم يرسل ملف\n(PDF / Excel / صورة)"] --> B["AI Handler يكتشف نوع الملف"]
    B --> C{"نوع الملف؟"}

    C -->|PDF| D["استخراج النص\n(pdf-parse)"]
    C -->|Excel| E["قراءة الجداول\n(xlsx)"]
    C -->|صورة| F["OCR\n(Tesseract / PaddleOCR)"]

    D --> G["📊 تحليل المحتوى عبر LLM"]
    E --> G
    F --> G

    G --> H["📩 عرض ملخص + إجابة"]

    style H fill:#27ae60,color:#fff
```

## أنواع الملفات المدعومة (مخطط)

| النوع | المكتبة | الحجم الأقصى |
|-------|---------|-------------|
| PDF | `pdf-parse` | 10MB |
| Excel (.xlsx) | `xlsx` / `exceljs` | 5MB |
| صورة (JPG/PNG) | Tesseract / PaddleOCR | 5MB |
| Word (.docx) | مخطط لاحقاً | — |
