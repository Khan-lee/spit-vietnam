<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 
import BrandMarquee from '../components/BrandMarquee.vue'
import HomeProductFilter from '../components/HomeProductFilter.vue' // <-- Bổ sung import Component lọc
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

const products = ref([])
const promotions = ref([]) 
const categoryDocs = ref([])
const mainBanners = ref([])
const isLoading = ref(true)
const currentTime = ref(new Date()) 

// --- BỔ SUNG: Biến chứa danh sách sản phẩm sau khi qua Bộ lọc Multi-Select ---
const filteredHomeProducts = ref([])

const handleFilteredProducts = (newList) => {
  filteredHomeProducts.value = newList;
};

// Tự động bật/tắt trạng thái lọc dựa vào số lượng sản phẩm:
// - Nếu số lượng sau khi lọc khác tổng số sản phẩm gốc -> Đang lọc (true)
// - Nếu bằng nhau (hoặc bấm "Bỏ chọn tất cả") -> Không lọc (false)
const isFiltering = computed(() => {
  if (!products.value || !filteredHomeProducts.value) return false;
  return filteredHomeProducts.value.length !== products.value.length;
});

const handleFilterState = (state) => {
  isFiltering.value = state
}

const swiperModules = [Autoplay, Pagination, Navigation, EffectFade]

// Quản lý trạng thái category đang hover
const activeHoverCategory = ref(null)

// Lấy danh sách thương hiệu thuộc category đang hover
const getSubCategoriesOrBrands = (catName) => {
  const prods = getProductsByCategory(catName)
  const brands = [...new Set(prods.map(p => p.brand).filter(Boolean))]
  return brands
}

// Ảnh banner dự phòng cho từng danh mục (Dùng khi trên Firestore chưa cài đặt banner)
const categoryBanners = ref({
  'Dụng cụ cắt gọt': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
  'Thiết bị đo lường': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800',
  'Phụ kiện máy': 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=800',
})

// --- BỔ SUNG: Data dự phòng cho Banner Chính (Giữ nguyên code cũ của mày) ---
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

// --- UPDATE: Chuyển thành ref() để nhận data động, list cũ lưu thành fallback ---
const rightSubBanners = ref([])
const fallbackRightSubBanners = [
  {
    id: 1,
    title: 'GIẢI PHÁP GIA CÔNG',
    sub: 'Ưu đãi mảnh cắt Insert',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=600',
    link: '/products'
  },
  {
    id: 2,
    title: 'THIẾT BỊ ĐO CHÍNH XÁC',
    sub: 'Chuẩn dung sai Micromet',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600',
    link: '/products'
  }
]

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  fetchData()
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

    // --- UPDATE: Logic tách Banner Chính & Phụ ---
    const fetchedBanners = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (fetchedBanners.length > 0) {
      // Sắp xếp banner mới nhất lên trước
      fetchedBanners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

      // 1. Tách Banner Chính
      const main = fetchedBanners.filter(b => b.position === 'main' || !b.position)
      mainBanners.value = main.length > 0 ? main : fallbackMainBanners

      // 2. Tách Banner Phụ (Map subtitle sang sub)
      const sub = fetchedBanners
        .filter(b => b.position === 'right_sub')
        .map(b => ({
          ...b,
          sub: b.subtitle || b.sub
        }))
        .slice(0, 2)
      
      rightSubBanners.value = sub.length > 0 ? sub : fallbackRightSubBanners

    } else {
      mainBanners.value = fallbackMainBanners
      rightSubBanners.value = fallbackRightSubBanners
    }
    // --- KẾT THÚC UPDATE BANNER ---

  } catch (e) { 
    console.error("Lỗi đồng bộ Firestore:", e) 
  } finally { 
    isLoading.value = false 
  }
}

// Logic khuyến mãi & tính giá sale
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
  if (!activePromo) return null
  if (activePromo.discount_type === 'percentage') {
    return product.price * (1 - activePromo.discount_value / 100)
  }
  return product.price - activePromo.discount_value
}

const getDiscountPercent = (product) => {
  const activePromo = getActivePromo(product)
  if (!activePromo) return 0
  if (activePromo.discount_type === 'percentage') {
    return Math.round(activePromo.discount_value)
  }
  if (product.price) {
    return Math.round((activePromo.discount_value / product.price) * 100)
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
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Danh mục hoạt động
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

// Tìm kiếm toàn cục
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

// Danh sách sản phẩm Hot Sale
const promoProducts = computed(() => {
  return products.value.filter(p => getSalePrice(p) !== null)
})

// Lấy sản phẩm theo tên danh mục hoặc ID danh mục tương ứng trên Firestore
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

// Lấy banner động từ dữ liệu Firestore (c.banner / c.image / c.bannerUrl), nếu không có mới dùng ảnh fallback
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
  <div class="bg-slate-100 font-sans antialiased text-slate-900 pb-12">
    
    <!-- 1. Thanh Campaign Khuyến Mãi Đầu Trang -->
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-red-700 via-red-600 to-red-700 text-white py-2.5 shadow-md z-50">
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <span class="bg-yellow-400 text-red-950 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shadow">🔥 HOT SALE</span>
              <span class="text-xs font-bold uppercase tracking-wide">
                {{ activeBannerPromo.title }}: ƯU ĐÃI ĐẾN {{ activeBannerPromo.discount_value }}{{ activeBannerPromo.discount_type === 'percentage' ? '%' : ' VNĐ' }}
              </span>
              <span v-if="activeBannerPromo.end_date" class="text-[11px] font-mono text-yellow-200 bg-black/20 px-2 py-0.5 rounded-full border border-yellow-400/30">
                ⏱️ Kết thúc sau: {{ getCountdown(activeBannerPromo.end_date) }}
              </span>
              <span class="text-white/40 text-xs"></span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. Khối Hero Slider & Sidebar Danh Mục (CellphoneS Style) -->
    <section class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        <!-- Sidebar Danh mục sản phẩm (Bên trái) -->
        <aside 
          class="hidden lg:block lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-2.5 relative"
          @mouseleave="activeHoverCategory = null"
        >
          <div class="text-xs font-black uppercase text-slate-400 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span>Danh mục sản phẩm</span>
            <span class="text-red-600">☰</span>
          </div>

          <!-- Danh sách các danh mục chính -->
          <ul class="divide-y divide-slate-50 my-1">
            <li 
              v-for="cat in categories" 
              :key="cat"
              @mouseenter="activeHoverCategory = cat"
              class="group"
            >
              <router-link 
                :to="'/products?category=' + cat" 
                class="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold"
                :class="activeHoverCategory === cat ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:bg-red-50 hover:text-red-600'"
              >
                <span class="truncate">{{ cat }}</span>
                <span class="text-slate-300 group-hover:text-red-600 transition-transform group-hover:translate-x-1">&rsaquo;</span>
              </router-link>
            </li>
          </ul>

          <!-- MEGA MENU FLYOUT -->
          <Transition name="fade-fast">
            <div 
              v-if="activeHoverCategory" 
              class="absolute top-0 left-[102%] w-145 min-h-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-5 z-50 grid grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div class="col-span-2 space-y-4">
                <div>
                  <h3 class="text-xs font-black uppercase text-red-600 tracking-wider mb-2 border-b border-red-100 pb-1 flex items-center gap-1.5">
                    <span></span> {{ activeHoverCategory }}
                  </h3>
                  <p class="text-[11px] font-bold text-slate-400 mb-1.5">Thương hiệu hàng đầu:</p>
                  <div class="flex flex-wrap gap-1.5 mb-3">
                    <router-link 
                      v-for="brand in getSubCategoriesOrBrands(activeHoverCategory)" 
                      :key="brand"
                      :to="'/products?category=' + activeHoverCategory + '&brand=' + brand"
                      class="bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {{ brand }}
                    </router-link>
                    <span v-if="getSubCategoriesOrBrands(activeHoverCategory).length === 0" class="text-xs text-slate-400 italic">
                      Đang cập nhật thương hiệu...
                    </span>
                  </div>
                </div>

                <div>
                  <p class="text-[11px] font-bold text-slate-400 mb-2">Sản phẩm gợi ý:</p>
                  <div class="grid grid-cols-2 gap-2">
                    <router-link 
                      v-for="p in getProductsByCategory(activeHoverCategory).slice(0, 4)" 
                      :key="p.id"
                      :to="'/product/' + p.id"
                      class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-red-50/50 border border-slate-100 transition-all group"
                    >
                      <img :src="p.image" :alt="p.name" class="w-10 h-10 object-contain rounded bg-white shrink-0 p-0.5" />
                      <div class="overflow-hidden">
                        <p class="text-[11px] font-bold text-slate-800 truncate group-hover:text-red-600">{{ p[`name_${locale}`] || p.name }}</p>
                        <p class="text-[10px] font-black text-red-600">{{ (getSalePrice(p) || p.price)?.toLocaleString() }}đ</p>
                      </div>
                    </router-link>
                  </div>
                </div>
              </div>

              <div class="col-span-1 border-l border-slate-100 pl-4 flex flex-col justify-between">
                <div class="relative rounded-xl overflow-hidden h-full bg-slate-900 group/banner min-h-45">
                  <img :src="getCategoryBanner(activeHoverCategory)" class="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/banner:scale-105 transition-transform duration-300" />
                  <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div class="relative z-10 h-full p-3 flex flex-col justify-end text-white">
                    <span class="text-[9px] font-bold text-yellow-400 uppercase">Khuyến mãi</span>
                    <p class="text-xs font-black leading-snug mb-2 line-clamp-2">{{ activeHoverCategory }}</p>
                    <router-link 
                      :to="'/products?category=' + activeHoverCategory" 
                      class="bg-red-600 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg text-center hover:bg-red-700 transition-colors shadow"
                    >
                      Xem tất cả
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <div class="bg-red-50/60 border border-red-100 rounded-xl p-2.5 text-center mt-2">
            <p class="text-[11px] text-red-700 font-bold">Hotline Tư Vấn Kỹ Thuật</p>
            <p class="text-sm font-black text-red-600 mt-0.5">0906 826 959</p>
          </div>
        </aside>

        <!-- Banner Swiper chính (Ở giữa) -->
        <div class="lg:col-span-6 h-70 sm:h-90 lg:h-auto rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900">
          <swiper
            v-if="mainBanners.length > 0"
            :modules="swiperModules"
            :slides-per-view="1"
            :loop="mainBanners.length > 1"
            :effect="'fade'"
            :autoplay="mainBanners.length > 1 ? { delay: 4500, disableOnInteraction: false } : false"
            :pagination="{ clickable: true }"
            :navigation="true"
            class="h-full w-full custom-swiper"
          >
            <swiper-slide v-for="banner in mainBanners" :key="banner.id">
              <div class="relative h-full w-full flex items-end p-6 md:p-8">
                <img :src="banner.image" class="absolute inset-0 w-full h-full object-cover z-0" />
                <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent z-1"></div>
                
                <div class="relative z-10 space-y-2 text-white">
                  <template v-if="banner.useI18n">
                    <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight drop-shadow" v-html="$t('home.hero_title')"></h1>
                    <p class="text-slate-300 text-xs sm:text-sm line-clamp-2 max-w-md font-medium">{{ $t('home.hero_subtitle') }}</p>
                  </template>
                  <template v-else>
                    <span v-if="banner.subtitle" class="bg-red-600 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md inline-block">{{ banner.subtitle }}</span>
                    <h1 v-if="banner.title" class="text-2xl sm:text-3xl font-black uppercase tracking-tight drop-shadow" v-html="banner.title"></h1>
                    <p v-if="banner.desc" class="text-slate-300 text-xs sm:text-sm line-clamp-2 max-w-md font-medium opacity-90">{{ banner.desc }}</p>
                  </template>

                  <div class="pt-2">
                    <router-link :to="banner.link || '/products'" class="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-md hover:shadow-red-600/30">
                      <span>{{ locale === 'vi' ? 'Khám phá ngay' : 'Explore Now' }}</span>
                      <span>&rarr;</span>
                    </router-link>
                  </div>
                </div>
              </div>
            </swiper-slide>
          </swiper>
        </div>

        <!-- Right Sub-banners (Bên phải) -->
        <div class="hidden lg:flex lg:col-span-3 flex-col gap-3">
          <div v-for="sub in rightSubBanners" :key="sub.id" class="relative flex-1 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm group bg-slate-900">
            <img :src="sub.image" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent"></div>
            <div class="relative z-10 h-full p-4 flex flex-col justify-end text-white">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-yellow-400">{{ sub.sub }}</span>
              <h3 class="font-bold text-sm leading-tight text-white mb-2">{{ sub.title }}</h3>
              <router-link :to="sub.link" class="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                Xem chi tiết &rarr;
              </router-link>
            </div>
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
              <div class="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1">
                <div>
                  <div v-if="getSalePrice(p)" class="text-xs sm:text-sm font-black text-red-600">
                    {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                  </div>
                  <div class="text-[10px] text-slate-400 line-through font-medium" v-if="getSalePrice(p)">
                    {{ p.price?.toLocaleString() }}đ
                  </div>
                  <div v-if="!getSalePrice(p)" class="text-xs sm:text-sm font-black text-red-600">
                    {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ' }}
                  </div>
                </div>
                <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- MÀN HÌNH CHÍNH (Đã chia 2 cột: Cột Filter Trái và Cột Content Phải) -->
        <div v-else class="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">

          <!-- ========================================== -->
          <!-- CỘT TRÁI: BỘ LỌC ĐA TIÊU CHÍ (STICKY) -->
          <!-- ========================================== -->
          <div class="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-22.5 self-start h-fit z-20">
  <HomeProductFilter 
    :products="products" 
    @update:filteredProducts="handleFilteredProducts"
  />
</div>

          <!-- ========================================== -->
          <!-- CỘT PHẢI: KẾT QUẢ VÀ CÁC KHỐI DANH MỤC -->
          <!-- ========================================== -->
          <div class="flex-1 w-full min-w-0 space-y-6">
            
            <!-- Lưới Kết Quả từ Bộ Lọc (Chỉ hiện khi isFiltering là true) -->
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

                  <div class="mt-3 pt-2 border-t border-slate-100">
                    <div v-if="getSalePrice(p)">
                      <div class="text-xs sm:text-sm font-black text-red-600">
                        {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                      </div>
                      <div class="text-[10px] text-slate-400 line-through font-medium">
                        {{ p.price?.toLocaleString() }}đ
                      </div>
                    </div>
                    <div v-else class="text-xs sm:text-sm font-black text-red-600">
                      {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ giá' }}
                    </div>
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
              <div v-if="promoProducts.length > 0" class="bg-linear-to-r from-red-700 via-red-600 to-red-800 rounded-3xl p-4 sm:p-6 text-white shadow-xl">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                  <div class="flex items-center gap-3">
                    <h2 class="text-xl sm:text-2xl font-black uppercase italic tracking-wider flex items-center gap-1.5 text-yellow-300">
                      <span></span> HOT SALE GIÁ SỐC
                    </h2>
                  </div>
                  <div v-if="activeBannerPromo?.end_date" class="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-400/40">
                    <span class="text-xs font-semibold text-slate-200">Kết thúc sau:</span>
                    <span class="font-mono text-sm font-black text-yellow-300">{{ getCountdown(activeBannerPromo.end_date) }}</span>
                  </div>
                </div>
                
                <!-- Lưới Sản Phẩm Khuyến Mãi -->
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  <div v-for="p in promoProducts.slice(0, 5)" :key="p.id" 
                       class="group bg-white rounded-2xl p-3 flex flex-col justify-between text-slate-900 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <div class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
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

                    <div class="mt-3 pt-2 border-t border-slate-100">
                      <div class="text-xs sm:text-sm font-black text-red-600">
                        {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                      </div>
                      <div class="text-[10px] text-slate-400 line-through font-medium">
                        {{ p.price?.toLocaleString() }}đ
                      </div>
                      <div class="mt-1.5 bg-red-50 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100 line-clamp-1">
                        🎁 Ưu đãi doanh nghiệp
                      </div>
                    </div>

                    <router-link :to="'/product/' + p.id" class="absolute inset-0 z-20"></router-link>
                  </div>
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
                  <router-link :to="'/products?category=' + cat" 
                               class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline">
                    <span>Xem tất cả {{ cat }}</span>
                    <span>&rsaquo;</span>
                  </router-link>
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
                      <router-link :to="'/products?category=' + cat" class="inline-block text-center bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-[11px] py-2 px-3 rounded-xl border border-white/20 transition-all">
                        Khám phá danh mục
                      </router-link>
                    </div>
                  </div>

                  <!-- Lưới Sản phẩm thuộc Danh mục này -->
                  <div class="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div v-for="p in getProductsByCategory(cat).slice(0, 8)" :key="p.id" 
                         class="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
                      
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

                      <div class="mt-3 pt-2 border-t border-slate-100">
                        <div v-if="getSalePrice(p)">
                          <div class="text-xs sm:text-sm font-black text-red-600">
                            {{ Math.round(getSalePrice(p)).toLocaleString() }}đ
                          </div>
                          <div class="text-[10px] text-slate-400 line-through font-medium">
                            {{ p.price?.toLocaleString() }}đ
                          </div>
                        </div>
                        <div v-else class="text-xs sm:text-sm font-black text-red-600">
                          {{ p.price ? p.price.toLocaleString() + 'đ' : 'Liên hệ giá' }}
                        </div>
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