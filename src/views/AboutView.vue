<template>
  <div class="min-h-screen bg-white">
    <div class="relative py-20 bg-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute inset-0" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 30px 30px;"></div>
      </div>
      
      <div class="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic">
          {{ aboutData.title || 'VỀ CHÚNG TÔI' }}
        </h1>
        <div class="h-2 w-24 bg-red-600 mx-auto rounded-full"></div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-16">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="space-y-12">
        <div v-if="aboutData.imageUrl" class="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-50">
          <img :src="aboutData.imageUrl" alt="About SPIT" class="w-full object-cover max-h-125" />
        </div>

        <div class="prose prose-slate max-w-none">
          <div 
            class="text-slate-600 leading-relaxed text-lg whitespace-pre-line font-medium"
            v-html="aboutData.content"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const aboutData = ref({
  title: '',
  content: '',
  imageUrl: ''
})
const loading = ref(true)
let unsubscribe = null

onMounted(() => {
  // CẬP NHẬT: Đã đổi từ 'pages/about' sang 'settings/about' để khớp với Admin
  const docRef = doc(db, 'settings', 'about')
  
  // CẬP NHẬT: Dùng onSnapshot để dữ liệu tự nhảy khi bạn nhấn "Lưu" bên Admin
  unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      aboutData.value = docSnap.data()
    } else {
      // Dữ liệu mặc định nếu Database chưa có gì
      aboutData.value = {
        title: 'Sài Gòn Precision Industrial Tool',
        content: 'Chào mừng bạn đến với SPIT. Chúng tôi cung cấp các giải pháp công cụ công nghiệp chính xác...',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070'
      }
    }
    loading.value = false
  }, (error) => {
    console.error("Lỗi khi lắng nghe dữ liệu:", error)
    loading.value = false
  })
})

// Ngắt kết nối khi rời khỏi trang để tiết kiệm tài nguyên
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
:deep(p) {
  margin-bottom: 1.5rem;
}
</style>