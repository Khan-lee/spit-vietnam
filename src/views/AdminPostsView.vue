<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { db, storage } from '../firebase' 
import { collection, setDoc, doc, getDocs, query, orderBy, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage' 
import Editor from '@tinymce/tinymce-vue'
import slugify from 'slugify'

// --- TRẠNG THÁI FORM (ĐÃ MỞ RỘNG TOÀN DIỆN CHO SEO) ---
const newPost = ref({
  title: '',
  slug: '',
  category: 'Tin tức',
  image: '', 
  imageAlt: '',         // Alt text cho hình ảnh (Cực kỳ quan trọng cho SEO Image)
  content: '',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: '',
  metaKeywords: '',     // Thẻ từ khóa bổ trợ / Tags
  canonicalUrl: '',     // URL chuẩn hóa để tránh lỗi trùng lặp nội dung
  robotsMeta: 'index, follow', // Điều hướng Robots Thẻ meta (index/noindex)
  schemaJson: ''        // Cấu trúc dữ liệu nâng cao Structured Data JSON-LD
})

const posts = ref([])
const isSubmitting = ref(false)
const imageFile = ref(null) 
const isEditingSlug = ref(false)
const isEditing = ref(false) 

// --- BỘ ĐẾM KÝ TỰ & TỪ VỰNG ---
const wordCount = computed(() => {
  if (!newPost.value.content) return 0
  const text = newPost.value.content.replace(/<[^>]*>/g, ' ') // Loại bỏ thẻ HTML
  return text.trim().split(/\s+/).filter(Boolean).length
})

// --- LOGIC PHÂN TÍCH SEO REAL-TIME NÂNG CAO (CHUẨN YOAST/RANKMATH) ---
const seoAnalysis = computed(() => {
  const contentLower = (newPost.value.content || '').toLowerCase()
  const keywordLower = (newPost.value.focusKeyword || '').trim().toLowerCase()
  const titleLower = (newPost.value.title || '').toLowerCase()
  const seoTitleLower = (newPost.value.seoTitle || '').toLowerCase()
  const metaLower = (newPost.value.metaDescription || '').toLowerCase()
  const slugLower = (newPost.value.slug || '').toLowerCase()
  const imageAltLower = (newPost.value.imageAlt || '').toLowerCase()

  const checks = {
    titleLength: newPost.value.title.length >= 30 && newPost.value.title.length <= 60,
    metaLength: newPost.value.metaDescription.length >= 120 && newPost.value.metaDescription.length <= 160,
    hasKeyword: keywordLower !== '' && contentLower.includes(keywordLower),
    keywordInTitle: keywordLower !== '' && (titleLower.includes(keywordLower) || seoTitleLower.includes(keywordLower)),
    keywordInMeta: keywordLower !== '' && metaLower.includes(keywordLower),
    keywordInSlug: keywordLower !== '' && slugLower.includes(slugify(keywordLower, { lower: true, locale: 'vi' })),
    contentLength: wordCount.value >= 600, // Tiêu chuẩn bài viết chia sẻ kỹ thuật chuyên sâu
    hasHeadings: /<h2[^>]*>|<h3[^>]*>/i.test(newPost.value.content), // Kiểm tra phân bổ cấu trúc H2/H3
    hasImageAlt: keywordLower !== '' && imageAltLower.includes(keywordLower)
  }
  
  let score = 0
  if (checks.titleLength) score += 10
  if (checks.metaLength) score += 10
  if (checks.hasKeyword) score += 15
  if (checks.keywordInTitle) score += 15
  if (checks.keywordInMeta) score += 15
  if (checks.keywordInSlug) score += 10
  if (checks.contentLength) score += 10
  if (checks.hasHeadings) score += 10
  if (checks.hasImageAlt) score += 5
  
  return { score, checks }
})

// Tự động sinh dữ liệu Schema cấu trúc JSON-LD mẫu chuẩn Google
const generateAutoSchema = () => {
  if (!newPost.value.title) {
    alert("Vui lòng nhập tiêu đề bài viết trước khi sinh dữ liệu cấu trúc!")
    return
  }
  const domain = 'https://spit.com.vn'
  const postUrl = `${domain}/blog/${newPost.value.slug || slugify(newPost.value.title, { lower: true, locale: 'vi' })}`
  
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": newPost.value.seoTitle || newPost.value.title,
    "image": [newPost.value.image || "https://spit.com.vn/default-share.jpg"],
    "description": newPost.value.metaDescription || newPost.value.title,
    "url": postUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sài Gòn Precision Industrial Tool Co. (SPIT)",
      "logo": {
        "@type": "ImageObject",
        "url": `${domain}/logo.png`
      }
    },
    "keywords": newPost.value.focusKeyword || newPost.value.metaKeywords || "industrial tools"
  }
  newPost.value.schemaJson = JSON.stringify(schemaObj, null, 2)
}

const handleTitleInput = () => {
  if (!isEditingSlug.value && !isEditing.value) {
    newPost.value.slug = slugify(newPost.value.title, { lower: true, locale: 'vi' })
  }
}

// Cấu hình Editor mở rộng định dạng blocks để viết tiêu đề H2, H3
const editorConfig = {
  height: 450,
  menubar: true,
  plugins: 'lists link image table code wordcount advlist lists charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
  toolbar: 'undo redo | blocks | bold italic underline striir | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table code'
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageFile.value = file
    newPost.value.image = URL.createObjectURL(file)
  }
}

const uploadImageToStorage = async () => {
  if (imageFile.value) {
    const fileRef = storageRef(storage, `posts/${Date.now()}_${imageFile.value.name}`)
    await uploadBytes(fileRef, imageFile.value)
    return await getDownloadURL(fileRef)
  }
  return newPost.value.image
}

const fetchPosts = async () => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
  const querySnapshot = await getDocs(q)
  posts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const loadPostToEdit = (post) => {
  isEditing.value = true
  newPost.value = {
    imageAlt: '',
    metaKeywords: '',
    canonicalUrl: '',
    robotsMeta: 'index, follow',
    schemaJson: '',
    ...post
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetForm = () => {
  newPost.value = { 
    title: '', slug: '', category: 'Tin tức', image: '', imageAlt: '', content: '', 
    seoTitle: '', metaDescription: '', focusKeyword: '', metaKeywords: '', 
    canonicalUrl: '', robotsMeta: 'index, follow', schemaJson: '' 
  }
  imageFile.value = null
  isEditingSlug.value = false
  isEditing.value = false
}

const handleSavePost = async () => {
  if (!newPost.value.title || !newPost.value.content) {
    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
    return
  }

  isSubmitting.value = true
  try {
    const finalImageUrl = await uploadImageToStorage()
    const slug = newPost.value.slug || slugify(newPost.value.title, { lower: true, locale: 'vi' })
    
    const postData = {
      ...newPost.value,
      image: finalImageUrl, 
      slug: slug,
      seoScore: seoAnalysis.value.score,
      wordCount: wordCount.value,
      updatedAt: serverTimestamp()
    }

    if (isEditing.value) {
      const postRef = doc(db, "posts", slug)
      await updateDoc(postRef, postData)
      alert("Cập nhật bài viết thành công!")
    } else {
      postData.createdAt = serverTimestamp()
      await setDoc(doc(db, "posts", slug), postData)
      alert("Đăng bài viết mới thành công!")
    }
    
    resetForm()
    fetchPosts()
  } catch (error) {
    console.error("Lỗi:", error)
    alert("Có lỗi xảy ra khi lưu bài viết.")
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async (id) => {
  if (confirm("Xác nhận xóa bài viết này?")) {
    await deleteDoc(doc(db, "posts", id))
    fetchPosts()
  }
}

onMounted(fetchPosts)
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
      <div>
        <h2 class="text-3xl font-black text-slate-900 uppercase italic leading-none">
          Quản lý <span class="text-blue-600">Nội dung SEO</span>
        </h2>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Hệ thống biên tập & Tối ưu hóa On-page chuyên nghiệp</p>
      </div>
      <div class="flex gap-3 w-full md:w-auto">
        <button v-if="isEditing" @click="resetForm" class="bg-slate-200 hover:bg-slate-300 text-slate-600 font-black uppercase text-[11px] px-6 py-4 rounded-2xl transition-all">
          Hủy sửa
        </button>
        <button @click="handleSavePost" :disabled="isSubmitting"
          class="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 flex-1 md:flex-initial">
          {{ isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật bài viết' : 'Đăng bài viết') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8 items-start">
      
      <div class="col-span-12 lg:col-span-8 space-y-8">
        
        <div class="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div class="mb-8">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Tiêu đề chính bài viết (H1)</label>
            <input v-model="newPost.title" @input="handleTitleInput" type="text" placeholder="Nhập tiêu đề thu hút người đọc..." 
              class="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-200" />
            
            <div class="flex flex-col gap-1 mt-4 ml-2">
              <label class="text-[9px] font-black text-slate-400 uppercase">Đường dẫn tĩnh (Slug URL)</label>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-all focus-within:border-blue-200 w-full max-w-xl">
                  <span class="text-[10px] text-slate-400 font-medium italic select-none">spit.com.vn/blog/</span>
                  <input 
                    v-model="newPost.slug" 
                    :readonly="!isEditingSlug || isEditing"
                    class="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-blue-600 p-0 flex-1 min-w-0"
                    :class="{'cursor-not-allowed text-slate-400': !isEditingSlug || isEditing}"
                  />
                </div>
                <button v-if="!isEditing" @click="isEditingSlug = !isEditingSlug" type="button" class="bg-blue-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0">
                  {{ isEditingSlug ? 'Xong' : 'Sửa' }}
                </button>
              </div>
            </div>
          </div>

          <div class="mb-6">
             <div class="flex justify-between items-center mb-4 ml-2">
               <label class="text-[10px] font-black uppercase text-slate-400">Nội dung chi tiết</label>
               <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Tổng số từ: <b>{{ wordCount }}</b> từ</span>
             </div>
             <Editor v-model="newPost.content" api-key="k9iop30y1nl0rr9uh9dwjh552dqdmd85w0j3227x1btbcxlg" :init="editorConfig" />
          </div>
        </div>

        <div class="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
            <span class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">🛠️</span> Cấu hình Thẻ Meta & Robots Nâng Cao
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Từ khóa phụ / Tags (Phân cách bằng dấu phẩy)</label>
              <input v-model="newPost.metaKeywords" placeholder="VD: chip insert cnc, cán dao tiện, dụng cụ cơ khí" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Đường dẫn chuẩn hóa (Canonical URL)</label>
              <input v-model="newPost.canonicalUrl" placeholder="Bỏ trống nếu trùng với URL gốc bài viết" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
          </div>
          
          <div>
            <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-2 block">Thẻ Meta Robots (Điều hướng công cụ tìm kiếm)</label>
            <div class="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="radio" v-model="newPost.robotsMeta" value="index, follow" class="text-blue-600 focus:ring-blue-50" /> Index, Follow (Khuyên dùng)
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="radio" v-model="newPost.robotsMeta" value="noindex, follow" class="text-blue-600 focus:ring-blue-50" /> Noindex, Follow
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="radio" v-model="newPost.robotsMeta" value="noindex, nofollow" class="text-blue-600 focus:ring-blue-50" /> Noindex, Nofollow
              </label>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-50 pb-4">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span class="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">💎</span> Dữ liệu cấu trúc Schema (JSON-LD)
            </h3>
            <button type="button" @click="generateAutoSchema" class="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[9px] px-4 py-2 rounded-xl transition-all shadow-md">
              Tạo tự động Schema mẫu
            </button>
          </div>
          <p class="text-[10px] font-medium text-slate-400 leading-relaxed">Dữ liệu cấu trúc giúp các thuật toán của Google đọc hiểu thông tin doanh nghiệp, sản phẩm, hoặc bài viết kỹ thuật một cách tối ưu nhất để hiển thị Rich Snippets trên trang kết quả tìm kiếm.</p>
          <textarea v-model="newPost.schemaJson" rows="6" placeholder='{ "@context": "https://schema.org", "@type": "Article", ... }' class="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono text-[11px] text-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"></textarea>
        </div>

        <div class="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 class="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
            <span class="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🔍</span> Bản xem trước trên Google tìm kiếm (SERP)
          </h3>
          <div class="max-w-150 border-l-4 border-blue-500 pl-6 py-2 overflow-hidden">
            <div class="text-[#1a0dab] text-xl font-medium mb-1 line-clamp-1 hover:underline cursor-pointer">
              {{ newPost.seoTitle || newPost.title || 'Tiêu đề hiển thị chuẩn trên kết quả tìm kiếm Google' }}
            </div>
            <div class="text-[#006621] text-sm mb-1 truncate">spit.com.vn › blog › {{ newPost.slug || 'duong-dan-bai-viet' }}</div>
            <div class="text-[#4d5156] text-sm leading-relaxed line-clamp-2 wrap-break-word">
              {{ newPost.metaDescription || 'Vui lòng nhập mô tả ngắn (Meta Description) xuất hiện tại đây nhằm kích thích độc giả nhấp chuột vào đọc nội dung bài viết của bạn...' }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 space-y-8">
        
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-50">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-black uppercase tracking-widest italic text-slate-800">Bộ Thống Kê Chỉ Số SEO</h3>
            <div :class="seoAnalysis.score >= 80 ? 'bg-green-500 shadow-green-100' : seoAnalysis.score >= 50 ? 'bg-amber-500 shadow-amber-100' : 'bg-red-500 shadow-red-100'" 
              class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300">
              <span class="text-[16px] font-black leading-none">{{ seoAnalysis.score }}</span>
              <span class="text-[7px] font-bold uppercase mt-1">Điểm</span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Từ khóa mục tiêu (Focus Keyword)</label>
              <input v-model="newPost.focusKeyword" placeholder="VD: mảnh cắt insert, máy mài cnc" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-blue-100 transition-all border border-transparent focus:border-slate-100" />
            </div>

            <div>
              <div class="flex justify-between items-center ml-2 mb-1">
                <label class="text-[9px] font-black text-slate-400 uppercase">SEO Title</label>
                <span class="text-[9px] font-mono font-bold" :class="seoAnalysis.checks.titleLength ? 'text-green-500' : 'text-slate-400'">{{ newPost.seoTitle.length }} / 60 ký tự</span>
              </div>
              <input v-model="newPost.seoTitle" placeholder="Mặc định lấy tiêu đề chính nếu bỏ trống" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all" />
              <div class="w-full h-1 bg-slate-100 mt-2 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-300" :style="{ width: Math.min((newPost.seoTitle.length / 60) * 100, 100) + '%' }" :class="seoAnalysis.checks.titleLength ? 'bg-green-500' : 'bg-amber-400'"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center ml-2 mb-1">
                <label class="text-[9px] font-black text-slate-400 uppercase">Meta Description</label>
                <span class="text-[9px] font-mono font-bold" :class="seoAnalysis.checks.metaLength ? 'text-green-500' : 'text-slate-400'">{{ newPost.metaDescription.length }} / 160 ký tự</span>
              </div>
              <textarea v-model="newPost.metaDescription" rows="4" placeholder="Nhập đoạn mô tả ngắn tóm tắt nội dung chứa từ khóa..." class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all"></textarea>
              <div class="w-full h-1 bg-slate-100 mt-1 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-300" :style="{ width: Math.min((newPost.metaDescription.length / 160) * 100, 100) + '%' }" :class="seoAnalysis.checks.metaLength ? 'bg-green-500' : 'bg-amber-400'"></div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-slate-100">
            <h4 class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-4 ml-1">Danh sách kiểm tra phân tích</h4>
            <ul class="space-y-3">
              <li v-for="(val, key) in seoAnalysis.checks" :key="key" class="flex items-start gap-3">
                <span :class="val ? 'bg-green-500 ring-4 ring-green-50' : 'bg-slate-200'" class="w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-all"></span>
                <span class="text-[10px] font-bold uppercase tracking-tight transition-colors" :class="val ? 'text-slate-700' : 'text-slate-300'">
                  <template v-if="key === 'titleLength'">Độ dài tiêu đề tối ưu (30 - 60 ký tự)</template>
                  <template v-else-if="key === 'metaLength'">Độ dài Meta Description chuẩn (120 - 160 ký tự)</template>
                  <template v-else-if="key === 'hasKeyword'">Mật độ từ khóa chính xuất hiện trong nội dung</template>
                  <template v-else-if="key === 'keywordInTitle'">Từ khóa chính xuất hiện ở Tiêu Đề</template>
                  <template v-else-if="key === 'keywordInMeta'">Từ khóa chính xuất hiện ở Meta Description</template>
                  <template v-else-if="key === 'keywordInSlug'">Đường dẫn URL chứa từ khóa mục tiêu</template>
                  <template v-else-if="key === 'contentLength'">Bài viết chuyên sâu dài tối thiểu 600 từ</template>
                  <template v-else-if="key === 'hasHeadings'">Nội dung bài viết có phân bổ thẻ H2 hoặc H3</template>
                  <template v-else-if="key === 'hasImageAlt'">Văn bản thay thế Alt hình ảnh chứa từ khóa</template>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 space-y-4">
          <h3 class="text-[10px] font-black uppercase text-slate-400 ml-2">Ảnh đại diện bài viết</h3>
          <div class="relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-slate-100 hover:border-blue-400 transition-all">
            <input type="file" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
            <div v-if="!newPost.image" class="py-12 flex flex-col items-center justify-center text-slate-400">
               <span class="text-2xl mb-2">📸</span>
               <span class="text-[9px] font-black uppercase italic">Chọn file ảnh đại diện</span>
            </div>
            <img v-else :src="newPost.image" class="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div>
            <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Văn bản thay thế hình ảnh (Alt Text)</label>
            <input v-model="newPost.imageAlt" placeholder="Mô tả hình ảnh chứa từ khóa chính..." class="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
          <h3 class="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Đã xuất bản gần đây</h3>
          <div class="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="post in posts" :key="post.id" class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
              <img :src="post.image || 'https://via.placeholder.com/80'" class="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" />
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-xs truncate">{{ post.title }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-500 rounded">{{ post.category }}</span>
                  <span class="text-[7px] font-black uppercase px-1.5 py-0.5 rounded" :class="post.seoScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'">{{ post.seoScore || 0 }} PTS</span>
                  <span class="text-[7px] font-bold text-slate-400">{{ post.wordCount || 0 }} từ</span>
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <button @click="loadPostToEdit(post)" class="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button @click="deletePost(post.id)" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Tuỳ chỉnh thanh cuộn danh sách mượt mà */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>