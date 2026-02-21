import type { Context, SessionFlavor } from 'grammy'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { ConversationFlavor } from '@grammyjs/conversations'

export interface SessionData {
  userId?: number
  role?: string
  language?: string
  currentSection?: string | null
  currentModule?: string | null
  currentStep?: string
  lastActivity?: number
  __language_code?: string
}

export type BotContext = Context &
  HydrateFlavor<Context> &
  SessionFlavor<SessionData> &
  I18nFlavor &
  ConversationFlavor
