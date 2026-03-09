import process from 'node:process'
import { z } from 'zod'

const envSchema = z.object({
  // Bot configuration
  BOT_TOKEN: z.string().min(1, {
    message: 'BOT_TOKEN is required',
  }),
  WEBHOOK_URL: z.string().url().optional(),

  // Database configuration
  DATABASE_URL: z.string().min(1, {
    message: 'DATABASE_URL is required',
  }),

  // Redis configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Server configuration
  PORT: z.coerce.number().default(3000),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Super Admin Configuration
  INITIAL_SUPER_ADMIN_ID: z.coerce.number().int().positive().optional(),

  // Sentry Configuration
  SENTRY_DSN: z.string().url().optional(),

  // Backup Configuration
  BACKUP_ENABLED: z.coerce.boolean().default(false),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  BACKUP_DIR: z.string().default('./backups'),
  BACKUP_ENCRYPTION_KEY: z.string().optional(),

  // Rate Limiting Configuration
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().default(30),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(1),
})

// Validate environment variables
const env = envSchema.parse(process.env)

// Export schema type for use in other files
export type EnvSchema = z.infer<typeof envSchema>

// Export validated environment object
export { env }
