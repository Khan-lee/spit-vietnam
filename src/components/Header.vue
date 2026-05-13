<script setup>
import { ref, onMounted } from 'vue' 
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { auth, googleProvider } from '../firebase' 
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth' 

// Logo từ assets
import logoImg from '../assets/noBG_logo.png'

defineProps(['cartCount', 'searchQuery'])
const emit = defineEmits(['update:searchQuery', 'openCart'])

const { locale } = useI18n()
const isMobileMenuOpen = ref(false)
const user = ref(null) 

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (error) {
    console.error("Lỗi đăng nhập:", error)
  }
}

const handleLogout = async () => {
  await signOut(auth)
}

const handleOpenCart = () => {
  emit('openCart')
}

const changeLanguage = (event) => {
  const newLang = event.target.value
  locale.value = newLang
  localStorage.setItem('user-lang', newLang)
}
</script>

<template>
  <header class="flex justify-between items-center px-4 md:px-12 py-4 bg-white sticky top-0 z-100 border-b border-slate-100 shadow-sm">
    
    <RouterLink to="/" class="flex items-center group cursor-pointer h-10 md:h-20 shrink-0">
      <img :src="logoImg" alt="SPIT Vietnam Logo" class="max-h-full w-auto block transition-transform group-hover:-skew-x-6" />
    </RouterLink>

    <nav class="hidden lg:flex items-center gap-8 xl:gap-12 mx-4">
      <RouterLink v-for="item in ['home', 'about', 'products', 'contact']" :key="item" :to="item === 'home' ? '/' : '/' + item" 
                  class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition whitespace-nowrap" active-class="text-primary">
        {{ $t('nav.' + item) !== 'nav.' + item ? $t('nav.' + item) : (item === 'about' ? 'Giới thiệu' : item) }}
      </RouterLink>
    </nav>

    <div class="flex items-center gap-3 md:gap-5">
      
      <div class="relative hidden md:block group">
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', $event.target.value)"
          type="text"
          :placeholder="$t('nav.search')"
          class="bg-slate-100 py-2.5 px-6 pr-12 rounded-full text-[11px] font-bold outline-none w-40 lg:w-60 focus:w-72 transition-all border border-transparent focus:border-primary/20 shadow-inner"
        />
        <svg class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <select :value="locale" @change="changeLanguage"
              class="bg-slate-50 border-none rounded-xl px-2 py-1.5 text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-slate-100">
        <option value="vi">VN</option>
        <option value="en">EN</option>
      </select>
      
      <button @click="handleOpenCart" class="relative p-2 hover:bg-slate-50 rounded-full transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
        <span v-if="cartCount > 0" 
              class="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white text-[9px] font-black w-4 h-4 shadow-sm z-10"
              style="background-color: #888888; line-height: 1;">
          {{ cartCount }}
        </span>
      </button>

      <div class="flex items-center border-l border-slate-100 pl-4 ml-2">
        <button v-if="!user" @click="loginWithGoogle" 
                class="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all duration-300">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span class="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
            {{ $t('nav.login') !== 'nav.login' ? $t('nav.login') : 'Đăng nhập' }}
          </span>
        </button>
        
        <div v-else class="group relative flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <img :src="user.photoURL" class="w-9 h-9 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200" />
            <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          <div class="hidden lg:block text-left">
            <p class="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Welcome,</p>
            <p class="text-[10px] font-black uppercase tracking-tighter truncate max-w-20 leading-none">{{ user.displayName.split(' ').pop() }}</p>
          </div>

          <div class="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div class="bg-white shadow-2xl border border-slate-100 rounded-2xl py-2 w-44 overflow-hidden">
              <div class="px-4 py-2 border-b border-slate-50 mb-1">
                <p class="text-[10px] font-black uppercase truncate text-slate-400">{{ user.displayName }}</p>
              </div>
              
              <RouterLink to="/orders" class="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Đơn hàng
              </RouterLink>

              <button @click="handleLogout" class="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <button @click="isMobileMenuOpen = true" class="lg:hidden p-2 text-slate-900 ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>

    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-200 lg:hidden">
      <div @click="isMobileMenuOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col p-8 animate-slide-in">
        <button @click="isMobileMenuOpen = false" class="self-end p-2 text-slate-400 hover:text-primary mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div v-if="user" class="mb-8 p-4 bg-slate-50 rounded-2xl flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <img :src="user.photoURL" class="w-10 h-10 rounded-full border border-white shadow-sm" />
            <div class="overflow-hidden">
              <p class="text-[10px] font-black uppercase truncate">{{ user.displayName }}</p>
            </div>
          </div>
          <RouterLink to="/orders" @click="isMobileMenuOpen = false" class="text-[10px] font-black uppercase text-primary py-2 border-t border-slate-200 mt-1">
            Xem đơn hàng
          </RouterLink>
          <button @click="handleLogout" class="text-[9px] text-red-500 font-bold uppercase hover:underline text-left">Đăng xuất</button>
        </div>
        <button v-else @click="loginWithGoogle(); isMobileMenuOpen = false" class="mb-8 w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
          Đăng nhập bằng Google
        </button>

        <div class="mb-10 relative">
           <input
            :value="searchQuery"
            @input="emit('update:searchQuery', $event.target.value)"
            type="text"
            :placeholder="$t('nav.search')"
            class="w-full bg-slate-100 py-3 px-5 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-primary/20"
          />
        </div>
        
        <nav class="flex flex-col gap-6">
          <RouterLink v-for="item in ['home', 'about', 'products', 'contact']" 
                      :key="item" :to="item === 'home' ? '/' : '/' + item"
                      @click="isMobileMenuOpen = false"
                      class="text-sm font-black uppercase tracking-[0.2em] text-slate-800 border-b border-slate-50 pb-4 flex justify-between items-center" 
                      active-class="text-primary border-primary">
            {{ $t('nav.' + item) !== 'nav.' + item ? $t('nav.' + item) : (item === 'about' ? 'Giới thiệu' : item) }}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
          </RouterLink>
        </nav>

        <div class="mt-auto text-center">
           <p class="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">SPIT Vietnam Technology</p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>