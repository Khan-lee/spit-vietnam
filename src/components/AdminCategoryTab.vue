<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

// Nhận mảng products từ file cha truyền xuống để đỡ phải fetch lại
const props = defineProps({
  products: {
    type: Array,
    required: true,
    default: () => []
  }
})

const isUploading = ref(false)
const categoryMetadata = ref([])

// 1. Tự động lọc ra các tên danh mục (category_vi) không trùng lặp từ products
const uniqueCategories = computed(() => {
  const cats = props.products.map(p => p.category_vi).filter(Boolean)
  return [...new Set(cats)].sort()
})

// 2. Fetch data banner đã lưu trên Firestore
const fetchCategoryBanners = async () => {
  try {
    const snap = await getDocs(collection(db, 'category_banners'))
    const data = []
    snap.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() })
    })
    categoryMetadata.value = data
  } catch (error) {
    console.error("Lỗi lấy banner danh mục:", error)
  }
}

// 3. Kết hợp danh sách category động và ảnh đã lưu
const mergedCategories = computed(() => {
  return uniqueCategories.value.map(catName => {
    // Tìm xem category này đã có data banner chưa (dùng tên làm ID đối chiếu)
    const existingData = categoryMetadata.value.find(meta => meta.id === catName)
    return {
      name: catName,
      bannerUrl: existingData ? existingData.bannerUrl : null
    }
  })
})

onMounted(() => {
  fetchCategoryBanners()
})

// 4. Hàm xử lý upload ảnh và lưu vào Firestore
const handleBannerUpload = async (event, categoryName) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isUploading.value = true
    // Tạo đường dẫn lưu ảnh trên Storage
    const fileRef = storageRef(storage, `banners/categories/${Date.now()}_${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadUrl = await getDownloadURL(fileRef)

    // Lưu URL vào collection 'category_banners' với Document ID chính là tên Category
    await setDoc(doc(db, 'category_banners', categoryName), {
      name: categoryName,
      bannerUrl: downloadUrl,
      updatedAt: serverTimestamp()
    }, { merge: true }) // Dùng merge: true để ghi đè hoặc tạo mới mà không mất field cũ (nếu có)

    alert(`Đã cập nhật banner cho danh mục: ${categoryName}`)
    fetchCategoryBanners() // Gọi lại để update UI
  } catch (error) {
    alert("Lỗi upload ảnh banner!")
    console.error(error)
  } finally {
    isUploading.value = false
    event.target.value = '' // Reset input file
  }
}
</script>

<template>
  <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 animate-fade-in">
    <div class="mb-6 border-b border-slate-100 pb-4">
      <h2 class="text-xl font-black text-slate-800 uppercase">Quản lý Banner Danh mục</h2>
      <p class="text-xs text-slate-400 font-medium mt-1">Hệ thống tự động quét các danh mục hiện có trong kho sản phẩm. Vui lòng upload ảnh ngang (Tỉ lệ khuyến nghị 16:9 hoặc 21:9).</p>
    </div>

    <div v-if="isUploading" class="mb-4 p-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl text-center animate-pulse">
      Đang tải ảnh lên server, vui lòng đợi...
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="cat in mergedCategories" :key="cat.name" class="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 group hover:border-blue-300 transition-all">
        
        <div class="h-32 bg-slate-200 relative flex items-center justify-center overflow-hidden">
          <img v-if="cat.bannerUrl" :src="cat.bannerUrl" class="w-full h-full object-cover" />
          <div v-else class="text-slate-400 flex flex-col items-center">
            <span class="text-2xl mb-1">🖼️</span>
            <span class="text-[9px] font-black uppercase tracking-wider">Chưa có Banner</span>
          </div>
          
          <label class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span class="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-600 rounded-lg">
              {{ cat.bannerUrl ? 'Đổi ảnh khác' : 'Tải ảnh lên' }}
            </span>
            <input type="file" class="hidden" accept="image/*" @change="e => handleBannerUpload(e, cat.name)" :disabled="isUploading" />
          </label>
        </div>

        <div class="p-4 bg-white text-center">
          <h3 class="text-sm font-black text-slate-800 uppercase">{{ cat.name }}</h3>
        </div>
      </div>

      <div v-if="mergedCategories.length === 0" class="col-span-full p-8 text-center text-slate-400 text-sm">
        Chưa có danh mục nào được tìm thấy. Hãy thêm sản phẩm trước!
      </div>
    </div>
  </div>
</template>