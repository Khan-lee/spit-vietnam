<template>
  <div class="min-h-[60vh] bg-slate-50 py-12 px-6 md:px-12">
    <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
      
      <!-- Đang tải -->
      <div v-if="loading" class="py-12 text-center text-slate-400 font-medium">
        Đang tải nội dung bài viết...
      </div>

      <!-- Bài viết tồn tại -->
      <div v-else-if="policy">
        <h1 class="text-2xl md:text-3xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">
          {{ policy.title }}
        </h1>

        <!-- Hình ảnh đại diện bài viết (nếu có) -->
        <div v-if="policy.image" class="mb-8 rounded-xl overflow-hidden max-h-96">
          <img :src="policy.image" :alt="policy.title" class="w-full h-full object-cover" />
        </div>

        <!-- Nội dung chi tiết bài viết -->
        <div class="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
          {{ policy.content }}
        </div>
      </div>

      <!-- Không tìm thấy bài viết -->
      <div v-else class="py-12 text-center space-y-4">
        <p class="text-slate-500 font-medium">Rất tiếc, bài viết này không tồn tại hoặc đã bị ẩn.</p>
        <RouterLink to="/" class="inline-block px-6 py-2.5 bg-primary text-black font-bold text-xs uppercase rounded-xl">
          Trở về trang chủ
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase' // Kiểm tra đúng đường dẫn tới firebase.js
import { collection, query, where, getDocs } from 'firebase/firestore'

const route = useRoute()
const policy = ref(null)
const loading = ref(true)

const fetchPolicy = async () => {
  loading.value = true
  policy.value = null
  const slug = route.params.slug

  try {
    const q = query(collection(db, 'policies'), where('slug', '==', slug))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      const data = docSnap.data()
      // Chỉ hiển thị nếu bài viết đang bật (is_active !== false)
      if (data.is_active !== false) {
        policy.value = { id: docSnap.id, ...data }
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải chi tiết bài viết:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPolicy()
})

// Tải lại bài viết nếu người dùng bấm chuyển sang bài viết khác trực tiếp ở Footer
watch(() => route.params.slug, () => {
  fetchPolicy()
})
</script>