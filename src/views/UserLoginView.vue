<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100/80 px-4 py-12">
    <div class="max-w-md w-full bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
      
      <!-- LOGO -->
      <div class="text-center mb-6">
        <div class="h-16 w-full flex items-center justify-center mb-3">
          <img src="../assets/noBG_logo.png" alt="SPIT Logo" class="h-full w-auto object-contain" />
        </div>
        <h2 class="text-lg font-black uppercase tracking-tight text-slate-900">
          {{ isRegisterTab ? 'Tạo Tài Khoản Mới' : 'Đăng Nhập Tài Khoản' }}
        </h2>
        <p class="text-xs text-slate-400 font-bold mt-1">
          {{ isRegisterTab ? 'Đăng ký để quản lý đơn hàng & nhận ưu đãi' : '' }}
        </p>
      </div>

      <!-- NOTICE BANNER: Hiện khi khách được chuyển từ Checkout sang -->
      <div v-if="redirectPath === '/checkout'" class="mb-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3">
        <span class="text-lg">🛒</span>
        <p class="text-[11px] text-amber-800 font-black leading-tight uppercase">
          Vui lòng đăng nhập hoặc đăng ký để tiếp tục thanh toán đơn hàng.
        </p>
      </div>

      <!-- TAB SWITCHER (ĐĂNG NHẬP / ĐĂNG KÝ) -->
      <div class="flex bg-slate-100 p-1 rounded-2xl mb-6">
        <button 
          type="button"
          @click="switchTab(false)" 
          :class="['flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer', !isRegisterTab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700']"
        >
          Đăng nhập
        </button>
        <button 
          type="button"
          @click="switchTab(true)" 
          :class="['flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer', isRegisterTab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700']"
        >
          Đăng ký
        </button>
      </div>

      <!-- THÔNG BÁO LỖI / THÀNH CÔNG -->
      <div v-if="errorMessage" class="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl font-bold text-center">
        {{ errorMessage }}
      </div>

      <!-- GOOGLE ONE-CLICK AUTH -->
      <button 
        type="button" 
        @click="handleGoogleAuth"
        :disabled="isLoading"
        class="w-full mb-5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
      >
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>{{ isRegisterTab ? 'Đăng ký nhanh bằng Google' : 'Đăng nhập bằng Google' }}</span>
      </button>

      <div class="relative flex py-2 items-center mb-5">
        <div class="grow border-t border-slate-200"></div>
        <span class="shrink mx-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">HOẶC BẰNG EMAIL</span>
        <div class="grow border-t border-slate-200"></div>
      </div>

      <!-- FORM NHẬP LIỆU -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        
        <!-- TRƯỜNG HỌ TÊN (CHỈ HIỆN KHI ĐĂNG KÝ) -->
        <div v-if="isRegisterTab">
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Họ và tên</label>
          <input 
            v-model="fullName" 
            type="text" 
            class="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:border-slate-300 focus:ring-4 ring-red-500/5 transition-all outline-none" 
            placeholder="Nguyễn Văn A" 
            required
          >
        </div>

        <!-- TRƯỜNG SỐ ĐIỆN THOẠI (CHỈ HIỆN KHI ĐĂNG KÝ) -->
        <div v-if="isRegisterTab">
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Số điện thoại</label>
          <input 
            v-model="phone" 
            type="tel" 
            class="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:border-slate-300 focus:ring-4 ring-red-500/5 transition-all outline-none" 
            placeholder="0901234567" 
            required
          >
        </div>

        <!-- EMAIL -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
          <input 
            v-model="email" 
            type="email" 
            class="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:border-slate-300 focus:ring-4 ring-red-500/5 transition-all outline-none" 
            placeholder="your-email@gmail.com" 
            required
          >
        </div>

        <!-- MẬT KHẨU -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Mật khẩu</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:border-slate-300 focus:ring-4 ring-red-500/5 transition-all outline-none" 
            placeholder="••••••••" 
            required
          >
        </div>

        <!-- NÚT ACTION -->
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full mt-2 bg-red-600 hover:bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-red-600/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {{ isLoading ? 'Đang xử lý...' : (isRegisterTab ? 'Đăng ký tài khoản' : 'Đăng nhập') }}
        </button>
      </form>

      <!-- FOOTER TOGGLE -->
      <div class="mt-6 text-center">
        <p class="text-xs text-slate-400 font-semibold">
          {{ isRegisterTab ? 'Đã có tài khoản?' : 'Chưa có tài khoản tại SPIT?' }}
          <button 
            @click="switchTab(!isRegisterTab)" 
            class="text-red-600 font-extrabold hover:underline ml-1 cursor-pointer"
          >
            {{ isRegisterTab ? 'Đăng nhập ngay' : 'Đăng ký ngay' }}
          </button>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from '../firebase'

const router = useRouter()
const route = useRoute()
const auth = getAuth()

const isRegisterTab = ref(false)
const fullName = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Lấy tham số đường dẫn redirect (ví dụ /checkout)
const redirectPath = computed(() => route.query.redirect || '/')

const switchTab = (toRegister) => {
  isRegisterTab.value = toRegister
  errorMessage.value = ''
}

// Xử lý chung Submit Form (Đăng Nhập hoặc Đăng Ký)
const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (isRegisterTab.value) {
      // 1. ĐĂNG KÝ TÀI KHOẢN MỚI
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      const user = userCredential.user

      // Cập nhật Display Name trong Firebase Auth
      await updateProfile(user, { displayName: fullName.value })

      // Lưu hồ sơ thông tin người dùng vào Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: fullName.value,
        phone: phone.value,
        email: email.value,
        createdAt: new Date()
      })

    } else {
      // 2. ĐĂNG NHẬP
      await signInWithEmailAndPassword(auth, email.value, password.value)
    }

    // Chuyển hướng người dùng về trang mục tiêu (/checkout hoặc trang chủ)
    router.push(redirectPath.value)

  } catch (error) {
    console.error("Lỗi Auth:", error)
    if (error.code === 'auth/email-already-in-use') {
      errorMessage.value = 'Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập!'
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      errorMessage.value = 'Email hoặc mật khẩu không chính xác!'
    } else if (error.code === 'auth/weak-password') {
      errorMessage.value = 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!'
    } else {
      errorMessage.value = 'Có lỗi xảy ra, vui lòng thử lại sau!'
    }
  } finally {
    isLoading.value = false
  }
}

// Xử lý Đăng ký / Đăng nhập nhanh qua Google
const handleGoogleAuth = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Kiểm tra xem User đã có trong DB Firestore chưa, nếu chưa thì tạo profile mặc định
    const userDocRef = doc(db, "users", user.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        phone: user.phoneNumber || '',
        email: user.email,
        createdAt: new Date()
      })
    }

    router.push(redirectPath.value)
  } catch (error) {
    console.error("Lỗi Google Auth:", error)
    errorMessage.value = "Không thể đăng nhập bằng Google. Vui lòng thử lại!"
  } finally {
    isLoading.value = false
  }
}
</script>