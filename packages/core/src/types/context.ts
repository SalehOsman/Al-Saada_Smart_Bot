import { Context, SessionFlavor } from 'grammy'
import { I18nFlavor } from '@grammyjs/i18n'
import { HydrateFlavor } from '@grammyjs/hydrate'
import { ConversationFlavor } from '@grammyjs/conversations'

export interface SessionData {
  currentSection?: string
  currentModule?: string
  currentStep?: string
  lastActivity?: string
  __language_code?: string
}

export type BotContext = Context &
  HydrateFlavor<Context> &
  SessionFlavor<SessionData> &
  I18nFlavor &
  ConversationFlavor
