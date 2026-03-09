welcome = أهلاً بك في بوت السعادة الذكي!
error-generic = حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
error-network = حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.
maintenance-msg = النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.
status-pending = طلب انضمامك قيد المراجعة حالياً. ستصلك رسالة عند الرد.
welcome-back = أهلاً بعودتك يا { $name }!
welcome-super-admin = أهلاً بك يا { $name } بصفتك المسؤول الأعلى للنظام (Super Admin). يمكنك البدء بإعداد الأقسام والمستخدمين.
welcome-visitor = أهلاً بك! هذا النظام مخصص لموظفي الشركة. يرجى تقديم طلب انضمام للبدء.

# Menu Strings
menu-super_admin = مرحباً { $name }! بصفتك المسؤول الأعلى، لديك صلاحيات كاملة للنظام:
menu-super-admin = مرحباً { $name }! بصفتك المسؤول الأعلى، لديك صلاحيات كاملة للنظام:
menu-admin = مرحباً { $name }! بصفتك مسؤولاً، يمكنك إدارة الأقسام والمستخدمين:
menu-employee = مرحباً { $name }! يمكنك الوصول إلى الأقسام المخصصة لك:
menu-visitor = مرحباً { $name }! لديك حق الوصول الأساسي للنظام.

button-sections = الأقسام
button-users = المستخدمون
button-maintenance = الصيانة
button-maintenance-on = تفعيل الصيانة 🟢
button-maintenance-off = إيقاف الصيانة 🔴
button-audit = سجل العمليات
button-modules = الوحدات
button-notifications = الإشعارات

# Join Request Strings
join-welcome =
    👋 أهلاً بك في بوت السعادة الذكي!
    
    لم يتم التعرف عليك في النظام.
    سنحتاج منك بعض المعلومات لإتمام طلب انضمامك.
    
    يمكنك إلغاء العملية في أي وقت بإرسال /cancel
    ────────────────

join-step-name =
    📝 الخطوة 1 من 4
    
    من فضلك أدخل اسمك الكامل باللغة العربية.
    مثال: أحمد محمد عبدالله

join-step-nickname =
    ✏️ الخطوة 2 من 4
    
    هل تريد اختيار اسم شهرة (اسم مستعار)؟
    سيُستخدم للتعريف بك داخل النظام.
    
    أدخل الاسم، أو اضغط «تخطي» ليُولَّد تلقائياً

join-step-phone =
    📱 الخطوة 3 من 4
    
    أدخل رقم هاتفك المصري.
    الأرقام المقبولة تبدأ بـ: 010 / 011 / 012 / 015

join-step-national-id =
    🪪 الخطوة 4 من 4
    
    أدخل رقمك القومي المصري (14 رقماً).

join-confirm =
    ✅ مراجعة بيانات طلب الانضمام
    ────────────────
    👤 الاسم الكامل  : { $fullName }
    🏷️ اسم الشهرة    : { $nickname }
    📱 رقم الهاتف    : { $phone }
    🪪 الرقم القومي  : { $nationalId }
    🎂 تاريخ الميلاد : { $birthDate }
    ⚧️ الجنس         : { $gender }
    ────────────────
    هذه هي البيانات التي ستُحفظ في النظام.
    هل تؤكد إرسال الطلب؟

join-request-already-pending =
    ⏳ طلبك قيد المراجعة
    
    تم استلام طلب انضمامك بتاريخ { $date }
    وهو الآن في انتظار مراجعة الإدارة.
    
    سيصلك إشعار فور اتخاذ القرار. 🔔

join-request-received =
    📨 تم إرسال طلبك بنجاح!
    
    ────────────────
    رقم الطلب  : #{ $requestCode }
    الحالة     : ⏳ قيد المراجعة
    التاريخ    : { $date }
    ────────────────
    
    سيتم مراجعة طلبك من قِبَل الإدارة.
    ستصلك رسالة فور اتخاذ القرار. 🔔

join-cancelled =
    ⛔️ تم إلغاء طلب الانضمام.
    يمكنك تقديم طلب جديد في أي وقت.

button-submit-join-request = 📝 تقديم طلب انضمام

welcome-super-admin-new =
    🎉 مرحباً يا سوبر أدمين!
    
    تم تسجيلك بنجاح كمسؤول أول عن النظام.
    يمكنك الآن إدارة جميع أقسام وموظفي البوت.

join-approved =
    🎉 تهانينا! تمت الموافقة على طلبك
    
    ────────────────
    الحالة   : ✅ مقبول
    الدور    : { $role }
    بواسطة   : { $approvedBy }
    التاريخ  : { $date }
    ────────────────
    
    أرسل /start للدخول إلى حسابك الآن. 👇

join-rejected =
    نأسف، لم تتم الموافقة على طلبك
    
    ────────────────
    الحالة   : ❌ مرفوض
    بواسطة   : { $rejectedBy }
    التاريخ  : { $date }
    ────────────────
    
    للاستفسار تواصل مع الإدارة.

error-invalid-arabic-name =
    الاسم يجب أن يكون باللغة العربية ويحتوي على حرفين على الأقل.
    حاول مرة أخرى 👇

error-invalid-phone =
    رقم الهاتف غير صحيح ❌
    يجب أن يكون 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015
    حاول مرة أخرى 👇

error-phone-exists =
    هذا الرقم مسجل بالفعل في النظام ❌
    إذا كان لديك حساب، تواصل مع الإدارة.

error-invalid-national-id =
    الرقم القومي غير صحيح ❌
    يجب أن يكون 14 رقماً بالضبط.
    حاول مرة أخرى 👇

error-national-id-exists =
    هذا الرقم القومي مسجل بالفعل في النظام ❌
    إذا كان لديك حساب، تواصل مع الإدارة.

button-confirm = تأكيد
button-cancel = إلغاء
button-skip-nickname = تخطي ←
button-cancel-flow = ❌ إلغاء العملية

user-inactive = حسابك غير نشط حالياً. يرجى التواصل مع المسؤول.
user-already-exists = لقد قمت بالتسجيل مسبقاً.
join-request-pending = لديك طلب انضمام قيد المراجعة بالفعل.
error-invalid-telegram-id = معرّف Telegram غير صالح.
error-required-field = هذا الحقل مطلوب.
error-name-too-short = الاسم قصير جداً. يرجى إدخال اسم كامل.

gender-male = ذكر
gender-female = أنثى
gender-unknown = غير محدد
value-unknown = غير محدد

notification-join-request-title = طلب انضمام جديد
notification-join-request-message = لديك طلب انضمام جديد من: { $name } - { $phone }

# Notifications
notifications.join_request_new =
    📨 طلب انضمام جديد
    الاسم: { $userName }
    رقم الطلب: #{ $requestCode }

notifications.join_request_approved =
    ✅ تهانينا! تمت الموافقة على طلب انضمامك.
    يمكنك الآن البدء باستخدام البوت.

notifications.join_request_rejected =
    ❌ نأسف، لم تتم الموافقة على طلب انضمامك.
    للمزيد من التفاصيل يرجى التواصل مع الإدارة.

notifications.user_deactivated =
    🚫 تم تعطيل حسابك من قِبَل المسؤول.
    يرجى التواصل مع الإدارة للاستفسار.

notifications.maintenance_on =
    🛠️ سيبدأ النظام في وضع الصيانة الآن.
    قد تتوقف بعض الخدمات مؤقتاً.

notifications.maintenance_off =
    ✅ انتهت أعمال الصيانة. النظام متاح الآن للاستخدام بشكل كامل.

# --- Keys referenced in spec.md (added by /speckit.analyze remediation) ---

# FR-005: Error middleware fallback
errors-system-internal = حدث خطأ داخلي في النظام. يرجى المحاولة لاحقاً.

# Edge Case: Deactivated user access blocking
errors-account-deactivated = تم تعطيل حسابك. يرجى التواصل مع المسؤول الأعلى.

# Edge Case: Concurrent admin approval
errors-join-request-already-handled = تم التعامل مع هذا الطلب مسبقاً من قِبَل مسؤول آخر.

# Edge Case: Unsupported message types
errors-unsupported-message =
    هذا النوع من الرسائل غير مدعوم ❌
    يرجى استخدام الأوامر المتاحة أو إرسال رسالة نصية.

# FR-018: Section deletion constraint
errors-section-has-active-modules = لا يمكن حذف هذا القسم لأنه يحتوي على وحدات نشطة.

# FR-016: Unauthenticated access
errors-unauthorized = غير مصرح لك بتنفيذ هذا الإجراء.

# Super Admin Role Protection
errors-cannot-change-own-role = لا يمكنك تغيير رتبة حسابك الشخصي.
errors-cannot-demote-last-super-admin = لا يمكن تخفيض رتبة السوبر أدمن الوحيد بالنظام.

# US4: Maintenance mode active message
maintenance-active-message = النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.
maintenance-status-on = ✅ تم تفعيل وضع الصيانة بنجاح. النظام الآن متاح للمسؤولين فقط.
maintenance-status-off = 🛠️ تم إيقاف وضع الصيانة. النظام الآن متاح لجميع المستخدمين.

# FR-034: Phone validation
errors-validation-invalid-phone =
    رقم الهاتف غير صحيح ❌
    يجب أن يكون 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015

# FR-035: National ID validation
errors-validation-invalid-national-id =
    الرقم القومي غير صحيح ❌
    يجب أن يكون 14 رقماً بالضبط.

# Edge Case: Duplicate National ID
errors-join-request-duplicate-national-id = هذا الرقم القومي مسجل بالفعل في النظام. لا يمكن تقديم طلب انضمام جديد.

# Module Kit
module-kit-cancelled = ⛔️ تم إلغاء العملية. يمكنك العودة للقائمة الرئيسية.
notification-module-load-error-title = ⚠️ خطأ في تحميل الوحدة
notification-module-load-error-message = فشل تحميل الوحدة: { $slug }. السبب: { $reason }
module-kit-help-default = يمكنك إدخال البيانات المطلوبة أو استخدام الأوامر التالية: /cancel للإلغاء، /menu للعودة للقائمة.
module-kit-draft-found = 📝 تم العثور على مسودة سابقة لهذه العملية. هل تريد المتابعة من حيث توقفت؟
module-kit-draft-resume-btn = 🔄 متابعة
module-kit-draft-fresh-btn = ✨ بدء من جديد
module-kit-draft-expired = ⚠️ عذراً، انتهت صلاحية المسودة. سيتم البدء من جديد.
module-kit-max-retries-exceeded = ⚠️ تم تجاوز الحد الأقصى للمحاولات. تم إلغاء العملية.
module-kit-unauthorized-action = 🚫 عذراً، ليس لديك صلاحية للقيام بهذا الإجراء.
module-kit-draft-save-unavailable = ⚠️ لا يمكن حفظ تقدمك حالياً. إذا أغلقت المحادثة، ستفقد البيانات.
module-kit-save-failed-persistent = ❌ فشل الحفظ. بياناتك محفوظة مؤقتاً. حاول مرة أخرى.
module-kit-conversation-timeout = ⏱️ انتهت المهلة. بياناتك محفوظة.

# Production Readiness
# Backups
backup-manual-trigger = 🛠️ تم بدء النسخ الاحتياطي اليدوي...
backup-success = ✅ تم إنشاء النسخة الاحتياطية بنجاح!
    الملف: { $fileName }
    الحجم: { $fileSize }
backup-failed = ❌ فشل إنشاء النسخة الاحتياطية.
    السبب: { $error }
backup-list-title = 📜 النسخ الاحتياطية المتاحة:
backup-item = 📅 { $date } | 💾 { $size }
    المعرف: `{ $id }`
backup-restore-confirm-title = ⚠️ تأكيد استعادة البيانات
backup-restore-confirm-msg = هل أنت متأكد من استعادة النسخة الاحتياطية `{ $id }`؟
    سيتم استبدال جميع البيانات الحالية. هذا الإجراء لا يمكن التراجع عنه.
backup-restore-in-progress = ⏳ جاري استعادة البيانات... سيتم إرسال إشعار عند الانتهاء.
backup-restore-success-alert = ✅ تمت استعادة البيانات بنجاح!
backup-restore-failed-alert = ❌ فشلت عملية استعادة البيانات.

# Error Monitoring
error-alert-super-admin = ⚠️ *تنبيه خطأ في النظام*
    النوع: { $type }
    الرسالة: { $message }
    الموقع: { $location }

# Rate Limiting
error-rate-limit = ⚠️ لقد تجاوزت حد الطلبات المسموح به. يرجى الانتظار { $seconds } ثانية قبل المحاولة مرة أخرى.

# Auto Retry
error-retry-attempt = ⏳ فشل الطلب بسبب مشكلة مؤقتة. جاري المحاولة مرة أخرى ({ $attempt }/{ $maxAttempts })...
confirmation-deactivate-user = ⚠️ هل أنت متأكد من تعطيل حساب هذا المستخدم؟
confirmation-activate-user = ⚠️ هل أنت متأكد من تفعيل حساب هذا المستخدم؟
confirmation-cancelled = ✅ تم إلغاء التأكيد. لم تتم أي تغييرات.
confirmation-timeout = ⏰ انتهت صلاحية التأكيد. لقد انقضتْ مهلتك (5 دقائق). يرجى المحاولة مرة أخرى.
confirmation-confirmed = ✅ تم التأكيد! تم إكمال الإجراء.
errors-user-not-found = ❌ لم يتم العثور على المستخدم في النظام.
user-scopes-title = 🔑 صلاحيات الإدارة: { $name }
module-kit-confirm-btn = ✅ تأكيد
module-kit-cancel-btn = ❌ إلغاء
module-kit-review-title = 📝 *مراجعة بياناتك*
module-kit-edit-field = ✏️ تعديل { $field }

# Clarifications: PENDING user re-attempt
errors-join-request-already-pending = لديك طلب انضمام قيد المراجعة بالفعل. لا يمكنك تقديم طلب جديد حتى يتم الرد على الطلب الحالي.

# Section Management (US3 - Phase 6)
sections-menu-title = 📁 إدارة الأقسام
sections-list-empty = لا توجد أقسام بعد. يمكنك إنشاء قسم جديد.
section-empty-modules = لا توجد وحدات نشطة في هذا القسم.
button-add-section = ➕ إضافة قسم
button-add-subsection = ➕ إضافة قسم فرعي
button-back-to-sections = 🔙 العودة للأقسام
section-create-prompt = أرسل بيانات القسم الجديد بالتنسيق التالي:
    اسم القسم (عربي) | اسم القسم (إنجليزي) | أيقونة | ترتيب

subsection-create-prompt = أرسل بيانات القسم الفرعي الجديد تحت "{ $parentName }":
    اسم القسم (عربي) | اسم القسم (إنجليزي) | أيقونة

section-create-invalid-format = التنسيق غير صحيح. يرجى استخدام: الاسم العربي | الاسم الإنجليزي | الأيقونة
section-created-success = ✅ تم إنشاء القسم بنجاح!
section-edit-title = ✏️ تعديل القسم: { $name }
section-edit-name-prompt = أدخل الاسم الجديد للقسم (عربي):
section-edit-name-en-prompt = أدخل الاسم الجديد للقسم (إنجليزي):
section-edit-icon-prompt = أدخل الأيقونة الجديدة (إيموجي واحد):
section-edit-parent-prompt = اختر القسم الأب (اختياري):
option-no-parent = بدون قسم أب
section-edit-order-prompt = أدخل رقم الترتيب الجديد:
section-updated-success = ✅ تم تحديث القسم بنجاح!
section-parent-updated-success = ✅ تم تحديث القسم الأب بنجاح!
section-delete-confirm = ⚠️ هل أنت متأكد من حذف القسم "{ $name }"؟
button-confirm-delete = ✅ نعم، احذف
section-delete-confirm = هل تريد حذف هذا القسم؟
section-deleted-success = ✅ تم حذف القسم بنجاح!
section-enabled-success = ✅ تم تفعيل القسم بنجاح!
section-disabled-success = ✅ تم تعطيل القسم بنجاح!
section-modules-title = 📂 وحدات القسم: { $sectionName }
subsections-menu-title = 📂 أقسام فرعية لـ "{ $parentName }"
errors-section-not-found = القسم المطلوب غير موجود.
errors-validation-section-name = الاسم يجب أن يكون من 2 إلى 50 حرف.
errors-validation-section-icon = الأيقونة يجب أن تكون إيموجي واحد فقط.
errors-section-max-depth-exceeded = لا يمكن إنشاء قسم من مستوى ثالث. الحد الأقصى هو مستويين (قسم رئيسي وقسم فرعي).

# Settings Menu (FR-036)
settings-menu-title = ⚙️ إعدادات النظام
settings-menu-welcome = مرحباً بك في لوحة تحكم إعدادات البوت.

button-settings-maintenance = 🛠️ وضع الصيانة
button-settings-language = 🌐 اللغة الافتراضية
button-settings-notifications = 🔔 تفضيلات الإشعارات
button-settings-system-info = ℹ️ معلومات النظام
button-settings-backup = 💾 النسخ الاحتياطي

# Default Language
settings-language-title = 🌐 اللغة الافتراضية للمستخدمين الجدد
settings-language-current = اللغة الحالية: { $lang }
settings-language-updated = ✅ تم تحديث اللغة الافتراضية إلى: { $lang }

# Notification Preferences
settings-notifications-title = 🔔 تفضيلات الإشعارات (كتم/تفعيل)
settings-notifications-updated = ✅ تم تحديث تفضيلات الإشعارات.

# System Info
settings-system-info-title = ℹ️ معلومات النظام
settings-system-info-content =
    🤖 نسخة البوت: { $version }
    ⏱️ مدة التشغيل: { $uptime }
    🌍 البيئة: { $env }
    
    🔌 حالة الخدمات:
    🐘 PostgreSQL: { $dbStatus }
    🔴 Redis: { $redisStatus }

# Backup
settings-backup-title = 💾 إدارة النسخ الاحتياطي
settings-backup-trigger = 📤 إنشاء نسخة احتياطية الآن
settings-backup-history = 📜 سجل النسخ الاحتياطية
settings-backup-restore = 📥 استعادة نسخة احتياطية
settings-backup-created = ✅ تم إنشاء النسخة الاحتياطية بنجاح!
    الملف: { $filename }
    الحجم: { $size }
settings-backup-creating = ⏳ جاري إنشاء النسخة الاحتياطية...
settings-backup-history-empty = لا توجد نسخ احتياطية بعد.
settings-backup-restore-confirm = ⚠️ تحذير: سيتم حذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. هل أنت متأكد؟
    للتأكيد، يرجى كتابة الكلمة التالية: { $keyword }
settings-backup-restore-confirm-keyword = تأكيد
settings-backup-restore-success = ✅ تم استعادة البيانات بنجاح! سيتم إعادة تشغيل البوت.
settings-backup-restore-fail = ❌ فشل استعادة البيانات أو تم إلغاؤها.

# Notification Types
notif-type-join-request-new = طلب انضمام جديد
notif-type-join-request-approved = موافقة على انضمام
notif-type-join-request-rejected = رفض انضمام
notif-type-user-deactivated = تعطيل مستخدم
notif-type-maintenance-on = تفعيل صيانة
notif-type-maintenance-off = إيقاف صيانة

# Enhanced Notification Status Messages
notif-status-active = 🟢 مفعلة
notif-status-inactive = 🔴 معطلة
notif-status-toggle-enabled = ✅ تم تفعيل إشعار "{ $type }"
notif-status-toggle-disabled = ❌ تم تعطيل إشعار "{ $type }"
notif-summary-title = 📊 ملخص الإشعارات
notif-summary-total = الإجمالي
notif-summary-active = النشط
notif-summary-inactive = المعطل
notif-summary-percentage = النسبة المئوية
notif-quick-controls = 🎛️ تحكم سريع
notif-toggle-all = 🔔 تفعيل الكل
notif-disable-all = 🔇 تعطيل الكل
notif-reset-defaults = ⚙️ إعادة الإعدادات الافتراضية

# Section Edit Buttons (US3 - Phase 6)
button-edit-name = ✏️ تعديل الاسم (عربي)
button-edit-name-en = ✏️ تعديل الاسم (إنجليزي)
button-edit-icon = 🎨 تعديل الأيقونة
button-edit-parent = 📂 تغيير القسم الأب
button-edit-order = 🔢 تعديل الترتيب
button-back = 🔙 رجوع
button-settings = ⚙️ الإعدادات
error-invalid-action = هذا الإجراء غير صالح.
errors-validation-invalid-number = الرقم المدخل غير صحيح. يرجى إدخال رقم صحيح.
errors-section-deleted = تم حذف هذا القسم. سيتم إعادتك للقائمة الرئيسية.

# Module Management (US3 - Phase 6)
button-back-to-menu = 🏠 العودة للقائمة الرئيسية

# Audit Log (FR-026)
audit-menu-title = 📋 سجل المراجعة
audit-button-recent = 📋 آخر السجلات
audit-button-filter-action = 🔍 فلترة حسب الإجراء
audit-button-filter-user = 👤 فلترة حسب المستخدم
audit-button-stats = 📊 إحصائيات
audit-log-entry = { $date } — { $action } بواسطة { $userId }
audit-no-logs = لا توجد سجلات مراجعة.
audit-stats-total = إجمالي السجلات: { $count }
audit-page-info = صفحة { $page } من { $totalPages }
button-next-page = التالي ⬅️
button-prev-page = ➡️ السابق

# Users Menu
users-list-title = 👥 قائمة المستخدمين:
users-list-empty = لا يوجد مستخدمين لعرضهم.

# User Details
user-details = 👤 تفاصيل المستخدم
status-active = 🟢 نشط
status-inactive = 🔴 موقوف
button-back-to-list = 🔙 رجوع للقائمة
role-super-admin = 👑 مدير عام
role-admin = 🛡️ مسؤول
role-employee = 💼 موظف
role-visitor = 👤 زائر
button-deactivate = 🔴 إيقاف الحساب
button-activate = 🟢 تفعيل الحساب

button-activate-short = تفعيل
button-deactivate-short = إيقاف

# Short Button Variants (Mobile-Optimized, Max 20 chars)
button-confirm-short = تأكيد
button-cancel-short = إلغاء
button-back-short = رجوع
button-next-short = التالي
button-submit-short = إرسال
button-approve-short = موافقة
button-reject-short = رفض
button-delete-short = حذف
button-edit-short = تعديل
button-view-short = عرض
button-yes-short = نعم
button-no-short = لا
button-my-profile-short = ملفي

# User Profile View
profile-title = ملفي الشخصي
profile-full-name = الاسم الكامل
profile-nickname = اسم الشهرة
profile-nickname-not-set = غير محدد
profile-phone = رقم الهاتف
profile-national-id = الرقم القومي
profile-role = الدور
profile-language = اللغة
profile-status = حالة الحساب
profile-status-active = نشط
profile-status-inactive = موقوف
profile-join-date = تاريخ الانضمام
profile-last-active = آخر نشاط
profile-edit-button = تعديل الملف
profile-display =
    👤 ملفي الشخصي
    ────────────────
    👤 الاسم الكامل : { $fullName }
    🏷️ اسم الشهرة : { $nickname }
    📱 رقم الهاتف  : { $phone }
    🪪 الرقم القومي : { $nationalId }
    🛡️ الدور        : { $role }
    🌐 اللغة       : { $language }
    🟢 الحالة       : { $status }
    📅 الانضمام   : { $joinDate }
    🕐 آخر نشاط   : { $lastActive }
    ────────────────
