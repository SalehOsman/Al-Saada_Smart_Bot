welcome = Welcome to Al-Saada Smart Bot!
error_generic = An unexpected error occurred. Please try again.
error_network = A network error occurred. Please check your internet connection.
maintenance_msg = The system is currently under maintenance. Please try again later.
status_pending = Your join request is currently under review. You will receive a message when a decision is made.
welcome_back = Welcome back, { $name }!
welcome_super_admin = Welcome, { $name }, as the System Super Admin. You can start by setting up sections and users.
welcome_visitor = Welcome! This system is for company employees. Please submit a join request to get started.

# Menu Strings
menu_super_admin = Welcome, { $name }! As the Super Admin, you have full system access:
menu_admin = Welcome, { $name }! As an Admin, you can manage sections and users:
menu_employee = Welcome, { $name }! You can access the sections assigned to you:
menu_visitor = Welcome, { $name }! You have basic system access.

button_sections = Sections
button_users = Users
button_maintenance = Maintenance
button_audit = Audit Log
button_modules = Modules
button_notifications = Notifications

# Join Request Strings
join_request_start = We'll help you register your information. Please answer the following questions accurately:
ask_full_name = What is your full name in Arabic?
ask_nickname = Would you like to add an optional nickname? (Type /skip to continue)
nickname_info = (You can skip this question and we'll automatically generate a nickname from your name)
ask_phone_number = What is your Egyptian phone number? (Example: 01xxxxxxxx)
phone_info = (Please enter the complete Egyptian number format)
ask_national_id = What is your Egyptian National ID number?
national_id_info = (Please enter the 14-digit number)

join_request_confirm = Confirm your join request details:
- Name: { $name }
- Nickname: { $nickname }
- Phone: { $phone }
- National ID: { $nationalId }
- Birth Date: { $birthDate }
- Gender: { $gender }

button_confirm = Confirm
button_cancel = Cancel

user_inactive = Your account is currently inactive. Please contact an administrator.
user_already_exists = You have already registered.
join_request_pending = You already have a pending join request.
error_invalid_telegram_id = Invalid Telegram ID.
error_required_field = This field is required.
error_invalid_arabic_name = Please enter a valid Arabic name.
error_name_too_short = Name is too short. Please enter your full name.
error_invalid_phone = Please enter a valid Egyptian phone number.
error_phone_exists = This phone number is already registered.
error_invalid_national_id = Please enter a valid Egyptian National ID (14 digits).
error_national_id_exists = This National ID is already registered.

join_request_saved = Join request saved successfully! You will receive a message when reviewed.
join_request_cancelled = Join request cancelled.
join_request_complete = Registration process completed. Thank you!

notification_join_request_title = New Join Request
notification_join_request_message = You have a new join request from: { $name } - { $phone }