# Feature Specification: AI Assistant - Comprehensive Operational Partner

**Feature Branch**: `002-ai-assistant`
**Created**: 2026-03-02
**Updated**: 2026-03-10
**Status**: In Progress
**Input**: User description: "AI Assistant as a full operational partner for business management — data entry, retrieval, reporting, analysis, and proactive suggestions."

**Updates (2026-03-10)**:
- Hybrid OCR System with Gemini Vision API and DeepSeek-OCR providers
- AI Toolkit (Module Integration API) for shared AI services across modules
- Usage Guidance Assistant for module documentation queries
- RAG Quality Patterns (CRAG and Self-RAG)
**Architecture Note**: AI Assistant is "Layer 4" in the monorepo package structure (packages/ai-assistant/) and "Phase 4" in the constitutional development phases. **Note**: Feature numbering (002) is the spec sequence. Phase 4 is the constitutional implementation phase. Both are correct and intentional.

## Clarifications

### Session 2026-03-02

- Q: What are the expected scalability limits for the AI Assistant? → A: Small-to-medium: 50-500 concurrent users, 1M-10M records
- Q: What is the data retention period for AI interaction logs and document analyses? → A: Configurable by admin (flexible)
- Q: What are the specific query quotas for role-based rate limiting? → A: Super Admin 200/min, Admins 150/min, Managers 100/min, Employees 50/min
- Q: What are the size limits for uploaded documents? → A: 25MB max, up to 500 pages PDF
- Q: What level of observability should be implemented for the AI Assistant? → A: Core metrics + structured logging (latency, errors, model performance)
- Q: What is the expected system availability requirement for the AI Assistant? → A: 99.9% uptime (high availability)
- Q: What rate limiting strategy should be implemented for AI queries? → A: Role-based limits with different quotas per user role

### Session 2026-03-10

- Q: What is the default AI permission profile for each system role? → A: VISITOR=GUIDANCE_ONLY (immutable), EMPLOYEE=SELF_ONLY (default, upgradeable), ADMIN=MODULE_QUERY (default, upgradeable), SUPER_ADMIN=FULL_ACCESS (immutable)
- Q: Can SUPER_ADMIN change a VISITOR's AI permission profile? → A: No. VISITOR is permanently locked to GUIDANCE_ONLY. Only users with role EMPLOYEE or higher can be assigned elevated AI profiles
- Q: Can SUPER_ADMIN's AI profile be changed? → A: No. SUPER_ADMIN is permanently locked to FULL_ACCESS and cannot be downgraded
- Q: Who can assign AI permission profiles to users? → A: Only SUPER_ADMIN can assign, change, or revoke AI permission profiles for other users

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Natural Language Data Entry (Priority: P1)

A business employee wants to record data quickly without navigating through complex forms. They speak or type naturally in Arabic: "سجّل 500 لتر سولار للشاحنة أ ب ج 1234" (Register 500 liters of diesel for truck ABC 1234). The system understands the request, identifies the relevant module, fills in the correct fields, and shows a confirmation before saving.

**Why this priority**: This is the highest-value interaction — it dramatically reduces data entry time and enables all employees (not just tech-savvy ones) to interact with the system efficiently. Without this, the system remains a traditional form-based tool.

**Independent Test**: Can be fully tested by recording a fuel entry via natural language input and verifying the data is correctly saved to the database with proper confirmation display.

**Acceptance Scenarios**:

1. **Given** a user has permission to add fuel entries, **When** they type "سجّل 500 لتر سولار للشاحنة أ ب ج 1234", **Then** the system identifies the fuel entry module, pre-fills amount=500, type=دیزل (diesel), truck_id corresponding to "أ ب ج 1234", and displays a confirmation screen
2. **Given** a user provides ambiguous natural language input, **When** the system cannot confidently map all fields, **Then** it falls back to the module's step-by-step conversation flow to collect missing information
3. **Given** a user provides voice input, **When** the voice is transcribed to text, **Then** the same natural language parsing applies and proceeds with data entry
4. **Given** a user has no permission for a module, **When** they attempt natural language entry for that module, **Then** the system responds with an appropriate permission error message

---

### User Story 2 - Natural Language Data Querying (Priority: P1)

A manager needs quick answers about business data without running reports or navigating dashboards. They ask questions in Arabic like "كم لتر سولار استهلكنا هذا الشهر؟" (How many liters of diesel did we consume this month?) or "من الموظف الأكثر غياباً؟" (Which employee has the most absences?). The system searches the data and provides a clear, contextualized answer in Arabic.

**Why this priority**: This is the primary use case for daily management — managers constantly need quick answers. Without this, users must navigate complex reporting interfaces or query databases directly.

**Independent Test**: Can be fully tested by asking natural language questions and verifying accurate Arabic responses that respect the user's permission scope.

**Acceptance Scenarios**:

1. **Given** a manager asks "كم لتر سولار استهلكنا هذا الشهر؟", **When** the system processes the query, **Then** it responds with the exact amount consumed, possibly with context like "هذا الشهر استهلكنا 4,250 لتر سولار"
2. **Given** a user with limited permissions asks a question, **When** the query involves data outside their scope, **Then** it only returns data they are authorized to see, or explains that the information is not available to them
3. **Given** a user asks about data that doesn't exist, **When** no matching records are found, **Then** the system responds with a clear message like "لا توجد بيانات عن هذا الموضوع" (No data available on this topic)
4. **Given** a user asks an ambiguous question, **When** multiple interpretations exist, **Then** the system either requests clarification or provides the most likely interpretation with an option to refine

---

### User Story 3 - Smart Report Generation (Priority: P2)

A manager needs a regular summary of business performance. They use a command like "/report daily" to receive today's summary, or "/report weekly sales" to get a breakdown of weekly sales. The system generates a formatted report in Arabic with key metrics and AI-generated insights like "استهلاك السولار زاد 20% عن الشهر الماضي" (Diesel consumption increased 20% compared to last month).

**Why this priority**: Regular reporting is essential for business management but currently requires manual effort. This automates the process and adds AI-driven insights that humans might miss.

**Independent Test**: Can be fully tested by generating reports via command and verifying they contain accurate metrics, proper formatting, and relevant insights.

**Acceptance Scenarios**:

1. **Given** a manager requests "/report daily", **When** the report is generated, **Then** it includes today's key transactions, totals, and notable events formatted as a readable message
2. **Given** a manager requests "/report weekly sales", **When** the report is generated, **Then** it includes weekly sales breakdown by category, with comparisons to previous periods where applicable
3. **Given** a report is generated, **When** AI insights are included, **Then** each insight is factual, based on the data, and highlighted as actionable (e.g., trends, anomalies, thresholds exceeded)
4. **Given** a report is requested for a period with no data, **When** generated, **Then** it clearly states no data is available for the requested period

---

### User Story 4 - Proactive Business Suggestions (Priority: P2)

A manager receives an alert: "الموظف أحمد تأخر 8 مرات هذا الشهر — هل تريد مراجعة الموضوع؟" (Employee Ahmed was late 8 times this month — do you want to review this matter?). Another day: "3 شاحنات لم تسجّل وقود منذ أسبوع — تحقق من السبب" (3 trucks haven't recorded fuel for a week — check the reason). The system analyzes patterns and sends targeted suggestions to relevant administrators based on their scope.

**Why this priority**: Proactive alerts prevent issues before they become critical and surface insights managers might miss. This transforms the system from reactive to proactive.

**Independent Test**: Can be fully tested by triggering patterns that generate suggestions and verifying they are sent to the correct recipients with actionable content.

**Acceptance Scenarios**:

1. **Given** an employee reaches a defined threshold of late arrivals, **When** the suggestion is generated, **Then** the relevant manager receives an alert with the count, employee name, and an action option
2. **Given** trucks haven't recorded fuel entries for a configured period, **When** the suggestion is triggered, **Then** the relevant operations manager receives an alert listing the trucks and suggesting investigation
3. **Given** expenses exceed budget by a threshold, **When** the suggestion is generated, **Then** the finance manager receives an alert with the percentage exceeded, section name, and amount
4. **Given** a manager is not authorized for a suggestion topic, **When** that suggestion is generated, **Then** it is not sent to them (sent only to admins with relevant scope)

---

### User Story 5 - Document Analysis and Data Extraction (Priority: P2)

An employee uploads a scanned invoice or receipt. The system uses a Hybrid OCR engine (Google Gemini Vision API by default, with fallback to DeepSeek-OCR) to extract structured data — vendor name, amount, date, line items — and offers to register it as an expense. Similarly, uploading a PDF report allows the user to ask questions about its contents.

**Why this priority**: This reduces manual data entry from documents and enables digitization of paper records. It significantly improves efficiency for businesses that deal with many documents. The hybrid OCR approach provides flexibility for different document types while maintaining reliability.

**Independent Test**: Can be fully tested by uploading various document types and verifying accurate data extraction and the option to save to relevant modules.

**Acceptance Scenarios**:

1. **Given** a user uploads an invoice image, **When** processing completes, **Then** the system displays extracted fields (vendor, amount, date, items) and offers to save as expense
2. **Given** a user uploads a PDF report, **When** processing completes, **Then** the user can ask questions about the document's contents and receive answers based on the extracted data
3. **Given** a document upload fails or cannot be processed, **When** the error occurs, **Then** the system displays a clear error message and suggests alternative approaches
4. **Given** extracted data contains errors, **When** the user reviews before saving, **Then** they can edit any field before confirming the save

---

### User Story 6 - Voice Interaction (Priority: P3)

A manager on the road speaks into their phone: "كم توزيعات تمت اليوم؟" (How many deliveries were made today?). The system transcribes their voice, processes the question, and responds. Optionally, the response is read back via text-to-speech for hands-free operation.

**Why this priority**: Voice enables use in situations where typing is inconvenient (driving, walking with hands full). It improves accessibility and convenience.

**Independent Test**: Can be fully tested by enabling voice mode, speaking Arabic questions/commands, and verifying accurate transcription and responses.

**Acceptance Scenarios**:

1. **Given** voice mode is enabled, **When** a user speaks a query, **Then** the system transcribes accurately, processes the query, and responds in text or voice based on user preference
2. **Given** voice mode is enabled, **When** a user speaks a data entry command, **Then** the system transcribes and proceeds with natural language data entry flow
3. **Given** background noise affects voice input, **When** transcription fails, **Then** the system prompts the user to try again or switch to text input
4. **Given** a user has text-to-speech enabled, **When** a response is generated, **Then** the response is read aloud in Arabic with clear pronunciation

---

### User Story 7 - AI Settings and Configuration (Priority: P3)

A Super Admin configures the AI assistant: selects operating mode (Fast/Smart/Training), chooses cloud provider for the Teacher model, configures privacy filters, and sets up scheduled reports.

**Why this priority**: Configuration allows the system to be tailored to organizational needs, privacy requirements, and resource constraints. Without this, settings are hard-coded and inflexible.

**Independent Test**: Can be fully tested by accessing settings, changing values, and verifying they take effect for subsequent AI interactions.

**Acceptance Scenarios**:

1. **Given** a Super Admin accesses AI settings, **When** they change the operating mode, **Then** subsequent AI interactions follow the new mode's behavior
2. **Given** a Super Admin selects a cloud provider, **When** the Teacher model is needed, **Then** the selected provider is used for cloud interactions
3. **Given** a Super Admin configures privacy filters, **When** data is sent to cloud models, **Then** the configured fields are redacted from the context
4. **Given** a Super Admin sets up a scheduled report, **When** the schedule triggers, **Then** the report is automatically generated and sent to configured recipients

---

### User Story 8 - AI-Powered Module Wizard (Priority: P3)

Three AI-powered features help developers and Super Admins work with modules more efficiently: an interactive creation wizard, an AI code reviewer, and AI-generated module scaffolding.

**Why this priority**: Module development is core to the platform. AI assistance reduces development time, ensures consistency, and catches issues before deployment. This enables faster iteration and higher code quality.

**Independent Test**: Can create a new module from scratch using /ai create-module with AI guidance, then review it with /ai review-module for Module Contract compliance.

**Acceptance Scenarios**:

1. **Given** a developer uses /ai create-module, **When** prompted for a new module, **Then** AI asks clarifying questions and suggests module structure based on requirements
2. **Given** AI suggests module files, **When** developer confirms, **Then** complete module files are scaffolded with proper structure
3. **Given** a developer runs /ai review-module <slug>, **When** module code is analyzed, **Then** Module Contract violations are reported with fix suggestions
4. **Given** a developer prefers manual approach, **When** module scaffolding is needed, **Then** CLI module:create and manual options remain available

---

### User Story 9 - Hybrid Document OCR (Priority: P2)

Users upload invoices or images containing complex layouts. The system uses a hybrid OCR architecture with Google Gemini Vision API as the primary provider (fast, no GPU required) and DeepSeek-OCR as the secondary provider (better for complex structured documents with tables and dense layouts). The SUPER_ADMIN can configure the default provider from AI settings, and the system automatically falls back if the primary fails.

**Why this priority**: Different document types require different OCR capabilities. Gemini Vision is fast and works well for most documents, while DeepSeek-OCR excels at complex tables and dense layouts. This hybrid approach ensures high accuracy across all document types while allowing administrators to optimize for their specific use cases.

**Independent Test**: Can be fully tested by uploading various document types (simple invoices, complex tables, dense layouts) and verifying accurate extraction, fallback behavior, and configuration changes take effect.

**Acceptance Scenarios**:

1. **Given** a user uploads a standard invoice image, **When** the system processes with Gemini Vision (default), **Then** it extracts all fields accurately and displays them for confirmation
2. **Given** a SUPER_ADMIN selects DeepSeek-OCR as the primary provider in AI settings, **When** users subsequently upload documents, **Then** the system uses DeepSeek-OCR for all OCR operations
3. **Given** the primary OCR provider fails or returns an error, **When** processing a document, **Then** the system automatically falls back to the secondary provider without user intervention
4. **Given** a user uploads a complex document with multiple tables, **When** the primary provider cannot accurately extract the structure, **Then** the SUPER_ADMIN can configure the system to use DeepSeek-OCR for that document type

---

### User Story 10 - Usage Guidance Assistant (Priority: P3)

Users ask questions like "how do I register a leave?" or "what is the fuel entry process?". The system searches module documentation using RAG and responds with step-by-step guidance in Arabic. It also offers to start the relevant module flow directly after explaining.

**Why this priority**: New users and infrequent users often need guidance on how to use the system. Instead of reading documentation manually, they can ask natural questions and get immediate help. The ability to directly initiate the relevant flow reduces friction and improves user onboarding.

**Independent Test**: Can be fully tested by asking usage questions and verifying the system responds with accurate Arabic guidance based on module documentation and offers to start the relevant flow.

**Acceptance Scenarios**:

1. **Given** a user asks "كيف أسجل إجازة؟" (how do I register a leave?), **When** the system processes the query, **Then** it responds with numbered steps in Arabic based on the leave module documentation
2. **Given** the system explains a process, **When** the user confirms they want to proceed, **Then** the system initiates the relevant module conversation flow
3. **Given** no module matches the asked topic, **When** the system cannot find relevant documentation, **Then** it responds with a clear "أنا لا أستطيع المساعدة في هذا الموضوع" (I cannot help with this topic) message
4. **Given** a user asks about a module they don't have permission to access, **When** the system provides guidance, **Then** it only shares general information and does not initiate a flow they cannot access

---

### User Story 11 - AI Permission Profiles (Priority: P1)

SUPER_ADMIN assigns a role-based AI permission profile to each user, controlling exactly what the AI assistant can do for that user. Profiles range from full access to guidance-only. SUPER_ADMIN can also create custom profiles by combining individual AI capabilities. Every new user defaults to the most restrictive profile (GUIDANCE_ONLY) until explicitly assigned a different one by SUPER_ADMIN.

**Why this priority**: AI capabilities expose sensitive business data. Without permission profiles, all users would have equal AI access regardless of role. This is a security and compliance requirement.

**Independent Test**: Can be fully tested by assigning different profiles and verifying that each profile restricts or allows the expected AI capabilities.

**Acceptance Scenarios**:
1. **Given** a SUPER_ADMIN assigns a DATA_ANALYST profile to a manager, **When** the manager queries AI, **Then** the manager can generate cross-module reports but cannot modify AI settings
2. **Given** a user has a SELF_ONLY profile, **When** they ask about another employee's data, **Then** AI refuses and explains they can only view their own records
3. **Given** a new user is created, **When** they first interact with AI, **Then** the system defaults to GUIDANCE_ONLY profile until SUPER_ADMIN assigns a different one
4. **Given** a SUPER_ADMIN creates a custom profile "Senior Accountant" with financial query and OCR permissions, **When** assigned to a user, **Then** that user can query financial data and use OCR but cannot access non-financial modules

---

### User Story 12 - AI Audit Trail (Priority: P2)

SUPER_ADMIN can view a complete, filterable log of all AI interactions across all users. Each entry shows who asked what type of request, when, and whether it succeeded or was denied. This enables compliance reporting and security monitoring.

**Why this priority**: Regulated businesses must be able to audit AI usage. Without this, there is no visibility into how the AI assistant is being used or misused.

**Independent Test**: Can be fully tested by performing various AI interactions and verifying they all appear correctly in the audit log with accurate metadata.

**Acceptance Scenarios**:
1. **Given** any user interacts with the AI assistant, **When** the interaction completes, **Then** an audit entry is created with user identity, request type, timestamp, and result (success/denied)
2. **Given** a SUPER_ADMIN views the audit trail, **When** they filter by user or date range, **Then** only matching records are displayed
3. **Given** a request is denied due to insufficient AI permissions, **When** SUPER_ADMIN reviews the audit log, **Then** the denied attempt is logged with the reason
4. **Given** SUPER_ADMIN exports the audit trail, **When** the export completes, **Then** a structured report is generated covering the selected period

---

### User Story 13 - AI Confidence Indicator (Priority: P2)

When the AI assistant answers a question, it displays a confidence score alongside its response. High confidence responses are shown with a visual indicator. Low confidence responses include a warning and may offer the option to escalate to cloud model or admit uncertainty.

**Why this priority**: Users need to know how reliable each AI response is. Without confidence indicators, users may act on low-quality answers without realizing it.

**Independent Test**: Can be fully tested by asking questions with varying data availability and verifying the confidence indicator accurately reflects answer quality.

**Acceptance Scenarios**:
1. **Given** AI generates a high-confidence answer (>85%), **When** displayed to user, **Then** a confidence indicator shows high reliability with the data source cited
2. **Given** AI generates a low-confidence answer (<50%), **When** displayed to user, **Then** a warning is shown and user is offered the option to escalate to cloud model
3. **Given** data is partially available for a query, **When** AI answers, **Then** confidence score reflects the completeness of available data
4. **Given** a user requests more detail on a low-confidence answer, **When** they confirm, **Then** the system retrieves additional context and regenerates with updated confidence score

---

### User Story 14 - AI Health Dashboard (Priority: P3)

SUPER_ADMIN has access to a dedicated AI health dashboard showing real-time status of all AI services (local model, cloud APIs, voice, OCR, RAG), today's usage statistics, average response times, and success rates.

**Why this priority**: SUPER_ADMIN needs visibility into AI system health without accessing server logs. This enables proactive monitoring and quick identification of degraded services.

**Independent Test**: Can be fully tested by simulating service degradation and verifying the dashboard reflects the status change accurately.

**Acceptance Scenarios**:
1. **Given** SUPER_ADMIN opens the AI health dashboard, **When** all services are operational, **Then** each service shows its status, response time, and today's usage count
2. **Given** a cloud API service becomes unavailable, **When** SUPER_ADMIN views the dashboard, **Then** the affected service shows a degraded status with last-known failure time
3. **Given** SUPER_ADMIN views usage statistics, **When** viewing the dashboard, **Then** it shows total queries, success rate, average response time (P50/P95), and breakdown by request type
4. **Given** SUPER_ADMIN sets a monthly quota threshold, **When** usage approaches the threshold, **Then** an alert is sent to SUPER_ADMIN before quota is exhausted

---

### User Story 15 - AI Feedback Loop (Priority: P3)

After each AI response, users can rate it as correct, incorrect, or partially correct. Incorrect ratings include an optional correction field. This feedback is collected and used in Training Mode to improve RAG retrieval quality over time.

**Why this priority**: AI quality improves with real-world feedback. Without a feedback loop, the system cannot self-correct based on actual user experience.

**Independent Test**: Can be fully tested by submitting feedback on AI responses and verifying the feedback is stored and surfaced in Training Mode improvements.

**Acceptance Scenarios**:
1. **Given** an AI response is delivered, **When** the user reviews it, **Then** feedback options (correct/incorrect/partial) are shown below the response
2. **Given** a user marks a response as incorrect, **When** they submit feedback, **Then** an optional correction text field is available and the feedback is stored with the original query
3. **Given** Training Mode runs, **When** processing feedback, **Then** low-rated responses are prioritized for RAG re-indexing and embedding improvement
4. **Given** SUPER_ADMIN views feedback statistics, **When** reviewing AI quality, **Then** a summary of feedback ratings by response type is available

---

### User Story 16 - AI Quota and Cost Management (Priority: P3)

SUPER_ADMIN configures monthly usage quotas for each cloud AI service (Gemini, Whisper, OCR). The system tracks usage in real time, alerts SUPER_ADMIN when approaching limits, and enforces hard stops at the configured limit to prevent unexpected costs.

**Why this priority**: Cloud AI services have direct cost implications. Without quota management, usage could exceed budget without warning.

**Independent Test**: Can be fully tested by setting quotas, consuming usage, and verifying alerts are triggered at the configured threshold and hard stops work correctly.

**Acceptance Scenarios**:
1. **Given** SUPER_ADMIN sets a monthly quota for Gemini API calls, **When** the quota is configured, **Then** the system tracks usage against it in real time
2. **Given** usage reaches 80% of configured quota, **When** the threshold is crossed, **Then** SUPER_ADMIN receives an alert notification
3. **Given** usage reaches 100% of configured quota, **When** a user triggers a cloud AI request, **Then** the request is gracefully declined and the user is informed the service is temporarily limited
4. **Given** SUPER_ADMIN reviews cost management, **When** viewing the dashboard, **Then** a breakdown of usage per service per period is displayed

---

### User Story 17 - Emergency AI Shutdown (Priority: P2)

SUPER_ADMIN can immediately disable the AI assistant system-wide from the AI settings panel. All in-progress AI requests are gracefully terminated. Users see a clear maintenance message. SUPER_ADMIN can re-enable with a single action.

**Why this priority**: Security incidents, unexpected AI behavior, or planned maintenance may require immediate AI shutdown. Without this, stopping AI would require server-level intervention.

**Independent Test**: Can be fully tested by triggering emergency shutdown and verifying all users immediately see the maintenance message and no AI requests are processed.

**Acceptance Scenarios**:
1. **Given** SUPER_ADMIN triggers emergency AI shutdown, **When** confirmed, **Then** all AI services are disabled system-wide within 5 seconds
2. **Given** AI is in emergency shutdown, **When** any user attempts to use the AI assistant, **Then** they receive a clear localized message that AI is temporarily unavailable
3. **Given** SUPER_ADMIN re-enables AI after shutdown, **When** re-enabled, **Then** all AI services resume normally for all users
4. **Given** emergency shutdown occurs, **When** SUPER_ADMIN reviews audit trail, **Then** the shutdown event is logged with timestamp and actor

---

### User Story 18 - AI Time-Based Access Restrictions (Priority: P3)

SUPER_ADMIN can configure time-based access windows for AI capabilities per user or profile. Outside configured hours, AI access is restricted and users receive a localized message explaining when AI will be available again.

**Why this priority**: Business hours constraints and security policies may require limiting AI access to work hours only, preventing unauthorized off-hours data access.

**Independent Test**: Can be fully tested by configuring time restrictions and verifying AI is unavailable outside configured windows.

**Acceptance Scenarios**:
1. **Given** SUPER_ADMIN configures AI working hours as Sunday-Thursday 8AM-5PM for a user, **When** that user requests AI outside those hours, **Then** AI responds that it is currently unavailable with the next available time
2. **Given** a user's AI time restriction window opens, **When** the user sends a message, **Then** AI responds normally without any restriction
3. **Given** SUPER_ADMIN assigns no time restriction to a user, **When** that user interacts with AI at any time, **Then** AI is always available (no time-based blocking)
4. **Given** emergency situations, **When** SUPER_ADMIN temporarily overrides time restrictions for a specific user, **Then** that user gains immediate AI access regardless of configured hours

---

### User Story 19 - New User AI Onboarding (Priority: P3)

When a new user interacts with the AI assistant for the first time, the system offers an optional guided tour explaining what the AI can help with, providing a few example prompts based on the user's role, and inviting them to try their first AI interaction.

**Why this priority**: New users are often unsure how to interact with an AI assistant. A guided onboarding reduces the learning curve and increases adoption rates.

**Independent Test**: Can be fully tested by creating a new user, having them send their first message, and verifying the onboarding flow triggers and completes correctly.

**Acceptance Scenarios**:
1. **Given** a user sends their first message to the AI assistant, **When** detected as first-time interaction, **Then** the system presents a localized onboarding welcome message with example prompts relevant to their role
2. **Given** a user accepts the guided tour, **When** the tour completes, **Then** they are invited to try their first real query
3. **Given** a user declines the onboarding tour, **When** they decline, **Then** the system proceeds to answer their original message without forcing the tour
4. **Given** a user has already completed onboarding, **When** they interact with AI subsequently, **Then** the onboarding flow never triggers again

---

### User Story 20 - Business Knowledge Base (Priority: P2)

SUPER_ADMIN can teach the AI assistant business-specific knowledge: normal price ranges for supplies, which staff member is responsible for which area, seasonal patterns, and other domain-specific facts. The AI uses this knowledge to validate data entries and provide contextually accurate responses.

**Why this priority**: Generic AI models don't know business-specific context. A knowledge base makes the assistant aware of what is normal or abnormal for this specific business, dramatically improving the relevance and accuracy of warnings and suggestions.

**Independent Test**: Can be fully tested by adding a price range fact, then submitting a data entry that violates it, and verifying the AI warns the user before saving.

**Acceptance Scenarios**:
1. **Given** a SUPER_ADMIN adds a knowledge entry "diesel price range: 10-13 EGP per liter", **When** a user logs a fuel entry at 20 EGP/liter, **Then** AI warns that the price exceeds the normal range before saving
2. **Given** a SUPER_ADMIN adds a knowledge entry about staff responsibilities, **When** a user queries who handles heavy fleet maintenance, **Then** AI responds with the correct staff member from the knowledge base
3. **Given** a knowledge entry is updated by SUPER_ADMIN, **When** subsequent AI interactions occur, **Then** AI uses the updated knowledge immediately
4. **Given** a SUPER_ADMIN views the knowledge base, **When** reviewing entries, **Then** all entries are listed with creation date, type, and last-used timestamp

---

### User Story 21 - Smart Anomaly Detection (Priority: P2)

The AI assistant continuously monitors business data and automatically identifies unusual patterns without requiring pre-configured thresholds. When an anomaly is detected (e.g., a vehicle's fuel consumption increased 40% while travel distance remained the same), the system proactively alerts the relevant administrator with a clear explanation and suggested action.

**Why this priority**: Pre-configured threshold alerts miss unusual patterns that don't breach fixed limits. Machine learning anomaly detection catches subtle, gradual deviations that humans and rule-based systems would miss.

**Independent Test**: Can be fully tested by introducing a gradual data anomaly over several records and verifying the AI detects and reports it without any threshold having been set.

**Acceptance Scenarios**:
1. **Given** a vehicle's fuel consumption increases 40% over 3 weeks while distance is unchanged, **When** AI runs its anomaly detection cycle, **Then** the relevant administrator receives an alert with the anomaly details and a suggested investigation action
2. **Given** an employee's attendance pattern changes significantly, **When** AI detects the deviation from their historical baseline, **Then** the relevant admin receives an alert
3. **Given** a detected anomaly is investigated and resolved, **When** the admin marks it as resolved, **Then** AI updates its baseline for that metric and stops generating the same alert
4. **Given** no anomalies exist in the data, **When** AI runs its detection cycle, **Then** no false alerts are generated

---

### User Story 22 - AI Data Validation (Priority: P1)

Before any data is saved to the system, the AI assistant cross-validates the entered values against historical data and business knowledge. If the entered data is statistically unusual (e.g., maintenance cost 300% above historical average), the AI warns the user with context before allowing them to confirm save.

**Why this priority**: Incorrect data entry is a common real-world problem that corrupts reports and analytics. AI-powered pre-save validation catches errors before they enter the database, maintaining data quality without blocking legitimate entries.

**Independent Test**: Can be fully tested by entering statistically unusual values across different modules and verifying AI warnings appear before save with accurate historical context.

**Acceptance Scenarios**:
1. **Given** an employee enters a maintenance cost 300% above the historical average for that vehicle, **When** they attempt to save, **Then** AI displays a warning with the historical average and asks for confirmation before saving
2. **Given** a user enters data that matches expected ranges, **When** they attempt to save, **Then** no warning is displayed and data is saved normally
3. **Given** AI warns about unusual data, **When** the user confirms the data is correct, **Then** the data is saved with a flag indicating it was confirmed despite the anomaly
4. **Given** data validation is unavailable (AI service down), **When** a user saves data, **Then** data is saved normally without AI validation — AI validation is advisory only and never blocks saving

---

### User Story 23 - Scheduled AI Briefings (Priority: P2)

Administrators receive automatic AI-generated business briefings on a configured schedule (daily, weekly). Each briefing summarizes recent activity, highlights upcoming events or deadlines, and flags any issues requiring attention — all without the administrator needing to ask.

**Why this priority**: Managers spend significant time gathering status information. Automated briefings deliver the right information proactively at the right time, enabling better-informed decisions with minimal effort.

**Independent Test**: Can be fully tested by configuring a briefing schedule, advancing time to the trigger point, and verifying the briefing is delivered with accurate, current data.

**Acceptance Scenarios**:
1. **Given** a manager has a weekly briefing configured for Sunday at 8AM, **When** Sunday 8AM arrives, **Then** the manager receives a briefing covering last week's summary and this week's upcoming events
2. **Given** a briefing is generated, **When** delivered, **Then** it includes: recent activity summary, upcoming deadlines, anomalies detected, and items requiring action
3. **Given** a SUPER_ADMIN configures briefing recipients and frequency, **When** the configuration is saved, **Then** briefings are delivered only to configured recipients at the specified schedule
4. **Given** no notable activity occurred in the period, **When** the briefing is generated, **Then** it still delivers a brief summary confirming normal operations

---

### User Story 24 - AI-Assisted Approvals (Priority: P3)

When an approval request is submitted (leave, expense, purchase), the AI provides the approving manager with a data-driven recommendation (approve/reject/defer) based on historical patterns, current workload, budget availability, and business rules. The manager always makes the final decision.

**Why this priority**: Approval decisions often require reviewing multiple data points across different modules. AI assistance reduces the cognitive load on managers and ensures consistent, data-driven decisions.

**Independent Test**: Can be fully tested by submitting approval requests with varying contexts and verifying AI recommendations are accurate, consistent, and accompanied by clear reasoning.

**Acceptance Scenarios**:
1. **Given** a leave request is submitted, **When** the approving manager views it, **Then** AI displays a recommendation (approve/reject/defer) with reasons based on team coverage, workload, and the employee's leave history
2. **Given** an expense approval request is submitted, **When** the manager views it, **Then** AI indicates whether it is within budget, compares it to historical expenses, and recommends accordingly
3. **Given** a manager overrides an AI recommendation, **When** they make their decision, **Then** the decision is recorded normally — the AI recommendation is advisory only and never binding
4. **Given** AI cannot determine a recommendation due to insufficient data, **When** the manager views the request, **Then** no recommendation is shown and the manager decides independently

---

### User Story 25 - Conversation Memory (Priority: P2)

The AI assistant maintains context across a single conversation session. Users can refer to previous queries without repeating context. The AI understands pronouns and references that point to earlier parts of the conversation.

**Why this priority**: Without conversation memory, every interaction is stateless and users must repeat context in every message. Memory creates a natural conversational experience that mirrors how humans communicate.

**Independent Test**: Can be fully tested by asking a multi-part question across several messages and verifying the AI correctly resolves references to earlier answers.

**Acceptance Scenarios**:
1. **Given** a user asks "how many fuel entries last month?" and receives an answer, **When** they follow up with "and what was the total cost?", **Then** AI answers about the same scope (fuel entries last month) without requiring re-specification
2. **Given** a user references a previously mentioned entity (e.g., "and what about that truck?"), **When** AI processes the follow-up, **Then** it correctly identifies the truck from earlier in the conversation
3. **Given** a conversation session ends (user logs out or session expires), **When** the user starts a new session, **Then** conversation memory is cleared — memory is session-scoped only
4. **Given** a user explicitly restarts the topic (e.g., "now let's talk about something different"), **When** the direction changes, **Then** AI clears the previous context and starts fresh

---

### User Story 26 - Voice Data Export (Priority: P3)

Users can request data exports and report delivery via voice commands. The system generates the requested report and delivers it via the configured method (Telegram document, email PDF) without requiring the user to navigate menus.

**Why this priority**: Mobile users, especially managers on the move, benefit from hands-free report delivery. Combining voice input with automated export creates a fully hands-free reporting experience.

**Independent Test**: Can be fully tested by issuing a voice export command and verifying the report is generated and delivered to the correct destination in the expected format.

**Acceptance Scenarios**:
1. **Given** a user says "send me this week's fuel report as PDF to my email", **When** the command is processed, **Then** a PDF report is generated and sent to the user's registered email address
2. **Given** a user says "send the maintenance report to Telegram", **When** the command is processed, **Then** the report is delivered as a Telegram document in the current chat
3. **Given** a user requests a report for a period with no data, **When** the export is attempted, **Then** the user receives a voice/text response explaining no data is available for that period
4. **Given** a user's email is not configured, **When** they request an email export, **Then** AI informs them their email is not set up and offers to send via Telegram instead

---

### Edge Cases

- How does the system handle documents that exceed size or page limits? → (Handled by FR-025A: 25MB limit, FR-025B: 500 pages)

- What happens when the local AI model is unavailable or responds with an error? → (Handled by NFR-008: auto failover, NFR-009: graceful degradation to cached responses)
- How does the system handle natural language input that is completely unrelated to any module? → (Handled by FR-012: ambiguous query handling — system responds with clarification or "I cannot help with that")
- What happens when voice transcription produces completely incorrect text? → (Handled by FR-034: voice failure feedback — prompt user to retry or switch to text)
- How does the system handle documents with poor quality images or corrupted files? → (Handled by FR-026, FR-027: extraction returns low confidence score, user informed via i18n error message)
- What happens when the primary OCR provider fails or returns poor results? → (Handled by FR-060: automatic fallback to secondary OCR provider)
- What happens when a user asks a question about data from multiple modules simultaneously? → (Handled by FR-011, FR-054: cross-module query support)
- How does the system handle queries that would return an extremely large amount of data? → (Handled by FR-009: response format adapts — system provides summarized response with option to request details)
- What happens when the cloud AI model API is down or exceeds rate limits? → (Handled by NFR-009: graceful degradation to Fast Mode, NFR-004: rate limiting)
- How does the system handle ambiguous dates in natural language (e.g., "last month" when near month boundary)? → (Handled by FR-006: validation against constraints — system uses server date as reference and asks for clarification if ambiguous)
- What happens when natural language input contains conflicting values (e.g., "record 500 liters and 200 liters")? → (Handled by FR-004: fallback to step-by-step — system detects conflict and asks user to confirm correct value)
- How does the system handle multilingual input (mixing Arabic and English)? → (Handled by FR-001: natural language parsing supports mixed Arabic/English input as Qwen2.5 is multilingual)

## Requirements *(mandatory)*

### Functional Requirements

**Data Entry via AI**

- **FR-001**: System MUST parse natural language input in Arabic and extract structured data fields matching module definitions
- **FR-002**: System MUST map extracted values to appropriate module fields based on semantic understanding
- **FR-003**: System MUST display a confirmation screen with all extracted fields before saving any data
- **FR-004**: System MUST fall back to module's step-by-step conversation flow when natural language parsing cannot confidently identify all required fields
- **FR-005**: System MUST support voice input transcription for data entry commands
- **FR-006**: System MUST validate extracted data against module field constraints before showing confirmation

**Data Retrieval & Q&A**

- **FR-007**: System MUST answer natural language questions in Arabic based on business data
- **FR-008**: System MUST enforce RBAC restrictions for all queries — users only receive data within their permission scope
- **FR-009**: System MUST provide responses in Markdown bulleted lists for item enumerations, structured tables for comparative data, plain numeric answers for single-value queries, and JSON arrays when the response is consumed programmatically
- **FR-010**: System MUST indicate when no data is available for a question rather than returning empty or ambiguous results
- **FR-011**: System MUST support queries across multiple modules when the question context implies cross-module data
- **FR-012**: System MUST handle ambiguous queries by either requesting clarification or providing the most likely interpretation

**Smart Reports**

- **FR-013**: System MUST generate reports on demand for daily, weekly, or monthly periods
- **FR-014**: System MUST generate reports for specific topics (e.g., sales, fuel, expenses) when specified
- **FR-015**: System MUST include AI-generated insights in reports that identify trends, anomalies, or threshold breaches
- **FR-016**: System MUST support multiple report formats: text message, image (chart), and PDF
- **FR-017**: System MUST allow Super Admins to configure scheduled reports with frequency and recipients
- **FR-018**: System MUST deliver scheduled reports to configured recipients at the specified intervals

**Business Improvement Suggestions**

- **FR-019**: System MUST continuously analyze business data for patterns that indicate actionable improvements or concerns
- **FR-020**: System MUST generate suggestions when thresholds are exceeded or patterns match predefined criteria — default triggers (configurable by SUPER_ADMIN via AI settings): (1) fuel consumption >25% above 30-day average; (2) employee absence ≥3 days in the same month; (3) expense entry >50% above daily recording average; (4) ≥2 leave requests from same employee within 30 days. All thresholds are adjustable per company needs.
- **FR-021**: System MUST route suggestions to relevant administrators based on AdminScope and suggestion topic
- **FR-022**: System MUST allow configuration of suggestion frequency and sensitivity via AI settings
- **FR-023**: System MUST include clear, actionable content in each suggestion with context and recommended actions
- **FR-024**: System MUST track which suggestions have been acknowledged or acted upon to avoid duplicate alerts

**Note**: AdminScope is defined in 001-platform-core spec.

**Document & Image Analysis**

- **FR-025A**: System MUST reject documents exceeding 25MB file size
- **FR-025B**: System MUST reject PDF documents exceeding 500 pages

- **FR-025**: System MUST accept document uploads in common formats (PDF, images for OCR, Excel)
- **FR-026**: System MUST extract text, tables, and numbers from uploaded documents
- **FR-027**: System MUST identify document type and extract relevant structured fields automatically
- **FR-028**: System MUST offer to save extracted data to appropriate modules when relevant
- **FR-029**: System MUST allow users to edit extracted fields before saving
- **FR-030**: System MUST support asking questions about uploaded document contents

**Hybrid OCR Architecture**

- **FR-057**: System MUST support a pluggable OCR provider interface so providers can be swapped without changing business logic
- **FR-058**: System MUST default to Google Gemini Vision API as the OCR provider
- **FR-059**: System MUST support DeepSeek-OCR as an alternative OCR provider configurable by SUPER_ADMIN
- **FR-060**: System MUST automatically fall back to the secondary OCR provider if the primary fails
- **FR-061**: System MUST allow SUPER_ADMIN to select the active OCR provider from AI settings

**GAP 2 — OCR PII Redaction**
- **FR-121**: System MUST apply PII redaction to all OCR-extracted text before sending it to any cloud AI provider — fields matching configured PrivacyRules (e.g., national_id, phone) MUST be redacted using the configured redaction method before leaving local infrastructure

**Voice Interaction**

- **FR-031**: System MUST transcribe Arabic voice input to text for processing
- **FR-032**: System MUST support voice input for queries, data entry commands, and bot commands
- **FR-033**: System MUST allow enabling/disabling text-to-speech for responses
- **FR-034**: System MUST provide clear feedback when voice transcription fails or is uncertain

**AI Modes and Architecture**

- **FR-035**: System MUST support three operating modes: Fast (local only), Smart (local + cloud review), and Training (background improvement). **Training Mode**: Cloud model evaluates a batch of recent local model answers in the background, identifies low-confidence responses, and automatically re-indexes documents and improves embeddings without requiring SUPER_ADMIN approval — changes are applied immediately in the background. Training Mode MUST log every re-indexing action to the AI Audit Trail so SUPER_ADMIN can review what was changed after the fact. Training Mode is read-only batch processing that NEVER interferes with real-time user queries.
- **FR-036**: System MUST use a local model for all queries in Fast Mode
- **FR-037**: System MUST use a cloud model to review and refine local answers in Smart Mode
- **FR-038**: System MUST support selection of cloud model provider (Gemini, GPT, Claude)
- **FR-039**: System MUST respond within 5 seconds in Fast Mode for typical queries
- **FR-040**: System MUST respond within 10 seconds in Smart Mode for typical queries

**Privacy & Security**

- **FR-041**: System MUST redact personally identifiable information from context sent to cloud models
- **FR-042**: System MUST allow Super Admins to configure privacy filters per field
- **FR-043**: System MUST log all AI interactions in AuditLog without storing question content
- **FR-044**: System MUST use local model for full data access (no filtering required)
- **FR-045**: System MUST NOT send unfiltered sensitive data to cloud models

**Configuration**

- **FR-046**: System MUST provide AI settings interface for Super Admins to configure mode, provider, privacy, and schedules
- **FR-047**: System MUST persist AI configuration and apply changes immediately
- **FR-048**: System MUST validate cloud API credentials before saving configuration

**AI-Powered Module Wizard**

- **FR-049**: System MUST guide developers through module creation via `/ai create-module` interactively (tasks T121, T124 cover conversation flow)
- **FR-050**: System MUST scaffold complete module files based on AI conversation (task T123 covers scaffolding with all required files)
- **FR-051**: System MUST review module code for Module Contract compliance via `/ai review-module <slug>` (task T125 covers analysis and violation reporting)
- **FR-052**: System MUST be trained on Module Kit documentation for accurate development guidance. **Implementation**: AI MUST be trained on Module Kit documentation by generating RAG embeddings from `docs/module-development-guide.md` and `packages/module-kit/src/**/*.ts` at startup (covered in Phase 11).
- **FR-053**: System MUST provide CLI command `module:validate <slug>` that checks Module Contract compliance before deployment (task T126 adds CLI command, validation logic in ModuleWizardService)
- **FR-054**: System MUST support cross-module queries when question context implies data from multiple modules

**Distinction**: FR-011 = cross-module queries on business database records (e.g., fuel + attendance data). FR-054 = cross-document Q&A on uploaded documents (e.g., asking about content across multiple PDF uploads). Both use RAGService but with different data sources.

**Usage Guidance Assistant**

- **FR-055**: System MUST answer usage guidance questions by searching module documentation using RAG
- **FR-056**: System MUST offer to initiate the relevant module flow after providing usage guidance

**AI Toolkit (Module Integration API)**

- **FR-062**: System MUST expose AI capabilities as a shared toolkit importable by any module: documentIntelligence, ragService, queryService, reportService, voiceService, suggestionService
- **FR-063**: System MUST enforce RBAC and PII filtering even when AI toolkit is called from a module context
- **FR-064**: System MUST allow modules to call OCR, RAG, voice transcription, and report generation without duplicating AI logic

**GAP 4 — AI Toolkit Function Signatures**
- **FR-123**: The AI Toolkit exported from @al-saada/ai-assistant/toolkit MUST define and enforce stable TypeScript function signatures for all six shared services: documentIntelligence(file, options), ragService.query(query, userId, scope), queryService.execute(nl_query, userId), reportService.generate(type, params, userId), voiceService.transcribe(audioBuffer), suggestionService.get(userId) — breaking changes to these signatures require a major version bump

- **FR-065**: System MUST automatically index any newly registered module's documentation into RAG embeddings upon ModuleLoader registration — including: locale files (ar.ftl, en.ftl) for Help Assistant queries, module config field definitions for natural language data entry parsing, and module slug/description for intent recognition
- **FR-066**: System MUST automatically index a registered module's full data model into RAG metadata — including: table schemas, field types, field constraints, and inter-table relationships as defined in the module's schema.prisma file — making this metadata available to RAG for: natural language query parsing across module tables, cross-table analytics (e.g., joins between module tables and core tables), and natural language data entry parsing

**AI Permission Profiles**

- **FR-067**: System MUST support AI permission profiles that control which AI capabilities each user can access: MODULE_QUERY, DATA_ANALYST, FINANCIAL_VIEWER, SELF_ONLY, GUIDANCE_ONLY, FULL_ACCESS, and CUSTOM
- **FR-068**: System MUST default every new user to GUIDANCE_ONLY AI permission profile until SUPER_ADMIN explicitly assigns a different profile
- **FR-069**: System MUST allow SUPER_ADMIN to create custom AI permission profiles by selecting any combination of individual AI capabilities
- **FR-070**: System MUST enforce AI permission profiles on every AI request before processing — unauthorized capability requests MUST be rejected with a localized error message

**GAP 1 — Prompt Injection Protection**
- **FR-120**: System MUST sanitize all natural language AI inputs to prevent prompt injection attacks — any user message attempting to override system context, impersonate roles, or bypass RBAC filters MUST be detected and rejected with a localized error message, and the attempt MUST be logged in the AI Audit Trail

- **FR-071**: System MUST allow SUPER_ADMIN to assign, change, or revoke any user's AI permission profile at any time with immediate effect
- **FR-093**: System MUST assign default AI permission profiles automatically based on system role at account creation: VISITOR receives GUIDANCE_ONLY (immutable), EMPLOYEE receives SELF_ONLY, ADMIN receives MODULE_QUERY, SUPER_ADMIN receives FULL_ACCESS (immutable)
- **FR-094**: System MUST prevent SUPER_ADMIN from assigning any AI permission profile to VISITOR-role users — VISITOR is permanently locked to GUIDANCE_ONLY
- **FR-095**: System MUST prevent any modification to SUPER_ADMIN's AI permission profile — SUPER_ADMIN is permanently locked to FULL_ACCESS
- **FR-096**: System MUST allow SUPER_ADMIN to upgrade any EMPLOYEE or ADMIN user's AI permission profile to any available profile (SELF_ONLY, MODULE_QUERY, DATA_ANALYST, FINANCIAL_VIEWER, FULL_ACCESS, or CUSTOM) regardless of their system role
- **FR-097**: System MUST enforce two-layer access control for all AI requests: first check system role RBAC (AdminScope from 001-platform-core), then check AI permission profile — both layers must pass for a request to be processed

**AI Audit Trail**

- **FR-072**: System MUST log every AI interaction including: user identity, request type, timestamp, AI profile used, and result (success/denied/error)
- **FR-073**: System MUST allow SUPER_ADMIN to filter AI audit logs by user, date range, request type, and result
- **FR-074**: System MUST allow SUPER_ADMIN to export AI audit logs as structured reports
- **FR-075**: System MUST log AI permission denial events with the denied capability and the user's current AI profile

**AI Confidence Indicator**

- **FR-076**: System MUST calculate and display a confidence score (0-100%) with every AI-generated answer
- **FR-077**: System MUST display a warning when confidence score is below 50% and offer the option to escalate to cloud model
- **FR-078**: System MUST cite the data source(s) used when generating a high-confidence answer

**AI Health and Quota Management**

- **FR-079**: System MUST provide SUPER_ADMIN with a real-time AI health dashboard showing status of all AI services and today's usage statistics
- **FR-080**: System MUST allow SUPER_ADMIN to configure monthly usage quotas per cloud AI service (Gemini, Whisper, OCR providers)
- **FR-081**: System MUST alert SUPER_ADMIN when any cloud AI service usage reaches 80% of configured quota
- **FR-082**: System MUST enforce hard quota limits — when 100% is reached, cloud AI requests for that service are gracefully declined with a localized message

**GAP 3 — Quota Response Signalling**
- **FR-122**: System MUST include rate limit headers in all AI API responses: X-RateLimit-Limit (configured quota), X-RateLimit-Remaining (remaining quota), and X-RateLimit-Reset (UTC timestamp of quota reset) — when quota is exceeded, the 429 response MUST include a localized error body with the reset timestamp

- **FR-083**: System MUST allow SUPER_ADMIN to immediately disable all AI services system-wide (emergency shutdown) and re-enable them with a single action
- **FR-084**: System MUST ensure emergency shutdown takes effect within 5 seconds across all active sessions

**AI Feedback Loop**

- **FR-085**: System MUST display feedback options (correct/incorrect/partial) after every AI-generated response
- **FR-086**: System MUST store user feedback linked to the original interaction for use in Training Mode
- **FR-087**: System MUST surface low-rated interactions in Training Mode for RAG re-indexing and embedding improvement

**AI Time-Based Access**

- **FR-088**: System MUST allow SUPER_ADMIN to configure time-based AI access windows per user or per AI permission profile (days of week and hours)
- **FR-089**: System MUST block AI requests outside configured access windows and respond with a localized message indicating when AI will next be available
- **FR-090**: System MUST allow SUPER_ADMIN to temporarily override time restrictions for individual users

**AI Onboarding**

- **FR-091**: System MUST detect first-time AI users and present a localized onboarding welcome message with role-appropriate example prompts
- **FR-092**: System MUST allow users to skip onboarding and receive a direct response to their first message

**Business Knowledge Base**

- **FR-098**: System MUST allow SUPER_ADMIN to add, edit, and delete business knowledge entries including price ranges, staff responsibilities, seasonal patterns, and domain-specific facts
- **FR-099**: System MUST apply business knowledge during AI data validation — flagging entries that violate configured knowledge rules before saving
- **FR-100**: System MUST apply business knowledge during AI query responses to provide contextually accurate answers

**Smart Anomaly Detection**

- **FR-101**: System MUST continuously analyze business data using statistical baseline modeling to detect unusual patterns without pre-configured thresholds
- **FR-102**: System MUST send anomaly alerts to relevant administrators based on AdminScope when a significant deviation from baseline is detected
- **FR-103**: System MUST allow administrators to resolve detected anomalies, triggering a baseline update for that metric
- **FR-104**: System MUST minimize false positives — anomaly sensitivity MUST be auto-calibrated based on historical alert resolution patterns

**AI Data Validation**

- **FR-105**: System MUST cross-validate all data entries against historical averages and business knowledge before saving
- **FR-106**: System MUST display a contextual warning (including historical average and deviation percentage) when an entry is statistically unusual
- **FR-107**: System MUST allow users to confirm and save anomalous data after seeing the warning — AI validation is advisory only and MUST never block saving
- **FR-108**: System MUST flag confirmed-despite-warning records in the database for audit review

**Scheduled AI Briefings**

- **FR-109**: System MUST allow SUPER_ADMIN to configure automated AI briefings with schedule (daily/weekly), recipients, and content scope
- **FR-110**: System MUST generate and deliver briefings at the configured schedule including: activity summary, upcoming deadlines, detected anomalies, and action items
- **FR-111**: System MUST deliver briefings even when no anomalies exist, confirming normal operations

**AI-Assisted Approvals**

- **FR-112**: System MUST generate an AI recommendation (approve/reject/defer) for each approval request, accompanied by data-driven reasoning
- **FR-113**: System MUST make AI approval recommendations advisory only — the final decision always belongs to the human approver
- **FR-114**: System MUST display no recommendation when insufficient data exists to form one

**Conversation Memory**

- **FR-115**: System MUST maintain conversation context within a single session — resolving references to earlier messages without requiring re-specification
- **FR-116**: System MUST clear conversation memory when a session ends — memory is session-scoped only and does not persist across sessions

**Voice Data Export**

- **FR-117**: System MUST accept voice commands requesting data exports and report delivery (Telegram document or email PDF)
- **FR-118**: System MUST deliver requested exports to the user's configured delivery method (Telegram or registered email)
- **FR-119**: System MUST inform users when their requested export destination (e.g., email) is not configured and offer an alternative

## RAG Quality Patterns

The RAG system implements two quality improvement patterns to enhance answer accuracy and relevance:

**Corrective RAG (CRAG) Pattern**: Before generating an answer, the system evaluates retrieved documents for relevance. If documents are of low relevance (below configurable threshold), the system re-queries with refined search terms or escalates to the cloud model for higher-quality responses. This reduces hallucinations and improves answer accuracy.

**Self-RAG Pattern**: The system self-evaluates its responses during generation by assessing relevance, support, and completeness. If the response fails any quality check, the system can retrieve additional documents, refine the query, or acknowledge uncertainty. This ensures the system only provides answers when it has sufficient supporting evidence.

## Non-Functional Quality Attributes

### Scalability

- **NFR-001**: System MUST support 50-500 concurrent users within acceptable performance targets
- **NFR-002**: System MUST handle 1M-10M total records without degradation of query performance (defined as within 5% of baseline performance)
- **NFR-003**: System MUST support horizontal scaling for stateless services when concurrent users exceed 300. **Note**: Horizontal scaling (300+ users) is an architecture decision for production deployment phase. Phase 1 targets single-instance with Docker auto-restart.
### Rate Limiting

- **NFR-004**: System MUST enforce role-based rate limits for AI queries
- **NFR-005**: Super Admins receive higher query quotas than standard users
- **NFR-006A**: Super Admins limited to 200 queries per minute
- **NFR-006B**: Admins limited to 150 queries per minute
- **NFR-006C**: Admins limited to 100 queries per minute
- **NFR-006D**: Employees limited to 50 queries per minute



### Reliability & Availability

- **NFR-007**: System MUST achieve 99.9% uptime (maximum 43 minutes downtime per month)
- **NFR-008**: System MUST implement automatic failover for critical services (local model, database) via Docker auto-restart and graceful degradation to Fast Mode
- **NFR-009**: System MUST support graceful degradation when cloud AI services are unavailable

### Observability

- **NFR-010**: System MUST track query latency (P50, P95, P99) for all AI interactions
- **NFR-011**: System MUST log structured error messages with correlation IDs for debugging
- **NFR-012**: System MUST monitor model performance metrics (accuracy, timeout rates, fallback frequency)

### Data Retention

- **NFR-013**: System MUST allow Super Admins to configure retention period for AI interaction logs
- **NFR-014**: System MUST allow Super Admins to configure retention period for document analyses
- **NFR-015**: System MUST automatically delete logs and analyses after configured retention period expires

### RAG Quality

- **NFR-016**: System MUST implement Corrective RAG (CRAG) — evaluate retrieved document relevance before answer generation; if relevance score is below configurable threshold, system MUST re-query with refined terms or escalate to the cloud model
- **NFR-017**: System MUST implement Self-RAG — evaluate generated answer confidence after generation; if confidence score is below configurable threshold, system MUST retrieve additional context and regenerate the answer before returning it to the user


### Key Entities

- **AIInteraction**: Represents a single AI query/response cycle including timestamp, user, mode used, processing time, and outcome (success/error)
- **AISuggestion**: Represents a proactive business suggestion including type, content, target recipient, status (pending/acknowledged/dismissed), and creation timestamp
- **ScheduledReport**: Represents a configured auto-generated report including name, period type, topic, frequency, recipients, and next run time
- **PrivacyRule**: Represents a privacy filter configuration including field name, model type (cloud/both), and redaction method
- **DocumentAnalysis**: Represents a processed document including file info, extracted data, module mapping suggestion, and status
- **VoiceSession**: Represents an active voice interaction including user, mode (TEXT_ONLY, VOICE_INPUT_ONLY, FULL_VOICE), and transcription history
- **AIConfig**: Represents user-specific AI configuration including operating mode, cloud provider, voice response enabled, and privacy preferences
- **AIPermissionProfile**: Represents an AI access profile including name, profile type (FULL_ACCESS/DATA_ANALYST/FINANCIAL_VIEWER/MODULE_QUERY/SELF_ONLY/GUIDANCE_ONLY/CUSTOM), list of allowed AI capabilities, isCustom flag, and creator reference (SUPER_ADMIN only)

### Entity Relationships

```text
User (from 001-platform-core)
├── 1:N AIInteraction        ← user makes queries
├── 1:N AISuggestion         ← user receives suggestions (as target)
├── 1:1 AIConfig            ← user's AI settings
├── 1:N DocumentAnalysis     ← user uploads documents (as uploader)
└── 1:N VoiceSession         ← user's voice interactions

AIPermissionProfile
└── N:1 User               ← many users can share one profile, created by SUPER_ADMIN only

PrivacyRule
└── N:1 User               ← created by SUPER_ADMIN only

ScheduledReport
└── N:N User               ← recipients (via JSON array)

AdminScope (from 001-platform-core)
└── Used by:
    ├── RAGService          ← RBAC filtering for queries
    ├── SuggestionService    ← RBAC filtering for suggestions
    └── ReportService       ← RBAC filtering for reports
```

Full entity definitions: see data-model.md

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of natural language data entry attempts are successfully parsed and confirmed on first try (without fallback to step-by-step conversation)
- **SC-002**: 85% of natural language queries receive accurate answers that satisfy the user's information need without follow-up
- **SC-003**: AI-generated reports are produced and delivered within 10 seconds for daily reports and within 30 seconds for weekly/monthly reports
- **SC-004**: Proactive business suggestions correctly identify actionable issues — defined as suggestions that are not dismissed by the recipient within 24 hours of delivery — at least 80% of the time
- **SC-005**: Document data extraction achieves 85% accuracy for structured fields (vendor, amount, date) on clear documents
- **SC-006**: Voice transcription achieves 90% accuracy for clear Arabic input in typical business environments
- **SC-007**: 95% of users report that the AI assistant saves them time compared to traditional menu navigation (measured via feedback)
- **SC-008**: Cloud model API calls are reduced by at least 70% compared to sending all queries to cloud (due to local model first approach)
- **SC-009**: No personally identifiable information from business data is leaked to cloud models in any scenario
- **SC-010**: 90% of managers report that proactive suggestions surface issues they would have otherwise missed (measured via feedback)
- **SC-011**: 100% of AI requests are correctly evaluated against the user's AI permission profile before processing — no unauthorized data access occurs
- **SC-012**: AI audit trail captures 100% of AI interactions with no gaps in logging
- **SC-013**: Confidence scores correctly reflect data availability — low-confidence warnings appear when source data covers less than 60% of the queried period
- **SC-014**: Emergency shutdown disables all AI services within 5 seconds in all tested scenarios — no AI request is processed after shutdown is confirmed
- **SC-015**: Role-based AI permission defaults are automatically applied for 100% of new user registrations — no manual configuration required for default profiles
- **SC-016**: AI data validation warnings appear for 100% of entries that deviate more than 2 standard deviations from the historical average for that field and module
- **SC-017**: Smart anomaly detection achieves a false-positive rate below 10% after a 30-day calibration period
- **SC-018**: Scheduled briefings are delivered within 60 seconds of the configured trigger time in 99% of cases

## Assumptions

- The local AI model has sufficient Arabic language capabilities to understand business domain terminology
- Cloud AI model providers offer APIs suitable for real-time interactive use
- Users have devices capable of voice input and output where needed
- Business data follows consistent naming and structure patterns that AI can learn from
- Internet connectivity is available for cloud model interactions in Smart and Training modes
- The organization has established privacy policies defining what data can leave local infrastructure

## Module Contract

Every module MUST comply with these 11 mandatory rules:

**Note**: Section.slug is defined in 001-platform-core (Platform Core), i18n key prefix format is defined in 003-module-kit (Module Kit).

1. config.ts exports defineModule() — required for ModuleLoader discovery
2. slug is unique and kebab-case — used as ID in Redis, DB, i18n
3. sectionSlug matches an existing Section.slug in DB
4. permissions.view is non-empty — at least one role
5. All user-facing text via i18n keys only — no hardcoded Arabic/English (Principle VII)
6. i18n keys prefixed with {slug}- — prevents key collisions between modules
7. locales/ar.ftl and locales/en.ftl exist — bilingual platform
8. schema.prisma contains only module-specific tables — no Layer 1 modifications
9. tests/ directory with at least one test — Principle III (80% coverage)
10. package.json for monorepo workspace compatibility
11. Modules MAY use AI toolkit services (imported from @al-saada/ai-assistant/toolkit) but MUST NOT import directly from internal AI service files

### Runtime Enforcement
ModuleLoader validates rules 1-4 and i18n file existence at startup. On failure: module is skipped + SUPER_ADMIN notified.

### Module Customization Levels
1. Config Only — define fields and permissions
2. Config + Hooks — add lifecycle hooks (onStepValidate, beforeSave, afterSave, onApproval, onRejection)
3. Config + Custom Code — custom/ directory for calculations, integrations, reports
4. Full Custom — developer writes entire conversation manually

### Module Creation Methods
1. CLI: npm run module:create (fast scaffolding)
2. AI Wizard: /ai create-module (guided by AI)
3. Manual: create files directly (full control)

## Required Artifact
Create docs/module-development-guide.md containing: Module Contract rules, code examples, common mistakes, and pre-deploy checklist.
