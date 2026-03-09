# دليل إعداد Claude.ai Project — المستشار التقني
# Al-Saada Smart Bot

---

## الخطوة 1: إنشاء المشروع

1. افتح **Claude.ai**
2. من القائمة الجانبية اضغط **Projects**
3. اضغط **Create Project**
4. الاسم: `Al-Saada Smart Bot — Technical Advisor`

---

## الخطوة 2: Custom Instructions

1. في إعدادات المشروع → **Set custom instructions**
2. انسخ محتوى ملف `PROJECT-SYSTEM-PROMPT.md` بالكامل والصقه
3. احفظ

---

## الخطوة 3: Project Knowledge

ارفع هذه الملفات الأربعة في **Add content → Upload**:

| الملف | المحتوى | الحجم |
|-------|---------|-------|
| `knowledge-methodology.md` | المنهجية المكثّفة (12 قاعدة + سير العمل) | ~3K كلمة |
| `knowledge-constitution.md` | الدستور المكثّف (11 مبدأ + RBAC + Tech Stack) | ~3.5K كلمة |
| `knowledge-speckit-reference.md` | مرجع أوامر SpecKit المكثّف | ~2K كلمة |
| `knowledge-roadmap-status.md` | خريطة الطريق + حالة المشروع الحالية | ~2.5K كلمة |

> **لماذا ملفات مكثّفة؟** الأصلية ~16,000 كلمة → المكثّفة ~11,000 كلمة = توفير ~30% من التوكنز في كل رسالة.

---

## الخطوة 4: MCP Filesystem

تأكد أن MCP server مُفعّل ويشمل:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "F:\\_Al-Saada_Smart_Bot"
      ]
    }
  }
}
```

---

## الخطوة 5: Skills (اختياري لكن موصى به)

الـ Skills موجودة في `.claude/skills/` داخل المشروع:

| Skill | المسار | الغرض |
|-------|--------|-------|
| `technical-advisor` | `.claude/skills/technical-advisor/SKILL.md` | تعريف الدور والمنهجية |
| `speckit-advisor` | `.claude/skills/speckit-advisor/SKILL.md` | مرجع أوامر SpecKit |
| `codebase-reviewer` | `.claude/skills/codebase-reviewer/SKILL.md` | مراجعة مخرجات المنفّذ |
| `project-status` | `.claude/skills/project-status/SKILL.md` | تقارير حالة المشروع |

### طريقة الرفع:
1. Settings > Capabilities > Skills
2. اضغط Upload skill
3. اضغط كل مجلد skill كـ ZIP وارفعه

أو ضعها في مسار Skills الخاص بـ Claude Code إذا كنت تستخدمه.

---

## الخطوة 6: قواعد الاستخدام الفعّال (توفير الموارد)

### ✅ افعل:
- **محادثة لكل مهمة** — "تخطيط Phase 3"، "مراجعة Sentry"، "تقرير حالة"
- **استخدم MCP filesystem** — قل "راجع ملف X" بدل نسخ الكود
- **كن محدداً** — "راجع sentry.ts مقابل PR-001" بدل "راجع كل شيء"
- **اختصر الموافقات** — "موافق" أو "نفّذ" تكفي
- **أغلق المحادثة عند الانتهاء** — المحادثات الطويلة تستهلك أكثر

### ❌ لا تفعل:
- لا تفتح محادثة واحدة لكل شيء
- لا ترفق ملفات في الرسائل إذا كانت في Project Knowledge
- لا تنسخ مخرجات المنفّذ كنص — استخدم MCP
- لا تعيد شرح السياق — المشروع يحمله تلقائياً
- لا تطلب "مراجعة شاملة" بدون تحديد النطاق

---

## متى تحدّث هذه الملفات؟

| الحدث | الملف المتأثر |
|-------|--------------|
| تعديل الدستور | `knowledge-constitution.md` |
| إضافة قاعدة ذهبية | `knowledge-methodology.md` |
| إكمال Phase أو تغيير حالة | `knowledge-roadmap-status.md` |
| تعديل أوامر SpecKit | `knowledge-speckit-reference.md` |

---

## الهيكل النهائي

```
Claude.ai Project: "Al-Saada Smart Bot — Technical Advisor"
│
├── Custom Instructions: PROJECT-SYSTEM-PROMPT.md
│
├── Project Knowledge:
│   ├── knowledge-methodology.md
│   ├── knowledge-constitution.md
│   ├── knowledge-speckit-reference.md
│   └── knowledge-roadmap-status.md
│
├── MCP: filesystem → F:\_Al-Saada_Smart_Bot
│
├── Skills (optional):
│   ├── technical-advisor
│   ├── speckit-advisor
│   ├── codebase-reviewer
│   └── project-status
│
└── المحادثات: (أنت تحدد حسب المهمة)
```
