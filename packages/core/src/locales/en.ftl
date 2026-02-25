welcome = Welcome to Al-Saada Smart Bot!
error-generic = An unexpected error occurred. Please try again.
error-network = A network error occurred. Please check your internet connection.
maintenance-msg = The system is currently under maintenance. Please try again later.
status-pending = Your join request is currently under review. You will receive a message when a decision is made.
welcome-back = Welcome back, { $name }!
welcome-super-admin = Welcome, { $name }, as the System Super Admin. You can start by setting up sections and users.
welcome-visitor = Welcome! This system is for company employees. Please submit a join request to get started.

# Menu Strings
menu-super-admin = Welcome, { $name }! As the Super Admin, you have full system access:
menu-admin = Welcome, { $name }! As an Admin, you can manage sections and users:
menu-employee = Welcome, { $name }! You can access the sections assigned to you:
menu-visitor = Welcome, { $name }! You have basic system access.

button-sections = Sections
button-users = Users
button-maintenance = Maintenance
button-audit = Audit Log
button-modules = Modules
button-notifications = Notifications

# Join Request Strings
join-welcome =
    👋 Welcome to Al-Saada Smart Bot!
    
    You are not recognized in the system.
    We need some information to complete your join request.
    
    You can cancel at any time by sending /cancel
    ────────────────

join-step-name =
    📝 Step 1 of 4
    
    Please enter your full name in Arabic.
    Example: Ahmed Mohamed Abdullah

join-step-nickname =
    ✏️ Step 2 of 4
    
    Would you like to choose a display name (nickname)?
    It will be used to identify you in the system.
    
    Enter a name, or press "Skip" to auto-generate one

join-step-phone =
    📱 Step 3 of 4
    
    Enter your Egyptian phone number.
    Accepted numbers start with: 010 / 011 / 012 / 015

join-step-national-id =
    🪪 Step 4 of 4
    
    Enter your Egyptian National ID (14 digits).

join-confirm =
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

join-request-already-pending =
    ⏳ Your Request is Under Review
    
    Your join request was received on { $date }
    and is now awaiting admin review.
    
    You will be notified once a decision is made. 🔔

join-request-received =
    📨 Your Request Has Been Sent!
    
    ────────────────
    Request : #{ $requestCode }
    Status  : ⏳ Under Review
    Date    : { $date }
    ────────────────
    
    Your request will be reviewed by the administration.
    You will receive a message once a decision is made. 🔔

join-cancelled =
    ⛔️ Join request cancelled.
    You can submit a new request at any time.

button-submit-join-request = 📝 Submit Join Request

welcome-super-admin-new =
    🎉 Welcome, Super Admin!
    
    You have been successfully registered as the system's primary administrator.
    You can now manage all sections and employees.

join-approved =
    🎉 Congratulations! Your Request Has Been Approved
    
    ────────────────
    Status  : ✅ Approved
    Role    : { $role }
    By      : { $approvedBy }
    Date    : { $date }
    ────────────────
    
    Send /start to access your account now. 👇

join-rejected =
    We regret to inform you that your request was not approved
    
    ────────────────
    Status  : ❌ Rejected
    By      : { $rejectedBy }
    Date    : { $date }
    ────────────────
    
    For inquiries, please contact the administration.

error-invalid-arabic-name =
    The name must be in Arabic and contain at least two characters.
    Try again 👇

error-invalid-phone =
    Invalid phone number ❌
    Must be 11 digits starting with 010, 011, 012, or 015
    Try again 👇

error-phone-exists =
    This phone number is already registered in the system ❌
    If you have an account, please contact the administration.

error-invalid-national-id =
    Invalid National ID ❌
    Must be exactly 14 digits.
    Try again 👇

error-national-id-exists =
    This National ID is already registered in the system ❌
    If you have an account, please contact the administration.

button-confirm = Confirm
button-cancel = Cancel
button-skip-nickname = Skip <-
button-cancel-flow = ❌ Cancel

user-inactive = Your account is currently inactive. Please contact an administrator.
user-already-exists = You have already registered.
join-request-pending = You already have a pending join request.
error-invalid-telegram-id = Invalid Telegram ID.
error-required-field = This field is required.
error-name-too-short = Name is too short. Please enter your full name.

gender-male = Male
gender-female = Female
gender-unknown = Unknown
value-unknown = Unknown

notification-join-request-title = New Join Request
notification-join-request-message = You have a new join request from: { $name } - { $phone }

# --- Keys referenced in spec.md (added by /speckit.analyze remediation) ---

# FR-005: Error middleware fallback
errors-system-internal = An internal system error occurred. Please try again later.

# Edge Case: Deactivated user access blocking
errors-account-deactivated = Your account has been deactivated. Please contact the Super Admin.

# Edge Case: Concurrent admin approval
errors-join-request-already-handled = This request has already been handled by another administrator.

# Edge Case: Unsupported message types
errors-unsupported-message =
    This message type is not supported ❌
    Please use available commands or send a text message.

# FR-018: Section deletion constraint
errors-section-has-active-modules = This section cannot be deleted because it has active modules.

# FR-016: Unauthenticated access
errors-auth-unauthorized = You are not authorized to perform this action.

# US4: Maintenance mode active message
maintenance-active-message = The system is currently under maintenance. Please try again later.

# FR-034: Phone validation
errors-validation-invalid-phone =
    Invalid phone number ❌
    Must be 11 digits starting with 010, 011, 012, or 015

# FR-035: National ID validation
errors-validation-invalid-national-id =
    Invalid National ID ❌
    Must be exactly 14 digits.

# Edge Case: Duplicate National ID
errors-join-request-duplicate-national-id = This National ID is already registered in the system. A new join request cannot be submitted.

# Clarifications: PENDING user re-attempt
errors-join-request-already-pending = You already have a join request under review. You cannot submit a new request until the current one is resolved.
