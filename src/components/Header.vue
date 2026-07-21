<script setup>
import { ref, onMounted, computed } from 'vue' 
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router' 
import { auth, googleProvider } from '../firebase' 
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth' 
import { useSearchStore } from '../stores/search' 

// Logo từ assets
import logoImg from '../assets/noBG_logo.png'

const props = defineProps(['cartCount', 'searchQuery', 'products']) 
const emit = defineEmits(['update:searchQuery', 'openCart'])

const { locale } = useI18n()
const router = useRouter()
const searchStore = useSearchStore()
const isMobileMenuOpen = ref(false)
const isSearchFocused = ref(false)
const user = ref(null) 

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

// [FIX LỖI] Hàm đóng kết quả tìm kiếm
const handleBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}

// [FIX LỖI] Cập nhật searchQuery vào Store & Emit
const handleInput = (e) => {
  const value = e.target.value
  emit('update:searchQuery', value)
  searchStore.setSearchQuery(value)
}

// LOGIC GỢI Ý
const suggestions = computed(() => {
  const query = (props.searchQuery || '').toLowerCase().trim()
  if (!query || !props.products) return []
  return props.products.filter(p => {
    const name = (p[`name_${locale.value}`] || p.name || '').toLowerCase()
    return name.includes(query) || p.brand?.toLowerCase().includes(query)
  }).slice(0, 5)
})

const selectSuggestion = (id) => {
  router.push('/product/' + id)
  isSearchFocused.value = false
  emit('update:searchQuery', '') 
  searchStore.setSearchQuery('')
}

const loginWithGoogle = async () => {
  try { await signInWithPopup(auth, googleProvider) } 
  catch (error) { console.error("Lỗi đăng nhập:", error) }
}
const handleLogout = async () => { await signOut(auth) }
const handleOpenCart = () => { emit('openCart') }
const changeLanguage = (event) => {
  const newLang = event.target.value
  locale.value = newLang
  localStorage.setItem('user-lang', newLang)
}
</script>

<template>
  <header class="sticky top-0 z-100 bg-[#d70018] text-white shadow-md">
    <!-- MAIN HEADER BAR -->
    <div class="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2 lg:gap-4">
      
      <!-- LOGO -->
      <RouterLink to="/" class="flex items-center shrink-0 group">
        <div class="bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-colors flex items-center justify-center">
          <img :src="logoImg" alt="SPIT Vietnam Logo" class="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
        </div>
      </RouterLink>

      <!-- NÚT DANH MỤC (CELLPHONES STYLE) -->
      <RouterLink to="/products" class="hidden md:flex items-center gap-2 bg-red-700/70 hover:bg-red-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        <span class="hidden lg:inline">Danh mục</span>
      </RouterLink>

      <!-- THANH TÌM KIẾM TRUNG TÂM (CENTER SEARCH BAR) -->
      <div class="relative flex-1 max-w-2xl mx-1 md:mx-2">
        <div class="relative flex items-center">
          <input
            :value="searchQuery"
            @input="handleInput"
            @focus="isSearchFocused = true"
            @blur="handleBlur" 
            type="text"
            :placeholder="$t('nav.search') !== 'nav.search' ? $t('nav.search') : 'Bạn cần tìm sản phẩm, linh kiện gì...'"
            class="w-full bg-white text-slate-800 placeholder-slate-400 py-2 pl-9 pr-8 rounded-xl text-xs font-semibold outline-none shadow-inner border border-transparent focus:ring-2 focus:ring-yellow-300 transition-all"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          
          <button v-if="searchQuery" @click="emit('update:searchQuery', ''); searchStore.setSearchQuery('')" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- DROPDOWN KẾT QUẢ TÌM KIẾM -->
        <div v-if="isSearchFocused && suggestions.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
          <div class="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gợi ý tìm kiếm</span>
            <span class="text-[10px] text-primary font-bold">{{ suggestions.length }} kết quả</span>
          </div>
          <div v-for="p in suggestions" :key="p.id" @mousedown="selectSuggestion(p.id)" class="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
            <img :src="p.image" class="w-10 h-10 object-contain bg-slate-100 rounded-lg p-1 shrink-0" />
            <div class="overflow-hidden flex-1">
              <p class="text-[9px] font-black text-red-600 uppercase leading-none mb-1">{{ p.brand || 'SPIT' }}</p>
              <p class="text-[11px] font-bold text-slate-800 truncate leading-tight">{{ p[`name_${locale}`] || p.name }}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-300"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      <!-- TIỆN ÍCH PHẢI (RIGHT ACTION BUTTONS) -->
      <div class="flex items-center gap-1.5 lg:gap-2 shrink-0">

        <!-- HOTLINE / TƯ VẤN (HIDDEN MOBILE) -->
        <a href="tel:0900000000" class="hidden xl:flex items-center gap-2 bg-red-700/50 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-xl text-left transition-colors border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <div class="leading-tight">
            <p class="text-[9px] text-red-200 font-medium">Tư vấn mua hàng</p>
            <p class="text-[11px] font-black">0906 826 959</p>
          </div>
        </a>

        <!-- ĐƠN HÀNG -->
        <RouterLink to="/orders" class="hidden lg:flex items-center gap-1.5 bg-red-700/50 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span class="text-[11px]">Đơn hàng</span>
        </RouterLink>

        <!-- GIỎ HÀNG -->
        <button @click="handleOpenCart" class="relative flex items-center gap-1.5 bg-red-700/70 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/10">
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span v-if="cartCount > 0" class="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-yellow-400 text-red-900 text-[10px] font-black w-4 h-4 shadow-md animate-bounce">
              {{ cartCount }}
            </span>
          </div>
          <span class="hidden sm:inline text-[11px]">Giỏ hàng</span>
        </button>

        <!-- ĐĂNG NHẬP / TÀI KHOẢN -->
        <div class="flex items-center">
          <button v-if="!user" @click="loginWithGoogle" class="flex items-center gap-1.5 bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="hidden sm:inline">Đăng nhập</span>
          </button>

          <div v-else class="group relative flex items-center cursor-pointer">
            <div class="flex items-center gap-1.5 bg-red-700/60 hover:bg-red-800 px-2 py-1 rounded-xl border border-white/10">
              <img :src="user.photoURL" class="w-7 h-7 rounded-full border border-white object-cover" />
              <span class="hidden md:inline text-[10px] font-bold max-w-17.5 truncate">{{ user.displayName.split(' ').pop() }}</span>
            </div>

            <!-- DROPDOWN USER -->
            <div class="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="bg-white text-slate-800 shadow-2xl border border-slate-100 rounded-2xl py-2 w-48 overflow-hidden">
                <div class="px-4 py-2 border-b border-slate-100 bg-slate-50">
                  <p class="text-[9px] font-bold text-slate-400 uppercase">Tài khoản</p>
                  <p class="text-[11px] font-black text-slate-800 truncate">{{ user.displayName }}</p>
                </div>
                <RouterLink to="/orders" class="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
                  Đơn hàng của tôi
                </RouterLink>
                <button @click="handleLogout" class="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ĐỔI NGÔN NGỮ -->
        <select :value="locale" @change="changeLanguage" class="bg-red-800/80 text-white border border-white/20 rounded-xl px-1.5 py-1 text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-red-900">
          <option value="vi" class="text-slate-800">VN</option>
          <option value="en" class="text-slate-800">EN</option>
        </select>

        <!-- MOBILE HAMBURGER BUTTON -->
        <button @click="isMobileMenuOpen = true" class="md:hidden p-1.5 hover:bg-red-700 rounded-xl text-white ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

    </div>

    <!-- MOBILE DRAWER MENU -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-200 md:hidden">
      <div @click="isMobileMenuOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="absolute top-0 right-0 h-full w-80 bg-white text-slate-800 shadow-2xl flex flex-col p-6 animate-slide-in overflow-y-auto">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <span class="text-xs font-black uppercase tracking-wider text-slate-400">Menu chức năng</span>
          <button @click="isMobileMenuOpen = false" class="p-2 text-slate-400 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- USER MOBILE CARD -->
        <div v-if="user" class="mb-6 p-4 bg-slate-50 rounded-2xl flex flex-col gap-3 border border-slate-100">
          <div class="flex items-center gap-3">
            <img :src="user.photoURL" class="w-10 h-10 rounded-full border border-white shadow-sm" />
            <div class="overflow-hidden">
              <p class="text-xs font-black uppercase truncate text-slate-800">{{ user.displayName }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ user.email }}</p>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t border-slate-200/60">
            <RouterLink to="/orders" @click="isMobileMenuOpen = false" class="flex-1 text-center text-[10px] font-black uppercase text-white bg-red-600 py-2 rounded-xl">Đơn hàng</RouterLink>
            <button @click="handleLogout" class="px-3 text-[10px] text-red-600 font-bold uppercase hover:bg-red-50 rounded-xl">Đăng xuất</button>
          </div>
        </div>
        <button v-else @click="loginWithGoogle(); isMobileMenuOpen = false" class="mb-6 w-full py-3.5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg">Đăng nhập bằng Google</button>

        <!-- NAVIGATION LINKS -->
        <nav class="flex flex-col gap-2">
          <RouterLink v-for="item in ['home', 'about', 'products', 'contact']" 
                      :key="item" :to="item === 'home' ? '/' : '/' + item"
                      @click="isMobileMenuOpen = false"
                      class="text-xs font-black uppercase tracking-wider text-slate-700 hover:text-red-600 p-3 rounded-xl hover:bg-slate-50 flex justify-between items-center" 
                      active-class="text-red-600 bg-red-50">
            {{ $t('nav.' + item) !== 'nav.' + item ? $t('nav.' + item) : (item === 'about' ? 'Giới thiệu' : item) }}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
</style>