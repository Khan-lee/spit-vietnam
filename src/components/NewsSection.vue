<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const latestPosts = ref([])
const isLoading = ref(true)

const fetchLatestPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3))
    const querySnapshot = await getDocs(q)
    latestPosts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error("Lỗi tải danh sách tin tức:", e)
  } finally {
    isLoading.value = false
  }
}

// --- [MỚI] HÀM KHỬ SẠCH TAG HTML VÀ GIẢI MÃ KÝ TỰ ĐẶC BIỆT ---
const stripHtml = (htmlString) => {
  if (!htmlString) return ''
  
  // Giải mã các thực thể HTML mã hóa (ví dụ: &igrave; -> ì, &nbsp; -> khoảng trắng)
  const parser = new DOMParser()
  const decodedDoc = parser.parseFromString(htmlString, 'text/html')
  const decodedString = decodedDoc.body.textContent || ''
  
  // Loại bỏ hoàn toàn các thẻ HTML còn lại
  return decodedString.replace(/<\/?[^>]+(>|$)/g, '').trim()
}

onMounted(fetchLatestPosts)
</script>

<template>
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6 max-w-7xl">
      
      <div class="flex justify-between items-end mb-12 border-b border-slate-100 pb-8">
        <div>
          <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tight">
            {{ t('news.title') }} <span class="text-slate-500">{{ t('news.subTitle') }}</span>
          </h2>
          <p class="text-slate-500 text-sm mt-2 font-medium">{{ t('news.desc') }}</p>
        </div>
        
        <router-link 
          to="/tin-tuc" 
          class="group hidden md:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all duration-300 shadow-sm"
        >
          {{ t('news.viewAll') }}
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        </router-link>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="bg-slate-100 h-48 rounded-2xl mb-6"></div>
          <div class="h-5 bg-slate-100 rounded-lg w-3/4 mb-3"></div>
          <div class="h-4 bg-slate-100 rounded-lg w-full mb-2"></div>
          <div class="h-4 bg-slate-100 rounded-lg w-2/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <router-link 
          v-for="post in latestPosts" 
          :key="post.id" 
          :to="{ name: 'post-detail', params: { id: post.id } }"
          class="group block"
        >
          <div class="relative overflow-hidden rounded-2xl mb-5 aspect-video bg-slate-50 border border-slate-100">
            <img 
              :src="post.image || 'https://via.placeholder.com/800'" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="SPIT Technical Post"
            >
            <div class="absolute top-4 left-4">
              <span class="bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase px-3 py-1 rounded-md tracking-wider">
                {{ t('news.tag') }}
              </span>
            </div>
          </div>
          
          <h3 class="text-base md:text-lg font-bold text-slate-800 group-hover:text-slate-950 transition-colors line-clamp-2 mb-2 tracking-tight">
            {{ locale === 'vi' ? (post.title_vi || post.title) : (post.title_en || post.title_vi) }}
          </h3>
          
          <p class="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed mb-4 font-normal">
            {{ stripHtml(locale === 'vi' ? (post.content_vi || post.content) : (post.content_en || post.content_vi)) }}
          </p>

          <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 border-t border-slate-50 pt-3">
            <span>{{ post.createdAt?.toDate().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-slate-800 font-extrabold group-hover:translate-x-1 transition-transform duration-300">
              {{ t('news.readMore') }} →
            </span>
          </div>
        </router-link>
      </div>
      
      <div class="mt-8 md:hidden">
        <router-link to="/tin-tuc" class="block text-center bg-slate-100 text-slate-800 py-3.5 rounded-xl font-bold uppercase text-xs">
          {{ t('news.viewAll') }}
        </router-link>
      </div>
    </div>
  </section>
</template>