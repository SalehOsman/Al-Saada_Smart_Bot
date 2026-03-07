welcome = Welcome to Al-Saada Smart Bot!
error-generic = An unexpected error occurred. Please try again.
error-network = A network error occurred. Please check your internet connection.
maintenance-msg = The system is currently under maintenance. Please try again later.
status-pending = Your join request is currently under review. You will receive a message when a decision is made.
welcome-back = Welcome back, { $name }!
welcome-super-admin = Welcome, { $name }, as the System Super Admin. You can start by setting up sections and users.
welcome-visitor = Welcome! This system is for company employees. Please submit a join request to get started.

# Menu Strings
menu-super_admin = Welcome, { $name }! As the Super Admin, you have full system access:
menu-super-admin = Welcome, { $name }! As the Super Admin, you have full system access:
menu-admin = Welcome, { $name }! As an Admin, you can manage sections and users:
menu-employee = Welcome, { $name }! You can access the sections assigned to you:
menu-visitor = Welcome, { $name }! You have basic system access.

button-sections = Sections
button-users = Users
button-maintenance = Maintenance
button-maintenance-on = Enable Maintenance 🟢
button-maintenance-off = Disable Maintenance 🔴
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

# Notifications
notifications.join_request_new =
    📨 New Join Request
    Name: { $userName }
    Request Code: #{ $requestCode }

notifications.join_request_approved =
    ✅ Congratulations! Your join request has been approved.
    You can now start using the bot.

notifications.join_request_rejected =
    ❌ Sorry, your join request was not approved.
    For more details, please contact the administration.

notifications.user_deactivated =
    🚫 Your account has been deactivated by the administrator.
    Please contact the administration for inquiries.

notifications.maintenance_on =
    🛠️ The system will enter maintenance mode now.
    Some services may be temporarily unavailable.

notifications.maintenance_off =
    ✅ Maintenance has ended. The system is now fully available.

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
errors-unauthorized = You are not authorized to perform this action.

# Super Admin Role Protection
errors-cannot-change-own-role = You cannot change your own role.
errors-cannot-demote-last-super-admin = You cannot demote the last Super Admin in the system.

# US4: Maintenance mode active message
maintenance-active-message = The system is currently under maintenance. Please try again later.
maintenance-status-on = ✅ Maintenance mode has been activated successfully. The system is now only accessible to administrators.
maintenance-status-off = 🛠️ Maintenance mode has been deactivated. The system is now available to all users.

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

# Module Kit
module-kit-cancelled = ⛔️ Process cancelled. You can return to the main menu.
notification-module-load-error-title = ⚠️ Module Load Error
notification-module-load-error-message = Failed to load module: { $slug }. Reason: { $reason }
module-kit-help-default = You can enter the required data or use the following commands: /cancel to cancel, /menu to return to the menu.
module-kit-draft-found = 📝 A previous draft was found for this process. Would you like to continue from where you left off?
module-kit-draft-resume-btn = 🔄 Resume
module-kit-draft-fresh-btn = ✨ Start Fresh
module-kit-draft-expired = ⚠️ Sorry, the draft has expired. Starting fresh.
module-kit-max-retries-exceeded = ⚠️ Maximum retry attempts exceeded. Process cancelled.
module-kit-unauthorized-action = 🚫 Sorry, you don't have permission to perform this action.

# Profile View Additions
confirmation-deactivate-user = ⚠️ Are you sure you want to deactivate this user's account?
confirmation-activate-user = ⚠️ Are you sure you want to activate this user's account?
confirmation-cancelled = ✅ Confirmation cancelled. No changes were made.
confirmation-timeout = ⏰ Confirmation timeout. Your request has expired (5 minutes). Please try again.
confirmation-confirmed = ✅ Confirmed! The action has been completed.
errors-user-not-found = ❌ User not found in the system.
user-scopes-title = 🔑 Admin Scopes: { $name }
module-kit-confirm-btn = ✅ Confirm
module-kit-cancel-btn = ❌ Cancel
module-kit-review-title = 📝 *Review Your Data*
module-kit-edit-field = ✏️ Edit { $field }

# Clarifications: PENDING user re-attempt
errors-join-request-already-pending = You already have a join request under review. You cannot submit a new request until the current one is resolved.

# Section Management (US3 - Phase 6)
sections-menu-title = 📁 Manage Sections
sections-list-empty = No sections exist yet. You can create a new section.
section-empty-modules = No active modules in this section.
button-add-section = ➕ Add Section
button-add-subsection = ➕ Add Sub-Section
button-back-to-sections = 🔙 Back to Sections
section-create-prompt = Send new section data in the following format:
    Section Name (Arabic) | Section Name (English) | Emoji | Order

subsection-create-prompt = Send new sub-section data under "{ $parentName }":
    Section Name (Arabic) | Section Name (English) | Emoji

section-create-invalid-format = Invalid format. Please use: Section Name (Arabic) | Section Name (English) | Emoji
section-created-success = ✅ Section created successfully!
section-edit-title = ✏️ Edit Section: { $name }
section-edit-name-prompt = Enter new name for the section (Arabic):
section-edit-name-en-prompt = Enter new name for the section (English):
section-edit-icon-prompt = Enter new emoji (single emoji character):
section-edit-parent-prompt = Select parent section (optional):
option-no-parent = No Parent Section
section-edit-order-prompt = Enter new order number:
section-updated-success = ✅ Section updated successfully!
section-parent-updated-success = ✅ Parent section updated successfully!
section-delete-confirm = ⚠️ Are you sure you want to delete "{ $name }"?
button-confirm-delete = ✅ Yes, Delete
section-delete-confirm = Do you want to delete this section?
section-deleted-success = ✅ Section deleted successfully!
section-enabled-success = ✅ Section enabled successfully!
section-disabled-success = ✅ Section disabled successfully!
section-modules-title = 📂 Section Modules: { $sectionName }
subsections-menu-title = 📂 Sub-Sections of "{ $parentName }"
errors-section-not-found = The requested section not found.
errors-validation-section-name = Name must be 2 to 50 characters.
errors-validation-section-icon = Emoji must be a single emoji character only.
errors-section-max-depth-exceeded = Cannot create third-level section. Maximum is 2 levels (main section and sub-section).

# Settings Menu (FR-036)
settings-menu-title = ⚙️ System Settings
settings-menu-welcome = Welcome to the bot settings control panel.

button-settings-maintenance = 🛠️ Maintenance Mode
button-settings-language = 🌐 Default Language
button-settings-notifications = 🔔 Notification Prefs
button-settings-system-info = ℹ️ System Info
button-settings-backup = 💾 Backup & Restore

# Default Language
settings-language-title = 🌐 Default Language for New Users
settings-language-current = Current language: { $lang }
settings-language-updated = ✅ Default language updated to: { $lang }

# Notification Preferences
settings-notifications-title = 🔔 Notification Preferences (Mute/Unmute)
settings-notifications-updated = ✅ Notification preferences updated.

# System Info
settings-system-info-title = ℹ️ System Information
settings-system-info-content =
    🤖 Bot Version: { $version }
    ⏱️ Uptime: { $uptime }
    🌍 Environment: { $env }
    
    🔌 Services Status:
    🐘 PostgreSQL: { $dbStatus }
    🔴 Redis: { $redisStatus }

# Backup
settings-backup-title = 💾 Backup Management
settings-backup-trigger = 📤 Create Backup Now
settings-backup-history = 📜 Backup History
settings-backup-restore = 📥 Restore Backup
settings-backup-created = ✅ Backup created successfully!
    File: { $filename }
    Size: { $size }
settings-backup-creating = ⏳ Creating backup...
settings-backup-history-empty = No backups found yet.
settings-backup-restore-confirm = ⚠️ Warning: All current data will be deleted and replaced with backup data. Are you sure?
    To confirm, please type the following word: { $keyword }
settings-backup-restore-confirm-keyword = CONFIRM
settings-backup-restore-success = ✅ Data restored successfully! The bot will restart.
settings-backup-restore-fail = ❌ Data restore failed or was cancelled.

# Notification Types
notif-type-join-request-new = New Join Request
notif-type-join-request-approved = Join Approved
notif-type-join-request-rejected = Join Rejected
notif-type-user-deactivated = User Deactivated
notif-type-maintenance-on = Maintenance On
notif-type-maintenance-off = Maintenance Off

# Section Edit Buttons (US3 - Phase 6)
button-edit-name = ✏️ Edit Name (Arabic)
button-edit-name-en = ✏️ Edit Name (English)
button-edit-icon = 🎨 Edit Icon
button-edit-parent = 📂 Change Parent Section
button-edit-order = 🔢 Edit Order
button-back = 🔙 Back
button-settings = ⚙️ Settings
error-invalid-action = This action is invalid.
errors-validation-invalid-number = Invalid number. Please enter a valid number.
errors-section-deleted = This section has been deleted. Returning to main menu.

# Module Management (US3 - Phase 6)
button-back-to-menu = 🏠 Back to Main Menu

# Audit Log (FR-026)
audit-menu-title = 📋 Audit Log
audit-button-recent = 📋 Recent Logs
audit-button-filter-action = 🔍 Filter by Action
audit-button-filter-user = 👤 Filter by User
audit-button-stats = 📊 Stats
audit-log-entry = { $date } — { $action } by { $userId }
audit-no-logs = No audit logs found.
audit-stats-total = Total logs: { $count }
audit-page-info = Page { $page } of { $totalPages }
button-next-page = Next ⬅️
button-prev-page = ➡️ Previous

# Users Menu
users-list-title = 👥 Users List:
users-list-empty = No users to display.

# User Details
user-details = 👤 User Details
status-active = 🟢 Active
status-inactive = 🔴 Inactive
button-back-to-list = 🔙 Back to List
role-super-admin = 👑 Super Admin
role-admin = 🛡️ Admin
role-employee = 💼 Employee
role-visitor = 👤 Visitor
button-deactivate = 🔴 Deactivate Account
button-activate = 🟢 Activate Account

button-activate-short = Activate
button-deactivate-short = Deactivate

# Short Button Variants (Mobile-Optimized, Max 20 chars)
button-confirm-short = Confirm
button-cancel-short = Cancel
button-back-short = Back
button-next-short = Next
button-submit-short = Submit
button-approve-short = Approve
button-reject-short = Reject
button-delete-short = Delete
button-edit-short = Edit
button-view-short = View
button-yes-short = Yes
button-no-short = No
button-my-profile-short = Profile

# User Profile View
profile-title = My Profile
profile-full-name = Full Name
profile-nickname = Nickname
profile-nickname-not-set = Not set
profile-phone = Phone Number
profile-national-id = National ID
profile-role = Role
profile-language = Language
profile-status = Account Status
profile-status-active = Active
profile-status-inactive = Inactive
profile-join-date = Join Date
profile-last-active = Last Active
profile-edit-button = Edit Profile
profile-display =
    👤 My Profile
    ────────────────
    👤 Full Name    : { $fullName }
    🏷️ Nickname     : { $nickname }
    📱 Phone        : { $phone }
    🪪 National ID  : { $nationalId }
    🛡️ Role         : { $role }
    🌐 Language      : { $language }
    🟢 Status       : { $status }
    📅 Join Date    : { $joinDate }
    🕐 Last Active   : { $lastActive }
    ────────────────
