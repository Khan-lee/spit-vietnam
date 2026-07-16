<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 
import BrandMarquee from '../components/BrandMarquee.vue'
import { useSearchStore } from '../stores/search' 

const { locale, t } = useI18n()
const searchStore = useSearchStore() 

const products = ref([])
const promotions = ref([]) 
const isLoading = ref(true)
const selectedCategory = ref('all') 
const currentTime = ref(new Date()) 

// Bạn có thể dễ dàng thêm hoặc đổi hình ảnh cho từng danh mục tại đây
// Hãy điền chính xác tên danh mục (VI hoặc EN tùy ngôn ngữ hiển thị) và link ảnh tương ứng
const categoryBanners = ref({
  'Dụng cụ cắt gọt': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
  'Thiết bị đo lường': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800',
  'Phụ kiện máy': 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=800',
})

// Import Swiper Vue.js components & modules
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

const swiperModules = [Autoplay, Pagination, Navigation, EffectFade]

// Đã cập nhật: Bỏ data cứng, đổi thành ref rỗng chờ fetch từ Firestore
const mainBanners = ref([])

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const fetchData = async () => {
  try {
    // 1. Fetch Products
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // 2. Fetch Promotions
    const promoSnap = await getDocs(collection(db, "promotions"))
    promotions.value = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // 3. ĐÃ CẬP NHẬT: Fetch Banners từ Firestore
    const bannerSnap = await getDocs(collection(db, "banners"))
    const fetchedBanners = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (fetchedBanners.length > 0) {
      mainBanners.value = fetchedBanners
    } else {
      // Fallback: Nếu Firestore chưa có banner nào, sử dụng banner mặc định cũ của bạn để không hỏng UI
      mainBanners.value = [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070',
          useI18n: true 
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070',
          title: 'GIẢI PHÁP GIA CÔNG <span class="text-slate-400">CHÍNH XÁC CAO</span>',
          subtitle: 'CHƯƠNG TRÌNH ĐỒNG HÀNH CÙNG DOANH NGHIỆP KHUÔN MẪU',
          desc: 'Ưu đãi tối ưu chi phí vận hành: Tặng cán dao tiện khi đặt hàng số lượng lớn các dòng mảnh cắt insert trong tháng này.',
          useI18n: false
        }
      ]
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

const filteredProducts = computed(() => {
  let result = products.value

  if (selectedCategory.value !== 'all') {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    result = result.filter(p => (p[catField] || p.category) === selectedCategory.value)
  }

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

const promoProducts = computed(() => {
  return products.value.filter(p => getSalePrice(p) !== null)
})

// Hàm lọc các sản phẩm theo từng danh mục cụ thể để chia hàng
const getProductsByCategory = (catName) => {
  const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
  return products.value.filter(p => (p[catField] || p.category) === catName)
}

// Lấy ảnh banner tương ứng của danh mục, nếu không có sẽ lấy ảnh mặc định
const getCategoryBanner = (catName) => {
  return categoryBanners.value[catName] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800'
}

onMounted(fetchData)
</script>

<template>
  <div class="bg-linear-to-b from-[#f8fafc] via-[#f8fafc] to-slate-100 font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
    
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 text-white py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] border-b border-white/5 z-50">
        <div class="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-4">
              <span class="bg-slate-800/80 backdrop-blur-sm text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider shadow-inner">CAMPAIGN</span>
              <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                {{ activeBannerPromo.title }}: ƯU ĐÃI ĐẾN {{ activeBannerPromo.discount_value }}{{ activeBannerPromo.discount_type === 'percentage' ? '%' : ' VNĐ' }}
              </span>
              <span v-if="activeBannerPromo.end_date" class="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                ⏱️ {{ getCountdown(activeBannerPromo.end_date) }}
              </span>
              <span class="text-white/20 text-xs">✦</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <section class="relative h-[60vh] md:h-[75vh] bg-slate-900 text-white overflow-hidden">
      <swiper
        v-if="mainBanners.length > 0"
        :modules="swiperModules"
        :slides-per-view="1"
        :loop="mainBanners.length > 1"
        :effect="'fade'"
        :fade-effect="{ crossFade: true }"
        :autoplay="mainBanners.length > 1 ? { delay: 5000, disableOnInteraction: false } : false"
        :pagination="mainBanners.length > 1 ? { clickable: true } : false"
        :navigation="mainBanners.length > 1"
        :speed="1200"
        class="h-full w-full"
      >
        <swiper-slide v-for="banner in mainBanners" :key="banner.id" class="overflow-hidden">
          <div class="relative h-full w-full flex items-center">
            <img :src="banner.image" class="absolute inset-0 w-full h-full object-cover opacity-25 z-0 animate-kenburns" />
            <div class="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-900/70 to-transparent z-1"></div>
            <div class="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent z-1"></div>
            
            <div class="relative z-10 container mx-auto px-6 md:px-16 lg:px-24">
              <div class="max-w-4xl space-y-6">
                <template v-if="banner.useI18n">
                  <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase leading-[1.1] tracking-tight text-white drop-shadow-sm" v-html="$t('home.hero_title')"></h1>
                  <p class="text-slate-300 max-w-xl font-medium text-lg md:text-xl leading-relaxed">{{ $t('home.hero_subtitle') }}</p>
                </template>
                <template v-else>
                  <h2 v-if="banner.subtitle" class="text-slate-300 text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-2 bg-white/5 backdrop-blur-sm inline-block px-3 py-1 rounded-full border border-white/10 shadow-inner">{{ banner.subtitle }}</h2>
                  <h1 v-if="banner.title" class="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase leading-[1.1] tracking-tight text-white drop-shadow-sm" v-html="banner.title"></h1>
                  <p v-if="banner.desc" class="text-slate-300 max-w-xl font-medium text-base opacity-90 leading-relaxed">{{ banner.desc }}</p>
                </template>
                
                <div class="pt-4">
                  <a v-if="banner.link && (banner.link.startsWith('http://') || banner.link.startsWith('https://'))"
                     :href="banner.link"
                     target="_blank"
                     class="inline-block bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-slate-900/40 hover:-translate-y-0.5">
                    {{ locale === 'vi' ? 'Xem chi tiết' : 'View Details' }}
                  </a>
                  <router-link v-else
                               :to="banner.link || '/products'"
                               class="inline-block bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-slate-900/40 hover:-translate-y-0.5">
                    {{ banner.link ? (locale === 'vi' ? 'Xem chi tiết' : 'View Details') : (locale === 'vi' ? 'Xem danh mục sản phẩm' : 'Explore Catalog') }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </section>

    <section class="max-w-7xl mx-auto px-4 lg:px-8 -mt-8 relative z-20">
      <div class="bg-white grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 rounded-4xl shadow-lg shadow-slate-200/60 border border-slate-100">
        <div class="flex items-start gap-4 p-2 feature-item">
          <div class="w-12 h-12 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0 border border-slate-100 text-xl transition-transform duration-300">🎯</div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm mb-1">Độ Chính Xác Tuyệt Đối</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Đáp ứng dung sai khắt khe trong gia công chi tiết máy và khuôn mẫu.</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-2 border-t md:border-t-0 md:border-x border-slate-100 md:px-6 feature-item">
          <div class="w-12 h-12 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0 border border-slate-100 text-xl transition-transform duration-300">🛠️</div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm mb-1">Tư Vấn Kỹ Thuật Chuyên Sâu</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Đội ngũ kỹ sư SPIT hỗ trợ tính toán chế độ cắt (Vb, Fz) tối ưu.</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-2 border-t md:border-t-0 border-slate-100 feature-item">
          <div class="w-12 h-12 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0 border border-slate-100 text-xl transition-transform duration-300">📦</div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm mb-1">Cung Ứng Chuỗi Nhà Máy</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Kho vận ổn định, đảm bảo tiến độ sản xuất không bị gián đoạn.</p>
          </div>
        </div>
      </div>
    </section>

    <main class="py-16 px-4 lg:px-8 max-w-7xl mx-auto">
      
      <div v-if="isLoading" class="text-center py-20 font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {{ $t('product.processing') }}
      </div>
      
      <div v-else>
        <div v-if="searchStore.searchQuery && searchStore.searchQuery.trim() !== ''">
          <h2 class="text-2xl font-bold text-slate-900 mb-8 tracking-tight">
            🔍 Kết quả tìm kiếm cho: <span class="text-slate-500">"{{ searchStore.searchQuery }}"</span>
          </h2>
          
          <div v-if="filteredProducts.length === 0" class="text-center bg-white border border-slate-100 rounded-4xl py-20 shadow-sm">
            <p class="text-slate-400 font-semibold uppercase tracking-wider text-xs">Không tìm thấy mã sản phẩm hoặc thương hiệu phù hợp</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="p in filteredProducts" :key="p.id" class="group bg-white border border-slate-100 rounded-3xl p-5 flex flex-col hover:shadow-xl hover:shadow-slate-300/40 hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div v-if="getSalePrice(p)" class="absolute top-4 right-4 bg-linear-to-br from-slate-900 to-slate-700 text-white border border-slate-700 px-2.5 py-1 rounded-full text-[9px] font-bold z-10 shadow-md">
                OFF
              </div>
              <div class="h-44 mb-4 flex items-center justify-center relative overflow-hidden bg-linear-to-b from-slate-50 to-slate-100/60 rounded-2xl p-4 group-hover:from-slate-100 transition-colors duration-300">
                <img :src="p.image" :alt="p.name" class="max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                <div v-if="getActivePromo(p)?.end_date" class="absolute bottom-0 left-0 w-full bg-slate-950/90 py-1.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                   <p class="text-[9px] text-slate-300 font-medium">
                     Còn lại: <span class="text-white font-mono font-bold ml-1">{{ getCountdown(getActivePromo(p).end_date) }}</span>
                   </p>
                </div>
              </div>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {{ p[`category_${locale}`] || p.category }} • {{ p.brand }}
              </span>
              <h3 class="font-bold text-slate-800 text-sm mb-4 line-clamp-2 h-10 group-hover:text-slate-950 transition-colors">
                {{ p[`name_${locale}`] || p.name }}
              </h3>
              <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <div v-if="getSalePrice(p)">
                    <div class="text-sm font-extrabold text-slate-950">{{ Math.round(getSalePrice(p)).toLocaleString() }} VNĐ</div>
                    <div class="text-[10px] text-slate-400 line-through font-medium">{{ p.price?.toLocaleString() }} VNĐ</div>
                  </div>
                  <div v-else class="text-sm font-extrabold text-slate-950">
                    {{ p.price ? p.price.toLocaleString() + ' VNĐ' : 'Liên hệ giá' }}
                  </div>
                </div>
                <router-link :to="'/product/' + p.id" class="bg-slate-50 text-slate-700 hover:bg-slate-950 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20">
                  Chi tiết
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-16">
          
          <div v-if="promoProducts.length > 0">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Giải Pháp Đang Áp Dụng Ưu Đãi</span>
              </h2>
            </div>
            
            <div class="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4 md:gap-6 md:pb-0">
              <div v-for="p in promoProducts" :key="p.id" class="group bg-white border border-slate-100 rounded-3xl p-5 flex flex-col hover:shadow-xl hover:shadow-slate-300/40 hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden shrink-0 w-64 snap-start md:w-auto md:shrink">
                <div class="absolute top-4 right-4 bg-linear-to-br from-slate-900 to-slate-700 text-white border border-slate-700 px-2.5 py-1 rounded-full text-[9px] font-bold z-10 shadow-md">
                  OFF
                </div>
                <div class="h-44 mb-4 flex items-center justify-center relative overflow-hidden bg-linear-to-b from-slate-50 to-slate-100/60 rounded-2xl p-4 group-hover:from-slate-100 transition-colors duration-300">
                  <img :src="p.image" :alt="p.name" class="max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  <div v-if="getActivePromo(p)?.end_date" class="absolute bottom-0 left-0 w-full bg-slate-950/90 py-1.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                     <p class="text-[9px] text-slate-300 font-medium">
                       Còn lại: <span class="text-white font-mono font-bold ml-1">{{ getCountdown(getActivePromo(p).end_date) }}</span>
                     </p>
                  </div>
                </div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {{ p[`category_${locale}`] || p.category }} • {{ p.brand }}
                </span>
                <h3 class="font-bold text-slate-800 text-sm mb-4 line-clamp-2 h-10">
                  {{ p[`name_${locale}`] || p.name }}
                </h3>
                <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <div v-if="getSalePrice(p)">
                      <div class="text-sm font-extrabold text-slate-950">{{ Math.round(getSalePrice(p)).toLocaleString() }} VNĐ</div>
                      <div class="text-[10px] text-slate-400 line-through font-medium">{{ p.price?.toLocaleString() }} VNĐ</div>
                    </div>
                    <div class="text-sm font-extrabold text-slate-950" v-else>
                      {{ p.price ? p.price.toLocaleString() + ' VNĐ' : 'Liên hệ giá' }}
                    </div>
                  </div>
                  <router-link :to="'/product/' + p.id" class="bg-slate-50 text-slate-700 hover:bg-slate-950 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20">
                    Chi tiết
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 pt-4">
            <div v-for="cat in categories.filter(c => c !== 'all')" :key="cat" class="flex flex-col">
              
              <div class="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                <h2 class="text-lg md:text-xl font-bold text-red-600 uppercase flex items-center gap-2 leading-none">
                  <span class="w-1 h-5 md:h-6 bg-red-600 inline-block"></span>
                  {{ cat }}
                </h2>
                <router-link :to="'/products?category=' + cat" class="text-[10px] md:text-xs font-semibold text-slate-800 hover:text-red-600 transition-colors uppercase tracking-wider">
                  Xem thêm &gt;&gt;
                </router-link>
              </div>

              <div class="flex border-t border-l border-slate-200 bg-white h-95">
                
                <div class="w-1/3 border-r border-b border-slate-200 relative p-1 bg-white">
                  <img :src="getCategoryBanner(cat)" :alt="cat" class="w-full h-full object-cover" />
                  <router-link :to="'/products?category=' + cat" class="absolute inset-0 z-10"></router-link>
                </div>

                <div class="w-2/3 grid grid-cols-2 grid-rows-2">
                  <div v-for="p in getProductsByCategory(cat).slice(0, 4)" :key="p.id" 
                       class="border-r border-b border-slate-200 p-2 md:p-4 flex flex-col items-center justify-between text-center relative group hover:bg-slate-50 transition-colors">
                    
                    <div class="h-24 md:h-28 w-full flex items-center justify-center mb-2">
                      <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div class="mt-auto flex flex-col items-center w-full">
                      <span class="text-red-600 text-[10px] md:text-[11px] font-bold mb-1">
                        {{ p.price ? p.price.toLocaleString() + ' VNĐ' : 'Liên hệ' }}
                      </span>
                      <h3 class="text-[10px] md:text-xs font-medium text-slate-800 line-clamp-2 leading-tight">
                        <span v-if="p.brand" class="font-bold">{{ p.brand }} | </span>
                        {{ p[`name_${locale}`] || p.name }}
                      </h3>
                    </div>
                    
                    <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
                  </div>
                  
                  <div v-for="i in Math.max(0, 4 - getProductsByCategory(cat).length)" :key="'empty-'+i" 
                       class="border-r border-b border-slate-200 bg-slate-50/50">
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
      </div>
    </main>

    <NewsSection />
    <BrandMarquee />
  </div>
</template>

<style scoped>
/* Đồng bộ hóa màu sắc thanh điều hướng Swiper sang Slate tinh tế */
:deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.4;
}
:deep(.swiper-pagination-bullet-active) {
  background: #64748b !important; 
  opacity: 1;
  width: 20px;
  border-radius: 6px;
}
:deep(.swiper-button-next), :deep(.swiper-button-prev) {
  color: #94a3b8;
  transform: scale(0.5);
}

/* Các Animation luồng mượt mà */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); }

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-25%); }
}
.animate-marquee { display: flex; width: 400%; animation: marquee 35s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }

@keyframes shine {
  0% { transform: translateX(-100%); }
  20% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
.animate-shine { animation: shine 6s infinite; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Chuyển động zoom chậm (Ken Burns) cho ảnh nền hero */
@keyframes kenburns {
  0% { transform: scale(1); }
  100% { transform: scale(1.12); }
}
.animate-kenburns {
  animation: kenburns 12s ease-out infinite alternate;
}

/* Icon bật nhẹ khi hover khối tính năng */
.feature-item:hover .w-12.h-12 {
  transform: translateY(-3px) scale(1.06);
}

/* Làm mượt các thẻ sản phẩm và nút bấm khi hover */
.group {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>