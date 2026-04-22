import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client' 
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './style.css'

import vi from './locales/vi.json'
import en from './locales/en.json'

const app = createApp(App)
const head = createHead()

const i18n = createI18n({
  legacy: false,
  locale: 'vi',
  fallbackLocale: 'en',
  messages: {
    vi: vi,
    en: en
  }
})

app.use(head)
app.use(router)
app.use(i18n)
app.mount('#app')