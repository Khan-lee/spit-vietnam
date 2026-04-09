<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { useI18n } from 'vue-i18n' // Import thư viện i18n

const { t, locale } = useI18n() // Sử dụng hàm t và biến locale từ i18n

const latestPosts = ref([])
const isLoading = ref(true)

const fetchLatestPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3))
    const querySnapshot = await getDocs(q)
    latestPosts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error("Lỗi tin tức:", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLatestPosts)

// Gỡ bỏ phần window listener cũ vì vue-i18n sẽ tự động reactive khi locale thay đổi
</script>

<template>
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <div class="flex justify-between items-end mb-12 border-b border-slate-100 pb-8">
        <div>
          <h2 class="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            {{ t('news.title') }} <span class="text-red-600">{{ t('news.subTitle') }}</span>
          </h2>
          <p class="text-slate-500 text-sm mt-2 font-medium">{{ t('news.desc') }}</p>
        </div>
        
        <router-link 
          to="/tin-tuc" 
          class="group hidden md:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-200"
        >
          {{ t('news.viewAll') }}
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        </router-link>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="bg-slate-100 h-64 rounded-[2.5rem] mb-6"></div>
          <div class="h-6 bg-slate-100 rounded-full w-3/4 mb-4"></div>
          <div class="h-4 bg-slate-100 rounded-full w-full"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <router-link 
          v-for="post in latestPosts" 
          :key="post.id" 
          :to="{ name: 'post-detail', params: { id: post.id } }"
          class="group block"
        >
          <div class="relative overflow-hidden rounded-[2.5rem] mb-6 aspect-video shadow-xl shadow-slate-200/50">
            <img 
              :src="post.image || 'https://via.placeholder.com/800'" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="SPIT Post"
            >
            <div class="absolute top-4 left-4">
              <span class="bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">
                {{ t('news.tag') }}
              </span>
            </div>
          </div>
          
          <h3 class="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-3 tracking-tight">
            {{ locale === 'vi' ? (post.title_vi || post.title) : (post.title_en || post.title_vi) }}
          </h3>
          
          <p class="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 italic font-light">
            {{ locale === 'vi' ? (post.content_vi || post.content) : (post.content_en || post.content_vi) }}
          </p>

          <div class="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 border-t border-slate-50 pt-4">
            <span>{{ post.createdAt?.toDate().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') }}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-red-600 group-hover:translate-x-2 transition-transform duration-300">
              {{ t('news.readMore') }} →
            </span>
          </div>
        </router-link>
      </div>
      
      <div class="mt-12 md:hidden">
        <router-link to="/tin-tuc" class="block text-center bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold uppercase text-xs">
          {{ t('news.viewAll') }}
        </router-link>
      </div>
    </div>
  </section>
</template>