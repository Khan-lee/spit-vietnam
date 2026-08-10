<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 
import BrandMarquee from '../components/BrandMarquee.vue'
import HomeProductFilter from '../components/HomeProductFilter.vue' 
import { useSearchStore } from '../stores/search' 

// Import Swiper Vue.js components & modules
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

const { locale, t } = useI18n()
const searchStore = useSearchStore()
// Biến lưu thương hiệu đang được chọn tạm thời trong Mega Menu
const activeFlyoutBrand = ref(null)

const products = ref([])
const promotions = ref([]) 
const categoryDocs = ref([])
const mainBanners = ref([])
const isLoading = ref(true)
const currentTime = ref(new Date()) 

const dynamicHotSaleBanner = ref('https://via.placeholder.com/300x500/dc2626/ffffff?text=HOT+SALE')

const fetchSettings = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'home_config'))
    if (docSnap.exists() && docSnap.data().hotSaleBanner) {
      dynamicHotSaleBanner.value = docSnap.data().hotSaleBanner
    }
  } catch (e) {
    console.error("Lỗi lấy config trang chủ:", e)
  }
}

const filteredHomeProducts = ref([])

const handleFilteredProducts = (newProducts) => {
  filteredHomeProducts.value = newProducts;
};

const isFiltering = ref(false);

const handleFilterState = (state) => {
  isFiltering.value = state
}

const swiperModules = [Autoplay, Pagination, Navigation, EffectFade]

const activeHoverCategory = ref(null)

// ==========================================
// --- LOGIC MEGA MENU FILTER & SMOOTH SCROLL ---
// ==========================================
const selectedCategory = ref('') // Danh mục được chọn từ Mega Menu
const selectedBrand = ref('')    // Thương hiệu được chọn từ Mega Menu
const featuredSectionRef = ref(null) // Ref gắn vào thẻ <section> Sản phẩm nổi bật

// Hàm kích hoạt khi người dùng click vào một Hãng trong Mega Menu Popover
const handleSelectBrand = (catName, brandName) => {
  selectedCategory.value = catName
  selectedBrand.value = brandName

  // Cuộn mượt màn hình xuống Bảng Sản Phẩm Nổi Bật
  if (featuredSectionRef.value) {
    featuredSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Xóa bộ lọc thương hiệu quay về xem tất cả
const clearBrandFilter = () => {
  selectedBrand.value = ''
}

// Danh sách sản phẩm nổi bật tự động lọc theo Category & Brand
const featuredProductsFiltered = computed(() => {
  let result = products.value

  // Lọc theo Category nếu có chọn
  if (selectedCategory.value) {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    result = result.filter(p => {
      const pCat = p[catField] || p.category || p.category_name
      return pCat === selectedCategory.value
    })
  }

  // Lọc theo Thương hiệu nếu có chọn
  if (selectedBrand.value) {
    result = result.filter(p => p.brand === selectedBrand.value)
  }

  return result
})
// ==========================================

const getSubCategoriesOrBrands = (catName) => {
  const prods = getProductsByCategory(catName)
  const brands = [...new Set(prods.map(p => p.brand).filter(Boolean))]
  return brands
}

const categoryBanners = ref({
  'Dụng cụ cắt gọt': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
  'Thiết bị đo lường': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800',
  'Phụ kiện máy': 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=800',
})

const fallbackMainBanners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070',
    useI18n: true 
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070',
    title: 'GIẢI PHÁP GIA CÔNG CHÍNH XÁC',
    subtitle: 'CHƯƠNG TRÌNH ĐỒNG HÀNH CÙNG DOANH NGHIỆP',
    desc: 'Tặng cán dao tiện khi đặt hàng số lượng lớn các dòng mảnh cắt insert trong tháng này.',
    useI18n: false
  }
]

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  fetchData()
  fetchSettings()
})

onUnmounted(() => clearInterval(timer))

const fetchData = async () => {
  try {
    const [prodSnap, promoSnap, bannerSnap, catSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "promotions")),
      getDocs(collection(db, "banners")),
      getDocs(collection(db, "categories"))
    ])
    
    products.value = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    promotions.value = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    categoryDocs.value = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const fetchedBanners = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (fetchedBanners.length > 0) {
      fetchedBanners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      const main = fetchedBanners.filter(b => b.position === 'main' || !b.position)
      mainBanners.value = main.length > 0 ? main : fallbackMainBanners
    } else {
      mainBanners.value = fallbackMainBanners
    }
  } catch (e) { 
    console.error("Lỗi đồng bộ Firestore:", e) 
  } finally { 
    isLoading.value = false 
  }
}

const getActivePromo = (product) => {
  return promotions.value.find(p => {
    const start = p.start_date ? new Date(p.start_date) : null
    const end = p.end_date ? new Date(p.end_date) : null
    const isTimeValid = (!start || currentTime.value >= start) && (!end || currentTime.value <= end)
    return p.is_active && isTimeValid && (p.apply_to === 'all' || p.applied_ids?.includes(product.id))
  })
}

const getSalePrice = (product) => {
  const activePromo = getActivePromo(product)
  if (!activePromo || !activePromo.tiers || activePromo.tiers.length === 0) return null
  const firstTier = activePromo.tiers[0]
  if (firstTier.discount_type === 'percentage') {
    return product.price * (1 - firstTier.discount_value / 100)
  }
  return product.price - firstTier.discount_value
}

const getDiscountPercent = (product) => {
  const activePromo = getActivePromo(product)
  if (!activePromo || !activePromo.tiers || activePromo.tiers.length === 0) return 0
  const firstTier = activePromo.tiers[0]
  if (firstTier.discount_type === 'percentage') {
    return Math.round(firstTier.discount_value)
  }
  if (product.price) {
    return Math.round((firstTier.discount_value / product.price) * 100)
  }
  return 0
}

const activeBannerPromo = computed(() => {
  return promotions.value
    .filter(p => {
      const end = p.end_date ? new Date(p.end_date) : null
      return p.is_active && (!end || end > currentTime.value)
    })
    .sort((a, b) => (b.apply_to === 'all' ? 1 : -1))[0] 
})

const getCountdown = (endDate) => {
  if (!endDate) return null
  const diff = new Date(endDate) - currentTime.value
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60 * 60)) / 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const categories = computed(() => {
  const activeCats = categoryDocs.value
    .filter(c => c.isActive === true)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => {
      const catField = locale.value === 'vi' ? 'name_vi' : 'name_en'
      return c[catField] || c.name || c.category || c.id
    })
  return [...new Set(activeCats)]
})

const filteredProducts = computed(() => {
  let result = products.value
  if (searchStore.searchQuery && searchStore.searchQuery.trim() !== '') {
    const query = searchStore.searchQuery.toLowerCase().trim()
    result = result.filter(p => {
      const name = (p[`name_${locale.value}`] || p.name || '').toLowerCase()
      const brand = (p.brand || '').toLowerCase()
      return name.includes(query) || brand.includes(query)
    })
  }
  return result
})


// ==========================================
// --- LOGIC BỘ LỌC 2 TẦNG (HOT SALE CELLPHONES) ---
// ==========================================
const activePromoCategory = ref('all') 
const activePromoBrand = ref('all')    
const promoScrollContainer = ref(null) 

const allPromoProducts = computed(() => {
  return products.value.filter(p => getSalePrice(p) !== null)
})

const promoCategories = computed(() => {
  const cats = [...new Set(allPromoProducts.value.map(p => {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    return p[catField] || p.category || p.category_name || 'Khác'
  }).filter(Boolean))]

  return [
    { id: 'all', name: locale.value === 'vi' ? 'Tất cả' : 'All' },
    ...cats.map(c => ({ id: c, name: c }))
  ]
})

// Tự động load danh sách hãng dựa trên danh mục đang chọn
const promoBrands = computed(() => {
  let prods = allPromoProducts.value

  if (activePromoCategory.value !== 'all') {
    prods = prods.filter(p => {
      const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
      const pCat = p[catField] || p.category || p.category_name || 'Khác'
      return pCat === activePromoCategory.value
    })
  }

  const brands = [...new Set(prods.map(p => p.brand).filter(Boolean))]
  return [
    { id: 'all', name: locale.value === 'vi' ? 'Tất cả' : 'All' },
    ...brands.map(b => ({ id: b, name: b }))
  ]
})

// Khi chọn Danh mục, tự động reset filter Thương hiệu về 'Tất cả'
const selectPromoCategory = (catId) => {
  activePromoCategory.value = catId
  activePromoBrand.value = 'all'
}

// Lọc mảng sản phẩm cuối cùng dựa trên cả 2 điều kiện
const promoProducts = computed(() => {
  let hots = allPromoProducts.value

  // Lọc theo Danh mục
  if (activePromoCategory.value !== 'all') {
    hots = hots.filter(p => {
      const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
      const pCat = p[catField] || p.category || p.category_name || 'Khác'
      return pCat === activePromoCategory.value
    })
  }

  // Lọc theo Thương hiệu
  if (activePromoBrand.value !== 'all') {
    hots = hots.filter(p => p.brand === activePromoBrand.value)
  }

  return hots
})

const scrollPromoLeft = () => {
  if (promoScrollContainer.value) {
    promoScrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollPromoRight = () => {
  if (promoScrollContainer.value) {
    promoScrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}
// ==========================================


const topFlashSaleProducts = computed(() => {
  let hots = [...allPromoProducts.value] 
  hots.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
  return hots.slice(0, 5)
})

const hotProducts = computed(() => {
  let hots = [...allPromoProducts.value]
  if (hots.length < 4) {
    const additional = products.value.filter(p => !hots.some(hp => hp.id === p.id)) 
    hots = [...hots, ...additional]
  }
  return hots.slice(0, 4)
})

const getProductsByCategory = (catName) => {
  const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
  const catDoc = categoryDocs.value.find(c => {
    const nameField = locale.value === 'vi' ? 'name_vi' : 'name_en'
    return (c[nameField] || c.name || c.category || c.id) === catName
  })

  return products.value.filter(p => {
    const pCat = p[catField] || p.category || p.category_name
    if (pCat === catName) return true
    if (catDoc && (p.categoryId === catDoc.id || p.category_id === catDoc.id)) return true
    return false
  })
}

const getCategoryBanner = (catName) => {
  const catDoc = categoryDocs.value.find(c => {
    const nameField = locale.value === 'vi' ? 'name_vi' : 'name_en'
    return (c[nameField] || c.name || c.category || c.id) === catName
  })

  if (catDoc && (catDoc.banner || catDoc.image || catDoc.bannerUrl)) {
    return catDoc.banner || catDoc.image || catDoc.bannerUrl
  }

  return categoryBanners.value[catName] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800'
}
</script>

<template>
  <div class="bg-slate-50 font-sans antialiased text-slate-900 pb-12">
    
    <!-- 1. Thanh Campaign Khuyến Mãi Đầu Trang -->
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-red-700 via-red-600 to-red-700 text-white py-2.5 shadow-md z-50">
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <span class="bg-yellow-400 text-red-950 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shadow-sm">🔥 HOT SALE</span>
              <span class="text-xs font-bold uppercase tracking-wide">
  {{ activeBannerPromo.title }}: ƯU ĐÃI ĐẾN 
  {{ activeBannerPromo.tiers?.[0]?.discount_value?.toLocaleString('vi-VN') }}
  {{ activeBannerPromo.tiers?.[0]?.discount_type === 'percentage' ? '%' : ' VNĐ' }}
</span>
              <span v-if="activeBannerPromo.end_date" class="text-[11px] font-mono text-yellow-200 bg-black/20 px-2.5 py-1 rounded-full border border-yellow-400/30">
                Kết thúc sau: {{ getCountdown(activeBannerPromo.end_date) }}
              </span>
              <span class="text-white/40 text-xs"></span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. Khối Hero Slider & Sidebar Danh Mục (CellphoneS Style) -->
    <section class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        <!-- Sidebar Danh mục sản phẩm (Bên trái) -->
<!-- Sidebar Danh mục sản phẩm (Bên trái) -->
<aside 
  class="hidden lg:flex flex-col lg:col-span-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 p-2.5 relative z-40"
  @mouseleave="activeHoverCategory = null; activeFlyoutBrand = null"
>
  <div class="text-xs font-black uppercase text-slate-400 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      Danh mục
    </span>
  </div>

  <!-- Danh sách các danh mục chính -->
  <ul class="divide-y divide-slate-50 my-1 grow">
    <li 
      v-for="cat in categories" 
      :key="cat"
      @mouseenter="activeHoverCategory = cat; activeFlyoutBrand = null"
      class="group"
    >
      <router-link 
        :to="'/products?category=' + cat" 
        class="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold"
        :class="activeHoverCategory === cat ? 'bg-red-50 text-red-600 shadow-inner' : 'text-slate-700 hover:bg-slate-50 hover:text-red-600'"
      >
        <span class="truncate">{{ cat }}</span>
        <span class="text-slate-300 group-hover:text-red-600 transition-transform duration-300 group-hover:translate-x-1">&rsaquo;</span>
      </router-link>
    </li>
  </ul>

  <!-- MEGA MENU FLYOUT -->
  <Transition name="fade-fast">
    <div 
      v-if="activeHoverCategory" 
      class="absolute top-0 left-[102%] w-150 min-h-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 grid grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="col-span-2 space-y-5">
        <div>
          <h3 class="text-sm font-black uppercase text-red-600 tracking-wider mb-3 border-b border-red-100 pb-2 flex items-center gap-2">
            {{ activeHoverCategory }}
          </h3>
          
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Thương hiệu hàng đầu</p>
            <!-- Nút hủy chọn thương hiệu khi đang lọc -->
          </div>

          <!-- NÚT LỌC THƯƠNG HIỆU -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button 
              v-for="brand in getSubCategoriesOrBrands(activeHoverCategory)" 
              :key="brand"
              @click="activeFlyoutBrand = (activeFlyoutBrand === brand ? null : brand)"
              class="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer border"
              :class="activeFlyoutBrand === brand 
                ? 'bg-red-600 text-white border-red-600 shadow-md font-bold' 
                : 'bg-slate-50 hover:bg-red-600 hover:text-white border-slate-100 hover:border-red-600 text-slate-600'"
            >
              {{ brand }}
            </button>

            <span v-if="getSubCategoriesOrBrands(activeHoverCategory).length === 0" class="text-xs text-slate-400 italic py-1">
              Đang cập nhật thương hiệu...
            </span>
          </div>
        </div>

        <!-- KHUNG SẢN PHẨM NỔI BẬT NẰM TRONG KHUNG LỌC -->
        <div>
          <p class="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wide flex items-center justify-between">
            <span>Sản phẩm nổi bật</span>
            <span v-if="activeFlyoutBrand" class="text-red-600 font-extrabold lowercase">
              ({{ activeFlyoutBrand }})
            </span>
          </p>

          <div class="grid grid-cols-2 gap-3">
            <router-link 
              v-for="p in getProductsByCategory(activeHoverCategory)
                .filter(p => !activeFlyoutBrand || (p.brand && p.brand.toLowerCase() === activeFlyoutBrand.toLowerCase()))
                .slice(0, 4)" 
              :key="p.id"
              :to="'/product/' + p.id"
              class="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50/80 border border-slate-100 transition-all duration-200 group shadow-sm hover:shadow"
            >
              <div class="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                <img :src="p.image" :alt="p.name" class="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div class="overflow-hidden flex-1">
                <p class="text-[11px] font-bold text-slate-700 truncate group-hover:text-red-600 mb-0.5">{{ p[`name_${locale}`] || p.name }}</p>
                <p class="text-[11px] font-black text-red-600">{{ (getSalePrice(p) || p.price)?.toLocaleString() }}đ</p>
              </div>
            </router-link>

            <!-- Trường hợp thương hiệu được chọn không có sản phẩm nào -->
            <div 
              v-if="getProductsByCategory(activeHoverCategory).filter(p => !activeFlyoutBrand || (p.brand && p.brand.toLowerCase() === activeFlyoutBrand.toLowerCase())).length === 0" 
              class="col-span-2 text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              Chưa có sản phẩm nổi bật cho thương hiệu <strong>{{ activeFlyoutBrand }}</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- Banner phải trong Mega Menu -->
      <div class="col-span-1 border-l border-slate-100 pl-5 flex flex-col h-full">
        <div class="relative rounded-xl overflow-hidden h-full min-h-55 bg-slate-900 group/banner shadow-inner">
          <img :src="getCategoryBanner(activeHoverCategory)" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/banner:scale-110 group-hover/banner:opacity-70 transition-all duration-500 ease-out" />
          <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div class="relative z-10 h-full p-4 flex flex-col justify-end text-white">
            <span class="inline-block bg-yellow-400 text-slate-900 text-[9px] font-black uppercase px-2 py-0.5 rounded w-max mb-1.5">Nổi bật</span>
            <p class="text-sm font-black leading-snug mb-3 line-clamp-2 drop-shadow-md">{{ activeHoverCategory }}</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <div class="bg-linear-to-br from-red-50 to-red-100/50 border border-red-100 rounded-xl p-3 text-center mt-2 group cursor-pointer hover:border-red-300 transition-colors">
    <p class="text-[10px] text-primary font-bold uppercase tracking-wide">Hotline Tư Vấn Kỹ Thuật</p>
    <p class="text-sm font-black text-primary mt-1 flex items-center justify-center gap-1.5 group-hover:scale-105 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
      0347527093
    </p>
  </div>
</aside>

        <!-- Banner Swiper chính -->
        <div class="lg:col-span-9 h-70 sm:h-87.5 lg:h-105 rounded-2xl overflow-hidden shadow-md group relative">
          <swiper
            v-if="mainBanners.length > 0"
            :modules="swiperModules"
            :slides-per-view="1"
            :loop="mainBanners.length > 1"
            :effect="'fade'"
            :autoplay="mainBanners.length > 1 ? { delay: 5000, disableOnInteraction: false } : false"
            :pagination="{ clickable: true, dynamicBullets: true }"
            :navigation="true"
            class="h-full w-full custom-swiper bg-slate-900"
          >
            <swiper-slide v-for="banner in mainBanners" :key="banner.id" class="overflow-hidden">
              <div class="relative h-full w-full flex items-center md:items-end p-6 md:p-12 lg:p-16">
                <!-- Ảnh nền -->
                <img :src="banner.image" class="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-10000 ease-linear scale-100 hover:scale-110" />
                
                <!-- Lớp phủ gradient -->
                <div class="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-slate-950/90 via-slate-900/60 to-transparent z-1"></div>
                
                <!-- Content text -->
                <div class="relative z-10 w-full max-w-2xl space-y-3 md:space-y-4 text-white transform translate-y-4 md:translate-y-0">
                  <template v-if="banner.useI18n">
                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-lg leading-tight" v-html="$t('home.hero_title')"></h1>
                    <p class="text-slate-200 text-sm md:text-base line-clamp-3 md:max-w-xl font-medium drop-shadow">{{ $t('home.hero_subtitle') }}</p>
                  </template>
                  <template v-else>
                    <span v-if="banner.subtitle" class="bg-red-600/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold uppercase px-3 py-1 rounded-md inline-block shadow-md tracking-wider">
                      {{ banner.subtitle }}
                    </span>
                    <h1 v-if="banner.title" class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-lg leading-tight" v-html="banner.title"></h1>
                    <p v-if="banner.desc" class="text-slate-200 text-sm md:text-base line-clamp-3 md:max-w-xl font-medium opacity-95 drop-shadow">{{ banner.desc }}</p>
                  </template>

                  <div class="pt-4 md:pt-6">
                  </div>
                </div>
              </div>
            </swiper-slide>
          </swiper>
          
          <!-- Fallback khi đang load banner -->
          <div v-else class="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
            <svg class="w-10 h-10 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>
        </div>
      </div>
    </section>

    <!-- === SECTION SẢN PHẨM HOT / BÁN CHẠY NẰM NGANG === -->
    <section class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-4">
  <div class="w-full bg-linear-to-r from-red-50 via-white to-orange-50 rounded-2xl border border-red-200 p-3 shadow-sm flex flex-col md:flex-row gap-4 items-stretch overflow-hidden relative">
    <!-- Hiệu ứng viền sáng -->
    <div class="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 to-orange-400"></div>

    <!-- CỘT TRÁI: BANNER NỔI BẬT (ĐÃ UPDATE ĐỒNG BỘ ẢNH DYNAMIC) -->
    <div class="w-full md:w-1/5 shrink-0 rounded-xl overflow-hidden relative group cursor-pointer shadow-sm min-h-50">
      <img :src="dynamicHotSaleBanner" alt="Hot Sale Banner" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
        <h3 class="text-primary font-black text-lg uppercase leading-tight">Top<br>Bán Chạy</h3>
        <!--<p class="text-white/80 text-[10px] mt-1">Sản phẩm được mua nhiều nhất</p>-->
      </div>
    </div>

    <!-- CỘT PHẢI: 4 SẢN PHẨM HOT -->
    <div class="w-full md:w-4/5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div 
        v-for="product in hotProducts" 
        :key="'hot-' + product.id"
        class="bg-white rounded-xl p-3 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-red-400 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
      >
        <!-- Badge HOT -->
        <div class="absolute top-2 left-2 z-20 bg-linear-to-r from-red-600 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
          🔥 HOT
        </div>
        
        <div>
          <div class="aspect-square bg-white rounded-lg overflow-hidden mb-2 p-1 flex items-center justify-center">
             <img :src="product.image" :alt="product[`name_${locale}`] || product.name" class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <p class="text-[10px] font-bold text-slate-400 uppercase block mb-0.5 truncate">{{ product.brand || 'Khác' }}</p>
          
          <h4 class="text-xs font-bold text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors leading-tight">
            {{ product[`name_${locale}`] || product.name }}
          </h4>
        </div>
        
        <!-- PHẦN GIÁ TO + NÚT CATALOG -->
        <div class="mt-3 pt-2 border-t border-slate-100">
           <div class="flex items-baseline gap-1 flex-wrap">
             <span class="text-base sm:text-lg font-black text-red-600">
               {{ (getSalePrice(product) || product.price || 0).toLocaleString('vi-VN') }}đ
             </span>
             <span v-if="getSalePrice(product)" class="text-[10px] text-slate-400 line-through font-medium">
               {{ (product.price || 0).toLocaleString('vi-VN') }}đ
             </span>
           </div>

           <!-- Nút Xem Catalog -->
           <a 
             v-if="product.catalog_link || product.catalog || product.catalog_url || product.pdf"
             :href="product.catalog_link || product.catalog || product.catalog_url || product.pdf" 
             target="_blank"
             @click.stop
             class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
           >
             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
           </a>
        </div>

        <!-- Layer click nhảy sang trang chi tiết -->
        <router-link :to="'/product/' + product.id" class="absolute inset-0 z-10"></router-link>
      </div>
    </div>
  </div>
</section>

<!-- 4. MAIN CONTENT AREA -->
<main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-6">
  
  <!-- Loading Indicator -->
  <div v-if="isLoading" class="bg-white rounded-2xl p-12 text-center border border-slate-200">
    <div class="inline-block animate-spin text-3xl mb-2 text-red-600">🌀</div>
    <p class="font-bold text-slate-400 uppercase tracking-widest text-xs">{{ $t('product.processing') }}</p>
  </div>

  <div v-else>
    <!-- KẾT QUẢ TÌM KIẾM TỪ SEARCH BAR -->
    <div v-if="searchStore.searchQuery && searchStore.searchQuery.trim() !== ''" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        🔍 Kết quả tìm kiếm cho: <span class="text-red-600">"{{ searchStore.searchQuery }}"</span>
      </h2>
      
      <div v-if="filteredProducts.length === 0" class="text-center py-12">
        <p class="text-slate-400 font-semibold uppercase tracking-wider text-xs">Không tìm thấy sản phẩm nào phù hợp</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div v-for="p in filteredProducts" :key="p.id" 
             class="group bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
          
          <div>
            <div v-if="getDiscountPercent(p) > 0" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
              Giảm {{ getDiscountPercent(p) }}%
            </div>
            <div class="h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/30 transition-colors">
              <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">{{ p.brand }}</span>
              <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                {{ p[`name_${locale}`] || p.name }}
              </h3>
            </div>
          </div>

          <!-- PHẦN GIÁ TO + NÚT CATALOG -->
          <div class="mt-3 pt-2 border-t border-slate-100">
            <div v-if="getSalePrice(p)" class="flex items-baseline gap-1 flex-wrap">
              <span class="text-sm sm:text-base font-black text-red-600">
                {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
              </span>
              <span class="text-[10px] text-slate-400 line-through font-medium">
                {{ p.price?.toLocaleString() }}đ
              </span>
            </div>
            <div v-else class="text-sm sm:text-base font-black text-red-600">
              {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ giá' }}
            </div>

            <!-- Nút Xem Catalog -->
            <a 
              v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
              :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
              target="_blank"
              @click.stop
              class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
            </a>
          </div>

          <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
        </div>
      </div>
    </div>

    <!-- MÀN HÌNH CHÍNH (Cột Filter Trái và Cột Content Phải) -->
    <div v-else class="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">

      <!-- CỘT TRÁI: BỘ LỌC ĐA TIÊU CHÍ (STICKY) -->
      <HomeProductFilter 
        :products="products" 
        :categories="categories" 
        @update:filteredProducts="handleFilteredProducts"
        @update:isFiltering="isFiltering = $event" 
      />

      <!-- CỘT PHẢI: KẾT QUẢ VÀ CÁC KHỐI DANH MỤC -->
      <div class="flex-1 w-full min-w-0 space-y-6">
        
        <!-- Lưới Kết Quả từ Bộ Lọc -->
        <div v-if="isFiltering" class="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
              <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Kết Quả Lọc Sản Phẩm
              </h2>
            </div>
          </div>

          <!-- Trạng thái: Có kết quả -->
          <div v-if="filteredHomeProducts && filteredHomeProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <div v-for="p in filteredHomeProducts" :key="p.id" 
                 class="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
              
              <div>
                <div v-if="getDiscountPercent(p) > 0" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
                  Giảm {{ getDiscountPercent(p) }}%
                </div>

                <div class="h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
                  <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>

                <div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">{{ p.brand }}</span>
                  <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                    {{ p[`name_${locale}`] || p.name }}
                  </h3>
                </div>
              </div>

              <!-- PHẦN GIÁ TO + NÚT CATALOG -->
              <div class="mt-3 pt-2 border-t border-slate-100">
                <div v-if="getSalePrice(p)" class="flex items-baseline gap-1 flex-wrap">
                  <span class="text-sm sm:text-base font-black text-red-600">
                    {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                  </span>
                  <span class="text-[10px] text-slate-400 line-through font-medium">
                    {{ p.price?.toLocaleString() }}đ
                  </span>
                </div>
                <div v-else class="text-sm sm:text-base font-black text-red-600">
                  {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ giá' }}
                </div>

                <!-- Nút Xem Catalog -->
                <a 
                  v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
                  :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
                  target="_blank"
                  @click.stop
                  class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
                </a>
              </div>

              <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
            </div>
          </div>

          <!-- Trạng thái: Không có kết quả -->
          <div v-else class="text-center py-10">
            <p class="text-slate-400 font-semibold uppercase tracking-wider text-xs">Không tìm thấy sản phẩm nào phù hợp với bộ lọc</p>
          </div>
        </div>
        
        <!-- BỌC CÁC KHỐI CÒN LẠI ĐỂ ẨN ĐI KHI ĐANG LỌC -->
        <div v-show="!isFiltering" class="space-y-6">
          
          <!-- 5. Khối HOT SALE GIÁ SỐC -->
          <div v-if="promoProducts.length > 0" class="bg-white border-2 border-red-500 rounded-3xl overflow-hidden shadow-sm flex flex-col relative">
            
            <!-- Header Nền Đỏ -->
            <div class="bg-linear-to-r from-red-700 via-red-600 to-red-700 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <h2 class="text-xl sm:text-2xl font-black uppercase italic tracking-wider flex items-center gap-1.5 text-yellow-300 drop-shadow-md">
                  HOT SALE GIÁ SỐC
                </h2>
              </div>
              <div v-if="activeBannerPromo?.end_date" class="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-400/40 shadow-inner">
                <span class="text-xs font-semibold text-slate-200">Kết thúc sau:</span>
                <span class="font-mono text-sm font-black text-yellow-300">{{ getCountdown(activeBannerPromo.end_date) }}</span>
              </div>
            </div>

            <!-- Khu vực Nội dung (Nền sáng chứa Slider & Filter) -->
            <div class="p-4 sm:p-6 bg-red-50/20 relative group/promo">
              
              <!-- Bộ lọc 2 Tầng riêng cho Deal Sốc -->
              <div class="space-y-2.5 mb-5">
                <!-- Tầng 1: Lọc Danh Mục -->
                <div class="flex overflow-x-auto gap-2 sm:gap-3 pb-1 scrollbar-hide">
                  <button
                    v-for="cat in promoCategories" 
                    :key="cat.id"
                    @click="selectPromoCategory(cat.id)"
                    :class="[
                      'px-4 py-1.5 rounded-full border whitespace-nowrap text-xs sm:text-sm font-bold transition-all',
                      activePromoCategory === cat.id 
                        ? 'border-red-500 bg-red-500 text-white shadow-md' 
                        : 'border-red-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50'
                    ]"
                  >
                    {{ cat.name }}
                  </button>
                </div>

                <!-- Tầng 2: Lọc Thương Hiệu -->
                <div v-if="promoBrands.length > 1" class="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                  <button
                    v-for="brand in promoBrands" 
                    :key="brand.id"
                    @click="activePromoBrand = brand.id"
                    :class="[
                      'px-3 py-1 rounded-full border whitespace-nowrap text-[11px] sm:text-xs font-bold transition-all',
                      activePromoBrand === brand.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    ]"
                  >
                    {{ brand.name }}
                  </button>
                </div>
              </div>

              <!-- Nút cuộn Trái -->
              <button 
                @click="scrollPromoLeft"
                class="absolute left-2 top-1/2 mt-4 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 transition-all opacity-0 group-hover/promo:opacity-100 disabled:opacity-0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </button>

              <!-- Slider Cuộn Ngang -->
              <div 
                ref="promoScrollContainer"
                class="flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory scroll-smooth scrollbar-hide pb-4 pt-1"
              >
                <!-- Card Sản Phẩm HOT SALE -->
                <div v-for="p in promoProducts" :key="p.id" 
                     class="snap-start min-w-40 sm:min-w-50 shrink-0 group bg-white border border-slate-200/60 rounded-2xl p-3 flex flex-col justify-between text-slate-900 hover:shadow-xl hover:border-red-400 transition-all duration-300 relative overflow-hidden">
                  
                  <div>
                    <div class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
                      Giảm {{ getDiscountPercent(p) }}%
                    </div>
                    
                    <div class="h-32 sm:h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
                      <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    
                    <div>
                      <span class="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">{{ p.brand }}</span>
                      <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                        {{ p[`name_${locale}`] || p.name }}
                      </h3>
                    </div>
                  </div>

                  <!-- PHẦN GIÁ TO + NÚT CATALOG (HOT SALE) -->
                  <div class="mt-3 pt-2 border-t border-slate-100">
                    <div class="flex items-baseline gap-1 flex-wrap">
                      <span class="text-sm sm:text-base font-black text-red-600">
                        {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                      </span>
                      <span class="text-[10px] text-slate-400 line-through font-medium">
                        {{ p.price?.toLocaleString() }}đ
                      </span>
                    </div>

                    <div class="mt-1 bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100 line-clamp-1">
                      🎁 Ưu đãi đặc biệt
                    </div>

                    <!-- Nút Xem Catalog -->
                    <a 
                      v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
                      :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
                      target="_blank"
                      @click.stop
                      class="relative z-30 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
                    </a>
                  </div>

                  <router-link :to="'/product/' + p.id" class="absolute inset-0 z-20"></router-link>
                </div>
              </div>

              <!-- Nút cuộn Phải -->
              <button 
                @click="scrollPromoRight"
                class="absolute right-2 top-1/2 mt-4 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 transition-all opacity-0 group-hover/promo:opacity-100 disabled:opacity-0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>

            </div>
          </div>

          <!-- 6. KHỐI TỔNG HỢP THEO TỪNG DANH MỤC -->
          <div v-for="cat in categories" :key="cat" class="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            
            <!-- Header Danh Mục -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
                <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {{ cat }}
                </h2>
              </div>
            </div>

            <!-- Bố cục Khối: Banner Đại Diện bên trái + Lưới Sản Phẩm bên phải -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
              
              <!-- Banner nhỏ bên trái của danh mục -->
              <div class="hidden lg:block lg:col-span-1 relative rounded-2xl overflow-hidden border border-slate-200/60 group bg-slate-900 min-h-80">
                <img :src="getCategoryBanner(cat)" :alt="cat" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div class="relative z-10 h-full p-4 flex flex-col justify-end text-white">
                  <h3 class="font-black text-base uppercase text-white mb-1">{{ cat }}</h3>
                  <p class="text-[10px] text-slate-300 mb-3">Giải pháp công nghệ chính xác hàng đầu</p>
                </div>
              </div>

              <!-- Lưới Sản phẩm thuộc Danh mục này -->
              <div class="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                <div v-for="p in getProductsByCategory(cat).slice(0, 8)" :key="p.id" 
                     class="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
                  
                  <div>
                    <div v-if="getDiscountPercent(p)" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
                      Giảm {{ getDiscountPercent(p) }}%
                    </div>

                    <div class="h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
                      <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>

                    <div>
                      <span class="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">{{ p.brand }}</span>
                      <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                        {{ p[`name_${locale}`] || p.name }}
                      </h3>
                    </div>
                  </div>

                  <!-- PHẦN GIÁ TO + NÚT CATALOG (DANH MỤC) -->
                  <div class="mt-3 pt-2 border-t border-slate-100">
                    <div v-if="getSalePrice(p)" class="flex items-baseline gap-1 flex-wrap">
                      <span class="text-sm sm:text-base font-black text-red-600">
                        {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                      </span>
                      <span class="text-[10px] text-slate-400 line-through font-medium">
                        {{ p.price?.toLocaleString() }}đ
                      </span>
                    </div>
                    <div v-else class="text-sm sm:text-base font-black text-red-600">
                      {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ giá' }}
                    </div>

                    <!-- Nút Xem Catalog -->
                    <a 
                      v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
                      :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
                      target="_blank"
                      @click.stop
                      class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
                    </a>
                  </div>

                  <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
                </div>

                <!-- Khối trống bổ sung nếu danh mục ít sản phẩm -->
                <div v-if="getProductsByCategory(cat).length === 0" class="col-span-full text-center py-8 text-xs text-slate-400 font-semibold">
                  Đang cập nhật sản phẩm cho danh mục này...
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

    <!-- Tin tức & Thương hiệu hợp tác -->
    <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-8 space-y-8">
      <NewsSection />
      <BrandMarquee />
    </div>

  </div>
</template>

<style scoped>
:deep(.custom-swiper) {
  --swiper-theme-color: #ef4444; /* red-500 */
  --swiper-navigation-size: 18px;
}
/* Nút Next / Prev */
:deep(.custom-swiper .swiper-button-next),
:deep(.custom-swiper .swiper-button-prev) {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  color: #1e293b;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
:deep(.custom-swiper:hover .swiper-button-next),
:deep(.custom-swiper:hover .swiper-button-prev) {
  opacity: 1;
  transform: scale(1);
}
:deep(.custom-swiper .swiper-button-next:hover),
:deep(.custom-swiper .swiper-button-prev:hover) {
  background-color: #ef4444;
  color: #fff;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}
:deep(.custom-swiper .swiper-button-prev) { left: 16px; }
:deep(.custom-swiper .swiper-button-next) { right: 16px; }
/* Dấu chấm Pagination dưới đáy */
:deep(.custom-swiper .swiper-pagination-bullets) {
  bottom: 16px !important;
}
:deep(.custom-swiper .swiper-pagination-bullet) {
  background-color: rgba(255, 255, 255, 0.5);
  width: 8px;
  height: 8px;
  border-radius: 4px;
  opacity: 1;
  transition: all 0.3s ease;
}
:deep(.custom-swiper .swiper-pagination-bullet-active) {
  background-color: #ef4444;
  width: 24px;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}
/* Swiper Custom Navigation & Pagination */
:deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.5;
}
:deep(.swiper-pagination-bullet-active) {
  background: #dc2626 !important; 
  opacity: 1;
  width: 22px;
  border-radius: 6px;
}
:deep(.swiper-button-next), :deep(.swiper-button-prev) {
  color: white;
  transform: scale(0.45);
  background: rgba(0, 0, 0, 0.4);
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
:deep(.swiper-button-next:hover), :deep(.swiper-button-prev:hover) {
  background: #dc2626;
}

/* Animations */
.slide-down-enter-active, .slide-down-leave-active { 
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
}
.slide-down-enter-from, .slide-down-leave-to { 
  transform: translateY(-100%); 
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-25%); }
}
.animate-marquee { 
  display: flex; 
  width: 400%; 
  animation: marquee 35s linear infinite; 
}
.animate-marquee:hover { 
  animation-play-state: paused; 
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>