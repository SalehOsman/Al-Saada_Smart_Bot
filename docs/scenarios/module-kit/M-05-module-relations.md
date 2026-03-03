# M-05: ربط الموديولات (Module Relations & Lookup)

> **الحالة:** ⏳ مقترح (لم يُنفذ بعد)

## الفكرة

عندما يحتاج موديول بيانات من موديول آخر (مثلاً: "مسحوبات العاملين" يحتاج اختيار عامل من "بيانات العاملين")، يوفر Module Kit نظام ربط تلقائي يتولى جلب البيانات وعرضها للمستخدم بدون أن يكتب المطور كود UI.

---

## السيناريو الكامل: تسجيل مسحوبات العاملين

### الشخصيات
- **المطور (أحمد)**: يبني الموديولات
- **الموظف (خالد)**: يستخدم البوت لتسجيل مسحوبة

---

### الجزء 1: ما يفعله المطور (مرة واحدة)

```mermaid
flowchart TD
    A["المطور أحمد يُنشئ موديول\n'بيانات العاملين' (employee-data)"] --> B["يُعرّف الحقول:\nالاسم، الهاتف، الرقم القومي، القسم"]
    B --> C["الموديول يعمل بشكل مستقل\nالموظفون يُسجّلون عبر البوت"]

    D["المطور أحمد يُنشئ موديول جديد\n'مسحوبات العاملين' (employee-withdrawals)"] --> E["يُعرّف العلاقة في الـ config:\nrelation → employee-data"]
    E --> F["يستخدم lookup() في المحادثة\nلاختيار العامل"]
    F --> G["✅ انتهى — Module Kit\nيتولى الباقي تلقائياً"]

    style G fill:#27ae60,color:#fff
```

#### ما يكتبه المطور في `module.config.ts`:

```typescript
defineModule({
  slug: 'employee-withdrawals',
  sectionSlug: 'hr',
  name: 'module-withdrawals-name',       // مفتاح i18n
  icon: '💰',

  // ✨ تعريف العلاقة
  relations: [
    {
      field: 'employeeId',                // اسم الحقل في هذا الموديول
      targetModule: 'employee-data',       // slug الموديول المصدر
      targetTable: 'employees',            // اسم جدول Prisma
      displayField: 'fullName',            // الحقل الذي يظهر للمستخدم
      searchFields: ['fullName', 'phone'], // حقول البحث
      filters: { isActive: true },         // فقط العاملين النشطين
    }
  ],

  permissions: { /* ... */ },
  addEntryPoint: withdrawalConversation,
})
```

#### ما يكتبه المطور في `conversation.ts`:

```typescript
async function withdrawalConversation(conversation, ctx) {
  // الخطوة 1: اختيار العامل — سطر واحد فقط!
  const employee = await lookup(ctx, conversation, {
    relation: 'employeeId',
    prompt: 'withdrawal-select-employee',  // مفتاح i18n
  })
  // employee = { id: 'abc123', fullName: 'محمد أحمد علي', phone: '01012345678' }

  // الخطوة 2: إدخال المبلغ (validate عادي)
  const amount = await validate(ctx, conversation, { /* ... */ })

  // الخطوة 3: تأكيد + حفظ
  await confirm(ctx, { employeeName: employee.fullName, amount })
  await save(ctx, { /* ... */ })
}
```

---

### الجزء 2: ما يراه المستخدم النهائي (كل مرة)

```mermaid
flowchart TD
    A["الموظف خالد يفتح البوت\nيضغط /start"] --> B["📋 القائمة الرئيسية"]
    B --> C["يختار: 💰 مسحوبات العاملين"]
    C --> D["📩 البوت يسأل:\n'اختر العامل'"]

    D --> E["📋 قائمة العاملين:\n━━━━━━━━━━━\n👤 أحمد محمد علي\n👤 محمود حسن إبراهيم\n👤 سعيد عبدالله خالد\n👤 يوسف إبراهيم أحمد\n━━━━━━━━━━━\n🔎 بحث │ ◀ التالي"]

    E --> F{"ماذا يفعل خالد؟"}

    F -->|"يختار عامل مباشرة"| G["✅ تم اختيار: أحمد محمد علي"]
    F -->|"يضغط 🔎 بحث"| H["📩 البوت: 'اكتب اسم أو رقم العامل'"]
    H --> H1["خالد يكتب: 'محمود'"]
    H1 --> H2["📋 نتائج البحث:\n👤 محمود حسن إبراهيم\n👤 محمود صالح أحمد"]
    H2 --> G2["✅ تم اختيار: محمود حسن إبراهيم"]
    F -->|"يضغط ◀ التالي"| I["📋 الصفحة التالية:\n👤 عمر خالد محمد\n👤 طارق سعيد حسن\n..."]
    I --> G

    G --> J["📩 البوت يسأل:\n'أدخل المبلغ المسحوب'"]
    G2 --> J
    J --> K["خالد يكتب: 500"]
    K --> L["📋 شاشة التأكيد:\n━━━━━━━━━━━\n👤 العامل: أحمد محمد علي\n💰 المبلغ: 500 جنيه\n━━━━━━━━━━━\n✅ تأكيد │ ❌ إلغاء"]

    L --> M{"تأكيد؟"}
    M -->|نعم| N["💾 حفظ + إشعار المدير\n✅ تم تسجيل المسحوبة بنجاح"]
    M -->|لا| O["❌ إلغاء + حفظ مسودة"]

    style N fill:#27ae60,color:#fff
    style O fill:#e74c3c,color:#fff
```

---

### الجزء 3: ما يحدث خلف الكواليس (Module Kit)

```mermaid
flowchart TD
    A["lookup() يُستدعى"] --> B["قراءة relation config\nمن ModuleDefinition"]
    B --> C["🔐 RBAC Check:\nهل المستخدم يملك view\nعلى موديول employee-data؟"]
    C -->|لا| C1["⛔ رفض — لا صلاحية"]
    C -->|نعم| D

    D["prisma.employees.findMany()\nمع filters + pagination"] --> E["بناء InlineKeyboard\nمن النتائج"]
    E --> F["عرض للمستخدم"]

    F --> G{"المستخدم يختار أو يبحث"}
    G -->|اختيار| H["إرجاع السجل الكامل\nللـ conversation"]
    G -->|بحث| I["prisma.employees.findMany()\nمع WHERE LIKE على searchFields"]
    I --> E
    G -->|صفحة تالية| J["prisma مع skip/take"]
    J --> E

    style H fill:#27ae60,color:#fff
    style C1 fill:#e74c3c,color:#fff
```

---

## ملخص التجربة

### من منظور المطور ✏️

| بدون Relations API | مع Relations API |
|-------------------|-----------------|
| يكتب query يدوي في Prisma | سطر واحد: `lookup()` |
| يبني InlineKeyboard يدوياً | تلقائي |
| يكتب منطق البحث والصفحات يدوي | تلقائي |
| يتحقق من RBAC يدوي | تلقائي |
| **~80 سطر كود** | **~3 أسطر كود** |

### من منظور المستخدم النهائي 👤

| الخطوة | ما يراه |
|--------|---------|
| 1 | قائمة أسماء العاملين (أزرار) |
| 2 | إمكانية البحث بالاسم أو الرقم |
| 3 | إمكانية التنقل بين الصفحات |
| 4 | بعد الاختيار → يكمل بقية الحقول بشكل عادي |

### من منظور النظام ⚙️

| العنصر | التفاصيل |
|--------|---------|
| RBAC | لا يعرض عاملين من أقسام ليس لديه صلاحية عليها |
| Pagination | 5 نتائج في الصفحة (قابل للضبط) |
| Search | بحث نصي في الحقول المحددة في `searchFields` |
| Validation | عند تشغيل البوت: يتحقق أن `targetModule` موجود فعلاً |
| Draft | إذا ألغى المستخدم، الاختيار يُحفظ في المسودة |
