<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
    <div class="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
      <div class="text-center mb-8">
        <div class="h-16 w-full flex items-center justify-center mb-4">
          <img src="../assets/noBG_logo.png" alt="SPIT Logo" class="h-full w-auto object-contain" />
        </div>
        <h2 class="text-xl font-black uppercase italic text-slate-900">Đăng Nhập Tài Khoản</h2>
      </div>

      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 text-red-600 text-xs rounded-2xl font-bold text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleUserLogin" class="space-y-5">
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
          <input v-model="email" type="email" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none" placeholder="your-email@gmail.com" required>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Mật khẩu</label>
          <input v-model="password" type="password" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none" placeholder="••••••••" required>
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
        >
          {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
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

const handleUserLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const auth = getAuth()

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/') // Chuyển về trang chủ cho người dùng thường
  } catch (error) {
    console.error("Lỗi đăng nhập:", error)
    errorMessage.value = "Sai tài khoản hoặc mật khẩu! Vui lòng kiểm tra lại."
  } finally {
    isLoading.value = false
  }
}
</script>