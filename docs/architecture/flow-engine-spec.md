**Al-Saada Smart Bot**

─────────────────────────────────

**الوثيقة المعمارية الرسمية**

**Flow Engine - Layer 2**

| **الإصدار** | v1.0.0 - مسودة نهائية معتمدة |
| --- | --- |
| **التاريخ** | مارس 2026 |
| **المرحلة** | Layer 2 - بعد اكتمال Platform Core |
| **المسار** | specs/003-flow-engine/spec.md |
| **المعتمد** | فريق التطوير الأساسي |

# **1\. الملخص التنفيذي**

يُمثّل Flow Engine الطبقة الثانية (Layer 2) من منظومة Al-Saada Smart Bot؛ وهو المحرك المسؤول عن تحويل ملفات إعداد TypeScript إلى محادثات تفاعلية كاملة على تطبيق Telegram، دون الحاجة إلى كتابة أي كود للتفاعل مع المستخدم في كل موديول على حدة.

| **رؤية** | تمكين أي مطور من بناء موديول عمليات كامل (إضافة، تعديل، موافقة، إشعارات) عبر ملف config واحد، في غضون ساعات وليس أياماً. |
| --- | --- |

### **المبادئ المعمارية الحاكمة**

| **المبدأ** | **التعريف** | **الأثر العملي** |
| --- | --- | --- |
| Config-First | 90% إعداد، 10% hooks كحد أقصى | لا كود تكراري في كل موديول |
| Platform-First | Layer 1 يجب أن يكتمل قبل Layer 2 | RBAC وSession جاهزان للاستخدام |
| Test-First | اختبار إلزامي لكل موديول | لا موديول بدون tests/ |
| i18n-Only | كل النصوص عبر مفاتيح ترجمة | لا نص عربي مباشر في الكود |
| YAGNI | لا تبنِ ما لا تحتاجه الآن | لا حقول DB بدون استخدام فعلي |
| Single Responsibility | كل ملف له غرض واحد | config ≠ flow ≠ hooks ≠ tests |

# **2\. نظرة معمارية شاملة**

## **2.1 موقع المحرك في المنظومة**

| **الطبقة** | **الاسم** | **المسؤولية** | **الحالة** |
| --- | --- | --- | --- |
| Layer 0 | Infrastructure | Redis • PostgreSQL • Grammy | ✅ مكتمل |
| Layer 1 | Platform Core | RBAC • Sessions • Audit • Notifications | ✅ مكتمل (116 مهمة) |
| Layer 2 | Flow Engine ← نحن هنا | تشغيل المحادثات التفاعلية | 🔨 قيد التصميم |
| Layer 3 | Business Modules | موديولات العمليات (50+ موديول) | ⏳ بعد Layer 2 |
| Layer 4 | Dashboard (Future) | لوحة تحكم ويب + No-Code Builder | 📋 خارطة طريق |

## **2.2 تدفق المعالجة الداخلي**

| المستخدم يرسل رسالة على Telegram |
| --- |
| │   |
| ▼   |
| ┌─────────────────────┐ |
| │ Global Interceptor │ ← يكتشف أوامر الهروب (/cancel /menu /help) |
| └──────────┬──────────┘ |
| │ (ليس أمر هروب) |
| ▼   |
| ┌─────────────────────┐ |
| │ Auth Guard │ ← يتحقق من الصلاحيات (4 نقاط فحص) |
| └──────────┬──────────┘ |
| │ (مُصرَّح) |
| ▼   |
| ┌─────────────────────┐ |
| │ Redis Lock │ ← يمنع Race Conditions (NX EX 30) |
| └──────────┬──────────┘ |
| │ (القفل مُكتسَب) |
| ▼   |
| ┌─────────────────────┐ |
| │ Draft Manager │ ← يحمّل/يحفظ المسودة من Redis |
| └──────────┬──────────┘ |
| │   |
| ▼   |
| ┌─────────────────────┐ |
| │ Step Evaluator │ ← يقيّم showIf ويحدد الخطوة التالية |
| └──────────┬──────────┘ |
| │   |
| ▼   |
| ┌─────────────────────┐ |
| │ Block Renderer │ ← يُظهر السؤال المناسب للمستخدم |
| └──────────┬──────────┘ |
| │ (المستخدم يجيب) |
| ▼   |
| ┌─────────────────────┐ |
| │ Hook Executor │ ← يُشغّل onStepValidate إن وُجد |
| └──────────┬──────────┘ |
| │ (نجح) |
| ▼   |
| ┌─────────────────────┐ |
| │ Save & Complete │ ← beforeSave → DB → afterSave (صامت) |
| └─────────────────────┘ |

# **3\. هيكل الموديول (Module Blueprint)**

## **3.1 بنية المجلدات الإلزامية**

| modules/ |
| --- |
| └── {module-slug}/ ← اسم الموديول بحروف صغيرة وشرطات |
| ├── module.config.ts ← الهوية والصلاحيات والإعداد العام |
| ├── flow.add.ts ← تسلسل خطوات الإضافة (إلزامي) |
| ├── flow.edit.ts ← تسلسل خطوات التعديل (اختياري) |
| ├── hooks.ts ← Lifecycle Hooks (اختياري) |
| ├── schema.prisma ← تعريف الجداول (مرجع + دمج يدوي) |
| ├── locales/ |
| │ ├── ar.ftl ← ترجمة عربية (إلزامي) |
| │ └── en.ftl ← ترجمة إنجليزية (اختياري) |
| └── tests/ |
| ├── flow.test.ts ← اختبار التسلسل (إلزامي هيكلياً) |
| └── hooks.test.ts ← اختبار الـ Hooks (اختياري) |

## **3.2 ModuleConfig Interface**

| interface ModuleConfig { |
| --- |
| // ─── الهوية ─────────────────────────────────────────── |
| version: string // "1.0.0" - SemVer إلزامي |
| minPlatformVersion: string // "0.2.0" - الحد الأدنى من Layer 1 |
| slug: string // "fuel-entry" - حروف صغيرة وشرطات فقط |
| name: string // "وارد السولار" - عربي |
| nameEn: string // "Fuel Entry" - إنجليزي |
| icon: string // "⛽" - emoji واحد فقط |
| sectionSlug: string // "warehouse" - قسم موجود في DB |
|     |
| // ─── التشغيل ───────────────────────────────────────── |
| isActive: boolean // تفعيل/تعطيل من DB (قابل للتعديل عبر UI) |
| orderIndex: number // ترتيب في القائمة (قابل للسحب والإفلات) |
| isHidden?: boolean // مخفي للاختبار (default: false) |
| tags?: string\[\] // \["مالي","موارد بشرية"\] للتصفية |
|     |
| // ─── الصلاحيات ─────────────────────────────────────── |
| permissions: { |
| create: Role\[\] // من يملك إنشاء سجل |
| view: Role\[\] // من يملك عرض السجلات |
| edit: Role\[\] // من يملك تعديل سجل |
| delete: Role\[\] // من يملك حذف سجل |
| approve: Role\[\] // من يملك الموافقة (إن وُجد ApprovalStep) |
| }   |
|     |
| // ─── المسارات ───────────────────────────────────────── |
| flows: { |
| add: string // "./flow.add.ts" |
| edit?: string \| null // "./flow.edit.ts" أو null |
| }   |
| hooksPath?: string \| null // "./hooks.ts" أو null |
|     |
| // ─── سياسة الهروب ──────────────────────────────────── |
| escapePolicy?: { |
| requireConfirmation: boolean // اطلب تأكيداً قبل الحفظ والخروج |
| confirmationKey?: string // مفتاح i18n للرسالة |
| }   |
|     |
| // ─── تحديثات النسخة ────────────────────────────────── |
| breakingChangeNote?: string // ملاحظة للـ Audit عند Major bump |
| }   |

## **3.3 StepDefinition Interface**

هذا هو اللبنة الأساسية لكل flow - كل خطوة في الـ flow.add.ts تتبع هذا العقد:

| interface StepDefinition { |
| --- |
| id: string // "quantity" - معرف فريد داخل الـ flow |
| block: BlockType // "InputNumber" - نوع الـ Block |
| labelKey: string // "fuel-entry-quantity-label" - مفتاح i18n |
| field: string // "quantity" - اسم الحقل في collectedData |
| required: boolean // إلزامي أم اختياري |
| skippable?: boolean // يقبل /skip (default: false) |
| showIf?: Condition // ظهور مشروط (اختياري) |
| config?: BlockConfig // إعدادات خاصة بنوع الـ Block |
| editLabel?: string // نص زر التعديل في SummaryCard (مفتاح i18n) |
| }   |
|     |
| // ─── الشرط البسيط (v1.0) ───────────────────────────── |
| interface SimpleCondition { |
| field: string |
| operator: "eq" \| "neq" \| "gt" \| "lt" \| "gte" \| "lte" \| "in" \| "notIn" |
| value: unknown |
| }   |
|     |
| // ─── الشرط المركب (v1.1) ───────────────────────────── |
| interface CompoundCondition { |
| operator: "AND" \| "OR" |
| conditions: SimpleCondition\[\] |
| }   |
|     |
| type Condition = SimpleCondition \| CompoundCondition |

# **4\. مكتبة كتل التدفق (Flow Blocks Library)**

| **مبدأ** | كل Block هو وحدة مستقلة ذاتية التحقق. المحرك لا يعرف تفاصيل الموديول - يعرف فقط نوع الـ Block وإعداداته. |
| --- | --- |

## **4.1 جدول الأولوية (Block Priority Tiers)**

| **المستوى** | **متى يُبنى** | **عدد الـ Blocks** | **الأمثلة** |
| --- | --- | --- | --- |
| Tier 1 - Core | مع بناء المحرك (v1.0) | 16 Block | InputText، SelectMenu، Confirm، ApprovalStep |
| Tier 2 - Standard | بعد أول موديول (v1.1) | 21 Block | RelationPicker، PhotoUpload، APICallStep، LoopBlock |
| Tier 3 - Advanced | حسب الطلب الفعلي (v1.2+) | 14 Block | LocationPicker، PinConfirm، BiometricCheck، VoiceNote |

## **4.2 المجموعة A - المدخلات النصية والرقمية**

| **Block** | **الوصف** | **Tier** | **إعدادات رئيسية** |
| --- | --- | --- | --- |
| InputText | نص حر قصير (سطر واحد) | Core | minLength، maxLength، regex |
| InputTextArea | نص حر طويل (متعدد أسطر) | Standard | minLength، maxLength |
| InputNumber | رقم صحيح | Core | min، max، unit، positiveOnly |
| InputDecimal | رقم عشري | Standard | decimalPlaces، min، max |
| InputCurrency | مبلغ مالي بالجنيه المصري | Core | currency (EGP افتراضي)، min، max |
| InputFormula | حقل محسوب من حقول أخرى | Standard | formula: "amount \* rate" |

## **4.3 المجموعة B - المدخلات المصرية المتخصصة**

| **Block** | **الوصف** | **Tier** | **التحقق المدمج** |
| --- | --- | --- | --- |
| InputPhone | رقم موبايل مصري | Core | Egyptian phone regex تلقائي |
| InputNationalId | الرقم القومي المصري (14 رقم) | Core | استخراج جنس/عمر/محافظة تلقائياً |
| InputLandline | رقم أرضي مصري | Standard | كود المحافظة + 7 أرقام |
| InputTaxId | الرقم الضريبي للشركات | Advanced | 9 أرقام مصري |
| InputCommercialReg | رقم السجل التجاري | Advanced | تنسيق مصري |

## **4.4 المجموعة C - الاختيارات والقوائم**

| **Block** | **الوصف** | **Tier** | **مصدر البيانات** |
| --- | --- | --- | --- |
| SelectMenu | اختيار واحد من قائمة | Core | Static في config أو Dynamic من DB |
| MultiSelect | اختيار متعدد | Core | Static أو Dynamic |
| BooleanToggle | نعم / لا | Core | Static دائماً |
| RatingScale | تقييم 1 إلى N | Standard | min، max في config |
| RelationPicker | اختيار من جدول مع بحث | Standard | Dynamic - table، labelField، valueField |
| RelationMultiPicker | اختيار متعدد من جدول | Advanced | Dynamic مع بحث |
| GovernorateSelect | اختيار محافظة مصرية | Standard | Static مدمج في المحرك |
| CitySelect | مدينة تابعة للمحافظة | Standard | Dynamic مرتبط بـ GovernorateSelect |

## **4.5 المجموعات D-I (ملخص)**

| **المجموعة** | **الـ Blocks** | **Tier** |
| --- | --- | --- |
| D - تواريخ وأوقات | DatePicker، TimePicker، DateTimePicker، DateRangePicker، DurationPicker، HijriDatePicker | Core/Standard |
| E - ملفات ووسائط | PhotoUpload، MultiPhotoUpload، FileUpload، MultiFileUpload، VoiceNote، VideoUpload | Standard/Advanced |
| F - عرض وجلب | InfoDisplay، RecordViewer، SummaryCard، DataTable، CalculatedDisplay، StatusBadge | Core/Standard |
| G - تحكم بالتدفق | Confirm، ConditionalBranch، LoopBlock، ApprovalStep، NotificationStep، APICallStep، Skip | Core/Standard/Advanced |
| H - جغرافية | LocationPicker، MapAreaPicker، AddressInput | Advanced |
| I - أمان وتوقيع | PinConfirm، OTPVerify، SignatureCapture، BiometricCheck | Advanced |

# **5\. إدارة المسودات (Draft Management)**

## **5.1 هيكل بيانات المسودة (Draft Object)**

| {   |
| --- |
| // ─── هوية المسودة ───────────────────────────────── |
| "draftId": "drft_k7x9m2p4", // UUID مُختصر |
| "moduleSlug": "fuel-entry", |
| "moduleVersion": "1.0.0", // للكشف عن تضارب النسخ |
| "userId": "123456789", |
| "flowType": "add", // "add" \| "edit" |
| "locale": "ar", |
|     |
| // ─── موضع المستخدم في الـ Flow ────────────────────── |
| "currentStepIndex": 2, |
| "currentStepId": "quantity", |
| "totalSteps": 5, |
| "visitedSteps": \["date", "vehicle_type"\], // للتراجع الذكي |
| "skippedSteps": \[\], // خطوات تم تخطيها بـ showIf |
|     |
| // ─── البيانات المجمعة ──────────────────────────────── |
| "collectedData": { |
| "date": "2026-03-01", |
| "vehicle_type": "شاحنة", |
| "quantity": null // null = الخطوة الحالية |
| },  |
|     |
| // ─── وضع التعديل الموجّه ───────────────────────────── |
| "editMode": null, // أو: { type, targetStepId, snapshot } |
|     |
| // ─── الأخطاء والتحقق ──────────────────────────────── |
| "validationErrors": {}, |
| "retryCount": 0, // عدد محاولات الخطوة الحالية (max: 3) |
|     |
| // ─── التوقيت ───────────────────────────────────────── |
| "startedAt": "2026-03-01T10:00:00Z", |
| "lastUpdatedAt": "2026-03-01T10:05:00Z", |
| "expiresAt": "2026-03-02T10:00:00Z", |
|     |
| // ─── بيانات إضافية ─────────────────────────────────── |
| "metadata": { |
| "source": "bot_menu", // "bot_menu" \| "deep_link" |
| "attemptCount": 1 |
| }   |
| }   |

## **5.2 مخطط مفاتيح Redis**

| **المفتاح** | **القيمة** | **TTL** | **الغرض** |
| --- | --- | --- | --- |
| draft:{userId}:{moduleSlug} | Draft JSON Object | 86400 ث (24 ساعة) | المسودة الرئيسية |
| lock:{userId}:{moduleSlug} | "1" | 30 ث (safety valve) | منع Race Conditions |
| api_cache:{moduleSlug}:{stepId} | API Response JSON | قابل للإعداد per-block | Fallback للـ APIs الخارجية |
| circuit:{moduleSlug}:{stepId} | "open" | 1800 ث (30 دقيقة) | Circuit Breaker للـ APIs |

## **5.3 استرجاع المسودة - سيناريوهات كاملة**

### **السيناريو 1: عودة لنفس الموديول**

| **السلوك** | "لديك طلب غير مكتمل في الخطوة X. هل تريد الإكمال أم البدء من جديد؟" |
| --- | --- |

### **السيناريو 2: فتح موديول مختلف مع وجود مسودة**

| **السلوك** | "لديك طلب \[اسم الموديول\] غير مكتمل. هل تريد التخلي عنه والمتابعة؟" زران: \[تخلَّ عنه وتابع\] \| \[ارجع وأكمله\] |
| --- | --- |

### **السيناريو 3: انتهاء TTL (24 ساعة)**

| **السلوك** | حذف صامت تلقائي من Redis - لا رسالة للمستخدم - تسجيل في Audit: DRAFT_EXPIRED |
| --- | --- |

## **5.4 تضارب النسخ (Version Conflict Resolution)**

عند استرجاع مسودة قديمة، يقارن المحرك نسخة المسودة بنسخة الموديول الحالية وفق SemVer:

| **الحالة** | **القرار** | **الرسالة للمستخدم** | **Audit Log** |
| --- | --- | --- | --- |
| Major تغيّر (1.x → 2.x) | مسح فوري | "تم تحديث جوهري - ابدأ من جديد" | DRAFT_INVALIDATED |
| Minor تغيّر (1.0 → 1.1) | إكمال مع تحذير | "قد تجد خطوات جديدة اختيارية" | DRAFT_VERSION_WARN |
| Patch تغيّر (1.0.0 → 1.0.1) | إكمال بصمت | لا رسالة | لا شيء |
| نفس النسخة | إكمال بصمت | لا رسالة | لا شيء |

# **6\. نظام المشابك الدورية (Lifecycle Hooks)**

| **المبدأ** | الـ Hooks تُمكّن المطور من إضافة منطق عمل معقد دون المساس بنواة المحرك. الموديول يمتلك 6 hooks - كلها اختيارية - وكلها تستقبل نفس HookContext. |
| --- | --- |

## **6.1 واجهة السياق (HookContext)**

| interface HookContext { |
| --- |
| userId: string |
| moduleSlug: string |
| flowType: "add" \| "edit" |
| collectedData: Record&lt;string, unknown&gt; // كل البيانات حتى الآن |
| currentStep: StepDefinition |
| prisma: PrismaClient // وصول كامل للـ DB |
| locale: "ar" \| "en" |
| userId: string |
| }   |
|     |
| interface HookResult { |
| success: boolean |
| errorKey?: string // مفتاح i18n - لا نص مباشر |
| errorParams?: Record&lt;string, unknown&gt; |
| modifiedData?: Record&lt;string, unknown&gt; // لتعديل البيانات قبل الحفظ |
| }   |

## **6.2 الـ 6 Hooks وسلوكها**

| **الـ Hook** | **متى يُستدعى** | **هل يوقف المحرك عند الفشل؟** | **الاستخدام النموذجي** |
| --- | --- | --- | --- |
| onStepValidate | بعد كل إدخال، قبل الانتقال | نعم - يُعيد السؤال | فحص رصيد ERP، قواعد عمل معقدة |
| onPreConfirm | قبل شاشة التأكيد النهائية | نعم - يمنع إتمام الطلب | التحقق الشامل من البيانات كلها |
| beforeSave | قبل الحفظ في DB | نعم - يمنع الحفظ | حساب الحقول، تهيئة البيانات |
| afterSave | بعد الحفظ الناجح | لا - صامت تماماً | إشعارات، API خارجية، تسجيل |
| onApproval | عند موافقة المدير | لا - صامت | تحديث ERP، إرسال إشعار للموظف |
| onRejection | عند رفض المدير | لا - صامت | إشعار الموظف، تسجيل السبب |

## **6.3 الـ Hooks البطيئة (Slow Hooks)**

عندما يتطلب Hook اتصالاً خارجياً بطيئاً (مثل ERP أو API شحن)، يجب تعريفه صراحةً لتفعيل آليات الحماية:

| interface SlowHookDefinition { |
| --- |
| isSlow: true |
| estimatedMs: number // تقدير زمن التنفيذ بالميلي ثانية |
| waitMessageKey: string // مفتاح i18n لرسالة الانتظار |
| timeoutMs?: number // الحد الأقصى (default: 10000) |
| }   |
|     |
| // مثال في hooks.ts: |
| onStepValidate: { |
| isSlow: true, |
| estimatedMs: 4000, |
| waitMessageKey: "warehouse-checking-stock", |
| timeoutMs: 10000, |
| handler: async (stepId, value, ctx) => { |
| const stock = await erpClient.checkStock(value) |
| return stock > 0 |
| ? { success: true } |
| : { success: false, errorKey: "warehouse-insufficient-stock" } |
| }   |
| }   |

| **ضمان المحرك** | عند isSlow: true - يُرسل المحرك تلقائياً: (1) "يكتب..." فوراً، (2) رسالة نصية إذا تجاوز 2 ثانية، (3) يُغلق Redis Lock طوال فترة المعالجة لمنع الإدخال المكرر. |
| --- | --- |

# **7\. السلوكيات المتقدمة للمحرك**

## **7.1 التفرع الشرطي (Conditional Branching)**

كل خطوة يمكن أن تحتوي على showIf يُقيّمه المحرك قبل عرضها. الخطوات المتخطاة تُحفظ كـ null ولا تظهر في SummaryCard.

| // مثال: خطوة "موافقة الكفيل" تظهر فقط إذا كانت السلفة > 5000 |
| --- |
| {   |
| id: "guarantor_approval", |
| block: "InputText", |
| labelKey: "loan-guarantor-label", |
| field: "guarantor_name", |
| required: true, |
| showIf: { |
| field: "loan_amount", |
| operator: "gt", |
| value: 5000 |
| }   |
| }   |
|     |
| // منطق المحرك: |
| for (const step of flowSteps) { |
| if (step.showIf && !evaluate(step.showIf, draft.collectedData)) { |
| draft.collectedData\[step.field\] = null // تخطٍّ صامت |
| continue |
| }   |
| await renderStep(step, ctx) |
| break |
| }   |

## **7.2 أوامر الهروب العالمية (Global Escape Commands)**

| **الأمر** | **السلوك داخل Flow نشط** | **يمسح المسودة؟** |
| --- | --- | --- |
| /cancel | يحفظ المسودة في Redis → يفتح القائمة الرئيسية | لا  |
| /menu | نفس سلوك /cancel | لا  |
| /start | نفس سلوك /cancel (إعادة تهيئة) | لا  |
| /help | يعرض تعليمات الخطوة الحالية → يعود للخطوة ذاتها | لا  |

| **مهم** | الـ Global Interceptor يعمل كـ Grammy middleware قبل كل Handlers. أي أمر هروب لا يُعامَل كإدخال خاطئ - المحادثات الرديئة تقول "نص غير صالح" وهذا يُغضب المستخدم. |
| --- | --- |

## **7.3 التراجع الذكي وتعديل الخطوات (Smart Backtracking)**

في شاشة SummaryCard النهائية، يظهر زر ✏️ أمام كل حقل قابل للتعديل. يُقفز المحرك مباشرة للخطوة المستهدفة دون تكرار ما بينهما.

| interface EditMode { |
| --- |
| type: "targeted_edit" |
| targetStepId: string // الخطوة المستهدفة للتعديل |
| returnToSummary: true // يعود لـ SummaryCard تلقائياً بعد الإدخال |
| snapshot: Record&lt;string, unknown&gt; // نسخة احتياطية للتراجع |
| }   |
|     |
| // بعد إدخال القيمة الجديدة: |
| // 1. هل هذا الحقل يؤثر على خطوات showIf لاحقة؟ |
| // نعم → إعادة تقييم + إبلاغ المستخدم + مسح البيانات المتأثرة |
| // لا → تحديث القيمة مباشرة |
| // 2. العودة لـ SummaryCard فوراً |
| // 3. إذا ضغط /cancel أثناء التعديل → استرجاع snapshot |

## **7.4 فحص الصلاحيات متعدد النقاط (Multi-Point Authorization)**

| **نقطة الفحص** | **متى تحدث** | **سلوك عند الفشل** |
| --- | --- | --- |
| INITIATION | عند فتح الموديول لأول مرة | رفض الدخول فوراً + رسالة |
| RESUME | عند استرجاع مسودة محفوظة | تجميد المسودة + إشعار المستخدم + Audit |
| PRE_CONFIRM | قبل شاشة التأكيد النهائية | إيقاف الـ Flow + رسالة واضحة |
| BEFORE_SAVE | داخل DB transaction الحفظ (الأهم) | rollback كامل + إشعار Super Admin |

| **لماذا 4 نقاط؟** | الصلاحية قد تُسحب في أي لحظة - حتى بعد وصول المستخدم لشاشة التأكيد. الفحص داخل الـ DB transaction هو خط الدفاع الأخير الذي لا يمكن تخطيه. |
| --- | --- |

## **7.5 مقاومة شلل الـ APIs (API Outage Resilience)**

| **استراتيجية Fallback** | **الاستخدام** | **السلوك** |
| --- | --- | --- |
| cache | APIs قوائم (مكاتب شحن، مستودعات) | يعرض آخر بيانات ناجحة مع تنبيه عمرها |
| manual | APIs اختيار | يتيح للمستخدم الإدخال اليدوي |
| skip | بيانات غير حرجة | يتخطى الخطوة بقيمة افتراضية |
| queue | APIs تنفيذ عمليات | يكمل الطلب ويضع العملية في طابور |
| block | APIs إلزامية بلا بديل | يوقف الـ Flow برسالة واضحة |

| **Circuit Breaker** | بعد 5 فشل متتالي في 10 دقائق → يفتح Circuit Breaker → يذهب للـ Fallback مباشرة بدون محاولة → يُغلق تلقائياً بعد 30 دقيقة → يُشعر Super Admin فوراً. |
| --- | --- |

## **7.6 الملفات التراكمية (Resumable Media Uploads)**

| // هيكل MultiPhotoUpload في collectedData: |
| --- |
| "site_photos": { |
| "type": "multi_media", |
| "required": 3, |
| "minRequired": 1, // الحد الأدنى للقبول |
| "received": 1, |
| "files": \[ |
| {   |
| "telegramFileId": "AgACAgIAAxk...", |
| "telegramFileUniqueId": "AQADmq...", // ثابت للمقارنة |
| "receivedAt": "2026-03-01T10:00:00Z" |
| }   |
| \]  |
| }   |
|     |
| // عند الاستئناف: "استلمت 1 صورة من أصل 3. أرسل الصور المتبقية أو اضغط \[اكتفيت\]" |
| // \[اكتفيت\] يقبل إذا files.length >= minRequired |

# **8\. استراتيجية الترجمة (i18n Decoupling)**

## **8.1 بنية ملفات الترجمة**

| modules/fuel-entry/locales/ |
| --- |
| ├── ar.ftl ← ترجمة عربية (إلزامية) |
| └── en.ftl ← ترجمة إنجليزية (اختيارية) |
|     |
| \# محتوى ar.ftl - قاعدة الـ Namespace: |
| \# كل مفتاح يبدأ بـ {module-slug}- لمنع التعارض |
|     |
| fuel-entry-date-label = تاريخ الوارد |
| fuel-entry-quantity-label = الكمية (بالليتر) |
| fuel-entry-vehicle-label = نوع المركبة |
| fuel-entry-confirm-message = هل تريد تأكيد تسجيل وارد السولار؟ |
| fuel-entry-success-message = تم تسجيل وارد السولار بنجاح ✅ |
| fuel-entry-insufficient-stock = الكمية المطلوبة ({ required } ل) غير متوفرة |

## **8.2 آلية الدمج عند Bootstrap**

| // packages/flow-engine/src/i18n-merger.ts |
| --- |
| async function mergeModuleLocales(i18n: I18n): Promise&lt;void&gt; { |
| const moduleDirs = await discoverModules() // يقرأ modules/\*/ |
|     |
| for (const dir of moduleDirs) { |
| for (const locale of \["ar", "en"\]) { |
| const ftlPath = path.join(dir, "locales", \`\${locale}.ftl\`) |
| if (existsSync(ftlPath)) { |
| await i18n.loadLocale(locale, readFileSync(ftlPath, "utf-8")) |
| }   |
| }   |
| }   |
| }   |
|     |
| // يُستدعى مرة واحدة عند startup - قبل أي message handler |
| await mergeModuleLocales(bot.api.i18n) |

## **8.3 قاعدة Namespace الإلزامية**

| **النمط** | **مثال** | **الحكم** |
| --- | --- | --- |
| مفتاح عام | date-label | ❌ ممنوع - يتعارض مع موديولات أخرى |
| مفتاح بـ Namespace | fuel-entry-date-label | ✅ صحيح |
| نص مباشر في الكود | "تاريخ الوارد" بالعربي مباشرة | ❌ مخالفة دستورية (i18n-Only) |

| **تحقق CLI** | عند تشغيل npm run module:create - يتحقق الـ CLI تلقائياً أن كل labelKey في flow.add.ts موجود في ar.ftl. إذا غاب مفتاح → تحذير: "Missing i18n key: fuel-entry-xxx-label" |
| --- | --- |

# **9\. المولّد الآلي (CLI Generator)**

## **9.1 الأمر الأساسي**

| npm run module:create "{module-slug}" \\ |
| --- |
| \--name-ar "{الاسم بالعربي}" \\ |
| \--name-en "{Name in English}" \\ |
| \--section "{section-slug}" \\ |
| \--icon "{emoji}" \\ |
| \--with-edit-flow # يولد flow.edit.ts (افتراضي: false) |
| \--with-approval # يضيف ApprovalStep (افتراضي: false) |
| \--with-hooks # يولد hooks.ts بـ boilerplate (افتراضي: false) |
|     |
| \# مثال كامل: |
| npm run module:create "fuel-entry" \\ |
| \--name-ar "وارد السولار" \\ |
| \--name-en "Fuel Entry" \\ |
| \--section "warehouse" \\ |
| \--icon "⛽" \\ |
| \--with-edit-flow \\ |
| \--with-approval \\ |
| \--with-hooks |

## **9.2 فحوص الـ CLI قبل التوليد**

| **الفحص** | **القاعدة** | **عند الفشل** |
| --- | --- | --- |
| slug صحيح | أحرف صغيرة، أرقام، شرطات فقط (a-z 0-9 -) | خطأ + إيقاف |
| section موجود | الـ section معرّف في DB أو في قائمة sections | تحذير + متابعة |
| المجلد غير موجود | لا يكتب فوق موديول قائم | خطأ + إيقاف |
| icon صحيح | emoji واحد فقط | خطأ + إيقاف |
| مفاتيح i18n | كل labelKey موجود في ar.ftl | تحذير + قائمة المفاتيح الناقصة |

## **9.3 الملفات المُولَّدة**

| **الملف** | **المحتوى المُولَّد** | **قابل للتعديل** |
| --- | --- | --- |
| module.config.ts | هوية كاملة مع TODO comments للصلاحيات | نعم |
| flow.add.ts | مصفوفة فارغة مع خطوة مثال معلقة | نعم |
| flow.edit.ts | نفس flow.add.ts (إذا --with-edit-flow) | نعم |
| hooks.ts | boilerplate الـ 6 Hooks بـ TODO (إذا --with-hooks) | نعم |
| schema.prisma | template جدول أساسي مع الحقول الإلزامية | نعم |
| locales/ar.ftl | مفاتيح مُسبقة بـ {slug}- جاهزة للتعبئة | نعم |
| tests/flow.test.ts | اختبار تسلسل أساسي يمر تلقائياً | نعم |

# **10\. قابلية التعديل عبر واجهة المستخدم (UI Configurability)**

| **الهدف** | السوبر أدمن يجب أن يستطيع تعديل سلوك الموديولات من واجهة الـ Bot مباشرة دون الرجوع للمطور في الحالات الشائعة. |
| --- | --- |

## **10.1 الإعدادات القابلة للتعديل من الـ Bot**

| **الإعداد** | **من يملكه** | **آلية التعديل** | **التأثير الفوري** |
| --- | --- | --- | --- |
| تفعيل/تعطيل موديول | Super Admin | أمر /admin → Modules → تفعيل/تعطيل | فوري - isActive في DB |
| ترتيب الموديولات | Super Admin | قائمة قابلة للترقيم | فوري - orderIndex في DB |
| صلاحيات الوصول للموديول | Super Admin | تعديل permissions per-role | فوري - AdminScope في DB |
| مدة صلاحية المسودة (TTL) | Super Admin | إعداد عام في System Settings | يؤثر على المسودات الجديدة فقط |
| تفعيل/تعطيل الـ Fallback للـ API | Admin | إعداد per-module في لوحة الإدارة | فوري |
| إخفاء موديول (isHidden) | Super Admin | وضع Test Mode | فوري - المستخدمون لا يرونه |

## **10.2 الإعدادات التي تتطلب مطوراً**

هذه الإعدادات تتطلب تعديل كود لأنها تؤثر على البنية الجوهرية للموديول:

| **الإعداد** | **السبب** |
| --- | --- |
| إضافة/حذف خطوة من الـ flow | يؤثر على stepIndex والبيانات المحفوظة |
| تغيير نوع Block | يغير schema البيانات |
| تعديل شروط showIf | يؤثر على منطق التفرع |
| إضافة Hook جديد | كود TypeScript مباشر |
| تعديل schema.prisma | يتطلب migration جديد |

## **10.3 مستويات الأدمن في النظام**

| **الدور** | **الصلاحيات في Flow Engine** |
| --- | --- |
| SUPER_ADMIN | كل الإعدادات أعلاه + إدارة الأدمن الآخرين + System Settings |
| ADMIN | عرض السجلات + الموافقة/الرفض + إعدادات محدودة per-module |
| USER | استخدام الموديولات وفق الصلاحيات المعطاة له |

# **11\. خارطة التنفيذ (Implementation Roadmap)**

## **11.1 مراحل بناء Layer 2**

| **المرحلة** | **المهام الرئيسية** | **الأولوية** | **يُفتح بعده** |
| --- | --- | --- | --- |
| Phase 1 - Engine Core | Draft Manager + Redis Lock + Global Interceptor + Auth Guard | ⚡ حرجة | كل ما بعده |
| Phase 2 - Tier 1 Blocks | الـ 16 blocks الأساسية + Block Renderer + Step Evaluator | ⚡ حرجة | أول موديول |
| Phase 3 - Hooks System | HookContext + الـ 6 Hooks + Slow Hook support | 🔴 عالية | موديولات معقدة |
| Phase 4 - CLI Generator | سكريبت module:create + التحقق + الـ boilerplate | 🔴 عالية | تسريع التطوير |
| Phase 5 - i18n Merger | دمج locales/ عند Bootstrap + CLI validation | 🟡 متوسطة | تعدد اللغات |
| Phase 6 - Advanced Features | Smart Backtracking + Version Conflict + API Resilience | 🟡 متوسطة | موديولات متقدمة |
| Phase 7 - Tier 2 & 3 Blocks | بقية الـ blocks حسب الطلب الفعلي | 🟢 منخفضة | حسب الحاجة |

## **11.2 شروط الاجتياز (Definition of Done) لكل موديول**

لا يُعتبر الموديول مكتملاً إلا إذا اجتاز كل هذه الشروط:

| **الشرط** | **الأداة** | **إلزامي؟** |
| --- | --- | --- |
| flow.test.ts يمر بنجاح | Jest / Vitest | نعم |
| كل labelKey موجود في ar.ftl | CLI Validator | نعم |
| لا نص عربي مباشر في الكود | ESLint custom rule | نعم |
| schema.prisma موثق في الجذر الرئيسي | Code Review | نعم |
| module.config.ts بدون TODO مفتوح | Code Review | نعم |
| الـ Hooks مغطاة بـ hooks.test.ts (إن وُجدت) | Jest | مشروط |

## **11.3 قرارات مرجأة (Deferred Decisions)**

| **القرار** | **المرجأ حتى** | **السبب** |
| --- | --- | --- |
| No-Code Builder (Drag & Drop) | بعد 20+ موديول مكتمل | YAGNI - بيانات حقيقية أولاً |
| CompoundCondition (AND/OR) | v1.1 بعد أول موديول | معقد قبل إثبات الحاجة |
| Dashboard ويب (views/) | مرحلة Layer 4 | خارج نطاق Layer 2 |
| merge script تلقائي لـ schema.prisma | v1.1 | دمج يدوي كافٍ في v1.0 |
| SemVer Minor: دمج البيانات الجديدة | بعد أول major update فعلي | لا حاجة قبل التجربة |

# **12\. سجل القرارات المعمارية (ADR Log)**

هذا السجل يوثق القرارات الجوهرية وأسبابها لمنع إعادة النقاش مستقبلاً.

| **#** | **القرار** | **البديل المرفوض** | **السبب** |
| --- | --- | --- | --- |
| ADR-01 | Redis للمسودات | PostgreSQL column | TTL تلقائي - لا Cleanup Jobs |
| ADR-02 | hooks.ts ملف منفصل | داخل module.config.ts | فصل الإعداد عن المنطق |
| ADR-03 | SemVer للموديولات | مقارنة بسيطة (متساوي/مختلف) | تمييز Breaking من Non-Breaking |
| ADR-04 | Redis Lock (NX EX 30) | In-memory lock | Atomic + يتعافى من crashes |
| ADR-05 | showIf في StepDefinition | ConditionalBranch block منفصل | أبسط - المحرك يتولى التقييم |
| ADR-06 | Targeted Edit من SummaryCard | زر "رجوع خطوة" | يتجنب تعقيد إعادة تقييم showIf |
| ADR-07 | دمج schema.prisma يدوياً | merge script تلقائي | YAGNI - أبسط وأكثر موثوقية |
| ADR-08 | locales/ داخل كل موديول | ملف ar.ftl مركزي واحد | Self-Contained - لا ملفات عملاقة |
| ADR-09 | 4 نقاط فحص للصلاحيات | نقطتان فقط (Init + PreConfirm) | فحص داخل Transaction الحفظ ضروري |
| ADR-10 | Namespace إلزامي لمفاتيح i18n | مفاتيح عامة | منع تعارض 50+ موديول |

# **ملحق: المسرد التقني**

| **المصطلح** | **التعريف** |
| --- | --- |
| Flow Engine | المحرك المسؤول عن تشغيل محادثات الموديولات تلقائياً من ملفات config |
| Block | وحدة إدخال/عرض ذاتية (InputText، SelectMenu، Confirm، ...) |
| Draft | المسودة المحفوظة في Redis لحفظ تقدم المستخدم |
| Hook | دالة اختيارية يكتبها المطور لإضافة منطق عمل خاص |
| showIf | شرط يحدد ظهور خطوة بناءً على قيم خطوات سابقة |
| SemVer | نظام تسمية الإصدارات Major.Minor.Patch |
| Circuit Breaker | آلية توقف مؤقت عند تكرار فشل API خارجي |
| Redis Lock | قفل ذري يمنع معالجة إدخالين في نفس الوقت |
| Targeted Edit | القفز لخطوة محددة للتعديل ثم العودة للـ SummaryCard |
| TTL | Time To Live - مدة الصلاحية قبل الحذف التلقائي |
| Namespace | بادئة فريدة تمنع تعارض مفاتيح i18n بين الموديولات |
| Bootstrap | مرحلة تهيئة النظام عند بدء تشغيل البوت |
| ADR | Architectural Decision Record - سجل قرار معماري موثق |