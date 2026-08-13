<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 px-6">
    <div class="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
      <div class="text-center mb-8">
        <div class="h-16 w-full flex items-center justify-center mb-4">
          <img src="../assets/noBG_logo.png" alt="SPIT Logo" class="h-full w-auto object-contain" />
        </div>
        <span class="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Hệ thống Cổng Admin</span>
        <h2 class="text-xl font-black uppercase italic text-slate-900 mt-2">Đăng nhập Quản trị</h2>
      </div>
      
      <!-- Thông báo lỗi nếu có -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-xl">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleAdminLogin" class="space-y-5">
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Admin</label>
          <input v-model="email" type="email" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/10 transition-all outline-none" placeholder="admin@spit.vn" required>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Mật khẩu</label>
          <input v-model="password" type="password" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/10 transition-all outline-none" placeholder="••••••••" required>
        </div>
        
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-100 disabled:opacity-50 flex items-center justify-center"
        >
          <span v-if="!isLoading">Xác thực & Vào Hệ Thống</span>
          <span v-else class="animate-pulse">Đang xác thực...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Danh sách email Admin
const ADMIN_EMAILS = ['spitsaigon@gmail.com', 'p.tri@spit.vn']
const handleAdminLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const auth = getAuth()

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const loggedInEmail = userCredential.user.email

    // KIỂM TRA: Nếu không phải Email Admin -> Đăng xuất luôn!
    if (!ADMIN_EMAILS.includes(loggedInEmail)) {
      await signOut(auth) // Đăng xuất lập tức
      errorMessage.value = 'Tài khoản này là tài khoản Khách hàng, không có quyền truy cập Admin!'
      return
    }

    // Nếu đúng là Admin -> Cho vào Dashboard
    router.push('/spit-system-manager')

  } catch (error) {
    console.error("Lỗi đăng nhập Admin:", error)
    errorMessage.value = 'Tài khoản hoặc mật khẩu không chính xác!'
  } finally {
    isLoading.value = false
  }
}
</script>