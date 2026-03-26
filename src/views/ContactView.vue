<template>
  <div class="min-h-screen bg-slate-50 py-20 px-6">
    <div class="max-w-7xl mx-auto">
      
      <div class="mb-16 border-l-8 border-red-600 pl-8">
        <h1 class="text-5xl font-black uppercase italic tracking-tighter text-slate-900">
          Liên hệ <span class="text-red-600">Hợp tác</span>
        </h1>
        <p class="text-slate-400 font-bold uppercase text-xs tracking-[0.4em] mt-3">
          Spit Precision Industrial Tools Vietnam
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div class="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100">
          <form @submit.prevent="submitContact" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Họ và tên</label>
                <input v-model="formData.name" type="text" placeholder="Nguyễn Văn A" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Số điện thoại</label>
                <input v-model="formData.phone" type="tel" placeholder="0909 xxx xxx" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nội dung yêu cầu</label>
              <textarea v-model="formData.message" rows="5" placeholder="Bạn cần tư vấn về thiết bị nào?" class="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none resize-none"></textarea>
            </div>

            <button :disabled="isSubmitting" type="submit" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-100 active:scale-95 disabled:opacity-50">
              {{ isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU TƯ VẤN 🚀' }}
            </button>
          </form>
        </div>

        <div class="flex flex-col justify-center space-y-12">
          <div class="group cursor-default">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 text-xl shadow-sm transition-transform group-hover:scale-110">📍</div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-900">Văn phòng đại diện</h3>
            </div>
            <p class="text-slate-500 text-sm font-medium leading-loose pl-16">
              361 Lê Trọng Tấn, Sơn Kỳ, Tân Phú, TP. HCM
            </p>
          </div>

          <div class="rounded-[2.5rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-xl border-4 border-white h-80 bg-slate-200 relative group">
            <iframe src="https://www.google.com/maps/search/361+L%C3%AA+Tr%E1%BB%8Dng+T%E1%BA%A5n,+S%C6%A1n+K%E1%BB%B3,+T%C3%A2n+Ph%C3%BA,+TP.+HCM/@10.8058993,106.6151258,15z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D" class="w-full h-full border-0 transition-transform duration-700 group-hover:scale-105" allowfullscreen="" loading="lazy"></iframe>
            <a href="https://www.google.com/maps/search/361+L%C3%AA+Tr%E1%BB%8Dng+T%E1%BA%A5n,+S%C6%A1n+K%E1%BB%B3,+T%C3%A2n+Ph%C3%BA,+TP.+HCM/@10.8058993,106.6151258,15z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D" target="_blank" class="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg border border-white opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-red-600 hover:text-white flex items-center gap-2">
              <span>Mở trong Maps</span><span class="text-xs">↗</span>
            </a>
          </div>

          <div class="group cursor-default">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl shadow-sm transition-transform group-hover:scale-110">📞</div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-900">Đường dây nóng</h3>
            </div>
            <p class="text-slate-900 text-2xl font-black italic pl-16">1900 xxxx</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { db } from '../firebase' // Nhập kết nối database của Khang
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const isSubmitting = ref(false)
const formData = ref({
  name: '',
  phone: '',
  message: ''
})

const submitContact = async () => {
  // 1. Kiểm tra dữ liệu đầu vào
  if (!formData.value.name.trim() || !formData.value.phone.trim() || !formData.value.message.trim()) {
    alert("Bạn ơi, điền đủ thông tin rồi mới gửi được nhé!")
    return
  }

  isSubmitting.value = true
  
  try {
    // 2. Gửi dữ liệu lên bảng "contacts" trong Firebase
    await addDoc(collection(db, "contacts"), {
      name: formData.value.name,
      phone: formData.value.phone,
      message: formData.value.message,
      createdAt: serverTimestamp() // Lưu thời gian gửi để dễ quản lý
    })

    alert("Yêu cầu của bạn đã được lưu vào hệ thống. Mình sẽ phản hồi sớm!")
    
    // 3. Xóa trắng form
    formData.value = { name: '', phone: '', message: '' }
  } catch (error) {
    console.error("Lỗi gửi Firebase:", error)
    alert("Có lỗi kỹ thuật rồi, Khang kiểm tra lại console nhé.")
  } finally {
    isSubmitting.value = false
  }
}
</script>