import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.js'
import zhTW from './locales/zh-TW.js'
import en from './locales/en.js'
import pt from './locales/pt.js'

const STORAGE_KEY = 'photograph_lang'

function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && ['zh-CN', 'zh-TW', 'en', 'pt'].includes(saved)) return saved
  const browser = navigator.language || 'zh-CN'
  if (browser.startsWith('zh-TW') || browser.startsWith('zh-HK')) return 'zh-TW'
  if (browser.startsWith('zh')) return 'zh-CN'
  if (browser.startsWith('pt')) return 'pt'
  if (browser.startsWith('en')) return 'en'
  return 'zh-CN'
}

export const LOCALES = [
  { code: 'zh-CN', ...zhCN.lang },
  { code: 'zh-TW', ...zhTW.lang },
  { code: 'en',    ...en.lang },
  { code: 'pt',    ...pt.lang },
]

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'zh-TW': zhTW, en, pt },
})

export function setLocale(code) {
  i18n.global.locale.value = code
  localStorage.setItem(STORAGE_KEY, code)
  document.documentElement.lang = code
}
