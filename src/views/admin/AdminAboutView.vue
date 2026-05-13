<script setup>
import { ref, onMounted } from 'vue'
import { db, storage } from '../../firebase' // Đảm bảo bạn đã export 'storage' từ file firebase.js
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

// 1. Hàm xử lý khi chọn file từ máy tính
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Kiểm tra định dạng file (chỉ nhận ảnh)
  if (!file.type.includes('image')) {
    alert('Vui lòng chọn file hình ảnh!')
    return
  }

  isUploading.value = true
  try {
    // Tạo đường dẫn lưu trữ trên Firebase Storage: about/filename_timestamp
    const filePath = `about/banner_${Date.now()}_${file.name}`
    const sRef = storageRef(storage, filePath)

    // Upload file
    await uploadBytes(sRef, file)

    // Lấy Link ảnh sau khi upload thành công
    const downloadURL = await getDownloadURL(sRef)
    
    // Cập nhật link vào form
    aboutData.value.imageUrl = downloadURL
    alert('Tải ảnh lên thành công!')
  } catch (error) {
    console.error("Lỗi upload ảnh:", error)
    alert('Lỗi khi tải ảnh lên, vui lòng thử lại.')
  } finally {
    isUploading.value = false
  }
}

const fetchAboutData = async () => {
  const docSnap = await getDoc(doc(db, "settings", "about"))
  if (docSnap.exists()) {
    aboutData.value = { ...aboutData.value, ...docSnap.data() }
  }
}

const saveAboutData = async () => {
  isSaving.value = true
  try {
    await setDoc(doc(db, "settings", "about"), aboutData.value)
    alert('Đã lưu thay đổi thành công!')
  } catch (error) {
    alert('Lỗi khi lưu dữ liệu!')
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchAboutData)
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-black uppercase text-slate-800">Quản lý trang giới thiệu</h1>
        <p class="text-slate-500 text-sm">Cập nhật nội dung giới thiệu về SPIT trên website</p>
      </div>
      <button 
        @click="saveAboutData"
        :disabled="isSaving || isUploading"
        class="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all disabled:bg-slate-400"
      >
        {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Tiêu đề trang</label>
          <input v-model="aboutData.title" type="text" class="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 outline-none transition-all" />
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nội dung chi tiết</label>
          <textarea v-model="aboutData.content" rows="12" class="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500/20 outline-none transition-all leading-relaxed"></textarea>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Hình ảnh giới thiệu</label>
          
          <div class="space-y-4">
            <div 
              @click="$refs.fileInput.click()"
              class="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" accept="image/*" />
              <div v-if="!isUploading">
                <span class="text-2xl">📸</span>
                <p class="text-[10px] font-black uppercase text-slate-400 mt-2 group-hover:text-red-600">Chọn ảnh từ máy</p>
              </div>
              <div v-else class="py-2">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mx-auto"></div>
                <p class="text-[10px] font-black uppercase text-red-600 mt-2">Đang tải lên...</p>
              </div>
            </div>

            <div class="relative group">
              <img :src="aboutData.imageUrl" class="w-full aspect-video object-cover rounded-xl shadow-inner border border-slate-100" />
              <div class="mt-2">
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Hoặc dán Link trực tiếp:</label>
                <input v-model="aboutData.imageUrl" type="text" class="w-full bg-slate-50 border-none rounded-lg p-2 text-[10px] outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>