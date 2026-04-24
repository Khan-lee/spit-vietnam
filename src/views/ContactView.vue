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
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Địa chỉ Email</label>
              <input v-model="formData.email" type="email" placeholder="example@gmail.com" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tên sản phẩm gia công</label>
                <input v-model="formData.productName" type="text" placeholder="Ví dụ: Đá mài..." class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Đính kèm bản vẽ (PDF/Ảnh)</label>
                <input @change="handleFileUpload" type="file" accept=".pdf,image/*" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-[10px] font-bold file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-red-50 file:text-red-600 hover:file:bg-red-100 transition-all outline-none cursor-pointer">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Số lượng</label>
                <input v-model="formData.quantity" type="number" placeholder="100" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Vật liệu</label>
                <input v-model="formData.material" type="text" placeholder="Thép, Nhôm..." class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Thời gian yêu cầu hoàn thành</label>
              <input v-model="formData.deadline" type="date" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tên công ty</label>
                <input v-model="formData.companyName" type="text" placeholder="Công ty TNHH SPIT" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Mã số thuế</label>
                <input v-model="formData.taxCode" type="text" placeholder="031xxxxxxx" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Địa chỉ công ty</label>
              <input v-model="formData.companyAddress" type="text" placeholder="Địa chỉ đăng ký kinh doanh" class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nội dung yêu cầu</label>
              <textarea v-model="formData.message" rows="4" placeholder="Ghi chú thêm cho SPIT..." class="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none resize-none"></textarea>
            </div>

            <button :disabled="isSubmitting" type="submit" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-100 active:scale-95 disabled:opacity-50">
              {{ isSubmitting ? 'ĐANG GỬI DỮ LIỆU...' : 'GỬI YÊU CẦU GIA CÔNG 🚀' }}
            </button>
          </form>
        </div>

        <div class="flex flex-col justify-center space-y-12">
          <div class="group cursor-default">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 text-xl shadow-sm">📍</div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-900">Văn phòng đại diện</h3>
            </div>
            <p class="text-slate-500 text-sm font-medium leading-loose pl-16">
              361 Lê Trọng Tấn, Sơn Kỳ, Tân Phú, TP. HCM
            </p>
          </div>
          <div class="rounded-[2.5rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-xl border-4 border-white h-80 bg-slate-200 relative group">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0495117245305!2d106.61659707316996!3d10.807519958623203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529305fff8f83%3A0x53158444d87263b!2zQ8O0bmcgdHkgUGjDumMgVGjhu4tuaA!5e0!3m2!1svi!2s!4v1777019409317!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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

const formData = ref({
  name: '',
  phone: '',
  email: '',
  productName: '',
  quantity: '',
  material: '',
  deadline: '', // Đã có trong formData
  companyName: '',
  taxCode: '',
  companyAddress: '',
  message: ''
})

onMounted(() => {
  const reason = route.query.reason
  if (reason === 'support') formData.value.message = "Tôi cần hỗ trợ kỹ thuật..."
})

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

const submitContact = async () => {
  if (!formData.value.name.trim() || !formData.value.phone.trim()) {
    alert("Vui lòng điền Tên và Số điện thoại!")
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

    alert("Yêu cầu đã được gửi thành công!")
    
    // Reset form
    formData.value = { 
      name: '', phone: '', email: '', productName: '', quantity: '', 
      material: '', deadline: '', companyName: '', taxCode: '', 
      companyAddress: '', message: '' 
    }
    selectedFile.value = null
  } catch (err) {
    console.error("Lỗi:", err)
    alert("Lỗi hệ thống: " + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>