import { Hono } from 'hono'
import logger from '../utils/logger'
import { redis } from '../cache/redis'
import { prisma } from '../database/prisma'

// Create health check router
export const healthRouter = new Hono()

// Health check endpoint
healthRouter.get('/health', async (c) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {} as Record<string, boolean>,
  }
  
  // Check Redis connection
  try {
    await redis.ping()
    healthStatus.services.redis = true
  } catch (error) {
    logger.error('Redis health check failed:', error)
    healthStatus.services.redis = false
  }
  
  // Check Prisma/Database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    healthStatus.services.db = true
  } catch (error) {
    logger.error('Database health check failed:', error)
    healthStatus.services.db = false
  }
  
  // Set overall status based on service health
  const allServicesHealthy = Object.values(healthStatus.services).every(Boolean)
  
  // Return appropriate HTTP status
  return c.json(healthStatus, allServicesHealthy ? 200 : 503)
})

