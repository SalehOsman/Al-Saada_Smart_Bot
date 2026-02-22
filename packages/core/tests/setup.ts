import { config } from 'dotenv'
import { vi } from 'vitest'

// Load .env.test file
config({ path: '.env.test' })

// Mock global variables if needed
global.console = {
  ...console,
  // Uncomment to reduce console noise during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Set test environment
process.env.NODE_ENV = 'test'

// Mock any other global variables your tests might need
// For example:
// global.fetch = mockFetch