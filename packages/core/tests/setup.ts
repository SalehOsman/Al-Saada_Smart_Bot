import { config } from 'dotenv'

// Load .env.test file
config({ path: '.env.test' })

// Mock global variables if needed
// eslint-disable-next-line no-restricted-globals
global.console = {
  ...console,
  // Uncomment to reduce console noise during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Set test environment
// eslint-disable-next-line node/prefer-global/process
process.env.NODE_ENV = 'test'

// Mock any other global variables your tests might need
// For example:
// global.fetch = mockFetch
