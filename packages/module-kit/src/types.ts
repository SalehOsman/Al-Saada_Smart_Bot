import { Conversation } from '@grammyjs/conversations';
import { Context } from 'grammy';
import { PrismaClient, Role, AuditAction } from '@prisma/client';
import { BotContext as CoreBotContext } from '@core/types/context';

/**
 * Common context for bot handlers, extending core BotContext.
 */
export type BotContext = CoreBotContext;

export interface ModuleDefinition {
  /** Unique module identifier (e.g., "fuel-entry") */
  slug: string;

  /** Slug of the section this module belongs to (resolved to Section.slug) */
  sectionSlug: string;

  /** Primary Arabic display name (i18n key) */
  name: string;

  /** Secondary English display name (i18n key) */
  nameEn: string;

  /** Emoji icon for the bot menu */
  icon: string;

  /** Granular user roles required for access */
  permissions: {
    view: Role[];
    create: Role[];
    edit: Role[];
    delete: Role[];
  };

  /** Optional Redis TTL for conversation drafts (in hours, default 24) */
  draftTtlHours?: number;

  /** Order in the section's menu */
  orderIndex?: number;

  /** The grammY conversation handler (Create entry point) */
  addEntryPoint: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;

  /** The grammY conversation handler (Edit entry point) */
  editEntryPoint?: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;

  /** Optional audit action override (defaults to MODULE_CREATE) */
  auditAction?: AuditAction;
}

export interface ValidateOptions<T> {
  /** The i18n key for the prompt message */
  promptKey: string;

  /** The i18n key for the error message when validation fails */
  errorKey: string;

  /** The field name in the draft/object (e.g., "quantity") */
  field: keyof T;

  /** Validation function (boolean or throw) */
  validator: (val: string) => boolean | Promise<boolean>;

  /** Format function before storing (e.g., parseInt, trim) */
  formatter?: (val: string) => any;

  /** Maximum retries (default 3) */
  maxRetries?: number;
}

export interface ConfirmOptions<T> {
  /** The draft data to display in the summary */
  data: T;

  /** Map of field name to i18n key for labeling the summary row */
  labels: Record<keyof T, string>;

  /** List of field names that are editable from the summary */
  editableFields: (keyof T)[];

  /** Function to re-ask the question for a specific field */
  reAsk: (field: keyof T) => Promise<void>;
}

export interface SaveOptions<T> {
  /** The module's unique slug */
  moduleSlug: string;

  /** Database write operation (Prisma callback) */
  action: (prisma: PrismaClient) => Promise<any>;

  /** Audit log metadata */
  audit: {
    action: AuditAction;
    targetType: string;
    details?: any;
  };
}
