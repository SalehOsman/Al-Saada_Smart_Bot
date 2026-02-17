import { I18n, Context } from 'grammy'
import { redis } from '../../cache/redis'
import logger from '../../utils/logger'

// Create locale files path
const localesPath = 'packages/core/src/locales'

// Function to get user language from session
async function getUserLanguage(ctx: Context): Promise<string> {
  try {
    // Get session data
    const sessionKey = `session:${ctx.from?.id}`
    const sessionData = await redis.get(sessionKey)
    
    // Return language from session or default to Arabic
    return sessionData?.language || 'ar'
  } catch (error) {
    logger.error('Error getting user language from session:', error)
    return 'ar' // Default to Arabic on error
  }
}

// Create i18n instance
export const i18n = new I18n(localesPath, {
  defaultLanguage: 'ar',
  defaultLanguageOnMissing: true,
})

// Middleware to set locale based on user session
export const i18nMiddleware = async (ctx: Context, next: Function) => {
  // Get user language from session
  const language = await getUserLanguage(ctx)
  
  // Set locale for this context
  ctx.i18n = i18n.createContext(language)
  
  // Continue to next middleware
  return next()
}