<script setup>
import { ref, onMounted } from 'vue'
// Bổ sung import các hàm của Firestore để cấu hình banner
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
// Bổ sung import Storage để up ảnh
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
// Khai báo thêm storage (Đảm bảo file firebase.js của bạn có export storage)
import { db, storage } from '../../firebase'
import AdminSidebar from '../../components/AdminSidebar.vue'
import AdminCategoryTab from '../../components/AdminCategoryTab.vue'

const products = ref([])
const isLoading = ref(true)

// --- BỔ SUNG: BIẾN QUẢN LÝ BANNER HOT SALE ---
const hotSaleBannerUrl = ref('')
const isUploadingBanner = ref(false)

const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi lấy sản phẩm phục vụ quản lý danh mục:", error)
  } finally {
    isLoading.value = false
  }
}

// --- BỔ SUNG: LOGIC XỬ LÝ BANNER HOT SALE ---
const fetchHotSaleBanner = async () => {
  try {
    const docRef = doc(db, 'settings', 'home_config')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists() && docSnap.data().hotSaleBanner) {
      hotSaleBannerUrl.value = docSnap.data().hotSaleBanner
    }
  } catch (error) {
    console.error("Lỗi khi tải banner:", error)
  }
}

const handleHotSaleBannerUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploadingBanner.value = true
  try {
    const imageRef = storageRef(storage, `banners/hotsale_${Date.now()}_${file.name}`)
    await uploadBytes(imageRef, file)
    const downloadURL = await getDownloadURL(imageRef)

    await setDoc(doc(db, 'settings', 'home_config'), {
      hotSaleBanner: downloadURL
    }, { merge: true })

    hotSaleBannerUrl.value = downloadURL
    alert('Đã cập nhật banner thành công!')
  } catch (error) {
    console.error("Lỗi upload banner:", error)
    alert('Có lỗi xảy ra khi tải ảnh lên.')
  } finally {
    isUploadingBanner.value = false
    event.target.value = '' 
  }
}

const removeHotSaleBanner = async () => {
  if (!confirm('Bạn có chắc chắn muốn xóa banner này? Vùng trống trang chủ sẽ hiện ảnh mặc định.')) return
  
  try {
    await setDoc(doc(db, 'settings', 'home_config'), {
      hotSaleBanner: ''
    }, { merge: true })
    
    hotSaleBannerUrl.value = ''
  } catch (error) {
    console.error("Lỗi khi xóa banner:", error)
  }
}

onMounted(() => {
  fetchProducts()
  fetchHotSaleBanner() // Gọi thêm hàm tải dữ liệu banner khi load trang
})
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
    <AdminSidebar />

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-10 transition-all duration-300">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
         <div class="animate-pulse font-black text-slate-400 uppercase tracking-widest text-xs">ĐANG TẢI DỮ LIỆU...</div>
      </div>
      
      <div v-else class="max-w-6xl mx-auto space-y-6">
        <div class="space-y-1">
           <h1 class="text-2xl font-black text-slate-900 uppercase italic">Hệ thống quản lý SPIT</h1>
           <p class="text-[10px] font-bold text-slate-400 uppercase">Danh mục & Banner đại diện</p>
        </div>
        
        <!-- === BỔ SUNG: KHU VỰC THIẾT LẬP BANNER HOT SALE TRANG CHỦ === -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start">
          <div class="w-full md:w-1/4 shrink-0">
            <p class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Banner Hot Sale (Trang chủ)</p>
            <div class="relative w-full aspect-[3/5] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center group">
              <!-- Hiển thị ảnh nếu có -->
              <img v-if="hotSaleBannerUrl" :src="hotSaleBannerUrl" alt="Hot Sale Preview" class="w-full h-full object-cover" />
              
              <!-- Nút xóa ảnh (hiện khi hover) -->
              <button 
                v-if="hotSaleBannerUrl" 
                @click="removeHotSaleBanner" 
                class="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Xóa banner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <!-- Text hiển thị khi trống -->
              <span v-if="!hotSaleBannerUrl" class="text-slate-400 text-sm font-medium text-center px-4">
                Chưa có banner<br><span class="text-xs">(Khuyên dùng tỉ lệ 3:5)</span>
              </span>
            </div>
          </div>

          <div class="flex-1 w-full space-y-4">
            <div>
              <h3 class="text-lg font-black text-slate-800">Quản lý Banner Khuyến Mãi Ngang</h3>
              <p class="text-sm text-slate-500 mt-1">Banner này sẽ hiển thị bên trái khu vực 4 sản phẩm bán chạy trên trang chủ.</p>
            </div>
            
            <div class="flex flex-col space-y-2">
              <label class="text-sm font-bold text-slate-700">Tải ảnh mới lên</label>
              <input 
                type="file" 
                accept="image/*" 
                @change="handleHotSaleBannerUpload"
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                :disabled="isUploadingBanner"
              />
            </div>

            <!-- Hiển thị trạng thái tải ảnh -->
            <div v-if="isUploadingBanner" class="text-sm text-blue-600 font-semibold animate-pulse">
              Đang tải ảnh và cập nhật hệ thống...
            </div>
          </div>
        </div>
        <!-- === KẾT THÚC KHU VỰC THIẾT LẬP BANNER === -->

        <!-- CODE COMPONENT CŨ ĐƯỢC GIỮ NGUYÊN HOÀN TOÀN -->
        <AdminCategoryTab :products="products" />
      </div>
    </div>
  </div>
</template>