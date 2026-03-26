import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // Thêm dòng này

const app = createApp(App)
app.use(router) // Kích hoạt điều hướng
app.mount('#app')