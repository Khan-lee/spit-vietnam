<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

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
</script>

<template>
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <div class="flex justify-between items-end mb-12">
        <div>
          <h2 class="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            Tin tức & <span class="text-red-600">Kỹ thuật</span>
          </h2>
          <p class="text-slate-500 text-sm mt-2 font-medium">Giải pháp công nghiệp từ SPIT VIETNAM</p>
        </div>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="i in 3" :key="i" class="animate-pulse bg-slate-50 h-64 rounded-[2.5rem]"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <router-link 
          v-for="post in latestPosts" 
          :key="post.id" 
          :to="{ name: 'post-detail', params: { id: post.id } }"
          class="group block"
        >
          <div class="relative overflow-hidden rounded-[2.5rem] mb-6 aspect-video shadow-xl shadow-slate-200/50">
            <img :src="post.image || 'https://via.placeholder.com/800'" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
            <div class="absolute top-4 left-4">
              <span class="bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">{{ post.category }}</span>
            </div>
          </div>
          
          <h3 class="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-3 tracking-tight">
            {{ post.title }}
          </h3>
          <p class="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 italic">
            {{ post.content }}
          </p>
          <div class="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <span>{{ post.createdAt?.toDate().toLocaleDateString('vi-VN') }}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-red-600 group-hover:translate-x-2 transition-transform">Đọc thêm →</span>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>