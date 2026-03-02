welcome = أهلاً بك في بوت السعادة الذكي!
error-generic = حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
error-network = حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.
maintenance-msg = النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.
status-pending = طلب انضمامك قيد المراجعة حالياً. ستصلك رسالة عند الرد.
welcome-back = أهلاً بعودتك يا { $name }!
welcome-super-admin = أهلاً بك يا { $name } بصفتك المسؤول الأعلى للنظام (Super Admin). يمكنك البدء بإعداد الأقسام والمستخدمين.
welcome-visitor = أهلاً بك! هذا النظام مخصص لموظفي الشركة. يرجى تقديم طلب انضمام للبدء.

# Menu Strings
menu-super-admin = مرحباً { $name }! بصفتك المسؤول الأعلى، لديك صلاحيات كاملة للنظام:
menu-admin = مرحباً { $name }! بصفتك مسؤولاً، يمكنك إدارة الأقسام والمستخدمين:
menu-employee = مرحباً { $name }! يمكنك الوصول إلى الأقسام المخصصة لك:
menu-visitor = مرحباً { $name }! لديك حق الوصول الأساسي للنظام.

button-sections = الأقسام
button-users = المستخدمون
button-maintenance = الصيانة
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

# US4: Maintenance mode active message
maintenance-active-message = النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.

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
module-kit-confirm-btn = ✅ تأكيد
module-kit-cancel-btn = ❌ إلغاء
module-kit-review-title = 📝 *مراجعة بياناتك*
module-kit-edit-field = ✏️ تعديل { $field }

# Clarifications: PENDING user re-attempt
errors-join-request-already-pending = لديك طلب انضمام قيد المراجعة بالفعل. لا يمكنك تقديم طلب جديد حتى يتم الرد على الطلب الحالي.
