<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '../../utils/cloudinary'

const logoUrl = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const previewBg = ref('dark') // 'dark' hoặc 'light' để test hiển thị logo

// Quản lý Toast thông báo
const toast = ref({ show: false, message: '', type: 'success' })
const triggerToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3500)
}

// Tải logo hiện tại từ Firestore
const fetchLogo = async () => {
  try {
    isLoading.value = true
    const docRef = doc(db, 'settings', 'logo')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists() && docSnap.data().url) {
      logoUrl.value = docSnap.data().url
    }
  } catch (error) {
    console.error("Lỗi khi tải logo:", error)
    triggerToast("Không thể tải dữ liệu logo từ hệ thống!", "error")
  } finally {
    isLoading.value = false
  }
}

// Xử lý upload file lên Cloudinary
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isSaving.value = true
  try {
    const downloadURL = await uploadToCloudinary(file)
    if (downloadURL) {
      logoUrl.value = downloadURL
      triggerToast("Tải ảnh lên thành công!", "success")
    }
  } catch (error) {
    console.error("Lỗi upload logo:", error)
    triggerToast("Có lỗi xảy ra khi tải ảnh lên.", "error")
  } finally {
    isSaving.value = false
    event.target.value = '' // Reset input
  }
}

// Lưu logo vào Firestore
const saveLogo = async () => {
  if (!logoUrl.value) {
    return triggerToast("Vui lòng nhập URL hoặc tải ảnh logo lên!", "error")
  }

  try {
    isSaving.value = true
    const docRef = doc(db, 'settings', 'logo')
    
    await setDoc(docRef, {
      url: logoUrl.value,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    triggerToast("Đã cập nhật logo hệ thống thành công!", "success")
  } catch (error) {
    console.error("Lỗi khi lưu logo:", error)
    triggerToast("Cập nhật thất bại, vui lòng thử lại sau!", "error")
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchLogo()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6 md:p-8 ml-0 md:ml-64 transition-all antialiased">
    
    <!-- Toast Notification -->
    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-6 right-6 z-50 max-w-sm bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-xl flex items-center gap-3">
        <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs" 
              :class="toast.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'">
          {{ toast.type === 'success' ? '✓' : '✕' }}
        </span>
        <p class="text-xs font-bold tracking-wide">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-black uppercase italic tracking-tight text-slate-900">Quản lý Logo</h1>
        <p class="text-xs text-slate-500 font-bold mt-1">Thiết lập và thay đổi logo hiển thị trên toàn hệ thống.</p>
      </div>

      <div v-if="isLoading" class="flex justify-center py-20">
        <span class="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></span>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Cột Form Cài đặt -->
        <div class="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
          <div class="flex items-center gap-3 mb-2">
            <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-900">Nguồn dữ liệu Logo</h2>
          </div>

          <!-- Cách 1: Upload File -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tải ảnh lên từ thiết bị</label>
            <div class="relative flex items-center justify-center w-full">
              <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-500 transition-all">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg class="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p class="mb-1 text-xs text-slate-500 font-bold"><span class="text-blue-600">Click để tải lên</span> hoặc kéo thả ảnh</p>
                  <p class="text-[10px] text-slate-400 font-medium">SVG, PNG, JPG hoặc GIF</p>
                </div>
                <input id="dropzone-file" type="file" accept="image/*" class="hidden" @change="handleFileUpload" :disabled="isSaving" />
              </label>
            </div>
          </div>

          <div class="relative flex py-2 items-center">
            <div class="grow border-t border-slate-200"></div>
            <span class="shrink-0 mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Hoặc</span>
            <div class="grow border-t border-slate-200"></div>
          </div>

          <!-- Cách 2: Nhập URL -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đường dẫn ảnh (URL Image)</label>
            <input 
              v-model="logoUrl" 
              type="text" 
              placeholder="https://example.com/logo.png" 
              class="admin-input w-full p-3.5 border border-slate-200 bg-slate-50/60 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10" 
            />
          </div>

          <button 
            @click="saveLogo" 
            :disabled="isSaving" 
            class="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md shadow-blue-900/20 disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer flex items-center justify-center gap-2"
          >
            <span v-if="isSaving" class="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
            {{ isSaving ? 'ĐANG LƯU DỮ LIỆU...' : 'LƯU THAY ĐỔI LOGO' }}
          </button>
        </div>

        <!-- Cột Preview Xem trước -->
        <div class="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              <h2 class="text-xs font-black uppercase tracking-widest text-slate-900">Xem trước hiển thị</h2>
            </div>
            
            <!-- Nút đổi nền Preview -->
            <div class="flex bg-slate-100 rounded-lg p-1">
              <button 
                @click="previewBg = 'light'" 
                class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
                :class="previewBg === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
              >
                Nền sáng
              </button>
              <button 
                @click="previewBg = 'dark'" 
                class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
                :class="previewBg === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'"
              >
                Nền tối
              </button>
            </div>
          </div>

          <div 
            class="grow flex flex-col items-center justify-center min-h-62.5 rounded-xl border border-slate-200 transition-colors duration-300 relative overflow-hidden"
            :class="previewBg === 'dark' ? 'bg-slate-900' : 'bg-slate-50 pattern-grid'"
          >
            <p v-if="!logoUrl" class="text-xs font-bold text-slate-400">Chưa có logo nào được chọn</p>
            
            <!-- Click Logo về trang chủ -->
            <router-link v-else to="/" class="group relative inline-block p-4" title="Click để về Trang chủ">
              <img 
                :src="logoUrl" 
                alt="Logo Preview" 
                class="max-h-24 max-w-full object-contain transition-transform duration-300 group-hover:scale-110" 
              />
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg backdrop-blur-sm">
                <span class="text-[10px] text-white font-black uppercase tracking-wider">Về trang chủ</span>
              </div>
            </router-link>
          </div>
          <p class="text-center text-[10px] text-slate-400 font-bold mt-4">
            Click trực tiếp vào Logo ở trên để kiểm tra đường dẫn về trang chủ.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }

.pattern-grid {
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>