# Checklist: Unit Tests for Requirements (Platform Core)

**Purpose**: Validate the quality, clarity, and completeness of the requirements in `spec.md`.
**Domain**: Telegram Bot Platform (Al-Saada Smart Bot)
**Target**: `specs/001-platform-core/spec.md`

## 1. Requirement Completeness
- [ ] CHK001 - Are the conditions for the "Bootstrap Lock" (e.g., zero user count, BigInt comparison) explicitly defined? [Completeness, Spec §FR-014]
- [ ] CHK002 - Are all required fields for the Join Request (Full Name, Phone, National ID) listed? [Completeness, Spec §User Story 2]
- [ ] CHK003 - Is the exact list of auditable actions (e.g., USER_LOGIN, SECTION_CREATE) fully enumerated? [Completeness, Spec §FR-026]
- [ ] CHK004 - Are the specific prefixes for Egyptian phone validation (010, 011, 012, 015) documented? [Completeness, Spec §FR-034]
- [ ] CHK005 - Is the cleanup policy for old notifications (90 days) explicitly stated? [Completeness, Spec §FR-032]

## 2. Requirement Clarity
- [ ] CHK006 - Is the format for "National ID" defined (14 digits) or referenced clearly? [Clarity, Spec §FR-034]
- [ ] CHK007 - Is the behavior of "Maintenance Mode" clearly distinguished for Super Admins vs. regular users? [Clarity, Spec §User Story 4]
- [ ] CHK008 - Is the "90/10 rule" for configuration vs. hook code quantified sufficiently? [Clarity, Spec §Principles]
- [ ] CHK009 - Are the specific User Roles (SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR) listed without ambiguity? [Clarity, Spec §FR-015]
- [ ] CHK010 - Is the format for auto-generated nicknames (`{firstName}-{4-char-nanoid}`) explicitly defined? [Clarity, Spec §Clarifications]

## 3. Requirement Consistency
- [ ] CHK011 - Do the Session Management requirements (24h expiry) align with the Redis caching strategy? [Consistency, Spec §FR-028]
- [ ] CHK012 - Is the requirement for "Arabic-first" UI consistent with the bilingual support requirement? [Consistency, Spec §FR-031]
- [ ] CHK013 - Does the "Config-Driven" principle align with the module discovery mechanism descriptions? [Consistency, Spec §FR-020]
- [ ] CHK014 - Are the admin permission scopes (Section vs. Module) consistent with the `AdminScope` table definition? [Consistency, Spec §FR-017]

## 4. Acceptance Criteria Quality
- [ ] CHK015 - Can the "less than 30 seconds" bootstrap time be objectively measured? [Measurability, Spec §SC-001]
- [ ] CHK016 - Is the "99.9% uptime" requirement defined with a specific measurement period? [Measurability, Spec §SC-008]
- [ ] CHK017 - Can the "no sensitive data in logs" requirement be verified by a scanner or audit? [Measurability, Spec §FR-027]
- [ ] CHK018 - Is the "500ms p95 response time" linked to a specific concurrency level (~200 users)? [Measurability, Spec §NFR-001]

## 5. Scenario Coverage
- [ ] CHK019 - Are requirements defined for the scenario where a user sends `/start` for the first time? [Coverage, Spec §User Story 1]
- [ ] CHK020 - Is the flow for a Super Admin rejecting a join request explicitly described? [Coverage, Spec §User Story 2]
- [ ] CHK021 - Are requirements specified for a user attempting to join with an existing PENDING request? [Coverage, Spec §Clarifications]
- [ ] CHK022 - Is the process for a Super Admin to delete an empty section covered? [Coverage, Spec §User Story 3]
- [ ] CHK023 - Are the requirements for dynamic module discovery at startup defined? [Coverage, Spec §FR-020]

## 6. Edge Case Coverage
- [ ] CHK024 - Is the system behavior defined for a user submitting a duplicate National ID? [Edge Case, Spec §Edge Cases]
- [ ] CHK025 - Is the behavior specified when `INITIAL_SUPER_ADMIN_ID` is missing from the environment? [Edge Case, Spec §FR-014]
- [ ] CHK026 - Is the fallback mechanism specified if Redis becomes unavailable (in-memory fallback)? [Edge Case, Spec §Edge Cases]
- [ ] CHK027 - Are requirements defined for handling invalid module configurations (skip vs. crash)? [Edge Case, Spec §FR-021]
- [ ] CHK028 - Is the behavior defined for database connection failures during startup (retry logic)? [Edge Case, Spec §Edge Cases]

## 7. Non-Functional Requirements
- [ ] CHK029 - Is the specific timezone (Africa/Cairo) for the system explicitly required? [NFR, Spec §Principles]
- [ ] CHK030 - Are the security requirements for sanitizing all user inputs documented? [Security, Spec §FR-033]
- [ ] CHK031 - Is the requirement for BigInt safety in Telegram ID comparisons explicitly stated? [Security, Spec §FR-014]
- [ ] CHK032 - Are the performance targets (latency, concurrency) clearly defined? [Performance, Spec §NFR-001]

## 8. Dependencies & Assumptions
- [ ] CHK033 - Is the dependency on "PostgreSQL 16" and "Redis 7" explicitly stated? [Dependency, Spec §FR-006]
- [ ] CHK034 - Is the assumption that "RTL rendering is handled natively by Telegram" documented? [Assumption, Spec §FR-031]
- [ ] CHK035 - Is the reliance on the `@al-saada/validators` package for phone validation noted? [Dependency, Spec §FR-034]

## 9. Ambiguities & Conflicts
- [ ] CHK036 - Is the term "significant user actions" clearly defined to avoid ambiguity in logging? [Ambiguity, Spec §FR-026]
- [ ] CHK037 - Is the "configPath" relative location (to module root or project root) unambiguous? [Ambiguity, Spec §Key Entities]

## 10. Traceability
- [ ] CHK038 - Do the "Success Criteria" link back to specific Functional Requirements? [Traceability]
- [ ] CHK039 - Are the "User Stories" mapped to specific Priority levels (P1, P2, P3)? [Traceability, Spec §User Scenarios]

## 11. Surface & Resolve Issues
- [ ] CHK040 - Is the format of "Section Icons" (Unicode emoji vs. image) explicitly resolved? [Resolution, Spec §Key Entities]
- [ ] CHK041 - Is the policy on editing Pending requests (rejected vs. allowed) clearly resolved? [Resolution, Spec §Clarifications]
