import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client' 
import { createI18n } from 'vue-i18n' // Mới: Import thư viện đa ngôn ngữ
import App from './App.vue'
import router from './router'
import './style.css'

// Mới: Import các file bản dịch (Khang nhớ tạo file này trong src/locales/ nhé)
import vi from './locales/vi.json'
import en from './locales/en.json'

const app = createApp(App)
const head = createHead()

// Mới: Khởi tạo cấu hình i18n
const i18n = createI18n({
  legacy: false,      // Dùng cho Vue 3 Composition API
  locale: 'vi',       // Ngôn ngữ mặc định là Tiếng Việt
  fallbackLocale: 'en', // Phòng hờ nếu thiếu key bản dịch thì dùng Tiếng Anh
  messages: {
    vi: vi,
    en: en
  }
})

app.use(head)
app.use(router)
app.use(i18n) // Mới: Kích hoạt i18n cho toàn bộ ứng dụng
app.mount('#app')