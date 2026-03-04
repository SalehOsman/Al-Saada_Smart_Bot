import { InlineKeyboard } from 'grammy'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import { sectionService } from '../../services/sections'
import { auditService } from '../../services/audit-logs'
import logger from '../../utils/logger'
import { AuditAction } from '@prisma/client'
import {
  showMainSectionsMenu,
  showSectionModules,
  showSubSectionsMenu,
  updateNavigationBreadcrumb,
  handleBackNavigation,
} from '../menus/sections'

/**
 * Section management handler for Super Admin
 * Per FR-018: create, edit, delete, enable/disable sections with 2-level hierarchy
 */

/**
 * Handle section management callback queries
 */
export async function sectionsCallbackHandler(ctx: BotContext): Promise<void> {
  const query = ctx.callbackQuery?.data
  if (!query) return

  // Callbacks are formatted as "section:ACTION:ID[:EXTRA]"
  // e.g. "section:view:abc123", "section:add", "section:add:parentId"
  const parts = query.split(':')
  const _prefix = parts[0]   // always "section"
  const action = parts[1]    // view, add, edit, delete, etc.
  const id = parts[2]        // section ID (may be undefined)
  const extra = parts[3]     // extra param (may be undefined)

  // Update navigation breadcrumb
  await updateNavigationBreadcrumb(ctx, 'sections')

  if (action === 'add') {
    if (id) {
      // Adding sub-section under main section
      return addSubSectionPrompt(ctx, id)
    }
    return addSectionPrompt(ctx)
  }

  if (action === 'view') {
    return showSectionModules(ctx, id)
  }

  if (action === 'edit') {
    return editSectionPrompt(ctx, id)
  }

  if (action === 'delete') {
    return confirmDeleteSection(ctx, id)
  }

  if (action === 'confirm_delete') {
    return deleteSection(ctx, id)
  }

  if (action === 'toggle') {
    return toggleSectionActive(ctx, id)
  }

  if (action === 'back') {
    return handleBackNavigation(ctx)
  }
}

/**
 * Add a new main section
 */
async function addSectionPrompt(ctx: BotContext): Promise<void> {
  // Clear any previous edit state
  ctx.session.createSubSection = undefined
  ctx.reply(ctx.t('section-create-prompt'), {
    reply_markup: { force_reply: true },
  })
}

/**
 * Add a sub-section under a main section
 */
async function addSubSectionPrompt(ctx: BotContext, parentSectionId: string): Promise<void> {
  const parentSection = await prisma.section.findUnique({
    where: { id: parentSectionId },
  })

  if (!parentSection) {
    ctx.reply(ctx.t('errors-section-not-found'))
    return
  }

  // Set parent section ID in session for tracking
  ctx.session.createSubSection = parentSectionId

  ctx.reply(
    ctx.t('subsection-create-prompt', {
      parentName: ctx.t(parentSection.name as any),
    }),
    {
      reply_markup: { force_reply: true },
    }
  )
}

/**
 * Edit an existing section
 */
async function editSectionPrompt(ctx: BotContext, sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  })

  if (!section) {
    ctx.reply(ctx.t('errors-section-not-found'))
    return
  }

  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-edit-name'), `section:edit_name:${sectionId}`)
    .row()
    .text(ctx.t('button-edit-name-en'), `section:edit_name_en:${sectionId}`)
    .row()
    .text(ctx.t('button-edit-icon'), `section:edit_icon:${sectionId}`)
    .row()
    .text(ctx.t('button-edit-parent'), `section:edit_parent:${sectionId}`)
    .row()
    .text(ctx.t('button-edit-order'), `section:edit_order:${sectionId}`)
    .row()
    .text(ctx.t('button-back'), `section:view:${sectionId}`)

  ctx.answerCallbackQuery()
  ctx.editMessageText(ctx.t('section-edit-title', {
    name: ctx.t(section.name as any),
  }), {
    reply_markup: keyboard,
  })
}

/**
 * Handle section edit actions (name, icon, parent, order)
 */
export async function editSectionActionHandler(ctx: BotContext): Promise<void> {
  const query = ctx.callbackQuery?.data
  if (!query) return

  // Callbacks are formatted as "section:edit:SECTION_ID:FIELD"
  // e.g. "section:edit:abc123:name"
  const parts = query.split(':')
  const _prefix = parts[0]    // always "section"
  const action = parts[1]     // always "edit" for this handler
  const sectionId = parts[2]  // section ID
  const field = parts[3]      // field name (name, name_en, icon, parent, order)

  if (action !== 'edit') return

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  })

  if (!section) {
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  if (field === 'name' || field === 'name_en') {
    ctx.answerCallbackQuery()
    ctx.reply(
      field === 'name' ? ctx.t('section-edit-name-prompt') : ctx.t('section-edit-name-en-prompt'),
      { reply_markup: { force_reply: true } },
    )
    // Set edit query in session
    ctx.session.editSectionQuery = query
    return
  }

  if (field === 'icon') {
    ctx.answerCallbackQuery()
    ctx.reply(ctx.t('section-edit-icon-prompt'), {
      reply_markup: { force_reply: true },
    })
    ctx.session.editSectionQuery = query
    return
  }

  if (field === 'parent') {
    ctx.answerCallbackQuery()

    // Show parent selection (main sections only)
    const mainSections = await prisma.section.findMany({
      where: { parentId: null, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
    })

    const keyboard: any[][] = []
    keyboard.push([{ text: ctx.t('option-no-parent'), callback_data: `section:set_parent_none:${sectionId}` }])

    for (const sec of mainSections) {
      keyboard.push([
        { text: `${sec.icon} ${ctx.t(sec.name as any)}`, callback_data: `section:set_parent:${sectionId}:${sec.id}` },
      ])
    }

    keyboard.push([{ text: ctx.t('button-back'), callback_data: `section:edit:${sectionId}` }])

    ctx.editMessageText(ctx.t('section-edit-parent-prompt'), {
      reply_markup: { inline_keyboard: keyboard },
    })
    return
  }

  if (field === 'order') {
    ctx.answerCallbackQuery()
    ctx.reply(ctx.t('section-edit-order-prompt'), {
      reply_markup: { force_reply: true },
    })
    ctx.session.editSectionQuery = query
    return
  }

  ctx.answerCallbackQuery(ctx.t('error-invalid-action'))
}

/**
 * Handle section update from text input
 */
export async function sectionCreateTextHandler(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text?.trim()
  if (!text) return

  // Only process if user is in section creation mode (force_reply) or editing
  // Skip if no relevant session state is set
  const isCreating = ctx.session.createSubSection !== undefined || ctx.message?.reply_to_message
  const isEditing = ctx.session.editSectionQuery !== undefined
  if (!isCreating && !isEditing) return

  const isSubSection = ctx.session.createSubSection !== undefined
  const parentSectionId = ctx.session.createSubSection || null

  const section = await prisma.section.findUnique({
    where: { id: parentSectionId ?? '' },
  })

  if (parentSectionId && !section) {
    ctx.reply(ctx.t('errors-section-not-found'))
    return
  }

  try {
    // Parse input format: "name | name_en | icon | order"
    // For sub-section, format: "name | name_en | icon"
    const parts = text?.split('|').map((p: string) => p.trim())

    if (!parts || parts.length < 3) {
      ctx.reply(ctx.t('section-create-invalid-format'))
      return
    }

    const [name, nameEn, icon, orderStr] = parts

    // Validate name (2-50 characters)
    if (name.length < 2 || name.length > 50) {
      ctx.reply(ctx.t('errors-validation-section-name'))
      return
    }

    // Validate English name
    if (nameEn.length < 2 || nameEn.length > 50) {
      ctx.reply(ctx.t('errors-validation-section-name'))
      return
    }

    // Validate emoji (exactly one Unicode emoji)
    const emojiRegex = /^\p{Emoji}$/u
    if (!emojiRegex.test(icon)) {
      ctx.reply(ctx.t('errors-validation-section-icon'))
      return
    }

    // Validate order (if provided and not sub-section)
    let orderIndex = 0
    if (orderStr && !isSubSection) {
      const order = parseInt(orderStr, 10)
      if (isNaN(order)) {
        ctx.reply(ctx.t('errors-validation-invalid-number'))
        return
      }
      orderIndex = order
    }

    // Generate slug from name (Arabic -> transliteration fallback)
    // For simplicity, use a simplified approach
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')

    const section = await sectionService.create({
      slug,
      name,
      nameEn,
      icon,
      parentId: parentSectionId,
      orderIndex,
      createdBy: BigInt(ctx.from?.id || 0n),
    })

    await auditService.log({
      userId: BigInt(ctx.from?.id || 0n),
      action: AuditAction.SECTION_CREATE,
      targetType: 'Section',
      targetId: section.id,
    })

    // Clear session create state
    ctx.session.createSubSection = undefined

    ctx.reply(ctx.t('section-created-success'))

    // Return to sections menu
    await updateNavigationBreadcrumb(ctx, 'sections')
    await showMainSectionsMenu(ctx)
  } catch (error: any) {
    logger.error('Error creating section:', error)

    if (error.message.includes('3rd level') || error.message.includes('Cannot create')) {
      ctx.reply(ctx.t('errors-section-max-depth-exceeded'))
      return
    }

    ctx.reply(ctx.t('error-generic'))
  }
}

/**
 * Handle parent selection for section
 */
export async function sectionSetParentHandler(ctx: BotContext): Promise<void> {
  const query = ctx.callbackQuery?.data
  if (!query) return

  // Callbacks are formatted as "section:set_parent:SECTION_ID:PARENT_ID"
  // e.g. "section:set_parent:abc123:def456" or "section:set_parent_none:abc123"
  const parts = query.split(':')
  const _prefix = parts[0]    // always "section"
  const action = parts[1]     // "set_parent" or "set_parent_none"
  const sectionId = parts[2]  // section ID
  const parentId = parts[3]   // parent section ID (may be undefined)

  if (action !== 'set_parent' && action !== 'set_parent_none') return

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  })

  if (!section) {
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  try {
    const newParentId = (action === 'set_parent_none' || parentId === 'none') ? null : parentId

    await sectionService.update({
      id: sectionId,
      parentId: newParentId,
    })

    await auditService.log({
      userId: BigInt(ctx.from?.id || 0n),
      action: AuditAction.SECTION_UPDATE,
      targetType: 'Section',
      targetId: sectionId,
    })

    ctx.answerCallbackQuery(ctx.t('section-parent-updated-success'))

    // Show section details
    editSectionPrompt(ctx, sectionId)
  } catch (error: any) {
    logger.error('Error updating section parent:', error)
    ctx.answerCallbackQuery(ctx.t('error-generic'))
  }
}

/**
 * Confirm section deletion
 */
async function confirmDeleteSection(ctx: BotContext, sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  })

  if (!section) {
    ctx.reply(ctx.t('errors-section-not-found'))
    return
  }

  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-confirm-delete'), `section:confirm_delete:${sectionId}`)
    .text(ctx.t('button-cancel'), `section:view:${sectionId}`)

  ctx.answerCallbackQuery()
  ctx.editMessageText(ctx.t('section-delete-confirm', {
    name: ctx.t(section.name as any),
  }), {
    reply_markup: keyboard,
  })
}

/**
 * Delete a section
 */
async function deleteSection(ctx: BotContext, sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  })

  if (!section) {
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  try {
    await sectionService.delete(sectionId)

    await auditService.log({
      userId: BigInt(ctx.from?.id || 0n),
      action: AuditAction.SECTION_DELETE,
      targetType: 'Section',
      targetId: sectionId,
    })

    ctx.answerCallbackQuery(ctx.t('section-deleted-success'))

    // Return to sections menu
    await updateNavigationBreadcrumb(ctx, 'sections')
    showMainSectionsMenu(ctx)
  } catch (error: any) {
    logger.error('Error deleting section:', error)

    if (error.message.includes('active modules')) {
      ctx.answerCallbackQuery(ctx.t('errors-section-has-active-modules'))
      return
    }

    ctx.answerCallbackQuery(ctx.t('error-generic'))
  }
}

/**
 * Toggle section active/inactive
 */
async function toggleSectionActive(ctx: BotContext, sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, isActive: true },
  })

  if (!section) {
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  const newStatus = !section.isActive
  await sectionService.toggleActive(sectionId, newStatus)

  await auditService.log({
    userId: BigInt(ctx.from?.id || 0n),
    action: newStatus ? AuditAction.SECTION_ENABLE : AuditAction.SECTION_DISABLE,
    targetType: 'Section',
    targetId: sectionId,
  })

  ctx.answerCallbackQuery(
    newStatus ? ctx.t('section-enabled-success') : ctx.t('section-disabled-success'),
  )

  showMainSectionsMenu(ctx)
}
