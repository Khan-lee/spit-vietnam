<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import AdminSidebar from '../components/AdminSidebar.vue'

// Khởi tạo state cấu hình hệ thống - Bổ sung các trường SEO chiến lược
const settings = ref({
  hotline: '',
  email: '',
  address: '',
  facebook: '',
  zalo: '',
  shippingFee: 0,
  announcement: '',
  // [MỚI] Các trường cấu hình SEO tổng cho website
  seoTitle: '',
  seoDescription: '',
  seoKeywords: ''
})

const isLoading = ref(false)
const isSaving = ref(false)
const toast = ref({ show: false, message: '', type: 'success' })

// Kích hoạt thông báo Toast UI đồng bộ hệ thống admin
const triggerToast = (message, type = 'success') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3500)
}

// Truy xuất cấu hình từ Firestore
const fetchSettings = async () => {
  isLoading.value = true
  try {
    const docRef = doc(db, "settings", "website")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      settings.value = { ...settings.value, ...docSnap.data() }
    }
  } catch (e) {
    console.error("Lỗi tải cấu hình:", e)
    triggerToast("Không thể tải cấu hình hệ thống!", "error")
  } finally {
    isLoading.value = false
  }
}

// Lưu cấu hình hệ thống an toàn
const saveSettings = async () => {
  isSaving.value = true
  try {
    await setDoc(doc(db, "settings", "website"), {
      ...settings.value,
      updatedAt: new Date().toISOString()
    })
    triggerToast("Cập nhật cấu hình hệ thống thành công! ✨")
  } catch (e) {
    console.error("Lỗi khi lưu:", e)
    triggerToast("Có lỗi xảy ra trong quá trình lưu dữ liệu!", "error")
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans antialiased">
    <AdminSidebar />

    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-6 right-6 z-100 max-w-sm text-white p-4 rounded-xl shadow-xl flex items-center gap-3 border"
           :class="toast.type === 'success' ? 'bg-slate-900 border-slate-800' : 'bg-red-600 border-red-500'">
        <span class="text-sm font-bold shadow-md bg-white/20 w-6 h-6 rounded-lg flex items-center justify-center">
          {{ toast.type === 'success' ? '✓' : '✕' }}
        </span>
        <p class="text-xs font-bold tracking-wide">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="flex-1 ml-20 md:ml-64 p-4 sm:p-8 md:p-12">
      <div v-if="isLoading" class="flex flex-col items-center justify-center h-[60vh] text-slate-400 font-bold text-xs tracking-widest animate-pulse">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900 mb-4"></div>
        ĐANG TRUY XUẤT CẤU HÌNH GỐC...
      </div>
      
      <div v-else class="max-w-5xl mx-auto">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
          <div>
            <h1 class="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Thiết lập hệ thống</h1>
            <p class="text-slate-400 text-xs font-semibold mt-1">Cấu hình thông tin cốt lõi, kênh truyền thông và SEO tổng thể</p>
          </div>
          <button 
            @click="saveSettings" 
            :disabled="isSaving"
            class="px-8 py-3.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-red-600 disabled:bg-slate-300 transition-all active:scale-[0.99] shrink-0"
          >
            {{ isSaving ? 'ĐANG KHÓA & LƯU...' : 'LƯU THAY ĐỔI CẤU HÌNH' }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
            <h3 class="text-[10px] font-black uppercase text-slate-900 tracking-wider pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <span class="w-2 h-2 bg-red-600 rounded-full"></span> Thông tin liên lạc doanh nghiệp
            </h3>
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hotline bán hàng</label>
                <input v-model="settings.hotline" :disabled="isSaving" type="text" class="admin-input" placeholder="09xx xxx xxx" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email hỗ trợ kỹ thuật</label>
                <input v-model="settings.email" :disabled="isSaving" type="email" class="admin-input" placeholder="support@spit.com.vn" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa chỉ văn phòng / Nhà kho</label>
                <textarea v-model="settings.address" :disabled="isSaving" rows="3" class="admin-input resize-none" placeholder="Số nhà, tên đường, khu công nghiệp..."></textarea>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
            <h3 class="text-[10px] font-black uppercase text-slate-900 tracking-wider pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <span class="w-2 h-2 bg-red-600 rounded-full"></span> Kênh kết nối & Mức vận chuyển
            </h3>
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Link Facebook Fanpage</label>
                <input v-model="settings.facebook" :disabled="isSaving" type="text" class="admin-input" placeholder="https://facebook.com/..." />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số điện thoại kết nối Zalo</label>
                <input v-model="settings.zalo" :disabled="isSaving" type="text" class="admin-input" placeholder="09xx xxx xxx" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phí vận chuyển mặc định (VND)</label>
                <input v-model.number="settings.shippingFee" :disabled="isSaving" type="number" class="admin-input font-black text-red-600" />
              </div>
            </div>
          </div>

          <div class="md:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
            <h3 class="text-[10px] font-black uppercase text-red-600 tracking-wider pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <span class="w-2 h-2 bg-red-600 rounded-full"></span> Cấu hình SEO Metadata (Trang chủ & Hệ thống)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-1 md:col-span-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">SEO Global Title</label>
                <input v-model="settings.seoTitle" :disabled="isSaving" type="text" class="admin-input" placeholder="VD: Sài Gòn Precision Industrial Tool Co." />
                <p class="text-[9px] text-slate-400 font-medium italic mt-1">* Giới hạn khuyến nghị dưới 60 ký tự.</p>
              </div>
              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">SEO Global Keywords</label>
                <input v-model="settings.seoKeywords" :disabled="isSaving" type="text" class="admin-input" placeholder="VD: dung cu cat got, manh dao hop kim, achteck viet nam, dao phay ngón" />
                <p class="text-[9px] text-slate-400 font-medium italic mt-1">* Ngăn cách các từ khóa hoặc cụm từ khóa bằng dấu phẩy.</p>
              </div>
              <div class="space-y-1 md:col-span-3">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">SEO Global Description</label>
                <textarea v-model="settings.seoDescription" :disabled="isSaving" rows="2" class="admin-input resize-none" placeholder="VD: Chuyên cung cấp dụng cụ cắt gọt kim loại chính xác cao, mảnh dao tiện, mảnh dao phay thương hiệu Achteck, Norton chính hãng tại Việt Nam..."></textarea>
                <p class="text-[9px] text-slate-400 font-medium italic mt-1">* Mô tả súc tích về doanh nghiệp, khuyến nghị từ 150 - 160 ký tự để hiển thị đẹp trên Google.</p>
              </div>
            </div>
          </div>

          <div class="md:col-span-2 bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-inner border border-slate-950">
            <h3 class="text-[10px] font-black uppercase text-blue-400 mb-4 flex items-center gap-2 italic tracking-wide">
              <span>📢</span> Thông báo khẩn cấp / Banner khuyến mãi trên cùng trang chủ
            </h3>
            <input v-model="settings.announcement" :disabled="isSaving" type="text" class="w-full p-4 bg-slate-800 rounded-xl border border-slate-700/50 text-white text-xs font-bold focus:border-blue-500 transition-all outline-none" placeholder="Ví dụ: 🔥 GIẢM NGAY 10% CHO ĐƠN HÀNG MẢNH DAO PHAY ACHTECK TRONG THÁNG NÀY..." />
            <p class="text-[9px] text-slate-500 mt-2 ml-1 italic">* Chuỗi văn bản này sẽ hiển thị chạy chữ hoặc cố định trên thanh Topbar cao nhất của toàn bộ hệ thống giao diện.</p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Khai báo reference trỏ ngược ra 2 cấp đến file CSS gốc của bạn */
@reference "../style.css";

.admin-input {
  @apply w-full mt-1 p-3.5 border border-slate-200 bg-slate-50/60 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400/80;
}
.admin-input:focus {
  @apply border-slate-950 bg-white ring-4;
  --tw-ring-color: rgba(2, 6, 23, 0.05);
}
.admin-input:disabled {
  @apply bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>