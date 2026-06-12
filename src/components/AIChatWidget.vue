<template>
  <div class="font-sans">
    <transition name="widget-slide">
      <div 
        v-if="isOpen" 
        class="fixed bottom-0 right-0 w-full h-full sm:bottom-7.5 sm:right-6 md:right-7.5 z-999999 sm:w-95 sm:h-145 bg-white sm:rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
      >
        <div class="bg-linear-to-r from-orange-600 to-red-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg shadow-inner animate-pulse">🤖</div>
            <div>
              <h3 class="text-xs sm:text-sm font-bold tracking-wide">Trợ lý Kỹ thuật SPIT AI</h3>
              <p class="text-[10px] text-orange-200 flex items-center mt-0.5">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full inline-block mr-1.5 animate-pulse"></span>
                Trực tuyến • Phản hồi tức thì
              </p>
            </div>
          </div>
          <button @click="isOpen = false" class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          ref="chatContainer"
          class="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4 text-xs scrollbar-custom select-text"
        >
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            class="flex items-start space-x-2.5"
            :class="{ 'justify-end space-x-reverse': msg.role === 'user' }"
          >
            <div 
              class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm select-none"
              :class="msg.role === 'user' ? 'bg-slate-600 text-white' : 'bg-linear-to-br from-orange-500 to-red-600 text-white'"
            >
              {{ msg.role === 'user' ? 'KH' : 'AI' }}
            </div>
            
            <div 
              class="prose-chat p-3 rounded-2xl shadow-sm text-slate-800 border max-w-[85%] leading-relaxed wrap-break-word overflow-x-auto"
              :class="msg.role === 'user' ? 'bg-orange-500 text-white border-transparent rounded-tr-none' : 'bg-white border-slate-100 rounded-tl-none'"
              v-html="renderMarkdown(msg.content)"
            >
            </div>
          </div>

          <div v-if="isLoading" class="flex items-start space-x-2.5">
            <div class="w-7 h-7 bg-linear-to-br from-orange-500 to-red-600 text-white rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm select-none">AI</div>
            <div class="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm text-slate-400 border border-slate-100 flex items-center space-x-1">
              <span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>

        <div class="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0 pb-safe">
          <input 
            v-model="inputMessage"
            @keyup.enter="handleSend"
            type="text" 
            :disabled="isLoading"
            placeholder="Nhập yêu cầu kỹ thuật tại đây..." 
            class="flex-1 bg-slate-100 text-slate-800 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 border border-transparent focus:bg-white transition-all disabled:opacity-50"
          />
          <button 
            @click="handleSend"
            :disabled="isLoading"
            class="bg-orange-500 text-white p-2.5 rounded-xl hover:bg-orange-600 transition-colors cursor-pointer disabled:bg-slate-400 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9-7-9-7v14z" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade-button">
      <div 
        v-if="!isOpen" 
        class="fixed bottom-7.5 right-6 z-9999 flex flex-col space-y-3.5 items-end select-none"
      >
        <div class="flex items-center relative group">
          <div class="absolute right-15.5 bg-linear-to-r from-orange-600 to-red-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            Hỏi đáp kỹ thuật SPIT AI 🤖
          </div>
          <button 
            @click="toggleWidget"
            class="w-13 h-13 bg-linear-to-br from-orange-500 to-red-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 relative cursor-pointer"
          >
            <span class="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-35 animate-ping group-hover:hidden"></span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        </div>

        <div class="flex items-center relative group">
          <div class="absolute right-15.5 bg-blue-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            Chat Kỹ thuật qua Zalo 💬
          </div>
          <a 
            href="https://zalo.me/1985045628865812060" 
            target="_blank"
            class="w-13 h-13 bg-[#0068ff] rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group/zalo cursor-pointer"
          >
            <svg class="w-7 h-7 text-white fill-current transition-transform duration-300 group-hover/zalo:rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.27 10.3c0-4.63 4.38-8.4 9.73-8.4s9.73 3.77 9.73 8.4c0 4.63-4.38 8.4-9.73 8.4a11.23 11.23 0 0 1-2.43-.27c-.45.38-1.57 1.22-2.33 1.77-.32.23-.62.08-.55-.32l.27-1.63c-3-.93-4.72-3.41-4.72-6.35zM12 15a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4z"/>
            </svg>
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)
const sessionId = ref('')

// Cấu hình marked để xuống dòng chuẩn xác
marked.setOptions({
  breaks: true,
  gfm: true
})

const messages = ref([
  {
    role: 'model',
    content: 'Xin chào! Tôi là Trợ lý kỹ thuật của SPIT. Bạn cần tìm dòng dao cụ, đá mài đáp ứng vật liệu phôi hay độ cứng (HRC) nào?'
  }
])

// Hàm đồng bộ và lưu lại vào localStorage
const saveChatToLocal = () => {
  localStorage.setItem('spit_chat_messages', JSON.stringify(messages.value))
}

// Hàm khởi tạo SessionId và khôi phục Lịch sử Chat khi mount component
onMounted(() => {
  // 1. Quản lý Định danh khách hàng (Session ID)
  let localSessionId = localStorage.getItem('spit_chat_session_id')
  if (!localSessionId) {
    localSessionId = 'spit_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('spit_chat_session_id', localSessionId)
  }
  sessionId.value = localSessionId

  // 2. Khôi phục chuỗi hội thoại cũ
  const savedMessages = localStorage.getItem('spit_chat_messages')
  if (savedMessages) {
    try {
      messages.value = JSON.parse(savedMessages)
    } catch (e) {
      console.error('❌ Lỗi khôi phục lịch sử hội thoại từ LocalStorage:', e)
    }
  }
})

// Hàm tự động cuộn xuống đáy
const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const toggleWidget = () => {
  isOpen.value = true
  scrollToBottom()
}

const renderMarkdown = (text) => {
  if (!text) return ''
  const rawHtml = marked.parse(text)
  return DOMPurify.sanitize(rawHtml)
}

const handleSend = async () => {
  const currentQuery = inputMessage.value.trim()
  if (!currentQuery || isLoading.value) return

  messages.value.push({
    role: 'user',
    content: currentQuery
  })
  
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()
  saveChatToLocal() // Lưu ngay sau khi user nhập tin nhắn mới

  try {
    const formattedHistory = messages.value.slice(1, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }))

    const apiEndpoint = import.meta.env.VITE_API_URL || 'https://us-central1-spit-vietnam.cloudfunctions.net/askSPITAssistant/' 
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: currentQuery,
        history: formattedHistory,
        sessionId: sessionId.value // Truyền sessionId lên để lưu vào DB Firestore
      })
    });

    if (!response.ok) throw new Error('Không thể kết nối máy chủ.')

    const data = await response.json()

    messages.value.push({
      role: 'model',
      content: data.text || 'Không có phản hồi từ Trợ lý.'
    })

  } catch (error) {
    console.error('❌ Lỗi kết nối Frontend:', error)
    messages.value.push({
      role: 'model',
      content: '⚠️ Có lỗi kết nối hệ thống xảy ra. Vui lòng kiểm tra lại đường truyền hoặc liên hệ kỹ thuật viên SPIT.'
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
    saveChatToLocal() // Lưu lại sau khi nhận phản hồi từ AI (hoặc tin báo lỗi)
  }
}
</script>

<style scoped>
/* Giữ nguyên phần CSS ban đầu của bạn */
.widget-slide-enter-active, .widget-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.widget-slide-enter-from, .widget-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.96);
}
@media (max-width: 639px) {
  .widget-slide-enter-from, .widget-slide-leave-to {
    transform: translateY(100%);
  }
}

.fade-button-enter-active, .fade-button-leave-active {
  transition: all 0.25s ease-in-out;
}
.fade-button-enter-from, .fade-button-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.scrollbar-custom::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-custom::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.pb-safe {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
}

.prose-chat :deep(p) {
  margin-bottom: 0.5rem;
}
.prose-chat :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-chat :deep(strong) {
  font-weight: 700;
  color: inherit;
}
.prose-chat :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.prose-chat :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.prose-chat :deep(li) {
  margin-bottom: 0.25rem;
}

.prose-chat :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  overflow: hidden;
}
.prose-chat :deep(th), .prose-chat :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 6px 8px;
  text-align: left;
}
.prose-chat :deep(th) {
  background-color: #f1f5f9;
  font-weight: 600;
  color: #1e293b;
}
.bg-orange-500 .prose-chat :deep(th) {
  background-color: rgba(0, 0, 0, 0.1);
  color: #fff;
}
.bg-orange-500 .prose-chat :deep(table), 
.bg-orange-500 .prose-chat :deep(th), 
.bg-orange-500 .prose-chat :deep(td) {
  border-color: rgba(255, 255, 255, 0.2);
}
</style>