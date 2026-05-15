<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 
import BrandMarquee from '../components/BrandMarquee.vue'
import { useSearchStore } from '../stores/search' // [MỚI] Import Store để lấy từ khóa tìm kiếm

// Import Swiper Vue.js components & modules
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

const { locale, t } = useI18n()
const searchStore = useSearchStore() // [MỚI] Khởi tạo store tìm kiếm

const products = ref([])
const promotions = ref([]) 
const isLoading = ref(true)
const selectedCategory = ref('all') 
const currentTime = ref(new Date()) 

const swiperModules = [Autoplay, Pagination, Navigation, EffectFade]

// Dữ liệu Banners cho Slider (GIỮ NGUYÊN)
const mainBanners = ref([
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070',
    useI18n: true 
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070',
    title: 'VOUCHER <span class="text-primary">ƯU ĐÃI CỰC ĐÃ</span>',
    subtitle: 'KHI MUA 5 HỘP INSERT TẶNG NGAY 1 CÁN DAO',
    desc: 'Áp dụng cho tất cả các dòng sản phẩm INSERT tại SPIT.',
    useI18n: false
  }
])

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const fetchData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const promoSnap = await getDocs(collection(db, "promotions"))
    promotions.value = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) { 
    console.error("Lỗi:", e) 
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
  if (!activePromo) return null
  if (activePromo.discount_type === 'percentage') {
    return product.price * (1 - activePromo.discount_value / 100)
  }
  return product.price - activePromo.discount_value
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

const categories = computed(() => {
  const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
  const allCats = products.value.map(p => p[catField] || p.category)
  return ['all', ...new Set(allCats.filter(c => c))]
})

// [CẬP NHẬT] filteredProducts để kết hợp lọc theo danh mục VÀ tìm kiếm từ Header
const filteredProducts = computed(() => {
  let result = products.value

  // 1. Lọc theo danh mục (Code cũ của bạn)
  if (selectedCategory.value !== 'all') {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    result = result.filter(p => (p[catField] || p.category) === selectedCategory.value)
  }

  // 2. Lọc theo từ khóa tìm kiếm từ Store (Code mới tích hợp)
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

onMounted(fetchData)
</script>

<template>
  <div class="bg-white">
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-slate-900 via-primary to-slate-900 text-white py-2.5 shadow-lg border-b border-white/10 z-100">
        <div class="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-4">
              <span class="bg-white text-primary px-2 py-0.5 rounded text-[9px] font-black italic shadow-sm">PROMO</span>
              <span class="text-[11px] font-bold uppercase tracking-wider">
                {{ activeBannerPromo.title }}: GIẢM ĐẾN {{ activeBannerPromo.discount_value }}{{ activeBannerPromo.discount_type === 'percentage' ? '%' : 'VNĐ' }}
              </span>
              <span v-if="activeBannerPromo.end_date" class="text-[10px] font-mono text-primary-light font-bold bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                {{ getCountdown(activeBannerPromo.end_date) }}
              </span>
              <span class="text-white/30 text-xs">✦</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <section class="relative h-125 md:h-187.5 bg-slate-900 text-white overflow-hidden">
      <swiper
        :modules="swiperModules"
        :slides-per-view="1"
        :loop="true"
        :effect="'fade'"
        :fade-effect="{ crossFade: true }"
        :autoplay="{ delay: 5000, disableOnInteraction: false }"
        :pagination="{ clickable: true }"
        :navigation="true"
        class="h-full w-full"
      >
        <swiper-slide v-for="banner in mainBanners" :key="banner.id" class="overflow-hidden">
          <div class="relative h-full w-full flex items-center">
            <img :src="banner.image" class="absolute inset-0 w-full h-full object-cover opacity-40 z-0 transition-transform duration-10000 swiper-slide-active:scale-110" />
            <div class="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-900/60 to-transparent z-1"></div>
            <div class="relative z-10 container mx-auto px-6 md:px-20">
              <div class="max-w-4xl space-y-6 content-wrapper">
                <template v-if="banner.useI18n">
                  <h1 class="text-4xl md:text-7xl font-black uppercase italic leading-[1.1] tracking-tighter" v-html="$t('home.hero_title')"></h1>
                  <p class="text-slate-300 max-w-xl font-medium text-lg md:text-xl">{{ $t('home.hero_subtitle') }}</p>
                </template>
                <template v-else>
                  <h2 class="text-primary text-lg md:text-2xl font-black uppercase tracking-[0.3em] mb-2">{{ banner.subtitle }}</h2>
                  <h1 class="text-4xl md:text-7xl font-black uppercase leading-[1.1] tracking-tighter" v-html="banner.title"></h1>
                  <p class="text-slate-200 max-w-xl font-medium text-lg opacity-90">{{ banner.desc }}</p>
                </template>
                <div class="pt-4">
                    <router-link to="/products" class="inline-block bg-primary hover:bg-red-700 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                        Khám phá ngay
                    </router-link>
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </section>

    <NewsSection />

    <div class="py-12 px-6 md:px-12">
      <h2 class="text-2xl font-black text-center text-slate-800 mb-8 uppercase italic tracking-tight">
        {{ $t('home.category_title') }}
      </h2>
      
      <div class="flex flex-wrap justify-center gap-2 mb-12">
        <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
                :class="['px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all border', 
                selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200']">
          {{ cat === 'all' ? $t('home.all_cats') : cat }}
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-20 font-bold text-slate-300 uppercase tracking-widest">
        {{ $t('product.processing') }}
      </div>
      
      <div v-else-if="filteredProducts.length === 0" class="text-center py-20">
        <p class="text-slate-400 font-bold uppercase tracking-widest text-sm">Không tìm thấy sản phẩm phù hợp</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="p in filteredProducts" :key="p.id" class="relative border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-2xl transition-all group bg-white overflow-hidden">
          
          <div v-if="getSalePrice(p)" class="absolute top-4 right-4 bg-primary text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-lg z-10">
            SALE
          </div>

          <div class="h-48 mb-6 flex items-center justify-center relative overflow-hidden">
            <img :src="p.image" class="max-h-full object-contain group-hover:scale-110 transition-transform" />
            <div v-if="getActivePromo(p)?.end_date" class="absolute bottom-0 left-0 w-full bg-slate-900/90 py-1.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
               <p class="text-[8px] text-white font-bold uppercase">
                 Kết thúc: <span class="text-primary font-mono text-[10px] ml-1">{{ getCountdown(getActivePromo(p).end_date) }}</span>
               </p>
            </div>
          </div>
          
          <span class="text-[9px] font-black text-primary uppercase mb-2">
            {{ p[`category_${locale}`] || p.category }} | {{ p.brand }}
          </span>
          
          <h3 class="font-bold text-slate-800 mb-4 line-clamp-2 h-12">
            {{ p[`name_${locale}`] || p.name }}
          </h3>

          <div class="mt-auto">
            <div v-if="getSalePrice(p)" class="mb-4">
              <div class="text-xl font-black text-primary">{{ Math.round(getSalePrice(p)).toLocaleString() }} VNĐ</div>
              <div class="text-xs text-slate-400 line-through font-medium">{{ p.price?.toLocaleString() }} VNĐ</div>
            </div>
            <div v-else class="text-xl font-black text-primary mb-4">
              {{ p.price?.toLocaleString() }} VNĐ
            </div>

            <router-link :to="'/product/' + p.id" class="block w-full text-center bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-primary transition">
              {{ $t('product.view_detail') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <BrandMarquee />
  </div>
</template>

<style scoped>
/* Swiper styles (GIỮ NGUYÊN) */
:deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.5;
}
:deep(.swiper-pagination-bullet-active) {
  background: #dc2626 !important; 
  opacity: 1;
  width: 25px;
  border-radius: 4px;
}
:deep(.swiper-button-next), :deep(.swiper-button-prev) {
  color: white;
  transform: scale(0.6);
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.5s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); }

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-25%); }
}
.animate-marquee { display: flex; width: 400%; animation: marquee 30s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }

@keyframes shine {
  0% { transform: translateX(-100%); }
  20% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
.animate-shine { animation: shine 5s infinite; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>