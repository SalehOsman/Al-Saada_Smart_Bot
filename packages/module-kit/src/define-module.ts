import type { ModuleDefinition } from './types.js'

/**
 * Validates and freezes a module definition.
 * Enforces slug format (lowercase, hyphen-separated) and required fields.
 *
 * @param config - The module definition to validate.
 * @returns A frozen version of the configuration.
 * @throws Error if any required field is missing or invalid.
 */
export function defineModule(config: ModuleDefinition): ModuleDefinition {
  const {
    slug,
    sectionSlug,
    name,
    nameEn,
    icon,
    permissions,
    addEntryPoint,
  } = config

  // 1. Check for missing required fields
  if (!slug)
    throw new Error('Module definition is missing required field: "slug"')
  if (!sectionSlug)
    throw new Error('Module definition is missing required field: "sectionSlug"')
  if (!name)
    throw new Error('Module definition is missing required field: "name"')
  if (!nameEn)
    throw new Error('Module definition is missing required field: "nameEn"')
  if (!icon)
    throw new Error('Module definition is missing required field: "icon"')
  if (!permissions)
    throw new Error('Module definition is missing required field: "permissions"')
  if (!addEntryPoint)
    throw new Error('Module definition is missing required field: "addEntryPoint"')

  // 2. Validate slug format (lowercase, hyphen-separated, no trailing hyphen)
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    throw new Error(`Invalid slug format: "${slug}". Must be lowercase, hyphen-separated (e.g., "fuel-entry").`)
  }

  // 3. Validate permissions.view
  if (!permissions.view || permissions.view.length === 0) {
    throw new Error('Module definition "permissions.view" cannot be empty.')
  }

  // 4. Sanitize and deep freeze
  const sanitizedConfig = {
    ...config,
    slug: slug.trim(),
    sectionSlug: sectionSlug.trim(),
    name: name.trim(),
    nameEn: nameEn.trim(),
    icon: icon.trim(),
  }

  // Deep freeze permissions as well
  if (sanitizedConfig.permissions) {
    Object.freeze(sanitizedConfig.permissions)
    if (sanitizedConfig.permissions.view)
      Object.freeze(sanitizedConfig.permissions.view)
    if (sanitizedConfig.permissions.create)
      Object.freeze(sanitizedConfig.permissions.create)
    if (sanitizedConfig.permissions.edit)
      Object.freeze(sanitizedConfig.permissions.edit)
    if (sanitizedConfig.permissions.delete)
      Object.freeze(sanitizedConfig.permissions.delete)
  }

  return Object.freeze(sanitizedConfig)
}
