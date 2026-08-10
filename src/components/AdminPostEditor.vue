<script setup>
import { ref, reactive, computed } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import slugify from 'slugify'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '../utils/cloudinary'

// State quản lý bài viết
const post = reactive({
  title: '',
  slug: '',
  content: '',
  category: 'Kinh Nghiệm Mua Sắm',
  tags: 'mua sắm, an toàn, trực tuyến',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: '',
  thumbnail: ''
})

const isUploadingThumbnail = ref(false)
const thumbnailInput = ref(null)

// Tự động tạo Slug khi nhập tiêu đề
const updateSlug = () => {
  post.slug = slugify(post.title, { lower: true, locale: 'vi' })
}

// Logic Chấm điểm SEO (Real-time)
const seoAnalysis = computed(() => {
  const checks = {
    titleLength: post.title.length >= 30 && post.title.length <= 60,
    metaLength: post.metaDescription.length >= 120 && post.metaDescription.length <= 160,
    hasKeywordInTitle: post.focusKeyword !== '' && post.title.toLowerCase().includes(post.focusKeyword.toLowerCase()),
    hasKeywordInContent: post.focusKeyword !== '' && post.content.toLowerCase().includes(post.focusKeyword.toLowerCase()),
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

// Xử lý upload Thumbnail qua Cloudinary
const triggerThumbnailSelect = () => {
  thumbnailInput.value?.click()
}

const handleThumbnailUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isUploadingThumbnail.value = true
    const url = await uploadToCloudinary(file)
    if (url) {
      post.thumbnail = url
    }
  } catch (error) {
    console.error("Lỗi upload thumbnail:", error)
    alert("Có lỗi xảy ra khi tải ảnh đại diện lên!")
  } finally {
    isUploadingThumbnail.value = false
    event.target.value = ''
  }
}

// Cấu hình TinyMCE + Tích hợp Cloudinary Image Upload
const editorConfig = {
  height: 450,
  menubar: false,
  plugins: 'lists link image table code help wordcount',
  toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | image link table | removeformat | help',
  // Upload trực tiếp ảnh trong nội dung bài viết lên Cloudinary
  images_upload_handler: async (blobInfo) => {
    try {
      const file = blobInfo.blob()
      const url = await uploadToCloudinary(file)
      return url
    } catch (err) {
      console.error("Lỗi upload ảnh trong Editor:", err)
      throw new Error("Không thể tải ảnh lên Cloudinary")
    }
  }
}

// Lưu bài viết vào Firestore
const savePost = async (status) => {
  if (!post.title) {
    alert("Vui lòng nhập tiêu đề bài viết!")
    return
  }

  try {
    await addDoc(collection(db, "posts"), {
      ...post,
      status,
      createdAt: serverTimestamp(),
      seoScore: seoAnalysis.value.score
    })
    alert(status === 'published' ? "Đăng bài viết thành công!" : "Lưu bản nháp thành công!")
  } catch (e) {
    console.error("Lỗi khi lưu bài viết:", e)
    alert("Có lỗi xảy ra khi lưu bài viết!")
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-8 font-sans text-slate-800">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-black uppercase italic tracking-tighter">Biên tập bài viết</h1>
      <div class="flex gap-3">
        <button @click="savePost('draft')" class="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all cursor-pointer">
          Lưu nháp
        </button>
        <button @click="savePost('published')" class="px-6 py-2.5 bg-[#3b82f6] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all cursor-pointer">
          Đăng bài
        </button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8">
      <!-- Cột chính (Nội dung) -->
      <div class="col-span-8 space-y-6">
        <div class="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Tiêu đề bài viết</label>
          <input v-model="post.title" @input="updateSlug" type="text" placeholder="Nhập tiêu đề tại đây..." class="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-200 outline-none">
          
          <div class="flex items-center gap-2 mt-4 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <span class="text-[10px] font-bold text-slate-400 px-2 uppercase italic">URL:</span>
            <span class="text-xs text-blue-500 font-medium">https://spit.com.vn/blog/{{ post.slug || 'duong-dan' }}</span>
          </div>

          <div class="mt-8">
             <Editor v-model="post.content" :init="editorConfig" />
          </div>
        </div>

        <!-- Xem trước Google -->
        <div class="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
          <h3 class="text-sm font-black uppercase mb-6 flex items-center gap-2">
            <span class="p-1.5 bg-blue-50 rounded-lg text-blue-500">🔍</span> Xem trước trên Google
          </h3>
          <div class="max-w-150 border-l-4 border-blue-500 pl-4 py-2">
            <div class="text-[#1a0dab] text-xl font-medium mb-1 hover:underline cursor-pointer">
              {{ post.seoTitle || post.title || 'Tiêu đề bài viết SEO' }}
            </div>
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

      <!-- Cột phụ (SEO & Thumbnail) -->
      <div class="col-span-4 space-y-6">
        <!-- Panel SEO -->
        <div class="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 sticky top-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-900">Tối ưu SEO</h3>
            <div :class="getScoreColor(seoAnalysis.score)" class="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md transition-all">
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

        <!-- Panel Ảnh đại diện bài viết -->
        <div class="bg-white rounded-4xl p-6 shadow-sm border border-slate-100">
           <h3 class="text-[11px] font-black uppercase mb-4 text-slate-900">Ảnh đại diện bài viết</h3>
           
           <input ref="thumbnailInput" type="file" accept="image/*" class="hidden" @change="handleThumbnailUpload" />

           <div @click="triggerThumbnailSelect" class="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 min-h-40 bg-slate-50 flex items-center justify-center">
              <div v-if="isUploadingThumbnail" class="p-4 text-center">
                <span class="text-xs font-bold text-blue-600 animate-pulse block">Đang tải ảnh lên Cloudinary...</span>
              </div>
              <template v-else>
                <img v-if="post.thumbnail" :src="post.thumbnail" class="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                <div v-else class="p-4 text-center">
                  <span class="text-2xl mb-1 block">🖼️</span>
                  <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Bấm để tải ảnh lên</span>
                </div>
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-white text-[10px] font-black uppercase tracking-widest border border-white px-4 py-2 rounded-lg">
                    {{ post.thumbnail ? 'Thay đổi ảnh' : 'Tải ảnh lên' }}
                  </span>
                </div>
              </template>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tùy chỉnh thanh cuộn */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>