<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue' 
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router' 
import { auth, googleProvider, db } from '../firebase' 
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth' 
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useSearchStore } from '../stores/search' 

import logoImg from '../assets/noBG_logo.png'

const props = defineProps(['cartCount', 'searchQuery', 'products']) 
const emit = defineEmits(['update:searchQuery', 'openCart'])

const { locale } = useI18n()
const router = useRouter()
const searchStore = useSearchStore()
const isMobileMenuOpen = ref(false)
const isSearchFocused = ref(false)
const user = ref(null) 

const selectedIndex = ref(-1)
const dynamicLogo = ref(logoImg)
const defaultAvatar = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'

// State lưu cấu hình website từ Firestore (Realtime)
const websiteSettings = ref({
  hotline: '0347527093',
  zalo: '0347527093'
})

// Chuẩn hóa số điện thoại dùng cho href tel:
const formatPhoneLink = (phone) => {
  if (!phone) return ''
  return String(phone).replace(/[^0-9+]/g, '')
}

const userDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.displayName || user.value.email?.split('@')[0] || 'Tài khoản'
})

const userShortName = computed(() => {
  if (!userDisplayName.value) return ''
  const parts = userDisplayName.value.trim().split(' ')
  return parts[parts.length - 1]
})

const fetchLogo = async () => {
  try {
    const docRef = doc(db, 'settings', 'logo')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists() && docSnap.data().url) {
      dynamicLogo.value = docSnap.data().url
    }
  } catch (error) {
    console.error("Lỗi khi tải logo động:", error)
  }
}

// Lắng nghe dữ liệu cấu hình website thời gian thực (Realtime)
const listenToWebsiteSettings = () => {
  const docRef = doc(db, 'settings', 'website')
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      websiteSettings.value = { ...websiteSettings.value, ...docSnap.data() }
    }
  }, (error) => {
    console.error("Lỗi khi kết nối tới settings/website:", error)
  })
}

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
  fetchLogo()
  listenToWebsiteSettings()
  searchStore.fetchProducts()
})

// 1. HÀM XÓA DẤU TIẾNG VIỆT CHUẨN
const removeAccents = (str) => {
  if (!str) return ''
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
}

// 2. HÀM LẤY TÊN SẢN PHẨM THEO ĐÚNG NGUÔN NGỮ (Y HỆT HOMEVIEW)
const getProductName = (p) => {
  if (!p) return ''
  const langKey = `name_${locale.value}`
  return p[langKey] || p.name || p.title || p.code || 'Sản phẩm'
}

// 3. LOGIC GỢI Ý TÌM KIẾM (ĐÃ ĐỒNG BỘ HOÀN TOÀN VỚI MAIN)
const suggestions = computed(() => {
  const rawQuery = (props.searchQuery || searchStore.searchQuery || '').trim()
  console.log('1. Từ khóa đang gõ:', rawQuery)
  console.log('2. Dữ liệu sản phẩm Header nhận được:', props.products || searchStore.products)
  if (!rawQuery) return []
  
  // Tự động lấy nguồn dữ liệu từ props hoặc searchStore
  const productList = (Array.isArray(props.products) && props.products.length > 0)
    ? props.products
    : (searchStore.products || [])

  if (!productList.length) return []
  
  const query = removeAccents(rawQuery)
  
  return productList.filter(p => {
    if (!p) return false
    const nameLocalized = p[`name_${locale.value}`] || ''
    const nameVi = p.name_vi || ''
    const nameEn = p.name_en || ''
    const name = p.name || ''
    const title = p.title || ''
    const code = p.code || p.sku || ''
    const brand = p.brand || ''
    
    const fullSearchText = removeAccents(`${nameLocalized} ${nameVi} ${nameEn} ${name} ${title} ${code} ${brand}`)
    return fullSearchText.includes(query)
  }).slice(0, 5)
})

watch(() => suggestions.value, () => {
  selectedIndex.value = -1
})

const getHighlightedParts = (text, query) => {
  if (!query || !text) return [{ text: text || '', match: false }]
  const normText = removeAccents(text)
  const normQuery = removeAccents(query.trim())
  const index = normText.indexOf(normQuery)
  
  if (index === -1) return [{ text, match: false }]
  
  return [
    { text: text.slice(0, index), match: false },
    { text: text.slice(index, index + query.trim().length), match: true },
    { text: text.slice(index + query.trim().length), match: false }
  ]
}

const handleBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}

const handleInput = (e) => {
  const value = e.target.value
  emit('update:searchQuery', value)
  searchStore.setSearchQuery(value)
}

// 4. HÀM TỰ ĐỘNG CUỘN XUỐNG KẾT QUẢ TÌM KIẾM
const scrollToSearchResults = () => {
  setTimeout(() => {
    const el = document.getElementById('search-results')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 150)
}

// 5. XỬ LÝ PHÍM ENTER VÀ MŨI TÊN
const handleKeyDown = (e) => {
  if (e.key === 'ArrowDown') {
    if (!isSearchFocused.value) isSearchFocused.value = true
    e.preventDefault()
    if (suggestions.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      selectSuggestion(suggestions.value[selectedIndex.value].id)
    } else {
      isSearchFocused.value = false
      if (router.currentRoute.value.path !== '/') {
        router.push('/').then(() => scrollToSearchResults())
      } else {
        scrollToSearchResults()
      }
    }
  } else if (e.key === 'Escape') {
    isSearchFocused.value = false
  }
}

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
  <header class="sticky top-0 z-100 bg-primary text-white shadow-md">
    <!-- MAIN HEADER BAR -->
    <div class="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2 lg:gap-4">
      
      <!-- LOGO -->
      <RouterLink to="/" class="flex items-center shrink-0 group">
        <div class="transition-colors flex items-center justify-center rounded-xl overflow-hidden">
          <img :src="dynamicLogo" alt="Logo" class="h-10 md:h-12 w-auto max-w-45 object-contain transition-transform group-hover:scale-105" />
        </div>
      </RouterLink>

      <!-- THANH TÌM KIẾM TRUNG TÂM (CENTER SEARCH BAR) -->
      <div class="relative flex-1 max-w-2xl mx-1 md:mx-2">
        <div class="relative flex items-center">
          <input 
            type="text" 
            :value="searchQuery"
            @input="handleInput"
            @focus="isSearchFocused = true"
            @blur="handleBlur"
            @keydown="handleKeyDown"
            placeholder="Tìm kiếm sản phẩm, mã dao..."
            class="w-full pl-10 pr-10 py-2 bg-white text-slate-900 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          
          <button v-if="searchQuery" @click="emit('update:searchQuery', ''); searchStore.setSearchQuery('')" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- DROPDOWN KẾT QUẢ TÌM KIẾM -->
        <div 
          v-if="isSearchFocused && searchQuery && searchQuery.trim()" 
          class="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in"
        >
          <template v-if="suggestions.length > 0">
            <div class="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gợi ý tìm kiếm</span>
              <span class="text-[10px] text-primary font-bold">{{ suggestions.length }} kết quả</span>
            </div>
            <div 
              v-for="(p, index) in suggestions" 
              :key="p.id" 
              @mousedown="selectSuggestion(p.id)"
              @mouseenter="selectedIndex = index"
              :class="[
                'flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-0',
                selectedIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'
              ]"
            >
              <img :src="p.image || p.img" class="w-10 h-10 object-contain bg-slate-100 rounded-lg p-1 shrink-0" />
              <div class="overflow-hidden flex-1">
                <p class="text-[9px] font-black text-red-600 uppercase leading-none mb-1">{{ p.brand || 'SPIT' }}</p>
                
                <!-- HIỂN THỊ TÊN VÀ HIGHLIGHT CỦA SẢN PHẨM -->
                <p class="text-[11px] font-bold text-slate-800 truncate leading-tight">
                  <span 
                    v-for="(part, i) in getHighlightedParts(getProductName(p), searchQuery)" 
                    :key="i"
                    :class="{ 'text-red-600 bg-yellow-200/80 rounded-xs px-0.5': part.match }"
                  >
                    {{ part.text }}
                  </span>
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-slate-300"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </template>

          <div v-else class="p-4 text-center text-slate-400 text-xs font-medium">
            Không tìm thấy sản phẩm phù hợp cho "<span class="text-slate-700 font-bold">{{ searchQuery }}</span>"
          </div>
        </div>
      </div>

      <!-- TIỆN ÍCH PHẢI (RIGHT ACTION BUTTONS) -->
      <div class="flex items-center gap-1.5 lg:gap-2 shrink-0">

        <!-- HOTLINE / TƯ VẤN (HIDDEN MOBILE) - ĐỒNG BỘ REALTIME TỪ FIRESTORE -->
        <a 
          :href="'tel:' + formatPhoneLink(websiteSettings.hotline)" 
          class="hidden xl:flex items-center gap-2 bg-red-700/50 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-xl text-left transition-colors border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <div class="leading-tight">
            <p class="text-[9px] text-red-200 font-medium">Tư vấn mua hàng</p>
            <p class="text-[11px] font-black">{{ websiteSettings.hotline || '0347527093' }}</p>
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
              <img :src="user.photoURL || defaultAvatar" class="w-7 h-7 rounded-full border border-white object-cover" />
              <span class="hidden md:inline text-[10px] font-bold max-w-17.5 truncate">{{ userShortName }}</span>
            </div>

            <!-- DROPDOWN USER -->
            <div class="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="bg-white text-slate-800 shadow-2xl border border-slate-100 rounded-2xl py-2 w-48 overflow-hidden">
                <div class="px-4 py-2 border-b border-slate-100 bg-slate-50">
                  <p class="text-[9px] font-bold text-slate-400 uppercase">Tài khoản</p>
                  <p class="text-[11px] font-black text-slate-800 truncate">{{ userDisplayName }}</p>
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
            <img :src="user.photoURL || defaultAvatar" class="w-10 h-10 rounded-full border border-white shadow-sm object-cover" />
            <div class="overflow-hidden">
              <p class="text-xs font-black uppercase truncate text-slate-800">{{ userDisplayName }}</p>
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
          <RouterLink v-for="item in ['home', 'contact']" 
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