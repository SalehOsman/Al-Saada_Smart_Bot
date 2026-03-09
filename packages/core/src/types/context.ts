import type { Context, SessionFlavor } from 'grammy'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { ConversationFlavor } from '@grammyjs/conversations'
import type { AuditAction } from '@prisma/client'

/**
 * Shared session data stored in Redis.
 * Captures user state, navigation history, and temporary flow data.
 */
export interface SessionData {
  /** The internal database user ID */
  userId?: number
  /** The current user role (SUPER_ADMIN, ADMIN, etc.) */
  role?: string
  /** Preferred UI language (ar, en) */
  language?: string
  /** Currently active section slug for navigation context */
  currentSection?: string | null
  /** Currently active module slug */
  currentModule?: string | null
  /** Current step in a multi-step conversation */
  currentStep?: string
  /** Timestamp of the last user interaction */
  lastActivity?: number
  /** Navigation breadcrumb stack for hierarchical menus (FR-028) */
  currentMenu?: Array<{ level: string, id: string }>
  /** Stores the current edit query for section modifications */
  editSectionQuery?: string
  /** Stores the parent section ID when creating a sub-section */
  createSubSection?: string | null
  /** Stores the backup filename during a restore flow */
  pendingRestore?: string
  /** Internal grammY i18n language code */
  __language_code?: string
}

/**
 * Custom Bot Context extending grammY Context with project-specific flavors.
 * Includes session management, i18n, hydration, and custom utilities.
 */
export type BotContext = Context &
  HydrateFlavor<Context> &
  SessionFlavor<SessionData> &
  I18nFlavor &
  ConversationFlavor & {
    /**
     * Unified audit logging helper.
     * Records administrative actions to the database (FR-026).
     *
     * @param action - The type of action performed
     * @param targetType - The entity type affected (e.g., 'User', 'Section')
     * @param targetId - The unique identifier of the target entity
     * @param metadata - Optional key-value pairs for additional context
     */
    audit: (action: AuditAction, targetType?: string, targetId?: string, metadata?: Record<string, any>) => Promise<void>
  }
