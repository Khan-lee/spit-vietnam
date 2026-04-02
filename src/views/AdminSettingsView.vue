<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import AdminSidebar from '../components/AdminSidebar.vue'

const settings = ref({
  hotline: '',
  email: '',
  address: '',
  facebook: '',
  zalo: '',
  shippingFee: 0,
  announcement: '' 
})

const isLoading = ref(false)
const isSaving = ref(false)
const message = ref({ show: false, text: '', type: 'success' })

const fetchSettings = async () => {
  isLoading.value = true
  try {
    // Luôn lấy từ một địa chỉ duy nhất để đồng bộ
    const docRef = doc(db, "settings", "website")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      settings.value = { ...settings.value, ...docSnap.data() }
    }
  } catch (e) {
    console.error("Lỗi tải cấu hình:", e)
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    // Tinh chỉnh: Đảm bảo dữ liệu số (shippingFee) luôn chuẩn xác
    await setDoc(doc(db, "settings", "website"), {
      ...settings.value,
      updatedAt: new Date() // Thêm dấu mốc thời gian
    })
    message.value = { show: true, text: 'Cập nhật hệ thống thành công! ✨', type: 'success' }
  } catch (e) {
    message.value = { show: true, text: 'Có lỗi xảy ra, thử lại sau!', type: 'error' }
  } finally {
    isSaving.value = false
    setTimeout(() => { message.value.show = false }, 3000)
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans">
    <AdminSidebar />

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-12">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
         <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      </div>
      
      <div v-else class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-10">
          <h1 class="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Thiết lập hệ thống</h1>
          <button 
            @click="saveSettings" 
            :disabled="isSaving"
            class="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:bg-slate-300"
          >
            {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="message.show" :class="['mb-6 p-4 rounded-2xl text-[10px] font-black uppercase text-center border', message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100']">
            {{ message.text }}
          </div>
        </transition>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 class="text-[10px] font-black uppercase text-blue-500 mb-6 flex items-center gap-2">
              <span>📞</span> Thông tin liên lạc
            </h3>
            <div class="space-y-4">
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Hotline bán hàng</label>
                <input v-model="settings.hotline" type="text" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="09xx xxx xxx" />
              </div>
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Email hỗ trợ</label>
                <input v-model="settings.email" type="email" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="support@spit.com.vn" />
              </div>
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Địa chỉ văn phòng/kho</label>
                <textarea v-model="settings.address" rows="3" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Số nhà, đường, phường..."></textarea>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 class="text-[10px] font-black uppercase text-red-500 mb-6 flex items-center gap-2">
              <span>🌐</span> Kênh kết nối & Phí ship
            </h3>
            <div class="space-y-4">
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Link Facebook Page</label>
                <input v-model="settings.facebook" type="text" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Số điện thoại Zalo</label>
                <input v-model="settings.zalo" type="text" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-2">Phí vận chuyển mặc định (VNĐ)</label>
                <input v-model.number="settings.shippingFee" type="number" class="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none text-xs font-black text-red-600 focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
            </div>
          </div>

          <div class="md:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] shadow-xl">
            <h3 class="text-[10px] font-black uppercase text-blue-400 mb-6 flex items-center gap-2 italic">
              <span>📢</span> Thông báo nổi bật trên Website
            </h3>
            <input v-model="settings.announcement" type="text" class="w-full p-4 bg-slate-800 rounded-2xl border-none text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ví dụ: Miễn phí toàn sản phẩm 100%..." />
            <p class="text-[9px] text-slate-500 mt-3 ml-2 italic">* Nội dung này sẽ hiện ở thanh Banner trên cùng của trang chủ.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>