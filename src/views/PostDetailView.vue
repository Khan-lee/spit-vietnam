<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n' // Thêm i18n để đồng bộ

const { t, locale } = useI18n()
const route = useRoute()
const post = ref(null)
const isLoading = ref(true)

// 1. Khởi tạo useHead ngay tại setup (luồng đồng bộ)
// Chúng ta dùng computed để tiêu đề tự cập nhật khi dữ liệu post được tải xong
useHead({
  title: computed(() => post.value 
    ? `${locale.value === 'vi' ? (post.value.title_vi || post.value.title) : (post.value.title_en || post.value.title_vi)} | SPIT VIETNAM`
    : 'Loading... | SPIT VIETNAM'
  ),
  meta: [
    { 
      name: 'description', 
      content: computed(() => post.value?.content ? post.value.content.substring(0, 160) : '') 
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: window.location.href }
  ]
})

const fetchPost = async () => {
  try {
    const docRef = doc(db, "posts", route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      post.value = docSnap.data()
      // KHÔNG gọi updateSEO ở đây nữa vì useHead đã lắng nghe qua computed
    } else {
      console.error("Không tìm thấy bài viết!")
    }
  } catch (e) {
    console.error("Lỗi Data:", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPost)
</script>

<template>
  <div v-if="post" class="bg-white min-h-screen">
    <header class="relative h-[60vh] bg-slate-900 overflow-hidden">
      <img 
        :src="post.image" 
        :alt="post.title" 
        class="w-full h-full object-cover opacity-40 transition-transform duration-700 hover:scale-105" 
      />
      <div class="absolute inset-0 flex items-center justify-center text-center p-6">
        <div class="max-w-4xl">
          <span class="bg-red-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full tracking-widest shadow-xl">
            {{ locale === 'vi' ? (post.category_vi || post.category) : (post.category_en || post.category) }}
          </span>
          <h1 class="text-3xl md:text-6xl font-black text-white uppercase italic mt-8 mb-6 leading-tight tracking-tighter">
            {{ locale === 'vi' ? (post.title_vi || post.title) : (post.title_en || post.title_vi) }}
          </h1>
          <p class="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
            {{ locale === 'vi' ? 'Cập nhật' : 'Updated' }}: {{ post.createdAt?.toDate().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') }}
          </p>
        </div>
      </div>
    </header>

    <article class="max-w-3xl mx-auto py-20 px-6">
      <div class="text-slate-700 leading-[2.2] text-lg whitespace-pre-line font-medium 
                  first-letter:text-6xl first-letter:font-black first-letter:text-red-600 
                  first-letter:mr-3 first-letter:float-left first-letter:leading-none">
        {{ locale === 'vi' ? (post.content_vi || post.content) : (post.content_en || post.content_vi) }}
      </div>
      
      <footer class="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center">
        <router-link to="/" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-all flex items-center gap-2">
          ← {{ locale === 'vi' ? 'Quay lại trang chủ' : 'Back to Home' }}
        </router-link>
        
        <div class="flex gap-4">
           <button class="text-slate-400 hover:text-blue-600 transition-colors" title="Chia sẻ Facebook">
             <i class="fab fa-facebook-f"></i>
           </button>
        </div>
      </footer>
    </article>
  </div>

  <div v-else-if="isLoading" class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
</template>

<style scoped>
article {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>