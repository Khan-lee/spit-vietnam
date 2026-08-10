import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client' 
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './style.css'
import { createPinia } from 'pinia'

import vi from './locales/vi.json'
import en from './locales/en.json'

// 🛠️ ĐỒNG BỘ GIÁ TIỀN: Ghi đè mặc định toLocaleString toàn app về 'vi-VN' (Dấu chấm)
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales = 'vi-VN', options) {
  return originalToLocaleString.call(this, locales, options);
};

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
app.use(createPinia())
app.mount('#app')