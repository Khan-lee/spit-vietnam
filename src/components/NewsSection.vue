<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

const latestPosts = ref([])
const isLoading = ref(true)

const fetchLatestPosts = async () => {
  try {
    // Giữ limit(3) để trang chủ luôn cân đối với layout 3 cột
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
</script>

<template>
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <div class="flex justify-between items-end mb-12 border-b border-slate-100 pb-8">
        <div>
          <h2 class="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            Tin tức & <span class="text-red-600">Kỹ thuật</span>
          </h2>
          <p class="text-slate-500 text-sm mt-2 font-medium">Giải pháp công nghiệp từ SPIT VIETNAM</p>
        </div>
        
        <router-link 
          to="/tin-tuc" 
          class="group flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-200"
        >
          Xem tất cả bài viết
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
                {{ post.category }}
              </span>
            </div>
          </div>
          
          <h3 class="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-3 tracking-tight">
            {{ post.title }}
          </h3>
          
          <p class="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 italic font-light">
            {{ post.content }}
          </p>

          <div class="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 border-t border-slate-50 pt-4">
            <span>{{ post.createdAt?.toDate().toLocaleDateString('vi-VN') }}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-red-600 group-hover:translate-x-2 transition-transform duration-300">Đọc thêm →</span>
          </div>
        </router-link>
      </div>
      
      <div class="mt-12 md:hidden">
        <router-link to="/tin-tuc" class="block text-center bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold uppercase text-xs">
          Xem tất cả bài viết
        </router-link>
      </div>
    </div>
  </section>
</template>