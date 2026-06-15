<template>
  <div class="max-w-7xl mx-auto p-6 md:p-12 animate-fade-in">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-slate-900 uppercase tracking-tight">Quản lý Slideshow</h1>
        <p class="text-slate-500 mt-2 text-sm">Cập nhật hình ảnh và nội dung cho Banner trang chủ</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-10">
      <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span class="text-primary">➕</span> Thêm Banner Mới
      </h2>
      
      <form @submit.prevent="addBanner" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4 md:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div class="md:col-span-1">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hình ảnh tải lên *</label>
              <div class="relative group w-full h-32 overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all flex items-center justify-center bg-slate-50">
                <input type="file" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover p-1 rounded-xl" />
                <div v-else class="text-center p-2">
                  <span class="text-xl block">📷</span>
                  <p class="text-[9px] font-bold text-blue-500 uppercase mt-1">Chọn từ máy</p>
                </div>
              </div>
            </div>

            <div class="md:col-span-2 space-y-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hoặc dán Link Hình Ảnh (URL)</label>
              <input v-model="newBanner.image" type="url" placeholder="https://..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" />
              <p class="text-[9px] text-slate-400 italic">* Khuyến khích tải ảnh trực tiếp từ máy để đảm bảo đường truyền ổn định.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input type="checkbox" id="useI18n" v-model="newBanner.useI18n" class="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-800" />
            <label for="useI18n" class="text-sm font-bold text-slate-700 cursor-pointer">Sử dụng Text I18n mặc định (hero_title & hero_subtitle)</label>
          </div>
        </div>

        <template v-if="!newBanner.useI18n">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiêu đề (Hỗ trợ HTML)</label>
            <input v-model="newBanner.title" type="text" placeholder='Ví dụ: GIẢI PHÁP <span class="text-slate-400">CHÍNH XÁC</span>' class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiêu đề phụ (Subtitle)</label>
            <input v-model="newBanner.subtitle" type="text" placeholder="Nhập tiêu đề phụ..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả ngắn (Description)</label>
            <textarea v-model="newBanner.desc" rows="2" placeholder="Nhập mô tả chi tiết..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400"></textarea>
          </div>
        </template>

        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Link điều hướng khi click Banner (Tùy chọn)</label>
          <input v-model="newBanner.link" type="text" placeholder="Ví dụ: /products hoặc link liên kết ngoài..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
        </div>

        <div class="md:col-span-2 flex justify-end mt-2">
          <button type="submit" :disabled="isSaving" class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
            {{ isSaving ? 'Đang lưu...' : 'Lưu Banner' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="isLoading" class="text-center py-10 font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
      Đang tải dữ liệu...
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="banner in banners" :key="banner.id" class="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
        <div class="h-48 relative overflow-hidden bg-slate-100">
          <img :src="banner.image" alt="Banner" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-linear-to-t from-slate-900/80 to-transparent"></div>
          
          <button @click="deleteBanner(banner.id, banner.image)" class="absolute top-4 right-4 bg-red-500/90 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-lg z-10" title="Xóa Banner">
            ✕
          </button>
        </div>
        <div class="p-5">
          <div v-if="banner.useI18n" class="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">
            Sử dụng I18n Text
          </div>
          <div v-else>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{{ banner.subtitle || 'Không có Subtitle' }}</p>
            <h3 class="font-bold text-slate-800 text-sm mb-2 line-clamp-1" v-html="banner.title || 'Không có tiêu đề'"></h3>
            <p class="text-xs text-slate-500 line-clamp-2">{{ banner.desc || 'Không có mô tả' }}</p>
          </div>
          <p v-if="banner.link" class="text-[10px] text-blue-500 font-medium truncate mt-2">🔗 Link: {{ banner.link }}</p>
        </div>
      </div>
      <div v-if="banners.length === 0" class="md:col-span-3 text-center py-10 bg-slate-50 border border-slate-100 rounded-3xl">
        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có banner nào, hãy thêm mới!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage' 
import { db, storage } from '../firebase'

const banners = ref([])
const isLoading = ref(true)
const isSaving = ref(false)

const imagePreview = ref('')
const imageFile = ref(null)

const newBanner = ref({
  image: '',
  useI18n: false,
  title: '',
  subtitle: '',
  desc: '',
  link: ''
})

const fetchBanners = async () => {
  isLoading.value = true
  try {
    const querySnapshot = await getDocs(collection(db, 'banners'))
    banners.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi khi tải banners:", error)
    alert("Có lỗi xảy ra khi tải dữ liệu!")
  } bits: {
    isLoading.value = false
  }
}

// Logic xử lý khi chọn file hình ảnh từ máy tính
const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

// Logic đẩy file hình ảnh lên Firebase Storage
const uploadBannerImage = async () => {
  if (!imageFile.value) return newBanner.value.image
  const fileRef = storageRef(storage, `banners/${Date.now()}_${imageFile.value.name}`)
  await uploadBytes(fileRef, imageFile.value)
  return await getDownloadURL(fileRef)
}

const addBanner = async () => {
  if (!imageFile.value && !newBanner.value.image) {
    return alert("Vui lòng chọn ảnh từ máy hoặc nhập URL hình ảnh!")
  }
  
  isSaving.value = true
  try {
    // Tiến hành tải ảnh lên Storage nếu có file chọn từ máy
    const finalImageUrl = await uploadBannerImage()

    const bannerData = {
      image: finalImageUrl,
      useI18n: newBanner.value.useI18n,
      title: newBanner.value.title.trim(),
      subtitle: newBanner.value.subtitle.trim(),
      desc: newBanner.value.desc.trim(),
      link: newBanner.value.link.trim(),
      createdAt: Date.now()
    }

    await addDoc(collection(db, 'banners'), bannerData)
    
    // Reset toàn bộ form sau khi thêm thành công
    newBanner.value = { image: '', useI18n: false, title: '', subtitle: '', desc: '', link: '' }
    imageFile.value = null
    imagePreview.value = ''
    
    await fetchBanners()
  } catch (error) {
    console.error("Lỗi khi thêm banner:", error)
    alert("Không thể lưu banner mới!")
  } finally {
    isSaving.value = false
  }
}

const deleteBanner = async (id, imageUrl) => {
  if (!confirm("Bạn có chắc chắn muốn xóa banner này?")) return
  try {
    // 1. Tự động dọn dẹp file ảnh trên Firebase Storage nếu là ảnh được upload từ máy
    if (imageUrl && imageUrl.includes('firebasestorage')) {
      const fileRef = storageRef(storage, imageUrl)
      await deleteObject(fileRef).catch(e => console.log("Không tìm thấy file trên Storage, tiến hành xóa doc DB:", e))
    }

    // 2. Xóa tài liệu liên kết dưới Firestore
    await deleteDoc(doc(db, 'banners', id))
    await fetchBanners()
  } catch (error) {
    console.error("Lỗi khi xóa banner:", error)
    alert("Không thể xóa banner!")
  }
}

onMounted(fetchBanners)
</script>