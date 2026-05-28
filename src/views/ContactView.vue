<template>
  <div class="min-h-screen bg-[#f8fafc] py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased">
    
    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-24 right-6 z-100 max-w-sm text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border"
           :class="toast.type === 'success' ? 'bg-slate-900 border-slate-800' : 'bg-red-600 border-red-500'">
        <div class="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-md bg-white/20">
          {{ toast.type === 'success' ? '✓' : '✕' }}
        </div>
        <p class="text-xs font-bold grow tracking-wide">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="max-w-7xl mx-auto">
      
      <div class="mb-12 border-l-4 border-red-600 pl-6 md:pl-8">
        <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 leading-none">
          Liên hệ <span class="text-red-600">Hợp tác & Báo giá</span>
        </h1>
        <p class="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
          Spit Precision Industrial Tools Vietnam
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div class="lg:col-span-7 bg-white p-6 sm:p-10 rounded-4xl shadow-xl shadow-slate-100 border border-slate-100">
          <form @submit.prevent="submitContact" class="space-y-8">
            
            <div class="space-y-4">
              <h2 class="text-[11px] font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 1. Thông tin người liên hệ
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Họ và tên <span class="text-red-500">*</span></label>
                  <input v-model="formData.name" type="text" placeholder="Nguyễn Văn A" class="custom-input">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Số điện thoại <span class="text-red-500">*</span></label>
                  <input v-model="formData.phone" type="tel" placeholder="0909 xxx xxx" class="custom-input">
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Địa chỉ Email</label>
                <input v-model="formData.email" type="email" placeholder="example@gmail.com" class="custom-input">
              </div>
            </div>

            <div class="space-y-4 pt-4 border-t border-slate-50">
              <h2 class="text-[11px] font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 2. Yêu cầu thông số kỹ thuật
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Tên dụng cụ / Sản phẩm</label>
                  <input v-model="formData.productName" type="text" placeholder="Ví dụ: Đá mài, Dao phay..." class="custom-input">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Đính kèm bản vẽ (PDF/Ảnh)</label>
                  <div class="relative w-full bg-[#f8fafc] border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 transition-all flex items-center justify-between cursor-pointer group">
                    <input @change="handleFileUpload" type="file" accept=".pdf,image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                    <span class="text-xs font-bold text-slate-500 truncate max-w-45">
                      {{ selectedFile ? selectedFile.name : 'Chọn file bản vẽ...' }}
                    </span>
                    <span class="text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 group-hover:border-red-500 group-hover:text-red-600 px-2.5 py-1 rounded-lg transition-colors shadow-sm">
                      Tải lên
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Số lượng đặt hàng</label>
                  <input v-model="formData.quantity" type="number" placeholder="100" class="custom-input">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Vật liệu cấu tạo</label>
                  <input v-model="formData.material" type="text" placeholder="Thép hợp kim, Nhôm..." class="custom-input">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Thời gian yêu cầu hoàn thành</label>
                <input v-model="formData.deadline" type="date" class="custom-input">
              </div>
            </div>

            <div class="space-y-4 pt-4 border-t border-slate-50">
              <h2 class="text-[11px] font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 3. Thông tin doanh nghiệp
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Tên công ty</label>
                  <input v-model="formData.companyName" type="text" placeholder="Công ty TNHH cơ khí chính xác..." class="custom-input">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Mã số thuế</label>
                  <input v-model="formData.taxCode" type="text" placeholder="Mã số thuế doanh nghiệp" class="custom-input">
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Địa chỉ doanh nghiệp</label>
                <input v-model="formData.companyAddress" type="text" placeholder="Địa chỉ đăng ký kinh doanh" class="custom-input">
              </div>
            </div>

            <div class="space-y-1.5 pt-4 border-t border-slate-50">
              <label class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Nội dung chi tiết yêu cầu</label>
              <textarea v-model="formData.message" rows="4" placeholder="Ghi chú thêm quy cách hoặc quy trình kiểm định chất lượng (nếu có)..." class="w-full bg-[#f8fafc] border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-4 ring-red-500/5 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold outline-none transition-all resize-none placeholder:font-medium placeholder:text-slate-400"></textarea>
            </div>

            <button :disabled="isSubmitting" type="submit" class="w-full group relative overflow-hidden bg-slate-950 text-white py-4.5 rounded-xl font-black uppercase text-[10px] tracking-[0.25em] transition-all shadow-lg active:scale-[0.99] disabled:opacity-50">
              <span class="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <span class="relative z-10 flex items-center justify-center gap-2">
                {{ isSubmitting ? 'ĐANG GỬI DỮ LIỆU ĐẾN SPIT...' : 'GỬI YÊU CẦU BÁO GIÁ CƠ KHÍ 🚀' }}
              </span>
            </button>
          </form>
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          
          <div class="bg-white p-6 rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 text-base shadow-sm">📍</div>
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-900">Văn phòng đại diện</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Khu vực TP. Hồ Chí Minh</p>
              </div>
            </div>
            <p class="text-slate-600 text-sm font-semibold leading-relaxed pl-13">
              361 Lê Trọng Tấn, Sơn Kỳ, Tân Phú, TP. HCM
            </p>
          </div>

          <div class="rounded-4xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 shadow-xl border-4 border-white aspect-4/3 lg:h-95 bg-slate-100 relative group">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0456440814123!2d106.61659617355241!3d10.807816158616978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529305fff8f83%3A0x53158444d87263b!2zQ8O0bmcgdHkgUGjDumMgVGjhu4tuaA!5e0!3m2!1svi!2s!4v1779957824543!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db, storage } from '../firebase' 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const route = useRoute()
const isSubmitting = ref(false)
const selectedFile = ref(null)

// Đối tượng quản lý trạng thái Toast Notification thông minh
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const formData = ref({
  name: '',
  phone: '',
  email: '',
  productName: '',
  quantity: '',
  material: '',
  deadline: '', 
  companyName: '',
  taxCode: '',
  companyAddress: '',
  message: ''
})

onMounted(() => {
  const reason = route.query.reason
  if (reason === 'support') formData.value.message = "Tôi cần hỗ trợ kỹ thuật và kiểm thử dòng dụng cụ mới..."
})

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

// Hàm kích hoạt Toast không chặn tương tác hệ thống
const triggerToast = (message, type = 'success') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

const submitContact = async () => {
  if (!formData.value.name.trim() || !formData.value.phone.trim()) {
    triggerToast("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!", "error")
    return
  }

  isSubmitting.value = true
  let fileUrl = ''

  try {
    if (selectedFile.value && storage) {
      const path = `blueprints/${Date.now()}_${selectedFile.value.name}`
      const sRef = storageRef(storage, path)
      const snapshot = await uploadBytes(sRef, selectedFile.value)
      fileUrl = await getDownloadURL(snapshot.ref)
    }

    await addDoc(collection(db, "contacts"), {
      ...formData.value,
      drawingUrl: fileUrl,
      createdAt: serverTimestamp()
    })

    triggerToast("Yêu cầu báo giá của bạn đã được gửi thành công! Kỹ sư SPIT sẽ liên hệ lại ngay.", "success")
    
    // Đưa Form về trạng thái rỗng
    formData.value = { 
      name: '', phone: '', email: '', productName: '', quantity: '', 
      material: '', deadline: '', companyName: '', taxCode: '', 
      companyAddress: '', message: '' 
    }
    selectedFile.value = null
  } catch (err) {
    console.error("Lỗi gửi liên hệ:", err)
    triggerToast(`Gửi thất bại: ${err.message}`, "error")
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Khai báo reference chính xác đến file CSS gốc của bạn */
@reference "../style.css"; 

/* 1. Áp dụng các class cơ bản của Tailwind v4 */
.custom-input {
  @apply w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all;
}

/* 2. Trạng thái focus */
.custom-input:focus {
  @apply border-red-500 bg-white ring-4;
  --tw-ring-color: rgba(239, 68, 68, 0.05);
}

/* 3. Thuộc tính placeholder */
.custom-input::placeholder {
  @apply font-medium text-slate-400;
}

/* 4. Xử lý responsive bằng Media Query */
@media (min-width: 640px) {
  .custom-input {
    @apply text-sm;
  }
}

/* Hiệu ứng Toast giữ nguyên */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>