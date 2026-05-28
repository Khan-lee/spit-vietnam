<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()
const post = ref(null)
const isLoading = ref(true)

// --- LẤY DỮ LIỆU ĐA NGÔN NGỮ ĐỒNG BỘ ---
const currentTitle = computed(() => {
  if (!post.value) return ''
  return locale.value === 'vi' ? (post.value.title_vi || post.value.title) : (post.value.title_en || post.value.title)
})

const currentContent = computed(() => {
  if (!post.value) return ''
  return locale.value === 'vi' ? (post.value.content_vi || post.value.content) : (post.value.content_en || post.value.content)
})

const currentCategory = computed(() => {
  if (!post.value) return 'Tin tức'
  return locale.value === 'vi' ? (post.value.category_vi || post.value.category) : (post.value.category_en || post.value.category)
})

const currentDescription = computed(() => {
  if (post.value?.metaDescription) return post.value.metaDescription
  if (currentContent.value) {
    // Loại bỏ thẻ html để lấy text thô làm meta description
    return currentContent.value.replace(/<[^>]*>/g, '').substring(0, 160)
  }
  return ''
})

// --- TÍNH TOÁN THỜI GIAN ĐỌC DỰ KIẾN ---
const readingTime = computed(() => {
  const words = post.value?.wordCount || 0
  if (words === 0 && currentContent.value) {
    const text = currentContent.value.replace(/<[^>]*>/g, '')
    const count = text.trim().split(/\s+/).filter(Boolean).length
    return Math.ceil(count / 200) // Trung bình 200 từ/phút
  }
  return Math.ceil(words / 200) || 1
})

// --- CẤU HÌNH SEO HEAD ĐỒNG BỘ ---
useHead({
  title: computed(() => post.value ? `${post.value.seoTitle || currentTitle.value} | SPIT VIETNAM` : 'Loading...'),
  meta: [
    { name: 'description', content: currentDescription },
    { name: 'keywords', content: computed(() => post.value?.metaKeywords || '') },
    { name: 'robots', content: computed(() => post.value?.robotsMeta || 'index, follow') },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: currentTitle },
    { property: 'og:description', content: currentDescription },
    { property: 'og:image', content: computed(() => post.value?.image || '') },
    { property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : '' }
  ],
  link: [
    { rel: 'canonical', href: computed(() => post.value?.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '')) }
  ],
  script: [
    {
      type: 'application/ld+json',
      // Nhúng trực tiếp dữ liệu cấu trúc Schema JSON-LD đã cấu hình từ Admin
      children: computed(() => post.value?.schemaJson || '{}')
    }
  ]
})

const fetchPost = async () => {
  try {
    const docRef = doc(db, "posts", route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      post.value = docSnap.data()
    } else {
      console.error("Không tìm thấy bài viết!")
    }
  } catch (e) {
    console.error("Lỗi tải dữ liệu bài viết:", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPost)
</script>

<template>
  <div v-if="post" class="bg-[#f8fafc] min-h-screen font-sans antialiased selection:bg-slate-200">
    
    <header class="relative h-[50vh] md:h-[60vh] bg-slate-900 overflow-hidden flex items-end pb-12">
      <img 
        :src="post.image" 
        :alt="post.imageAlt || currentTitle" 
        class="absolute inset-0 w-full h-full object-cover opacity-30 transition-transform duration-1000 scale-100" 
      />
      <div class="absolute inset-0 bg-linear-to-t from-[#f8fafc] via-slate-900/60 to-transparent"></div>
      
      <div class="relative max-w-7xl mx-auto w-full px-4 lg:px-8 z-10">
        <div class="max-w-4xl space-y-6">
          <span class="inline-block bg-slate-700/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-lg tracking-wider">
            {{ currentCategory }}
          </span>
          <h1 class="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            {{ currentTitle }}
          </h1>
          
          <div class="flex flex-wrap items-center gap-6 text-slate-300 text-xs font-semibold pt-2 border-t border-white/10">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">⚙️</span>
              <span>SPIT Technical Team</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>📅</span>
              <span>{{ post.createdAt?.toDate().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{{ readingTime }} {{ locale === 'vi' ? 'phút đọc' : 'min read' }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <article class="lg:col-span-8 bg-white p-6 md:p-10 rounded-4xl shadow-sm border border-slate-100">
          <div 
            v-html="currentContent" 
            class="about-content-detail prose prose-slate max-w-none text-slate-700 leading-relaxed text-base md:text-lg"
          ></div>
          
          <footer class="mt-12 pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <router-link to="/" class="text-xs font-bold text-slate-400 hover:text-slate-800 transition-all flex items-center gap-2">
              ← {{ locale === 'vi' ? 'Quay lại tin tức' : 'Back to News' }}
            </router-link>
            
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 font-medium">{{ locale === 'vi' ? 'Chia sẻ bài viết:' : 'Share:' }}</span>
              <button class="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all" title="Share Facebook">
                <span class="text-xs font-bold">FB</span>
              </button>
            </div>
          </footer>
        </article>

        <aside class="lg:col-span-4 space-y-6">
          <div class="bg-linear-to-br from-slate-900 to-slate-800 text-white p-6 rounded-4xl shadow-md relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 text-9xl opacity-5 pointer-events-none">🛠️</div>
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
              <span>🎯</span> Giải Pháp Gia Công Chính Xác
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-6">
              Sài Gòn Precision Industrial Tool (SPIT) chuyên cung cấp dụng cụ cơ khí phụ trợ CNC, chip insert, cán dao tiện cao cấp hàng đầu Việt Nam.
            </p>
            <a 
              href="mailto:info@spit.com.vn" 
              class="block text-center w-full bg-white text-slate-900 font-bold text-xs uppercase py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-md"
            >
              {{ locale === 'vi' ? 'Yêu cầu tư vấn kỹ thuật' : 'Request Technical Support' }}
            </a>
          </div>

          <div class="bg-white p-6 rounded-4xl shadow-sm border border-slate-100">
            <h4 class="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Cam kết dịch vụ</h4>
            <ul class="space-y-3 text-xs font-semibold text-slate-600">
              <li class="flex items-center gap-2.5">
                <span class="text-green-500">✓</span> 100% Sản phẩm chính xác tuyệt đối
              </li>
              <li class="flex items-center gap-2.5">
                <span class="text-green-500">✓</span> Hỗ trợ tính toán thông số cắt gọt
              </li>
              <li class="flex items-center gap-2.5">
                <span class="text-green-500">✓</span> Giao hàng nhanh chóng toàn quốc
              </li>
            </ul>
          </div>
        </aside>

      </div>
    </main>
  </div>

  <div v-else-if="isLoading" class="min-h-screen flex flex-col gap-4 items-center justify-center bg-[#f8fafc]">
    <div class="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-800"></div>
    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải nội dung...</span>
  </div>
</template>

<style scoped>
/* Hiệu ứng mượt mà khi load cấu trúc trang */
main {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==========================================================================
   STYLE ĐỒNG BỘ TYPOGRAPHY CHO NỘI DUNG TỪ TINYMCE CHUẨN TRỰC QUAN
   ========================================================================== */
.about-content-detail :deep(p) {
  margin-bottom: 1.5rem;
  line-height: 1.8;
  color: #334155;
}

.about-content-detail :deep(h2) {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-left: 4px solid #475569;
  padding-left: 0.75rem;
}

.about-content-detail :deep(h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.about-content-detail :deep(img) {
  border-radius: 1.5rem;
  margin: 2rem auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  max-width: 100%;
  height: auto;
}

.about-content-detail :deep(ul), .about-content-detail :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
  list-style-type: disc;
}

.about-content-detail :deep(li) {
  margin-bottom: 0.5rem;
}

/* Chặn đứng tuyệt đối chữ in nghiêng lỗi mốt */
.about-content-detail :deep(em),
.about-content-detail :deep(i) {
  font-style: normal !important;
}
</style>