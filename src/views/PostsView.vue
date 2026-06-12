<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useI18n } from 'vue-i18n' 

const { t, locale } = useI18n() 
const allPosts = ref([])
const isLoading = ref(true)
const selectedCategory = ref('all') // State lưu danh mục bài viết đang lọc
const searchQuery = ref('') // State lưu từ khóa tìm kiếm của người dùng

const fetchAllPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    allPosts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error("Lỗi đồng bộ danh sách bài viết:", e)
  } finally {
    isLoading.value = false
  }
}

// Hàm khử sạch tag HTML thô (<p>, <strong>,...) và giải mã ký tự đặc biệt
const stripHtml = (htmlString) => {
  if (!htmlString) return ''
  const parser = new DOMParser()
  const decodedDoc = parser.parseFromString(htmlString, 'text/html')
  const decodedString = decodedDoc.body.textContent || ''
  return decodedString.replace(/<\/?[^>]+(>|$)/g, '').trim()
}

// Danh mục bộ lọc bài viết linh hoạt theo ngôn ngữ hiện tại
const categories = computed(() => {
  return [
    { id: 'all', name: locale.value === 'vi' ? 'Tất cả bài viết' : 'All Articles' },
    { id: 'technical', name: locale.value === 'vi' ? 'Kiến thức kỹ thuật' : 'Technical Knowledge' },
    { id: 'news', name: locale.value === 'vi' ? 'Tin tức & Sự kiện' : 'News & Events' }
  ]
})

// Khối logic nâng cao: Kết hợp bộ lọc danh mục và từ khóa tìm kiếm đa ngôn ngữ
const filteredPosts = computed(() => {
  let posts = allPosts.value

  // 1. Lọc theo danh mục trước
  if (selectedCategory.value !== 'all') {
    posts = posts.filter(post => post.category === selectedCategory.value)
  }

  // 2. Tiếp tục lọc theo từ khóa tìm kiếm nếu có
  const queryStr = searchQuery.value.trim().toLowerCase()
  if (!queryStr) return posts

  return posts.filter(post => {
    // Xác định đúng trường dữ liệu dựa theo ngôn ngữ đang chọn
    const title = locale.value === 'vi' 
      ? (post.title_vi || post.title || '') 
      : (post.title_en || post.title_vi || post.title || '')
      
    const content = locale.value === 'vi'
      ? (post.content_vi || post.content || '')
      : (post.content_en || post.content_vi || post.content || '')

    // Khử HTML của nội dung trước khi so sánh chuỗi để tìm kiếm chính xác hơn
    const cleanContent = stripHtml(content)

    return title.toLowerCase().includes(queryStr) || cleanContent.toLowerCase().includes(queryStr)
  })
})

onMounted(fetchAllPosts)
</script>

<template>
  <div class="bg-[#f8fafc] min-h-screen pt-36 pb-20">
    <div class="container mx-auto px-6 max-w-7xl">
      
      <header class="mb-12 border-b border-slate-200/60 pb-8">
        <h1 class="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-slate-900">
          {{ t('news.all_posts_title') }} 
          <span class="text-slate-500 block md:inline md:ml-2">{{ t('news.all_posts_subtitle') }}</span>
        </h1>
        <p class="text-slate-500 text-sm mt-3 max-w-2xl leading-relaxed">
          {{ locale === 'vi' ? 'Cập nhật các giải pháp gia công chính xác, hướng dẫn tối ưu thông số cắt gọt và tin tức mới nhất từ hệ sinh thái SPIT.' : 'Update high-precision machining solutions, cutting parameters optimization guidelines and the latest news from SPIT.' }}
        </p>
      </header>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div class="flex flex-wrap gap-2 order-2 md:order-1">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            @click="selectedCategory = cat.id"
            :class="[
              'px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border',
              selectedCategory === cat.id 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
            ]"
          >
            {{ cat.name }}
          </button>
        </div>

        <div class="relative w-full md:max-w-xs lg:max-w-md order-1 md:order-2">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input 
            v-model="searchQuery"
            type="text"
            :placeholder="locale === 'vi' ? 'Tìm kiếm bài viết...' : 'Search articles...'"
            class="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all duration-300 shadow-xs placeholder-slate-400 text-slate-800"
          />
          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="animate-pulse bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div class="bg-slate-100 h-48 rounded-xl mb-4"></div>
          <div class="h-5 bg-slate-100 rounded-md w-3/4 mb-3"></div>
          <div class="h-4 bg-slate-100 rounded-md w-full mb-2"></div>
          <div class="h-4 bg-slate-100 rounded-md w-1/2"></div>
        </div>
      </div>

      <div v-else>
        <div v-if="filteredPosts.length === 0" class="text-center bg-white border border-slate-200/60 rounded-3xl py-24 shadow-xs">
          <p class="text-slate-400 font-bold uppercase tracking-wider text-xs">
            {{ searchQuery ? (locale === 'vi' ? 'Không tìm thấy bài viết phù hợp với từ khóa' : 'No articles match your keyword') : (locale === 'vi' ? 'Chưa có bài viết nào thuộc chủ đề này' : 'No articles available in this category') }}
          </p>
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="mt-4 text-xs font-bold uppercase tracking-wider text-slate-900 underline hover:text-slate-600 transition-colors"
          >
            {{ locale === 'vi' ? 'Xóa tìm kiếm' : 'Clear Search' }}
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <router-link 
            v-for="post in filteredPosts" 
            :key="post.id" 
            :to="{ name: 'post-detail', params: { id: post.id } }"
            class="group bg-white border border-slate-100 rounded-3xl p-5 flex flex-col hover:shadow-xl hover:border-slate-200/80 transition-all duration-300"
          >
            <div class="relative overflow-hidden rounded-2xl mb-5 aspect-video bg-slate-50 border border-slate-100">
              <img :src="post.image || 'https://via.placeholder.com/800'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" :alt="post.title">
              
              <div class="absolute top-4 left-4">
                <span class="bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase px-3 py-1 rounded-md tracking-wider shadow-sm">
                  {{ t('news.tag') }}
                </span>
              </div>
            </div>

            <h3 class="text-base md:text-lg font-bold text-slate-800 group-hover:text-slate-950 transition-colors line-clamp-2 mb-2 tracking-tight">
              {{ locale === 'vi' ? (post.title_vi || post.title) : (post.title_en || post.title_vi) }}
            </h3>
            
            <p class="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed mb-5 font-normal">
              {{ stripHtml(locale === 'vi' ? (post.content_vi || post.content) : (post.content_en || post.content_vi)) }}
            </p>

            <div class="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{{ post.createdAt?.toDate().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
              <span class="text-slate-800 font-extrabold group-hover:translate-x-1 transition-transform duration-300">
                {{ t('news.readMore') }} →
              </span>
            </div>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>