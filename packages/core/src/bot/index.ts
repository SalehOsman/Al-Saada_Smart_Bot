import { Bot } from 'grammy'
import { Hono } from 'hono'
import { env } from '../config/env'
import logger from '../utils/logger'

// Create grammy bot instance using BOT_TOKEN from environment
export const bot = new Bot(env.BOT_TOKEN)

// Create Hono app instance for webhook server
export const app = new Hono()

// Setup webhook route to receive updates from Telegram
app.post('/webhook', async (c) => {
  try {
    // Get the update body from the request
    const update = await c.req.json()
    
    // Process the update with the bot
    await bot.handleUpdate(update)
    
    // Return success response
    return c.json({ ok: true })
  } catch (error) {
    logger.error('Error processing webhook:', error)
    return c.json({ ok: false, error: 'Webhook processing failed' }, 500)
  }
})
