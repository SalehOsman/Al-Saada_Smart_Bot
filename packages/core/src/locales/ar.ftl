welcome = أهلاً بك في بوت السعادة الذكي!
error_generic = حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
error_network = حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.
maintenance_msg = النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.
status_pending = طلب انضمامك قيد المراجعة حالياً. ستصلك رسالة عند الرد.
welcome_back = أهلاً بعودتك يا { $name }!
welcome_super_admin = أهلاً بك يا { $name } بصفتك المسؤول الأعلى للنظام (Super Admin). يمكنك البدء بإعداد الأقسام والمستخدمين.
welcome_visitor = أهلاً بك! هذا النظام مخصص لموظفي الشركة. يرجى تقديم طلب انضمام للبدء.

# Menu Strings
menu_super_admin = مرحباً { $name }! بصفتك المسؤول الأعلى، لديك صلاحيات كاملة للنظام:
menu_admin = مرحباً { $name }! بصفتك مسؤولاً، يمكنك إدارة الأقسام والمستخدمين:
menu_employee = مرحباً { $name }! يمكنك الوصول إلى الأقسام المخصصة لك:
menu_visitor = مرحباً { $name }! لديك حق الوصول الأساسي للنظام.

button_sections = الأقسام
button_users = المستخدمون
button_maintenance = الصيانة
button_audit = سجل العمليات
button_modules = الوحدات
button_notifications = الإشعارات

# Join Request Strings
join_request_start = سنساعدك في تسجيل بياناتك. يرجى الإجابة على الأسئلة التالية بدقة:
ask_full_name = ما هو اسمك الكامل باللغة العربية؟
ask_nickname = هل تريد添加 لقب اختياري؟ (اضغط /skip للانتقال التالي)
nickname_info = (يمكنك تخطي هذا السؤال وسنقوم بإنشاء لقب تلقائي من اسمك)
ask_phone_number = ما هو رقم هاتفك المصري؟ (مثال: 01xxxxxxxx)
phone_info = (يرجى إدخال الرقم بصيغة مصرية كاملة)
ask_national_id = ما هو رقم البطاقة الشخصية المصرية؟
national_id_info = (يرجى إدخال الرقم المكون من 14 رقمًا)

join_request_confirm = تأكيد بيانات الانضمام:
- الاسم: { $name }
- اللقب: { $nickname }
- الهاتف: { $phone }
- الرقم القومي: { $nationalId }
- تاريخ الميلاد: { $birthDate }
- الجنس: { $gender }

button_confirm = تأكيد
button_cancel = إلغاء

user_inactive = حسابك غير نشط حالياً. يرجى التواصل مع المسؤول.
user_already_exists = لقد قمت بالتسجيل مسبقاً.
join_request_pending = لديك طلب انضمام قيد المراجعة بالفعل.
error_invalid_telegram_id = معرّف Telegram غير صالح.
error_required_field = هذا الحقل مطلوب.
error_invalid_arabic_name = يرجى إدخال اسم عربي صالح.
error_name_too_short = الاسم قصير جداً. يرجى إدخال اسم كامل.
error_invalid_phone = يرجى إدخال رقم هاتف مصري صالح.
error_phone_exists = هذا الرقم مسجل مسبقاً.
error_invalid_national_id = يرجى إدخال رقم بطاقة شخصية مصري صالح (14 رقم).
error_national_id_exists = هذا الرقم مسجل مسبقاً.

join_request_saved = تم حفظ طلب الانضمام بنجاح! ستصلك رسالة عند الرد.
join_request_cancelled = تم إلغاء طلب الانضمام.
join_request_complete = اكتملت عملية تسجيل البيانات. شكراً!

notification_join_request_title = طلب انضمام جديد
notification_join_request_message = لديك طلب انضمام جديد من: { $name } - { $phone }