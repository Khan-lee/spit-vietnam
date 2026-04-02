<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
    <div class="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
      <div class="text-center mb-10">
        <div class="h-16 w-full flex items-center justify-center mb-6">
          <img src="../assets/noBG_logo.png" alt="SPIT Logo" class="h-full w-auto object-contain" />
        </div>
        <h2 class="text-xl font-black uppercase italic text-slate-900">Quản trị viên</h2>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
          <input v-model="email" type="email" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none" placeholder="admin@spit.vn" required>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Mật khẩu</label>
          <input v-model="password" type="password" class="w-full mt-2 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-red-500/5 transition-all outline-none" placeholder="••••••••" required>
        </div>
        <button type="submit" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-100">
          Đăng nhập ngay 🚀
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = async () => {
  const auth = getAuth();
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push('/spit-system-manager'); 
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert("Sai tài khoản hoặc mật khẩu rồi bạn ơi! Kiểm tra lại nhé 😊");
  }
}
</script>