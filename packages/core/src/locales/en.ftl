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
join_welcome =
    👋 Welcome to Al-Saada Smart Bot!
    
    You are not recognized in the system.
    We need some information to complete your join request.
    
    You can cancel at any time by sending /cancel
    ────────────────

join_step_name =
    📝 Step 1 of 4
    
    Please enter your full name in Arabic.
    Example: Ahmed Mohamed Abdullah

join_step_nickname =
    ✏️ Step 2 of 4
    
    Would you like to choose a display name (nickname)?
    It will be used to identify you in the system.
    
    Enter a name, or press "Skip" to auto-generate one

join_step_phone =
    📱 Step 3 of 4
    
    Enter your Egyptian phone number.
    Accepted numbers start with: 010 / 011 / 012 / 015

join_step_national_id =
    🪪 Step 4 of 4
    
    Enter your Egyptian National ID (14 digits).

join_confirm =
    ✅ Review Your Join Request
    ────────────────
    👤 Full Name    : { $fullName }
    🏷️ Display Name : { $nickname }
    📱 Phone        : { $phone }
    🪪 National ID  : { $nationalId }
    🎂 Birth Date   : { $birthDate }
    ⚧️ Gender       : { $gender }
    ────────────────
    This is the data that will be saved in the system.
    Do you confirm submitting the request?

join_request_already_pending =
    ⏳ Your Request is Under Review
    
    Your join request was received on { $date }
    and is now awaiting admin review.
    
    You will be notified once a decision is made. 🔔

join_request_received =
    📨 Your Request Has Been Sent!
    
    ────────────────
    Request : #{ $requestCode }
    Status  : ⏳ Under Review
    Date    : { $date }
    ────────────────
    
    Your request will be reviewed by the administration.
    You will receive a message once a decision is made. 🔔

join_cancelled =
    ⛔️ Join request cancelled.
    You can submit a new request at any time.

button_submit_join_request = 📝 Submit Join Request

welcome_super_admin_new =
    🎉 Welcome, Super Admin!
    
    You have been successfully registered as the system's primary administrator.
    You can now manage all sections and employees.

join_approved =
    🎉 Congratulations! Your Request Has Been Approved
    
    ────────────────
    Status  : ✅ Approved
    Role    : { $role }
    By      : { $approvedBy }
    Date    : { $date }
    ────────────────
    
    Send /start to access your account now. 👇

join_rejected =
    We regret to inform you that your request was not approved
    
    ────────────────
    Status  : ❌ Rejected
    By      : { $rejectedBy }
    Date    : { $date }
    ────────────────
    
    For inquiries, please contact the administration.

error_invalid_arabic_name =
    The name must be in Arabic and contain at least two characters.
    Try again 👇

error_invalid_phone =
    Invalid phone number ❌
    Must be 11 digits starting with 010, 011, 012, or 015
    Try again 👇

error_phone_exists =
    This phone number is already registered in the system ❌
    If you have an account, please contact the administration.

error_invalid_national_id =
    Invalid National ID ❌
    Must be exactly 14 digits.
    Try again 👇

error_national_id_exists =
    This National ID is already registered in the system ❌
    If you have an account, please contact the administration.

button_confirm = Confirm
button_cancel = Cancel
button_skip_nickname = Skip <-
button_cancel_flow = ❌ Cancel

user_inactive = Your account is currently inactive. Please contact an administrator.
user_already_exists = You have already registered.
join_request_pending = You already have a pending join request.
error_invalid_telegram_id = Invalid Telegram ID.
error_required_field = This field is required.
error_name_too_short = Name is too short. Please enter your full name.

gender_male = Male
gender_female = Female
gender_unknown = Unknown
value_unknown = Unknown

notification_join_request_title = New Join Request
notification_join_request_message = You have a new join request from: { $name } - { $phone }
