<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto font-sans antialiased text-slate-800">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <span>📝</span>
          <h1 class="text-xl md:text-2xl font-black uppercase text-slate-900 tracking-tight">Quản lý trang giới thiệu</h1>
        </div>
        <p class="text-slate-500 text-xs md:text-sm mt-1">Cấu hình tiêu đề, nội dung cốt lõi và banner hiển thị của trang About Us.</p>
      </div>
      
      <button 
        @click="saveAboutData"
        :disabled="isSaving || isUploading"
        class="w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 active:scale-98 transition-all disabled:bg-slate-300 disabled:scale-100 disabled:cursor-not-allowed shadow-md shadow-red-600/10 flex items-center justify-center gap-2"
      >
        <span v-if="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        {{ isSaving ? 'Đang lưu hệ thống...' : 'Lưu thay đổi' }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <div class="lg:col-span-8 space-y-6">
        
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div class="flex justify-between items-center">
            <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Tiêu đề chính (H1 Banner)</label>
            <span class="text-[10px] font-bold text-slate-400 font-mono">{{ aboutData.title?.length || 0 }}/80 ký tự</span>
          </div>
          <input 
            v-model="aboutData.title" 
            type="text" 
            placeholder="Ví dụ: SÀI GÒN PRECISION INDUSTRIAL TOOL"
            maxLength="80"
            class="w-full bg-slate-50 border border-transparent rounded-xl p-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-slate-400" 
          />
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div class="flex justify-between items-center mb-1">
            <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Nội dung chi tiết (Trình soạn thảo văn bản trực quan)</label>
            <span class="text-[10px] font-bold text-slate-400 font-mono">Định dạng văn bản trực quan chuẩn SEO</span>
          </div>
          
          <div class="editor-wrapper border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-red-500/30 focus-within:ring-4 focus-within:ring-red-500/5 transition-all">
            <div id="quill-toolbar" class="border-b border-slate-200 bg-slate-100/70 p-2 flex flex-wrap gap-1 items-center">
              <button class="ql-bold font-bold px-2 py-1 rounded hover:bg-slate-200 text-sm" title="In đậm">B</button>
              <button class="ql-italic italic px-2 py-1 rounded hover:bg-slate-200 text-sm" title="In nghiêng">I</button>
              <button class="ql-underline underline px-2 py-1 rounded hover:bg-slate-200 text-sm" title="Gạch chân">U</button>
              <div class="w-px h-4 bg-slate-300 mx-1"></div>
              <button class="ql-header px-1 py-0.5 rounded hover:bg-slate-200 text-[11px] font-black" value="2" title="Tiêu đề H2">H2</button>
              <button class="ql-header px-1 py-0.5 rounded hover:bg-slate-200 text-[11px] font-black" value="3" title="Tiêu đề H3">H3</button>
              <div class="w-px h-4 bg-slate-300 mx-1"></div>
              <button class="ql-list px-2 py-1 rounded hover:bg-slate-200 text-sm" value="ordered" title="Danh sách số">1.</button>
              <button class="ql-list px-2 py-1 rounded hover:bg-slate-200 text-sm" value="bullet" title="Danh sách chấm">•</button>
              <div class="w-px h-4 bg-slate-300 mx-1"></div>
              <button class="ql-clean px-2 py-1 rounded hover:bg-slate-200 text-xs text-slate-500" title="Xóa định dạng">Clear</button>
            </div>
            <div ref="editorContainer" class="prose max-w-none text-sm p-4 min-h-87.5 outline-none leading-relaxed font-sans"></div>
          </div>

          <div class="text-[11px] text-slate-400 italic flex items-center gap-1 mt-1">
            <span>💡</span> Mẹo: Bạn có thể bôi đen văn bản để tùy chỉnh nhanh Tiêu đề hoặc In đậm. Hệ thống sẽ tự tạo cấu trúc HTML chuẩn SEO B2B.
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-6">
        
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Hình ảnh đại diện doanh nghiệp</label>
          
          <div class="space-y-4">
            <div 
              @click="!isUploading && $refs.fileInput.click()"
              :class="[
                'border-2 border-dashed rounded-2xl p-6 text-center transition-all group select-none',
                isUploading ? 'border-red-300 bg-red-50/20 cursor-not-allowed' : 'border-slate-200 cursor-pointer hover:border-red-500 hover:bg-red-50/40'
              ]"
            >
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden" 
                @change="handleFileUpload" 
                accept="image/*" 
              />
              
              <div v-if="!isUploading" class="space-y-1">
                <span class="text-3xl block transform group-hover:scale-110 transition-transform duration-300">📤</span>
                <p class="text-[10px] font-black uppercase text-slate-500 group-hover:text-red-600 tracking-wide">Tải ảnh mới lên</p>
                <p class="text-[9px] text-slate-400 font-medium">PNG, JPG, WEBP (Khuyên dùng tỷ lệ 1:1 hoặc 4:3)</p>
              </div>
              
              <div v-else class="py-2 space-y-2">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent mx-auto"></div>
                <p class="text-[10px] font-black uppercase text-red-600 tracking-widest animate-pulse">Đang đẩy lên kho...</p>
              </div>
            </div>

            <div class="space-y-3 pt-2 border-t border-slate-100">
              <span class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Thumbnail & URL ảnh</span>
              
              <div class="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 group/img shadow-inner">
                <img 
                  v-if="aboutData.imageUrl" 
                  :src="aboutData.imageUrl" 
                  alt="Preview" 
                  class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-medium">
                  Chưa có ảnh hiển thị
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Đường dẫn liên kết ảnh trực tiếp:</label>
                <input 
                  v-model="aboutData.imageUrl" 
                  type="text" 
                  placeholder="https://firebasestorage.googleapis.com/..."
                  class="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-[11px] font-mono text-slate-600 outline-none focus:bg-white focus:border-slate-200 transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900 p-5 rounded-3xl text-white space-y-2 relative overflow-hidden shadow-md">
          <div class="absolute -right-6 -bottom-6 text-5xl opacity-10 select-none pointer-events-none">⚡</div>
          <h4 class="text-xs font-black uppercase tracking-wider text-red-500">Cơ chế đồng bộ Real-time</h4>
          <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
            Hệ thống quản trị được liên kết trực tiếp với document <code class="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">settings/about</code>. Ngay sau khi bạn nhấn nút lưu, toàn bộ dữ liệu ở trang chủ sẽ lập tức thay đổi mà khách hàng không cần tải lại trang.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { db, storage } from '../../firebase' 
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const aboutData = ref({
  title: '',
  content: '',
  imageUrl: ''
})

const isSaving = ref(false)
const isUploading = ref(false)
const fileInput = ref(null)
const editorContainer = ref(null)
let quillInstance = null

// Hàm nạp mã Quill từ CDN độc lập để tối ưu tốc độ tải trang
const loadQuillScripts = () => {
  return new Promise((resolve) => {
    if (window.Quill) return resolve()

    // Thêm file CSS của Quill vào thẻ head
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.core.css'
    document.head.appendChild(link)

    // Thêm file JS của Quill vào body
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.core.js'
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
}

// Khởi tạo trình soạn thảo văn bản trực quan sau khi tải xong dữ liệu
const initializeQuill = async () => {
  await loadQuillScripts()
  if (!editorContainer.value) return

  // Cấu hình Quill liên kết động với các nút bấm HTML custom ở trên toolbar
  quillInstance = new window.Quill(editorContainer.value, {
    modules: {
      toolbar: '#quill-toolbar'
    },
    placeholder: 'Nhập nội dung câu chuyện thương hiệu tại đây. Bạn có thể sử dụng các thanh công cụ ở trên để căn chỉnh đậm, nhạt, xuống dòng tự do...',
    readOnly: false
  })

  // Đổ dữ liệu HTML sẵn có từ Firestore vào khung soạn thảo mượt mà
  if (aboutData.value.content) {
    quillInstance.root.innerHTML = aboutData.value.content
  }

  // Lắng nghe sự kiện người dùng gõ chữ để đồng bộ trực tiếp vào biến reactive content
  quillInstance.on('text-change', () => {
    aboutData.value.content = quillInstance.root.innerHTML
  })
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.includes('image')) {
    alert('Vui lòng chọn đúng file định dạng hình ảnh (png, jpg, webp)!')
    return
  }

  isUploading.value = true
  try {
    const filePath = `b2b-about/banner_${Date.now()}_${file.name}`
    const sRef = storageRef(storage, filePath)
    await uploadBytes(sRef, file)
    const downloadURL = await getDownloadURL(sRef)
    aboutData.value.imageUrl = downloadURL
  } catch (error) {
    console.error("Lỗi upload ảnh lên Firebase Storage:", error)
    alert('Có lỗi xảy ra trong quá trình upload ảnh. Vui lòng kiểm tra lại cấu hình Firebase Storage của bạn.')
  } finally {
    isUploading.value = false
    if (event.target) event.target.value = ''
  }
}

const fetchAboutData = async () => {
  try {
    const docSnap = await getDoc(doc(db, "settings", "about"))
    if (docSnap.exists()) {
      aboutData.value = { ...aboutData.value, ...docSnap.data() }
      // Sau khi lấy được dữ liệu về, đợi DOM cập nhật xong rồi đẩy nội dung vào Quill Editor
      await nextTick()
      if (quillInstance) {
        quillInstance.root.innerHTML = aboutData.value.content || ''
      }
    }
  } catch (error) {
    console.error("Lỗi khi fetch dữ liệu cấu hình giới thiệu:", error)
  }
}

const saveAboutData = async () => {
  if (!aboutData.value.title.trim()) {
    alert('Vui lòng điền tiêu đề trang giới thiệu trước khi lưu!')
    return
  }

  isSaving.value = true
  try {
    await setDoc(doc(db, "settings", "about"), {
      title: aboutData.value.title,
      content: aboutData.value.content,
      imageUrl: aboutData.value.imageUrl,
      updatedAt: new Date().toISOString()
    })
    alert('Hệ thống đã lưu và cập nhật trang Giới thiệu thành công!')
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu lên Firestore:", error)
    alert('Lỗi kết nối cơ sở dữ liệu! Không thể lưu thay đổi.')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchAboutData()
  await initializeQuill()
})
</script>

<style scoped>
/* Định dạng bổ sung để đồng bộ khung soạn thảo mượt mà với lớp CSS Tailwind */
:deep(.ql-editor) {
  min-height: 350px;
  outline: none;
}

/* ÉP XUỐNG DÒNG VÀ DÃN ĐOẠN RÕ RÀNG KHI NHẤN ENTER */
:deep(.ql-editor p) {
  margin-bottom: 1rem !important; /* Tạo khoảng cách dòng thoáng giữa các đoạn <p> */
  line-height: 1.75;
}

:deep(.ql-editor h2) {
  font-size: 1.5rem;
  font-weight: 800;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
  color: #0f172a;
}

:deep(.ql-editor h3) {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25rem !important;
  margin-bottom: 0.5rem !important;
  color: #1e293b;
}

:deep(.ql-editor ul), :deep(.ql-editor ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.ql-editor.ql-blank::before) {
  color: #94a3b8;
  font-style: italic;
}
</style>