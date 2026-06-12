<template>
  <div class="flex flex-col h-150 max-w-4xl mx-auto border border-gray-200 bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="bg-linear-to-r border-b border-gray-100 p-4 flex items-center gap-3 bg-slate-900 text-white">
      <div class="w-3.5 h-3.5 bg-green-400 rounded-full animate-pulse"></div>
      <div>
        <h2 class="font-bold text-base">Trợ Lý Kỹ Thuật SPIT AI</h2>
        <p class="text-xs text-gray-400">Tư vấn dao cụ cắt gọt, đá mài chính xác theo thông số</p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref="chatWindow">
      <div class="flex gap-3 max-w-[80%]">
        <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">AI</div>
        <div class="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
          <p class="text-sm text-gray-700">
            Xin chào! Tôi là Trợ lý kỹ thuật của SPIT. Bạn cần tìm dòng dao cụ, đá mài đáp ứng vật liệu phôi hay độ cứng (HRC) nào? 
            <br><span class="text-xs text-gray-400 italic">(Ví dụ: "Tìm dao phay ngón gia công thép cứng 50 HRC")</span>
          </p>
        </div>
      </div>

      <div v-for="(msg, index) in chatHistory" :key="index" 
           :class="['flex gap-3 max-w-[80%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '']">
        
        <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', 
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white']">
          {{ msg.role === 'user' ? 'KH' : 'AI' }}
        </div>

        <div 
          :class="['p-3 rounded-lg shadow-sm text-sm chat-content', 
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none']"
          v-html="formatMessage(msg.content)"
        >
        </div>
      </div>

      <div v-if="loading" class="flex gap-3 max-w-[80%]">
        <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">AI</div>
        <div class="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1">
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>
    </div>

    <div class="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
      <input 
        v-model="userQuery" 
        @keyup.enter="handleSendMessage" 
        type="text" 
        placeholder="Nhập yêu cầu kỹ thuật tại đây..." 
        class="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors" 
        :disabled="loading" 
      />
      <button 
        @click="handleSendMessage" 
        class="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors" 
        :disabled="loading || !userQuery.trim()"
      >
        Gửi đi
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const userQuery = ref('')
const loading = ref(false)
const chatWindow = ref(null)

// Lưu trữ lịch sử cuộc trò chuyện
const chatHistory = ref([])

// Hàm tự động cuộn xuống dưới cùng khi có tin nhắn mới
const scrollToBottom = async () => {
  await nextTick()
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

// Hàm format văn bản Markdown (Chữ đậm **, dấu gạch đầu dòng *, và xuống dòng) sang HTML sạch
const formatMessage = (text) => {
  if (!text) return ''
  
  let formatted = text
    // Escaping HTML cơ bản để chống XSS an toàn
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // 1. Biến đổi cấu trúc chữ đậm **text** thành <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 2. Thay thế dấu gạch đầu dòng dạng "* " ở đầu hàng thành ký hiệu dấu chấm tròn "• " cho đẹp mắt
    .replace(/^\s*\*\s+/gm, '• ')
    // 3. Biến đổi các ký tự xuống dòng \n thành thẻ <br> chuẩn HTML
    .replace(/\n/g, '<br>')

  return formatted
}

// Hàm xử lý khi nhấn gửi tin nhắn
const handleSendMessage = async () => {
  if (!userQuery.value.trim() || loading.value) return

  const currentQuery = userQuery.value
  
  // Sao chép lại lịch sử chat hiện tại TRƯỚC KHI đẩy câu hỏi mới vào để gửi lên Server
  const historyPayload = [...chatHistory.value]

  // 1. Thêm tin nhắn của User vào màn hình hiển thị
  chatHistory.value.push({
    role: 'user',
    content: currentQuery
  })
  
  userQuery.value = '' // Clear ô nhập
  loading.value = true
  await scrollToBottom()

  try {
    // 2. Gọi API gửi kèm cả query hiện tại và history Payload để giữ ngữ cảnh chat
    const response = await fetch('https://askspitassistant-ovwdgatfvq-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: currentQuery,
        history: historyPayload
      })
    })

    if (!response.ok) {
      throw new Error('Mạng hoặc hệ thống Server gặp sự cố')
    }

    const data = await response.json()
    
    // 3. Đưa câu trả lời từ AI lên màn hình chat
    chatHistory.value.push({
      role: 'model',
      content: data.text
    })

  } catch (error) {
    console.error('Lỗi tư vấn hệ thống:', error)
    chatHistory.value.push({
      role: 'model',
      content: 'Hệ thống tư vấn SPIT đang bận xử lý thông số kỹ thuật. Bạn vui lòng thử lại sau giây lát!'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
/* CSS bổ sung để chữ đậm hiển thị rõ nét và không bị mất định dạng trong khung chat */
.chat-content :deep(strong) {
  font-weight: 700;
  color: #1e293b; /* Tông màu slate-800 giúp chữ đậm nhìn sang hơn */
}
</style>