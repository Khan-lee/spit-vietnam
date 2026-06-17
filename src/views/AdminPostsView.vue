<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { db, storage } from '../firebase' 
import { collection, setDoc, doc, getDocs, query, orderBy, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage' 
import Editor from '@tinymce/tinymce-vue'
import slugify from 'slugify'

// --- TRẠNG THÁI FORM ---
const newPost = ref({
  title: '',
  slug: '',
  category: 'technical',
  image: '', 
  imageAlt: '',         
  content: '',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: '',
  metaKeywords: '',     
  canonicalUrl: '',     
  robotsMeta: 'index, follow', 
  schemaJson: ''        
})

const posts = ref([])
const isSubmitting = ref(false)
const imageFile = ref(null) 
const isEditingSlug = ref(false)
const isEditing = ref(false) 
const originalSlug = ref('') 

// Lưu trữ URL preview của ảnh để giải phóng bộ nhớ tránh memory leak
const previewImageUrl = ref('')

// --- [MỚI] TRẠNG THÁI AI SEO ---
const isAIAnalyzing = ref(false)

// --- BỘ ĐẾM KÝ TỰ & TỪ VỰNG TỐI ƯU ---
const wordCount = computed(() => {
  if (!newPost.value.content) return 0
  const text = newPost.value.content.replace(/|<[^>]*>/g, ' ')
  const words = text.trim().match(/\S+/g)
  return words ? words.length : 0
})

// --- LOGIC PHÂN TÍCH SEO REAL-TIME NÂNG CAO ---
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
    contentLength: wordCount.value >= 600, 
    hasHeadings: /<h2[^>]*>|<h3[^>]*>/i.test(newPost.value.content), 
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

const getPlainTextSummary = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return ''
  const pureText = htmlContent.replace(/<[^>]*>/g, ' ').trim().replace(/\s+/g, ' ')
  return pureText.slice(0, maxLength) + (pureText.length > maxLength ? '...' : '')
}

// --- [MỚI] TÍCH HỢP GEMINI API LÀM TRỢ LÝ SEO ---
const generateSEOWithAI = async () => {
  if (!newPost.value.title && !newPost.value.content) {
    alert("Vui lòng nhập tiêu đề hoặc nội dung bài viết trước để AI có dữ liệu phân tích!")
    return
  }
  
  isAIAnalyzing.value = true
  try {
    // URL API Backend/Cloud Function gọi Gemini của bạn (thay thế nếu cần)
    const apiEndpoint = 'https://us-central1-spit-vietnam.cloudfunctions.net/askSPITAssistant'
    
    // Lấy khoảng 1500 ký tự đầu của bài viết để tiết kiệm token gửi lên AI
    const plainTextContent = getPlainTextSummary(newPost.value.content, 1500)

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Đóng vai chuyên gia SEO B2B ngành dao cụ cơ khí và công nghiệp (cho SPIT Việt Nam). 
        Phân tích bài viết có Tiêu đề: "${newPost.value.title}" và Nội dung: "${plainTextContent}".
        Hãy trả về kết quả định dạng JSON duy nhất, KHÔNG bọc trong block code markdown (không dùng \`\`\`json). Bắt buộc tuân thủ cấu trúc sau:
        {
          "slug": "viet-lien-khong-dau-cach-nhau-bang-dau-gach-ngang",
          "metaTitle": "Tiêu đề SEO chuẩn (dưới 60 ký tự)",
          "metaDescription": "Mô tả SEO hấp dẫn, chuẩn chuyên ngành cơ khí (120-160 ký tự)",
          "focusKeyword": "1 từ khóa chính quan trọng nhất",
          "suggestedKeywords": "từ khóa 1, từ khóa 2, từ khóa 3"
        }`,
        history: []
      })
    })

    if (!response.ok) throw new Error("API request failed")
    const data = await response.json()
    
    // Xử lý text trả về, loại bỏ markdown nếu Gemini lỡ sinh ra
    let rawText = data.text || data.response || data
    if (typeof rawText === 'string') {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    }
    
    let seoResult = null

    // [QUAN TRỌNG] Bọc try-catch riêng cho việc Parse JSON
    try {
      seoResult = typeof rawText === 'string' ? JSON.parse(rawText) : rawText
    } catch (parseError) {
      console.error('❌ Lỗi Parse JSON. AI không trả về đúng định dạng:', rawText)
      alert('AI vừa trả lời dưới dạng văn bản bình thường thay vì cấu trúc dữ liệu JSON. Bạn click sinh dữ liệu lại lần nữa nhé!')
      isAIAnalyzing.value = false // Tắt loading
      return // Dừng hàm ngay lập tức, không chạy code fill data bên dưới
    }

    // Fill data vào form (Chỉ chạy tiếp khi parse JSON thành công)
    if (seoResult) {
      if (seoResult.slug) newPost.value.slug = seoResult.slug
      if (seoResult.metaTitle) newPost.value.seoTitle = seoResult.metaTitle
      if (seoResult.metaDescription) newPost.value.metaDescription = seoResult.metaDescription
      if (seoResult.focusKeyword) newPost.value.focusKeyword = seoResult.focusKeyword
      if (seoResult.suggestedKeywords) newPost.value.metaKeywords = seoResult.suggestedKeywords
    }
    
    // Tự động sinh luôn Schema
    generateAutoSchema()

  } catch (error) {
    console.error('❌ Lỗi tạo SEO với AI:', error)
    alert('Không thể kết nối với AI lúc này. Vui lòng kiểm tra lại mạng hoặc thử lại sau.')
  } finally {
    isAIAnalyzing.value = false
  }
}

const generateAutoSchema = () => {
  if (!newPost.value.title) {
    alert("Vui lòng nhập tiêu đề bài viết trước khi sinh dữ liệu cấu trúc!")
    return
  }
  const domain = 'https://spit.com.vn'
  const finalSlug = newPost.value.slug || slugify(newPost.value.title, { lower: true, locale: 'vi' })
  const postUrl = `${domain}/blog/${finalSlug}`
  const fallbackDescription = getPlainTextSummary(newPost.value.content, 150) || newPost.value.title
  
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": newPost.value.seoTitle || newPost.value.title,
    "image": [newPost.value.image || "https://spit.com.vn/default-share.jpg"],
    "description": newPost.value.metaDescription || fallbackDescription,
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

// [MỚI ĐƯỢC THÊM VÀO] Hàm xử lý đưa ảnh từ khung soạn thảo TinyMCE lên Firebase Storage
const handleImageUpload = (blobInfo, progress) => {
  return new Promise((resolve, reject) => {
    const file = blobInfo.blob()
    // Tạo tên file duy nhất tránh trùng lặp
    const fileRef = storageRef(storage, `posts/tinymce_${Date.now()}_${blobInfo.filename()}`)

    uploadBytes(fileRef, file)
      .then((snapshot) => {
        getDownloadURL(snapshot.ref)
          .then((downloadURL) => {
            resolve(downloadURL) // Trả về link Firebase gốc cho HTML của trình soạn thảo
          })
          .catch((error) => {
            reject('Lỗi khi lấy link ảnh từ Firebase: ' + error.message)
          })
      })
      .catch((error) => {
        reject('Lỗi upload ảnh lên Storage: ' + error.message)
      })
  })
}

const editorConfig = {
  height: 450,
  menubar: true,
  plugins: 'lists link image table code wordcount advlist charmap preview anchor searchreplace visualblocks fullscreen insertdatetime media help',
  // Đã thêm 'image' vào toolbar và nhúng images_upload_handler để xử lý ảnh
  toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table image code',
  images_upload_handler: handleImageUpload 
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value)
    }
    imageFile.value = file
    previewImageUrl.value = URL.createObjectURL(file)
    newPost.value.image = previewImageUrl.value
  }
}

const uploadImageToStorage = async () => {
  if (imageFile.value && newPost.value.image.startsWith('blob:')) {
    const fileRef = storageRef(storage, `posts/${Date.now()}_${imageFile.value.name}`)
    await uploadBytes(fileRef, imageFile.value)
    return await getDownloadURL(fileRef)
  }
  return newPost.value.image
}

const fetchPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    posts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error("Lỗi lấy danh sách bài viết:", err)
  }
}

const loadPostToEdit = (post) => {
  isEditing.value = true
  originalSlug.value = post.id || post.slug 
  
  newPost.value = {
    title: post.title || '',
    slug: post.id || post.slug || '',
    category: post.category === 'Tin tức' ? 'news' : (post.category || 'technical'),
    image: post.image || '',
    imageAlt: post.imageAlt || '',
    content: post.content || '',
    seoTitle: post.seoTitle || '',
    metaDescription: post.metaDescription || '',
    focusKeyword: post.focusKeyword || '',
    metaKeywords: post.metaKeywords || '',
    canonicalUrl: post.canonicalUrl || '',
    robotsMeta: post.robotsMeta || 'index, follow',
    schemaJson: post.schemaJson || ''
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetForm = () => {
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }
  newPost.value = { 
    title: '', slug: '', category: 'technical', image: '', imageAlt: '', content: '', 
    seoTitle: '', metaDescription: '', focusKeyword: '', metaKeywords: '', 
    canonicalUrl: '', robotsMeta: 'index, follow', schemaJson: '' 
  }
  imageFile.value = null
  isEditingSlug.value = false
  isEditing.value = false
  originalSlug.value = ''
}

const handleSavePost = async () => {
  if (!newPost.value.title || !newPost.value.content) {
    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
    return
  }

  isSubmitting.value = true
  try {
    const finalImageUrl = await uploadImageToStorage()
    const currentSlug = newPost.value.slug ? slugify(newPost.value.slug, { lower: true, locale: 'vi' }) : slugify(newPost.value.title, { lower: true, locale: 'vi' })
    
    const postData = {
      title: newPost.value.title,
      slug: currentSlug,
      category: newPost.value.category,
      image: finalImageUrl,
      imageAlt: newPost.value.imageAlt,
      content: newPost.value.content,
      seoTitle: newPost.value.seoTitle,
      metaDescription: newPost.value.metaDescription,
      focusKeyword: newPost.value.focusKeyword,
      metaKeywords: newPost.value.metaKeywords,
      canonicalUrl: newPost.value.canonicalUrl,
      robotsMeta: newPost.value.robotsMeta,
      schemaJson: newPost.value.schemaJson,
      seoScore: seoAnalysis.value.score,
      wordCount: wordCount.value,
      updatedAt: serverTimestamp()
    }

    if (isEditing.value) {
      if (originalSlug.value !== currentSlug) {
        postData.createdAt = serverTimestamp() 
        await setDoc(doc(db, "posts", currentSlug), postData)
        await deleteDoc(doc(db, "posts", originalSlug.value))
      } else {
        const postRef = doc(db, "posts", originalSlug.value)
        await updateDoc(postRef, postData)
      }
      alert("Cập nhật bài viết thành công!")
    } else {
      postData.createdAt = serverTimestamp()
      await setDoc(doc(db, "posts", currentSlug), postData)
      alert("Đăng bài viết mới thành công!")
    }
    
    resetForm()
    fetchPosts()
  } catch (error) {
    console.error("Lỗi khi lưu bài viết vào Firestore:", error)
    alert("Có lỗi xảy ra khi lưu bài viết.")
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async (id) => {
  if (confirm("Xác nhận xóa bài viết này?")) {
    try {
      await deleteDoc(doc(db, "posts", id))
      fetchPosts()
    } catch (err) {
      console.error("Lỗi khi xóa bài viết:", err)
    }
  }
}

const formatCategory = (cat) => {
  if (cat === 'technical') return 'Kiến thức kỹ thuật'
  if (cat === 'news' || cat === 'Tin tức') return 'Tin tức & Sự kiện'
  return cat
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
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div class="flex flex-col gap-1 ml-2">
                <label class="text-[9px] font-black text-slate-400 uppercase">Đường dẫn tĩnh (Slug URL)</label>
                <div class="flex items-center gap-2">
                  <div class="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-all focus-within:border-blue-200 w-full">
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

              <div class="flex flex-col gap-1 ml-2">
                <label class="text-[9px] font-black text-slate-400 uppercase">Chủ đề phân loại bài viết</label>
                <select 
                  v-model="newPost.category"
                  class="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer"
                >
                  <option value="technical">🔧 Kiến thức kỹ thuật</option>
                  <option value="news">📰 Tin tức & Sự kiện</option>
                </select>
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
            <span class="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🔍</span> Bản xem trước trên Google (SERP)
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
        
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-100 bg-linear-to-br from-white to-orange-50/30 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10">🤖</div>
          <div class="flex items-center justify-between mb-3 relative z-10">
            <h3 class="text-xs font-black uppercase tracking-widest italic text-orange-600 flex items-center gap-2">
              Trợ lý AI SEO 
            </h3>
          </div>
          <p class="text-[10px] text-slate-500 mb-5 leading-relaxed font-medium relative z-10">
            AI tự động đọc hiểu bài viết kỹ thuật để đề xuất Tiêu đề, Mô tả, Slug và phân tích bộ Từ khóa tối ưu nhất.
          </p>
          <button 
            @click="generateSEOWithAI"
            :disabled="isAIAnalyzing || (!newPost.title && !newPost.content)"
            class="w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-black uppercase text-[10px] px-4 py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 relative z-10"
          >
            <span v-if="isAIAnalyzing" class="animate-pulse">Đang phân tích bài viết... ⏳</span>
            <span v-else>✨ Sinh Dữ Liệu SEO Tự Động</span>
          </button>
        </div>
        
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-50">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-black uppercase tracking-widest italic text-slate-800">Bộ Thống Kê Điểm</h3>
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
                  <template v-else-if="key === 'metaLength'">Độ dài Meta chuẩn (120 - 160 ký tự)</template>
                  <template v-else-if="key === 'hasKeyword'">Mật độ từ khóa chính xuất hiện</template>
                  <template v-else-if="key === 'keywordInTitle'">Từ khóa chính xuất hiện ở Tiêu Đề</template>
                  <template v-else-if="key === 'keywordInMeta'">Từ khóa chính xuất hiện ở Mô Tả</template>
                  <template v-else-if="key === 'keywordInSlug'">Đường dẫn URL chứa từ khóa mục tiêu</template>
                  <template v-else-if="key === 'contentLength'">Bài viết chuyên sâu dài trên 600 từ</template>
                  <template v-else-if="key === 'hasHeadings'">Bài viết có phân bổ thẻ H2 hoặc H3</template>
                  <template v-else-if="key === 'hasImageAlt'">Văn bản Alt hình ảnh chứa từ khóa</template>
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
                  <span class="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-500 rounded">{{ formatCategory(post.category) }}</span>
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
</style>