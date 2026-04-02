<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'

const allPosts = ref([])
const isLoading = ref(true)

const fetchAllPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    allPosts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error("Lỗi:", e)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchAllPosts)
</script>

<template>
  <div class="pt-32 pb-20 container mx-auto px-6">
    <h1 class="text-4xl font-black mb-12 uppercase italic">Tất cả <span class="text-red-600">Bài viết</span></h1>
    
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div v-for="i in 6" :key="i" class="animate-pulse bg-slate-100 h-80 rounded-[2.5rem]"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <router-link 
        v-for="post in allPosts" 
        :key="post.id" 
        :to="{ name: 'post-detail', params: { id: post.id } }"
        class="group"
      >
        <div class="relative overflow-hidden rounded-[2.5rem] mb-6 aspect-video shadow-lg">
          <img :src="post.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
        </div>
        <h3 class="text-xl font-bold mb-2 group-hover:text-red-600">{{ post.title }}</h3>
        <p class="text-slate-500 line-clamp-2 italic text-sm">{{ post.content }}</p>
      </router-link>
    </div>
  </div>
</template>