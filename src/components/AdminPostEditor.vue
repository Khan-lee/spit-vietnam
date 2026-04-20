<script setup>
import { ref, reactive, computed } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import slugify from 'slugify'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const post = reactive({
  title: '',
  slug: '',
  content: '',
  category: 'Kinh Nghiệm Mua Sắm',
  tags: 'mua sắm, an toàn, trực tuyến',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: '',
  thumbnail: 'https://via.placeholder.com/400x200'
})

// Tự động tạo Slug khi nhập tiêu đề
const updateSlug = () => {
  post.slug = slugify(post.title, { lower: true, locale: 'vi' })
}

// Logic Chấm điểm SEO (Real-time)
const seoAnalysis = computed(() => {
  const checks = {
    titleLength: post.title.length >= 30 && post.title.length <= 60,
    metaLength: post.metaDescription.length >= 120 && post.metaDescription.length <= 160,
    hasKeywordInTitle: post.title.toLowerCase().includes(post.focusKeyword.toLowerCase()) && post.focusKeyword !== '',
    hasKeywordInContent: post.content.toLowerCase().includes(post.focusKeyword.toLowerCase()) && post.focusKeyword !== '',
  }
  
  let score = 0
  if (checks.titleLength) score += 25
  if (checks.metaLength) score += 25
  if (checks.hasKeywordInTitle) score += 25
  if (checks.hasKeywordInContent) score += 25
  
  return { score, checks }
})

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Cấu hình Editor (Bạn cần API Key từ TinyMCE hoặc dùng bản free)
const editorConfig = {
  height: 400,
  menubar: false,
  plugins: 'lists link image table code help wordcount',
  toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat | help'
}

const savePost = async (status) => {
  try {
    await addDoc(collection(db, "posts"), {
      ...post,
      status,
      createdAt: serverTimestamp(),
      seoScore: seoAnalysis.value.score
    })
    alert("Đã lưu bài viết thành công!")
  } catch (e) {
    console.error("Lỗi khi lưu:", e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-8 font-sans text-slate-800">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-black uppercase italic tracking-tighter">Biên tập bài viết</h1>
      <div class="flex gap-3">
        <button @click="savePost('draft')" class="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all">Lưu nháp</button>
        <button @click="savePost('published')" class="px-6 py-2.5 bg-[#3b82f6] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all">Đăng bài</button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-8 space-y-6">
        <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Tiêu đề bài viết</label>
          <input v-model="post.title" @input="updateSlug" type="text" placeholder="Nhập tiêu đề tại đây..." class="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-200">
          
          <div class="flex items-center gap-2 mt-4 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <span class="text-[10px] font-bold text-slate-400 px-2 uppercase italic">URL:</span>
            <span class="text-xs text-blue-500 font-medium">https://spit.com.vn/blog/{{ post.slug }}</span>
          </div>

          <div class="mt-8">
             <Editor v-model="post.content" :init="editorConfig" />
          </div>
        </div>

        <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 class="text-sm font-black uppercase mb-6 flex items-center gap-2">
            <span class="p-1.5 bg-blue-50 rounded-lg text-blue-500">🔍</span> Xem trước trên Google
          </h3>
          <div class="max-w-[600px] border-l-4 border-blue-500 pl-4 py-2">
            <div class="text-[#1a0dab] text-xl font-medium mb-1 hover:underline cursor-pointer">{{ post.seoTitle || post.title || 'Tiêu đề bài viết SEO' }}</div>
            <div class="text-[#006621] text-sm mb-1 flex items-center gap-1">
               <span class="w-3 h-3 bg-green-600 rounded-full"></span> 
               spit.com.vn › blog › {{ post.slug || 'duong-dan' }}
            </div>
            <div class="text-[#4d5156] text-sm leading-relaxed line-clamp-2">
              {{ post.metaDescription || 'Hãy nhập mô tả Meta để tối ưu hóa cách bài viết hiển thị trên kết quả tìm kiếm Google...' }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4 space-y-6">
        <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-900">Tối ưu SEO</h3>
            <div :class="getScoreColor(seoAnalysis.score)" class="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md">
              {{ seoAnalysis.score }}
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">SEO Title</label>
              <input v-model="post.seoTitle" class="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all">
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Meta Description</label>
              <textarea v-model="post.metaDescription" rows="4" class="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"></textarea>
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Từ khóa chính</label>
              <div class="flex gap-2">
                <input v-model="post.focusKeyword" class="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                <button class="bg-blue-500 text-white px-4 rounded-xl text-[10px] font-black uppercase">Thêm</button>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-50">
            <h4 class="text-[10px] font-black uppercase text-slate-400 mb-4">Danh sách kiểm tra:</h4>
            <ul class="space-y-3">
              <li v-for="(val, key) in seoAnalysis.checks" :key="key" class="flex items-center gap-3 text-xs font-bold">
                <span :class="val ? 'bg-green-500' : 'bg-slate-200'" class="w-2 h-2 rounded-full transition-colors"></span>
                <span :class="val ? 'text-slate-700' : 'text-slate-300'">
                  {{ key === 'titleLength' ? 'Độ dài tiêu đề chuẩn' : 
                     key === 'metaLength' ? 'Mô tả Meta đủ ý' : 
                     key === 'hasKeywordInTitle' ? 'Từ khóa có trong tiêu đề' : 'Từ khóa có trong nội dung' }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
           <h3 class="text-[11px] font-black uppercase mb-4 text-slate-900">Ảnh đại diện bài viết</h3>
           <div class="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-100">
              <img :src="post.thumbnail" class="w-full h-40 object-cover group-hover:scale-105 transition-transform">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-[10px] font-black uppercase tracking-widest border border-white px-4 py-2 rounded-lg">Thay đổi ảnh</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tùy chỉnh thanh cuộn cho mượt mà */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>