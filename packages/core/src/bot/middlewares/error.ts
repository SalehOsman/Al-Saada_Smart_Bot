import { Bot, BotError } from 'grammy'
import { Context } from 'grammy'
import logger from '../../utils/logger'

// Arabic error messages
const errorMessages = {
  'default': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  'not_found': 'العنصر المطلوب غير موجود.',
  'permission_denied': 'ليس لديك صلاحية للقيام بهذا الإجراء.',
  'validation_error': 'البيانات المدخلة غير صحيحة.',
  'server_error': 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
  'network_error': 'حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.',
}

// Function to get appropriate error message
function getErrorMessage(error: any): string {
  // Check for specific error types
  if (error instanceof BotError) {
    switch (error.code) {
      case 404:
        return errorMessages.not_found
      case 403:
        return errorMessages.permission_denied
      case 400:
        return errorMessages.validation_error
      default:
        return errorMessages.default
    }
  }
  
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return errorMessages.network_error
  }
  
  // Default message
  return errorMessages.default
}

// Error handling middleware
export const errorHandler = async (error: any, ctx: Context) => {
  // Log the error with full details
  logger.error('Bot error occurred:', {
    error: error,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    message: ctx.message?.text,
  })
  
  // Send user-friendly Arabic message
  const errorMessage = getErrorMessage(error)
  await ctx.reply(errorMessage)
  
  // Don't rethrow the error as we've handled it
  return
}