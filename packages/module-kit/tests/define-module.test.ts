import { describe, expect, it } from 'vitest'
import { Role } from '@prisma/client'
import { defineModule } from '../src/define-module.js'

describe('defineModule()', () => {
  const validConfig = {
    slug: 'fuel-entry',
    sectionSlug: 'operations',
    name: 'fuel-entry-name',
    nameEn: 'fuel-entry-name-en',
    icon: '⛽',
    permissions: {
      view: [Role.ADMIN, Role.SUPER_ADMIN],
      create: [Role.ADMIN],
      edit: [Role.ADMIN],
      delete: [Role.SUPER_ADMIN],
    },
    addEntryPoint: async () => {},
  }

  it('returns a frozen config for a valid module definition', () => {
    const config = defineModule(validConfig as any)
    expect(config).toEqual(validConfig)
    expect(Object.isFrozen(config)).toBe(true)
    expect(Object.isFrozen(config.permissions)).toBe(true)
  })

  it('throws error if slug format is invalid', () => {
    const invalidSlugs = ['Fuel-Entry', 'fuel_entry', 'fuel entry', 'fuel-']
    invalidSlugs.forEach((slug) => {
      expect(() => defineModule({ ...validConfig, slug } as any)).toThrow(/Invalid slug format/)
    })
  })

  it('throws error if required fields are missing', () => {
    const requiredFields = ['slug', 'sectionSlug', 'name', 'nameEn', 'icon', 'permissions', 'addEntryPoint']
    requiredFields.forEach((field) => {
      const config = { ...validConfig } as any
      delete config[field]
      expect(() => defineModule(config)).toThrow()
    })
  })

  it('throws error if permissions.view is empty', () => {
    const config = {
      ...validConfig,
      permissions: { ...validConfig.permissions, view: [] },
    } as any
    expect(() => defineModule(config)).toThrow(/Module definition "permissions.view" cannot be empty/)
  })

  it('trims leading/trailing whitespace from i18n keys and icons', () => {
    const config = defineModule({
      ...validConfig,
      name: '  fuel-entry-name  ',
      icon: ' ⛽ ',
    } as any)
    expect(config.name).toBe('fuel-entry-name')
    expect(config.icon).toBe('⛽')
  })
})
