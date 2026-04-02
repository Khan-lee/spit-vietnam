<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import Footer from './components/Footer.vue'
// THÊM IMPORT FIREBASE
import { db } from './firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const route = useRoute()

// --- PHẦN MỚI: QUẢN LÝ CẤU HÌNH HỆ THỐNG ---
const webConfig = ref({
  announcement: '',
  hotline: '',
  email: ''
})

// --- 1. Tự động ẩn Header/Footer ở trang Admin và Login ---
const isHideLayout = computed(() => {
  // Cập nhật path để khớp với tiền tố mới của bạn
  return route.path.startsWith('/spit-system-manager') || route.path.startsWith('/admin') || route.path === '/login'
})

// --- 2. Quản lý trạng thái giỏ hàng (GIỮ NGUYÊN) ---
const cartItems = ref([])
const isCartOpen = ref(false)
const searchQuery = ref('')

const updateCart = () => {
  const data = localStorage.getItem('spit_cart')
  cartItems.value = data ? JSON.parse(data) : []
}

const cartCount = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))
const totalPrice = computed(() => cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0))

// --- 3. Các hàm bổ trợ cho giỏ hàng (GIỮ NGUYÊN) ---
const saveCart = () => {
  localStorage.setItem('spit_cart', JSON.stringify(cartItems.value))
  window.dispatchEvent(new Event('cart-updated'))
}

const changeQuantity = (productId, delta) => {
  const item = cartItems.value.find(i => i.id === productId)
  if (item) {
    item.quantity += delta
    if (item.quantity <= 0) removeFromCart(productId)
    else saveCart()
  }
}

const removeFromCart = (productId) => {
  cartItems.value = cartItems.value.filter(item => item.id !== productId)
  saveCart()
}

onMounted(() => {
  updateCart()
  window.addEventListener('storage', updateCart)
  window.addEventListener('cart-updated', updateCart)

  // THÊM: Lắng nghe thay đổi settings thời gian thực
  onSnapshot(doc(db, "settings", "website"), (docSnap) => {
    if (docSnap.exists()) {
      webConfig.value = docSnap.data()
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
    
    <div v-if="!isHideLayout && webConfig.announcement" 
         class="bg-red-600 text-white py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] relative z-[60]">
      <div class="container mx-auto px-4 overflow-hidden whitespace-nowrap">
        <span class="inline-block animate-marquee">
          {{ webConfig.announcement }} — {{ webConfig.announcement }} — {{ webConfig.announcement }}
        </span>
      </div>
    </div>

    <header v-if="!isHideLayout" class="flex justify-between items-center px-6 md:px-12 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
      <div class="flex items-center gap-3 group cursor-pointer">
        <div class="bg-red-600 text-white px-3 py-1 font-black rounded italic uppercase text-xl transition-transform group-hover:-skew-x-12">SPIT</div>
        <span class="font-extrabold text-slate-800 tracking-tighter text-2xl hidden lg:block uppercase">Vietnam</span>
      </div>

      <nav class="hidden xl:flex items-center gap-10">
        <RouterLink to="/" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">Trang chủ</RouterLink>
        <RouterLink to="/products" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">Sản phẩm</RouterLink>
        <RouterLink to="/contact" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">Liên hệ</RouterLink>
      </nav>

      <div class="flex items-center gap-4 md:gap-8">
        <div class="relative hidden md:block group">
          <input v-model="searchQuery" type="text" placeholder="Tìm kiếm thiết bị..." 
                  class="bg-slate-100 py-2.5 px-6 pr-12 rounded-full text-[11px] font-bold outline-none w-48 lg:w-64 focus:w-80 transition-all border border-transparent focus:border-red-100 shadow-inner" />
        </div>
        
        <button @click="isCartOpen = true" class="relative group p-2 hover:bg-slate-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{{ cartCount }}</span>
        </button>
      </div>
    </header>

    <Teleport to="body">
      <transition name="slide">
        <div v-if="isCartOpen" class="fixed inset-0 z-100 flex justify-end">
          <div @click="isCartOpen = false" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <aside class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div class="p-6 border-b flex justify-between items-center bg-slate-50">
               <h2 class="text-lg font-black uppercase italic">Giỏ hàng ({{ cartCount }})</h2>
               <button @click="isCartOpen = false" class="text-slate-300 hover:text-black text-2xl transition">✕</button>
            </div>
            
            <div class="grow overflow-y-auto p-6 space-y-6">
              <div v-if="cartItems.length === 0" class="text-center py-20 opacity-20 font-black uppercase text-[10px] italic">Trống rỗng</div>
              <div v-for="item in cartItems" :key="item.id" class="flex gap-4 border-b border-slate-50 pb-6">
                <div class="w-20 h-20 bg-slate-100 rounded-xl p-2 shrink-0"><img :src="item.image" class="w-full h-full object-contain" /></div>
                <div class="grow">
                  <h3 class="text-[10px] font-black uppercase italic">{{ item.name }}</h3>
                  <p class="text-red-600 font-black text-xs">{{ item.price?.toLocaleString() }} VNĐ</p>
                  <div class="flex items-center gap-1 mt-2">
                    <button @click="changeQuantity(item.id, -1)" class="w-6 h-6 bg-slate-100 rounded">-</button>
                    <span class="w-8 text-center text-[11px] font-black">{{ item.quantity }}</span>
                    <button @click="changeQuantity(item.id, 1)" class="w-6 h-6 bg-slate-100 rounded">+</button>
                    <button @click="removeFromCart(item.id)" class="ml-4 text-[9px] font-black text-slate-300 hover:text-red-600">Gỡ bỏ</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-slate-50 border-t">
              <div class="flex justify-between items-end mb-4">
                <span class="text-[10px] font-black text-slate-400 uppercase">TỔNG CỘNG:</span>
                <span class="text-2xl font-black text-slate-900">{{ totalPrice.toLocaleString() }} VNĐ</span>
              </div>
              <RouterLink to="/checkout" @click="isCartOpen = false" class="block w-full text-center bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition">Tiến hành thanh toán 🚀</RouterLink>
            </div>
          </aside>
        </div>
      </transition>
    </Teleport>

    <main class="grow">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :search-query="searchQuery" />
        </transition>
      </RouterView>
    </main>

    <Footer v-if="!isHideLayout" :config="webConfig" />
  </div>
</template>

<style>
/* Hiệu ứng chạy chữ cho Announcement */
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
}

.slide-enter-active, .slide-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>