# الوثيقة المعمارية: محرك التدفق (Flow Engine - Layer 2)
**حالة الوثيقة:** مسودة نهائية (مُعتمدة فنياً)
**المسار الأساسي:** \`specs/003-flow-engine\`

هذه الوثيقة تُمثل التصميم الهندسي الكامل لمُحرك التدفق (Flow Engine) المسؤول عن تشغيل وإدارة المحادثات التفاعلية داخل (\`Al-Saada Smart Bot\`).

---

## 1. أنواع وحدات التدفق (The Flow Blocks)
يجب أن يدعم المحرك كافة أنواع كتل الإدخال (Blocks) التالية لضمان القدرة على أتمتة كافة العمليات المؤسسية:

| المجموعة | وصف عام وتفصيلي | أمثلة على الـ Blocks |
| :--- | :--- | :--- |
| **المدخلات النصية والرقمية** | استلام النصوص والأرقام والعملات والمعادلات. | \`InputText\`, \`InputNumber\`, \`InputCurrency\`, \`InputFormula\` |
| **المدخلات المصرية المتخصصة** | أرقام الموبايل، الرقم القومي، بطاقات ضريبية، وسجلات تجارية. يحوي التحقق (Validation) تلقائياً. | \`InputPhone\`, \`InputNationalId\`, \`InputTaxId\` |
| **الاختيارات والقوائم** | خيارات أحادية ومتعددة ومفاتيح التشغيل والتقييم، مع دعم الربط المباشر بقاعدة البيانات (Relations). | \`SelectMenu\`, \`BooleanToggle\`, \`RelationPicker\` |
| **التواريخ والأوقات** | تواريخ (ميلادي/هجري)، أوقات، تواريخ بمدى زمني، ومدة زمنية (فترات). | \`DatePicker\`, \`DateRangePicker\`, \`HijriDatePicker\` |
| **الملفات والوسائط** | استقبال الصور، المستندات، الأصوات، والفيديوهات (واحدة أو متعددة). | \`PhotoUpload\`, \`FileUpload\`, \`VoiceNote\` |
| **العرض والجلب (Read Only)**| كتل غير تفاعلية مخصصة للعرض، ملخصات الطلبات، عرض البيانات وتوضيحات الحالة. | \`RecordViewer\`, \`SummaryCard\`, \`CalculatedDisplay\` |
| **التحكم بالتدفق (Flow Control)**| إدارة تسلسل المحادثة نفسه، مثل التفرع، التخطي، التأكيد النهائي، طلبات الموافقة واستدعاءات الربط (APIs). | \`Confirm\`, \`ConditionalBranch\`, \`ApprovalStep\`, \`APICallStep\` |
| **المواقع الجغرافية والأمان**| الإحداثيات عبر הGPS، الخرائط، إدخالات العناوين المنظمة، التأكيد برمز الـ PIN والـ OTP والتوقيع الإلكتروني. | \`LocationPicker\`, \`PinConfirm\`, \`SignatureCapture\` |

---

## 2. إدارة المحادثات غير المكتملة (Conversation Recovery)
بناءً على اعتبارات تجربة المستخدم (UX)، يعتمد المحرك على الـ **Contextual Resume** للحفاظ على جهد المستخدم:

### آلية التخزين والانعاش (Redis Storage & TTL)
- **المكان:** تُحفظ المُسودات في قاعدة بيانات \`Redis\` حصرياً.
- **التسمية:** يكون مفتاح الحفظ (Key) بالصيغة: \`draft:{userId}:{moduleSlug}\`.
- **المدة (TTL):** تُصرف المهلة التلقائية بـ \`86400\` ثانية (24 ساعة)، لتُحذف تلقائيًا بعدها منعًا للتكدس.
- **تغيير المسار:** يُمسح المفتاح من Redis في حال قرر الموظف "البدء من جديد".

### كائن المُسودة (Draft JSON Object)
هيكل السياق الكامل للمحرك ليتمكن من الانطلاق من حيث توقف المستخدم:
\`\`\`json
{
  "draftId": "drft_k7x9m2p4",
  "moduleSlug": "fuel-entry",
  "moduleVersion": "1.0.0",
  "userId": "123456789",
  "flowType": "add",
  "locale": "ar",
  "currentStepIndex": 2,
  "currentStepId": "quantity",
  "totalSteps": 5,
  "collectedData": {
    "date": "2026-03-01",
    "vehicle_type": "شاحنة",
    "quantity": null
  },
  "validationErrors": {},
  "startedAt": "2026-03-01T10:00:00Z",
  "lastUpdatedAt": "2026-03-01T10:05:00Z",
  "expiresAt": "2026-03-02T10:00:00Z",
  "metadata": {
    "source": "bot_menu",
    "attemptCount": 1
  }
}
\`\`\`

---

## 3. قواعد العمل الداخلي للموديول (Business Rules & Hooks)
لفك ارتباط كود المحرك بتعقيدات الموديولات الفردية (Business Logic)، سُيعتمد نظام "المشابك الدورية" (\`Lifecycle Hooks\`). تُتيح هذه المشابك للمطورين إضافة تحكم عميق دون المساس بالنواة.

### سياق المشابك (The Hook Context)
يُمرر هذا الكائن الشامل (Context) لكل الدوال لتوفير المعلومات الكاملة وربط الشروط بالبيانات الأخرى:
\`\`\`typescript
interface HookContext {
  userId: string;
  moduleSlug: string;
  flowType: 'add' | 'edit';
  collectedData: Record<string, unknown>; // كل البيانات المجمعة حتى الآن
  currentStep: StepDefinition;
  prisma: PrismaClient; // وصول لـ DB
  locale: 'ar' | 'en';
}

interface HookResult {
  success: boolean;
  errorKey?: string; // مفتاح الخطأ في الـ i18n
  errorParams?: Record<string, unknown>;
  modifiedData?: Record<string, unknown>; // استرجاع بيانات معدلة
}
\`\`\`

### دوال الموديول المتوفرة (The 6 Module Hooks)
1. \`onStepValidate\`: للتحقق المعقد من قيمة مدخلة واحدة *قبل* القفز للخطوة التالية.
2. \`onPreConfirm\`: التحليل والتدقيق النهائي لكل البيانات في آخر خطوة (قبل التأكيد).
3. \`beforeSave\`: تهيئة وتنسيق الحقول معمارياً (Format & Calculate) استعداداً للحفظ الفعلي.
4. \`afterSave\`: العمليات ما بعد الحفظ (إرسال إشعارات خارجية، استدعاء API)، *عملية صامتة لا توقف المحرك حال فشلها*.
5. \`onApproval\`: يُستدعى فقط للموديولات التي تتطلب إجازات إدارية، عند موافقة صاحب الشأن.
6. \`onRejection\`: معالجة رفض الطلبات وتحديث الحالة.

---

## 4. تجربة بناء الموديولات (Module DX blueprint)
يؤمن المشروع إيماناً أصيلاً بوضوح المهام (\`Single Responsibility Principle\`). الموديولات تُبنى في مسارات موحدة وتُولد آلياً.

### هيكل مجلد الموديول (Module Folder Structure)
\`\`\`text
modules/
└── fuel-entry/                 ← مجلد الموديول (مثال)
    ├── module.config.ts        ← تعريف الموديول (الاسم، Version، الأيقونة، صلاحيات الوصول)
    ├── flow.add.ts             ← المصفوفات والخطوات لبناء "تسجيل جديد"
    ├── flow.edit.ts            ← المصفوفات لبناء "تعديل سجل" (إن وجد)
    ├── hooks.ts                ← ملف دوال التحقق وقواعد العمل الإضافية (اختياري)
    ├── schema.prisma           ← الجداول الخاصة المرتبطة بالموديول (في الجذر لتندمج تلقائياً)
    └── tests/
        └── flow.test.ts        ← اختبارات التأكد من سلامة التسلسل (إلزامي)
        └── hooks.test.ts       ← اختبارات دوال التحقق (اختياري)
\`\`\`
*(تم إسقاط \`views\` من المرحلة التقنية الحالية لحين البدء في تفصيل لوحة التحكم `Dashboard`).*

### المولد الآلي (CLI Generator)
يجب استخدام سكريبت الإنشاء المُوحد دائماُ لحماية الهيكلية وتوفير سرعة التطوير (\`Boilerplate\`).
*مثال:*
\`\`\`bash
npm run module:create "fuel-entry" \
  --name-ar "وارد السولار" \
  --name-en "Fuel Entry" \
  --section "warehouse" \
  --icon "⛽" \
  --with-edit-flow \
  --with-hooks \
  --with-approval
\`\`\`
يقوم المُولّد بمطابقة الـ \`slug\`، التوثق من وجود قسم (\`Section\`) معرّف، وحماية مجلدات המوديولات القائمة من الكتابة فوقها. 

---

## 5. التفرع الشرطي (Conditional Branching)
المحرك يسمح بتخطي الخطوات (Skipping) أو إظهارها بناءً على إجابات سابقة للمستخدم، باستخدام خاصية \`showIf\`.

### مستويات التقييم
- **v1.0 (الحالي):** يدعم التقييم البسيط (\`SimpleCondition\`) كالمقارنة المباشرة لقيمة أو التحقق ضمن مصفوفة.
- **v1.1 (المستقبلي):** سيدعم الشروط المركبة (\`CompoundCondition\`) بـ And/Or.

\`\`\`typescript
interface StepDefinition {
  id: string
  block: BlockType
  labelKey: string
  field: string
  required: boolean
  skippable?: boolean
  showIf?: SimpleCondition // أو CompoundCondition مستقبلاً
  config?: BlockConfig
}

interface SimpleCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn'
  value: unknown
}
\`\`\`
**سلوك المحرك:**
إذا لم يتحقق شرط \`showIf\`، يتم تخطي الخطوة بصمت، وحفظ قيمتها كـ \`null\` في الـ \`collectedData\`. في شاشة الختام (SummaryCard)، لا تُعرض الخطوات المتخطاة.

---

## 6. أوامر الهروب المرجعية (Global Escape Commands)
لضمان ألا يعلق المستخدم داخل موديول طويل، يمتلك النظام معمارياً "مُقاطع عالمي" (Global Interceptor) على شكل (grammY middleware) يسبق المحرك.

### الحالات الثلاث للهروب
1. **\`/cancel\` أو \`/menu\`**: تجميد المحادثة، حفظ المُسودة في الـ Redis فوراً، وعرض القائمة الرئيسية.
2. **\`/help\`**: عرض تعليمات المساعدة الخاصة بالخطوة الحالية *دون* الخروج من المسار أو حفظ المُسودة.
3. **\`/start\`**: نفس سلوك الـ Cancel، حيث يقوم بالحفظ ثم العودة لنقطة الصفر.

**سياسة الهروب (Escape Policy):** يمكن للمبرمج داخل \`module.config.ts\` تخصيص سلوك الهروب (مثال: طلب التأكيد قبل الخروج من موديول حساس):
\`\`\`typescript
interface ModuleConfig {
  escapePolicy?: {
    requireConfirmation: boolean
    confirmationKey?: string
  }
}
\`\`\`

---

## 7. استقلالية الترجمة (i18n Module Decoupling)
للحفاظ على نظافة ملفات النواة (Core locales)، يلتزم كل موديول بحمل ملفات الترجمة الخاصة به بصيغة الـ Fluent (\`.ftl\`) المعتمدة في النظام المرجعي.

### الهيكل التنظيمي (Locales Directory)
\`\`\`text
modules/
└── fuel-entry/
    └── locales/
        ├── ar.ftl    ← مفاتيح الموديول بالعربية
        └── en.ftl    ← مفاتيح الموديول بالإنجليزية
\`\`\`

### آلية الدمج (Merge on Bootstrap)
عند تشغيل السيرفر (Startup)، تقوم النواة بجمع كافة ملفات الـ \`.ftl\` من المجلدات الفرعية للموديولات ودمجها مع مترجم النواة الأساسي. 
- **قاعدة النطاق (Namespace Rule):** يُمنع إرفاق مفاتيح عامة. كل مفتاح يجب أن يبدأ بـ \`slug\` الموديول لمنع التضارب (مثال: \`fuel-entry-date-label\` وليس \`date-label\`). يقوم مُوَلّد الـ CLI بالتحقق من هذا الشرط عند الإنشاء. 

---

## 8. محنة التحديثات وتضارب النسخ (Version Drifting)
لمنع انهيار المحرك عند تحديث الموديولات أثناء وجود مسودات نشطة، يتم الاعتماد على نظام **SemVer (Major.Minor.Patch)** لتقييم التوافق المرجعي.

### سياسة التوافق (Compatibility Policy):
1. **Compatible (متوافق):** لا تغيير في Major أو Minor، يُكمل المحرك بسلاسة.
2. **Warn (تغيير طفيف):** اختلاف في Minor (مثل إضافة حقل اختياري)، يُكمل المحرك ولكن مع تحذير المستخدم من إضافة خطوات جديدة محتملة، ودمج القيم الجديدة كـ \`null\`.
3. **Incompatible (تغيير كاسر):** اختلاف في Major (إضافة حقل إلزامي أو حذف حقل). يُمحى الـ Draft فوراً بتقديم رسالة اعتذار وتوجيه للبدء من جديد، ويُسجل \`DRAFT_INVALIDATED\` في الـ Audit Log.

---

## 9. التحقق غير المتزامن البطيء (Slow Async Validations)
لمنع الـ Race Conditions وتعطيل تجربة المستخدم أثناء التحقق المرجعي الخارجي (مثل API انتظار لـ ERP)، يعتمد المحرك على نظام الحماية المتعدد الطبقات:

### الطبقات الثلاث للحماية:
1. **Typing Indicator الفوري:** إرسال ChatAction \`typing\` بمجرد بدء الـ Hook. إذا تجاوز التقدير الزمن المسموح للمؤشر (2 ثانية)، يتم إرسال رسالة نصية (مثال: "⏳ جارٍ التحقق...").
2. **بروتوكول القفل الآمن (Redis Locking Mechanism):** لتجنب التكرار في الإرسال العشوائي من المستخدم، يقوم المحرك بإنشاء مسار حصري (\`SET NX EX 30\`). القفل يُحرر تلقائياً لتجنب التعليق الأبدي (Deadlock). إذا حاول الموظف الإدخال والقفل نشط، يتجاهل المحرك الإدخال بصمت.
3. **تعطيل التأخير (Timeout Fallback):** إذا تجاوز الـ Hook السقف الزمني، يتدخل المحرك ويوقف العملية مقدماً أزراراً للمستخدم ("إعادة المحاولة" / "إلغاء الطلب").

---

## 10. الرفع التراكمي للملفات (Resumable Media Handling)
لضمان عدم خسارة الملفات المرفوعة جراء انقطاع الاتصال (مثال: مطلوب إرفاق 3 صور للموقع)، تقوم كتلة (MultiPhotoUpload) بحفظ ما يُرفع بشكل تدريجي وتراكمي.

### هيكلة \`collectedData\`:
\`\`\`json
"site_photos": {
  "type": "multi_media",
  "required": 3,
  "received": 1,
  "minRequired": 1,
  "files": [
    {
      "telegramFileId": "AgACAgIAAxk...",
      "telegramFileUniqueId": "AQADX...",
      "receivedAt": "2026-03-01T10:00:00Z"
    }
  ]
}
\`\`\`
*(الاعتماد على \`telegramFileUniqueId\` للمُقارنة الثابتة للملف).*

### السلوك التراكمي:
يقبل المحرك الملف الأول، ويقوم بالحفظ الفوري للمسودة، ثُم يرد برسالة: \`"✅ استلمت الصورة 1 من 3. أرسل الصورة التالية."\`
عند العودة، يعرض المحرك على الموظف التقدم المنجز ويسأله الإكمال أو التخطي (بناءً على تحقيق \`minRequired\`). 

