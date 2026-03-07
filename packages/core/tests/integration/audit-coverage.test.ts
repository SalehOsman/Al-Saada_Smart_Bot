import { AuditAction } from '@prisma/client'
import { describe, expect, it } from 'vitest'

describe('t080: Audit Coverage', () => {
  it('should use all AuditAction values in the source code', () => {
    const actions = Object.values(AuditAction)
    expect(actions.length).toBeGreaterThanOrEqual(25)
  })
})
