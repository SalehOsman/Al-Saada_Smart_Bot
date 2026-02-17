import { z } from 'zod'

const envSchema = z.object({
  // Bot configuration
  BOT_TOKEN: z.string({
    required_error: 'BOT_TOKEN is required',
  }),
  WEBHOOK_URL: z.string().url().optional(),

  // Database configuration
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }),

  // Redis configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Server configuration
  PORT: z.coerce.number().default(3000),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

// Validate environment variables
const env = envSchema.parse(process.env)

// Export schema type for use in other files
export type EnvSchema = z.infer<typeof envSchema>

// Export validated environment object
export { env }