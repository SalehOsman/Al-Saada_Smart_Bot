import { vi } from 'vitest'

// Create a mock Prisma client with all the necessary methods
export const prisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  joinRequest: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
}

export default prisma
