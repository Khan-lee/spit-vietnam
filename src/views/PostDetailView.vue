<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useHead } from '@unhead/vue'

const route = useRoute()
const post = ref(null)
const isLoading = ref(true)

// Hàm quản lý SEO chuyên sâu
const updateSEO = (data) => {
  const description = data.content ? data.content.substring(0, 160).replace(/\n/g, ' ') : ''
  
  useHead({
    title: `${data.title} | SPIT VIETNAM`,
    meta: [
      { name: 'description', content: description },
      // Open Graph / Facebook / Zalo
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: data.image },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: window.location.href },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: data.image }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  })
}

const fetchPost = async () => {
  try {
    // Truy vấn bằng slug/id từ URL
    const docRef = doc(db, "posts", route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      post.value = docSnap.data()
      updateSEO(post.value) // Kích hoạt SEO ngay khi có dữ liệu
    } else {
      console.error("Không tìm thấy bài viết!")
    }
  } catch (e) {
    console.error("Lỗi SEO/Data:", e)
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
            {{ post.category }}
          </span>
          <h1 class="text-3xl md:text-6xl font-black text-white uppercase italic mt-8 mb-6 leading-tight tracking-tighter">
            {{ post.title }}
          </h1>
          <p class="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
            Cập nhật: {{ post.createdAt?.toDate().toLocaleDateString('vi-VN') }}
          </p>
        </div>
      </div>
    </header>

    <article class="max-w-3xl mx-auto py-20 px-6">
      <div class="text-slate-700 leading-[2.2] text-lg whitespace-pre-line font-medium 
                  first-letter:text-6xl first-letter:font-black first-letter:text-red-600 
                  first-letter:mr-3 first-letter:float-left first-letter:leading-none">
        {{ post.content }}
      </div>
      
      <footer class="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center">
        <router-link to="/" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-all flex items-center gap-2">
          ← Quay lại trang chủ
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
/* Khang có thể thêm các hiệu ứng mượt mà cho bài viết tại đây */
article {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>