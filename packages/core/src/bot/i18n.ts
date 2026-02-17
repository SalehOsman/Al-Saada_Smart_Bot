import { I18n } from '@grammyjs/i18n'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create i18n instance with Fluent locale files
export const i18n = new I18n({
  defaultLocale: 'ar',
  directory: path.resolve(__dirname, '../locales'),
  useSession: true,
})
