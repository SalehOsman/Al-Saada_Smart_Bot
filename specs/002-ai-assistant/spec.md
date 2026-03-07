# Feature Specification: AI Assistant - Comprehensive Operational Partner

**Feature Branch**: `002-ai-assistant`
**Created**: 2026-03-02
**Status**: In Progress
**Input**: User description: "AI Assistant as a full operational partner for business management — data entry, retrieval, reporting, analysis, and proactive suggestions."
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

An employee uploads a scanned invoice or receipt. The system extracts structured data — vendor name, amount, date, line items — and offers to register it as an expense. Similarly, uploading a PDF report allows the user to ask questions about its contents.

**Why this priority**: This reduces manual data entry from documents and enables digitization of paper records. It significantly improves efficiency for businesses that deal with many documents.

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

### Edge Cases

- How does the system handle documents that exceed size or page limits? → (Handled by FR-025A: 25MB limit, FR-025B: 500 pages)

- What happens when the local AI model is unavailable or responds with an error? → (Handled by NFR-008: auto failover, NFR-009: graceful degradation to cached responses)
- How does the system handle natural language input that is completely unrelated to any module? → (Handled by FR-012: ambiguous query handling — system responds with clarification or "I cannot help with that")
- What happens when voice transcription produces completely incorrect text? → (Handled by FR-034: voice failure feedback — prompt user to retry or switch to text)
- How does the system handle documents with poor quality images or corrupted files? → (Handled by FR-026, FR-027: extraction returns low confidence score, user informed via i18n error message)
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
- **FR-009**: System MUST provide responses in a format appropriate to the question type (numeric answers, lists, summaries, explanations)
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
- **FR-020**: System MUST generate suggestions when thresholds are exceeded or patterns match predefined criteria
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

**Voice Interaction**

- **FR-031**: System MUST transcribe Arabic voice input to text for processing
- **FR-032**: System MUST support voice input for queries, data entry commands, and bot commands
- **FR-033**: System MUST allow enabling/disabling text-to-speech for responses
- **FR-034**: System MUST provide clear feedback when voice transcription fails or is uncertain

**AI Modes and Architecture**

- **FR-035**: System MUST support three operating modes: Fast (local only), Smart (local + cloud review), and Training (background improvement). **Training Mode**: Cloud model evaluates a batch of recent local model answers in the background, identifies low-confidence responses, and generates RAG improvement suggestions (better embeddings, chunking, or missing data). Does not affect real-time queries. Training Mode is read-only, batch processing that runs asynchronously and NEVER interferes with real-time user queries. It only re-indexes documents and improves embeddings in the background.
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
- **NFR-006C**: Managers limited to 100 queries per minute
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


### Key Entities

- **AIInteraction**: Represents a single AI query/response cycle including timestamp, user, mode used, processing time, and outcome (success/error)
- **AISuggestion**: Represents a proactive business suggestion including type, content, target recipient, status (pending/acknowledged/dismissed), and creation timestamp
- **ScheduledReport**: Represents a configured auto-generated report including name, period type, topic, frequency, recipients, and next run time
- **PrivacyRule**: Represents a privacy filter configuration including field name, model type (cloud/both), and redaction method
- **DocumentAnalysis**: Represents a processed document including file info, extracted data, module mapping suggestion, and status
- **VoiceSession**: Represents an active voice interaction including user, mode (TEXT_ONLY, VOICE_INPUT_ONLY, FULL_VOICE), and transcription history
- **AIConfig**: Represents user-specific AI configuration including operating mode, cloud provider, voice response enabled, and privacy preferences

### Entity Relationships

```text
User (from 001-platform-core)
├── 1:N AIInteraction        ← user makes queries
├── 1:N AISuggestion         ← user receives suggestions (as target)
├── 1:1 AIConfig            ← user's AI settings
├── 1:N DocumentAnalysis     ← user uploads documents (as uploader)
└── 1:N VoiceSession         ← user's voice interactions

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
- **SC-004**: Proactive business suggestions correctly identify actionable issues (true positives) at least 80% of the time
- **SC-005**: Document data extraction achieves 85% accuracy for structured fields (vendor, amount, date) on clear documents
- **SC-006**: Voice transcription achieves 90% accuracy for clear Arabic input in typical business environments
- **SC-007**: 95% of users report that the AI assistant saves them time compared to traditional menu navigation (measured via feedback)
- **SC-008**: Cloud model API calls are reduced by at least 70% compared to sending all queries to cloud (due to local model first approach)
- **SC-009**: No personally identifiable information from business data is leaked to cloud models in any scenario
- **SC-010**: 90% of managers report that proactive suggestions surface issues they would have otherwise missed (measured via feedback)

## Assumptions

- The local AI model has sufficient Arabic language capabilities to understand business domain terminology
- Cloud AI model providers offer APIs suitable for real-time interactive use
- Users have devices capable of voice input and output where needed
- Business data follows consistent naming and structure patterns that AI can learn from
- Internet connectivity is available for cloud model interactions in Smart and Training modes
- The organization has established privacy policies defining what data can leave local infrastructure

## Module Contract

Every module MUST comply with these 10 mandatory rules:

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
