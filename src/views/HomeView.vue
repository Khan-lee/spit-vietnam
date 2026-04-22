<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 

const { locale, t } = useI18n()

const products = ref([])
const promotions = ref([]) 
const isLoading = ref(true)
const selectedCategory = ref('all') 
const currentTime = ref(new Date()) 

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

// LOGIC KHUYẾN MÃI
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
  if (selectedCategory.value === 'all') return products.value
  const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
  return products.value.filter(p => (p[catField] || p.category) === selectedCategory.value)
})

onMounted(fetchData)
</script>

<template>
  <div class="bg-white">
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-slate-900 via-red-700 to-slate-900 text-white py-2.5 shadow-lg border-b border-white/10 z-100">
        <div class="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
        
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-4">
              <span class="bg-white text-red-600 px-2 py-0.5 rounded text-[9px] font-black italic shadow-sm">PROMO</span>
              <span class="text-[11px] font-bold uppercase tracking-wider">
                {{ activeBannerPromo.title }}: GIẢM ĐẾN {{ activeBannerPromo.discount_value }}{{ activeBannerPromo.discount_type === 'percentage' ? '%' : 'VNĐ' }}
              </span>
              <span v-if="activeBannerPromo.end_date" class="text-[10px] font-mono text-red-300 font-bold bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                {{ getCountdown(activeBannerPromo.end_date) }}
              </span>
              <span class="text-white/30 text-xs">✦</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <section class="relative bg-slate-900 text-white py-20 px-6 md:px-12 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070" class="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div class="relative z-10 max-w-4xl">
        <h1 class="text-4xl md:text-6xl font-black uppercase italic leading-tight mb-4" v-html="$t('home.hero_title')"></h1>
        <p class="text-slate-300 max-w-xl mb-8 font-medium">{{ $t('home.hero_subtitle') }}</p>
        <div class="flex gap-4">
          <button class="bg-red-600 px-8 py-3 rounded-lg font-black uppercase text-xs hover:bg-red-700 transition">
            {{ $t('home.new_products') }}
          </button>
        </div>
      </div>
    </section>

    <NewsSection />

    <div class="py-12 px-6 md:px-12">
      <h2 class="text-2xl font-black text-center text-slate-800 mb-8 uppercase italic tracking-tight">
        {{ $t('home.category_title') }}
      </h2>
      
      <div class="flex flex-wrap justify-center gap-2 mb-12">
        <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
                :class="['px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all border', 
                selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200']">
          {{ cat === 'all' ? $t('home.all_cats') : cat }}
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-20 font-bold text-slate-300 uppercase tracking-widest">
        {{ $t('product.processing') }}
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="p in filteredProducts" :key="p.id" class="relative border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-2xl transition-all group bg-white overflow-hidden">
          
          <div v-if="getSalePrice(p)" class="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-lg z-10">
            SALE
          </div>

          <div class="h-48 mb-6 flex items-center justify-center relative overflow-hidden">
            <img :src="p.image" class="max-h-full object-contain group-hover:scale-110 transition-transform" />
            
            <div v-if="getActivePromo(p)?.end_date" class="absolute bottom-0 left-0 w-full bg-slate-900/90 py-1.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
               <p class="text-[8px] text-white font-bold uppercase">
                 Kết thúc: <span class="text-red-400 font-mono text-[10px] ml-1">{{ getCountdown(getActivePromo(p).end_date) }}</span>
               </p>
            </div>
          </div>
          
          <span class="text-[9px] font-black text-blue-500 uppercase mb-2">
            {{ p[`category_${locale}`] || p.category }} | {{ p.brand }}
          </span>
          
          <h3 class="font-bold text-slate-800 mb-4 line-clamp-2 h-12">
            {{ p[`name_${locale}`] || p.name }}
          </h3>

          <div class="mt-auto">
            <div v-if="getSalePrice(p)" class="mb-4">
              <div class="text-xl font-black text-red-600">{{ Math.round(getSalePrice(p)).toLocaleString() }} VNĐ</div>
              <div class="text-xs text-slate-400 line-through font-medium">{{ p.price?.toLocaleString() }} VNĐ</div>
            </div>
            <div v-else class="text-xl font-black text-red-600 mb-4">
              {{ p.price?.toLocaleString() }} VNĐ
            </div>

            <router-link :to="'/product/' + p.id" class="block w-full text-center bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition">
              {{ $t('product.view_detail') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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