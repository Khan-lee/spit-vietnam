<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { RouterLink } from 'vue-router'

const props = defineProps(['searchQuery'])
const products = ref([])
const promotions = ref([])
const loading = ref(true)
const selectedCategory = ref('Tất cả')
const selectedBrand = ref('Tất cả Hãng')
const currentTime = ref(new Date()) // Để cập nhật đồng hồ đếm ngược

// Cập nhật thời gian mỗi giây
let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const fetchData = async () => {
  try {
    loading.value = true
    const prodSnap = await getDocs(collection(db, "products"))
    products.value = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const promoSnap = await getDocs(collection(db, "promotions"))
    promotions.value = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi:", error)
  } finally {
    loading.value = false
  }
}

// Lấy chương trình KM đang áp dụng cho SP
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

// Logic đếm ngược (Countdown)
const getCountdown = (endDate) => {
  if (!endDate) return null
  const diff = new Date(endDate) - currentTime.value
  if (diff <= 0) return null
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Banner thông báo KM mới nhất (Tự động)
const latestGlobalPromo = computed(() => {
  return promotions.value
    .filter(p => p.is_active && (!p.end_date || new Date(p.end_date) > currentTime.value))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
})

const categoryStats = computed(() => {
  const uniqueCats = [...new Set(products.value.map(p => p.category_vi || p.category).filter(Boolean))]
  return ['Tất cả', ...uniqueCats]
})

const brandStats = computed(() => {
  const uniqueBrands = [...new Set(products.value.map(p => p.brand).filter(Boolean))]
  return ['Tất cả Hãng', ...uniqueBrands]
})

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const currentCat = p.category_vi || p.category
    const currentName = p.name_vi || p.name
    const matchCat = selectedCategory.value === 'Tất cả' || currentCat === selectedCategory.value
    const matchBrand = selectedBrand.value === 'Tất cả Hãng' || p.brand === selectedBrand.value
    const matchSearch = !props.searchQuery || 
      [currentName, p.brand, currentCat].some(f => f?.toLowerCase().includes(props.searchQuery.toLowerCase().trim()))
    return matchCat && matchBrand && matchSearch
  })
})

onMounted(fetchData)
</script>

<template>
  <div v-if="latestGlobalPromo" class="bg-red-600 text-white py-2 px-4 text-center overflow-hidden relative">
    <p class="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] animate-pulse">
      🔥 {{ latestGlobalPromo.title }}: GIẢM ĐẾN {{ latestGlobalPromo.discount_value }}{{ latestGlobalPromo.discount_type === 'percentage' ? '%' : 'Đ' }} 🔥
    </p>
  </div>

  <div class="min-h-screen bg-white py-12 px-4 md:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="text-center mb-10">
        <h1 class="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
          SPIT <span class="text-red-600">COLLECTION</span>
        </h1>
        <div class="h-1 w-12 bg-red-600 mx-auto mt-2"></div>
      </div>

      <div class="sticky top-20 z-30 bg-white/80 backdrop-blur-md py-4 mb-12 border-y border-slate-100 flex flex-wrap items-center justify-center gap-6">
        <div class="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button 
            v-for="cat in categoryStats" :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all',
              selectedCategory === cat ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'
            ]"
          >
            {{ cat }}
          </button>
        </div>
        <div class="hidden md:block w-px h-4 bg-slate-200"></div>
        <div class="flex items-center gap-2">
          <button 
            v-for="brand in brandStats" :key="brand"
            @click="selectedBrand = brand"
            :class="[
              'px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all',
              selectedBrand === brand 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-900'
            ]"
          >
            {{ brand }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="aspect-3/4 bg-slate-50 animate-pulse rounded-2xl"></div>
      </div>

      <div v-else>
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          <RouterLink 
            v-for="product in filteredProducts" :key="product.id"
            :to="'/product/' + product.id"
            class="group"
          >
            <div class="relative aspect-square bg-[#f9f9f9] rounded-2xl overflow-hidden mb-4 flex items-center justify-center p-6 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200">
              <img :src="product.image" class="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
              
              <div v-if="getSalePrice(product)" class="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-lg z-10 animate-pulse">
                SALE
              </div>

              <div v-if="getActivePromo(product)?.end_date" class="absolute bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm py-1.5 text-center transition-transform translate-y-full group-hover:translate-y-0 duration-300">
                 <p class="text-[8px] text-white font-bold uppercase tracking-widest">
                   Kết thúc sau: <span class="text-red-400 font-mono">{{ getCountdown(getActivePromo(product).end_date) }}</span>
                 </p>
              </div>

              <div class="absolute bottom-3 left-3 bg-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border border-slate-50">
                {{ product.brand }}
              </div>
            </div>

            <div class="px-1">
              <p class="text-[9px] font-bold text-red-600 uppercase mb-1">
                {{ product.category_vi || product.category }}
              </p>
              
              <h3 class="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                {{ product.name_vi || product.name }}
              </h3>
              
              <div v-if="getSalePrice(product)" class="flex flex-col">
                <div class="text-base font-black text-red-600">
                  {{ Math.round(getSalePrice(product)).toLocaleString() }} <span class="text-[10px] font-normal">đ</span>
                </div>
                <div class="text-[11px] font-medium text-slate-400 line-through">
                  {{ product.price?.toLocaleString() }} đ
                </div>
              </div>
              <div v-else class="text-base font-black text-slate-900">
                {{ product.price?.toLocaleString() }} <span class="text-[10px] font-normal">đ</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-else class="text-center py-40">
          <p class="text-slate-300 font-black uppercase tracking-[0.5em] text-xs">No Results Found</p>
          <button @click="selectedBrand = 'Tất cả Hãng'; selectedCategory = 'Tất cả'" class="mt-4 text-[10px] font-bold underline uppercase tracking-widest text-red-600">Reset Filters</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>