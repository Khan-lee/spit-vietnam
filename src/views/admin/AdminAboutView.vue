<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto font-sans antialiased text-slate-800">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <span>📝</span>
          <h1 class="text-xl md:text-2xl font-black uppercase text-slate-900 tracking-tight">Quản lý trang giới thiệu & SEO</h1>
        </div>
        <p class="text-slate-500 text-xs md:text-sm mt-1">Cấu hình thông tin doanh nghiệp, nội dung cốt lõi và tối ưu hóa hiển thị Schema, thực thể Local SEO.</p>
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
            <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Tiêu đề chính (H1 Banner ngoài client)</label>
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
          
          <div class="quill-editor-wrapper">
            <QuillEditor
              v-model:content="aboutData.content"
              content-type="html"
              theme="snow"
              :toolbar="customToolbarOptions"
              placeholder="Nhập nội dung câu chuyện thương hiệu tại đây. Bạn có thể sử dụng các thanh công cụ ở trên để căn chỉnh đậm, nhạt, xuống dòng tự do..."
            />
          </div>

          <div class="text-[11px] text-slate-400 italic flex items-center gap-1 mt-2">
            <span>💡</span> Mẹo: Bạn có thể bôi đen văn bản để tùy chỉnh nhanh Tiêu đề hoặc In đậm. Hệ thống sẽ tự tạo cấu trúc HTML chuẩn SEO B2B.
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
              <span>🔍</span> Cấu hình tối ưu On-Page SEO nâng cao
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Title (Tiêu đề Google)</label>
                <span class="text-[10px] font-mono text-slate-400">{{ aboutData.metaTitle?.length || 0 }}/60</span>
              </div>
              <input 
                v-model="aboutData.metaTitle" 
                type="text" 
                placeholder="Ví dụ: Giới thiệu về SPIT - Dụng cụ cắt gọt & Thiết bị phụ trợ cơ khí"
                maxLength="60"
                class="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-slate-400" 
              />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest">SEO Keywords (Từ khóa cách nhau bởi dấu phẩy)</label>
              <input 
                v-model="aboutData.seoKeywords" 
                type="text" 
                placeholder="Ví dụ: dung cu cat got, co khi chinh xac, thiet bi phu tro, spit"
                class="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-slate-400" 
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Description (Mô tả công cụ tìm kiếm)</label>
              <span class="text-[10px] font-mono text-slate-400">{{ aboutData.metaDescription?.length || 0 }}/160</span>
            </div>
            <textarea 
              v-model="aboutData.metaDescription" 
              placeholder="Nhập đoạn tóm tắt ngắn giới thiệu năng lực doanh nghiệp giúp tăng tỷ lệ click khi khách hàng tìm kiếm trên Google..."
              maxLength="160"
              rows="3"
              class="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
            ></textarea>
          </div>

          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5 select-none">
            <span class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mô phỏng kết quả hiển thị trên Google Search</span>
            <div class="flex items-center gap-1.5 text-xs text-slate-600">
              <span class="w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[9px]">🌐</span>
              <div class="flex flex-col leading-tight">
                <span class="text-[11px] font-medium text-slate-800">spit.com.vn</span>
                <span class="text-[9px] text-slate-400 font-mono">https://spit.com.vn › gioi-thieu</span>
              </div>
            </div>
            <h4 class="text-blue-800 text-sm md:text-base font-medium hover:underline cursor-pointer leading-tight tracking-wide">
              {{ aboutData.metaTitle || (aboutData.title || 'SÀI GÒN PRECISION INDUSTRIAL TOOL') }}
            </h4>
            <p class="text-slate-600 text-xs leading-relaxed max-w-2xl font-normal">
              {{ aboutData.metaDescription || 'Vui lòng điền thẻ mô tả Meta Description để tối ưu hóa hiển thị tóm tắt câu chuyện thương hiệu của bạn trên các bot tìm kiếm toàn cầu.' }}
            </p>
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

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div class="border-b border-slate-100 pb-2">
            <h3 class="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <span>🏢</span> Thực thể doanh nghiệp (Local SEO)
            </h3>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <label class="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mã số thuế / Giấy phép ĐKKD</label>
              <input 
                v-model="aboutData.taxCode" 
                type="text" 
                placeholder="Nhập mã số thuế doanh nghiệp..."
                class="w-full bg-slate-50 border border-transparent rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-red-500/30 outline-none transition-all" 
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Địa chỉ trụ sở chính (Tân Bình...)</label>
              <input 
                v-model="aboutData.businessAddress" 
                type="text" 
                placeholder="Nhập địa chỉ chính xác của văn phòng..."
                class="w-full bg-slate-50 border border-transparent rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-red-500/30 outline-none transition-all" 
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Đường dẫn Google Maps (Nhúng/URL)</label>
              <input 
                v-model="aboutData.mapsUrl" 
                type="text" 
                placeholder="https://maps.app.goo.gl/..."
                class="w-full bg-slate-50 border border-transparent rounded-xl p-2.5 text-[10px] font-mono text-slate-600 focus:bg-white focus:border-red-500/30 outline-none transition-all" 
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Đường dẫn Fanpage Facebook</label>
              <input 
                v-model="aboutData.facebookUrl" 
                type="text" 
                placeholder="https://facebook.com/spit..."
                class="w-full bg-slate-50 border border-transparent rounded-xl p-2.5 text-[10px] font-mono text-slate-600 focus:bg-white focus:border-red-500/30 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div class="bg-slate-900 p-5 rounded-3xl text-white space-y-2.5 relative overflow-hidden shadow-md">
          <div class="absolute -right-6 -bottom-6 text-5xl opacity-10 select-none pointer-events-none">⚡</div>
          <h4 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Cơ chế đồng bộ Real-time
          </h4>
          <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
            Hệ thống quản trị liên kết trực tiếp với document <code class="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">settings/about</code>. Sau khi nhấn lưu, dữ liệu ngoài client thay đổi lập tức.
          </p>
          <div v-if="aboutData.updatedAt" class="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex justify-between">
            <span>Cập nhật cuối:</span>
            <span class="text-slate-300 font-bold">{{ new Date(aboutData.updatedAt).toLocaleString('vi-VN') }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db, storage } from '../../firebase' 
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// ĐÃ FIX: Import trực tiếp component và CSS từ vue-quill đã install trong node_modules
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const aboutData = ref({
  title: '',
  content: '',
  imageUrl: '',
  metaTitle: '',
  metaDescription: '',
  seoKeywords: '',
  taxCode: '',
  businessAddress: '',
  mapsUrl: '',
  facebookUrl: '',
  updatedAt: ''
})

const isSaving = ref(false)
const isUploading = ref(false)
const fileInput = ref(null)

// ĐÃ FIX: Định nghĩa mảng tùy chọn Toolbar khớp với giao diện của bạn
const customToolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ 'header': '2' }, { 'header': '3' }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  ['clean']
]

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
    alert('Có lỗi xảy ra trong quá trình upload ảnh.')
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
    }
  } catch (error) {
    console.error("Lỗi khi fetch dữ liệu cấu hình giới thiệu:", error)
  }
}

const saveAboutData = async () => {
  if (!aboutData.value.title?.trim()) {
    alert('Vui lòng điền tiêu đề trang giới thiệu trước khi lưu!')
    return
  }

  isSaving.value = true
  const currentIsoDate = new Date().toISOString()
  
  try {
    await setDoc(doc(db, "settings", "about"), {
      title: aboutData.value.title || '',
      content: aboutData.value.content || '',
      imageUrl: aboutData.value.imageUrl || '',
      metaTitle: aboutData.value.metaTitle || '',
      metaDescription: aboutData.value.metaDescription || '',
      seoKeywords: aboutData.value.seoKeywords || '',
      taxCode: aboutData.value.taxCode || '',
      businessAddress: aboutData.value.businessAddress || '',
      mapsUrl: aboutData.value.mapsUrl || '',
      facebookUrl: aboutData.value.facebookUrl || '',
      updatedAt: currentIsoDate
    })
    
    aboutData.value.updatedAt = currentIsoDate
    alert('Hệ thống đã lưu và cập nhật trang Giới thiệu cùng cấu hình SEO thành công!')
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu lên Firestore:", error)
    alert('Lỗi kết nối cơ sở dữ liệu! Không thể lưu thay đổi.')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchAboutData()
})
</script>

<style scoped>
/* ĐÃ FIX: Tùy biến CSS mịn màng cho khối vue-quill mới */
.quill-editor-wrapper :deep(.ql-toolbar.ql-snow) {
  border: 1px solid #e2e8f0 !important;
  border-top-left-radius: 1rem !important;
  border-top-right-radius: 1rem !important;
  background-color: #f1f5f9 !important;
  padding: 0.6rem 0.8rem !important;
}

.quill-editor-wrapper :deep(.ql-container.ql-snow) {
  border: 1px solid #e2e8f0 !important;
  border-bottom-left-radius: 1rem !important;
  border-bottom-right-radius: 1rem !important;
  min-height: 350px !important;
  background-color: #f8fafc !important;
  font-family: inherit !important;
}

.quill-editor-wrapper :deep(.ql-editor) {
  padding: 1.25rem !important;
  font-size: 14px !important;
  line-height: 1.75 !important;
  color: #334155 !important;
}

.quill-editor-wrapper :deep(.ql-container:focus-within) {
  background-color: #ffffff !important;
}

/* Định dạng các thẻ HTML sinh ra khi bôi đen định dạng */
:deep(.ql-editor p) {
  margin-bottom: 1rem !important;
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
  left: 1.25rem !important;
}
</style>