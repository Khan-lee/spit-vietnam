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
const currentTime = ref(new Date()) 
const localSearch = ref('') 

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

const getCountdown = (endDate) => {
  if (!endDate) return null
  const diff = new Date(endDate) - currentTime.value
  if (diff <= 0) return null
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

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
    
    const query = localSearch.value.trim() || props.searchQuery?.trim() || ''
    const matchSearch = !query || 
      [currentName, p.brand, currentCat].some(f => f?.toLowerCase().includes(query.toLowerCase()))
    
    return matchCat && matchBrand && matchSearch
  })
})

onMounted(fetchData)
</script>

<template>
  <div v-if="latestGlobalPromo" class="bg-linear-to-r from-red-700 via-red-600 to-red-700 text-white py-2.5 px-4 text-center relative shadow-inner z-50">
    <p class="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2">
      <span class="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
      🔥 {{ latestGlobalPromo.title }}: GIẢM ĐẾN {{ latestGlobalPromo.discount_value }}{{ latestGlobalPromo.discount_type === 'percentage' ? '%' : 'Đ' }} 🔥
    </p>
  </div>

  <div class="min-h-screen bg-[#f8fafc] py-16 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto">
      
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 italic leading-none">
          SPIT <span class="text-red-600">COLLECTION</span>
        </h1>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Giải pháp dụng cụ cắt gọt & Thiết bị công nghiệp chính xác</p>
        <div class="h-1 w-16 bg-red-600 mx-auto mt-4 rounded-full"></div>
      </div>

      <div class="max-w-2xl mx-auto mb-14 relative group px-2">
        <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
          <svg class="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input 
          v-model="localSearch"
          type="text" 
          placeholder="Tìm sản phẩm, thương hiệu hoặc mã dụng cụ..."
          class="w-full bg-white border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5 py-4 pl-14 pr-16 rounded-2xl text-[12px] font-bold text-slate-800 tracking-wide outline-none transition-all shadow-md shadow-slate-100 placeholder:text-slate-400 placeholder:font-medium"
        />
        <button v-if="localSearch" @click="localSearch = ''" class="absolute inset-y-0 right-6 flex items-center text-slate-400 hover:text-red-600 transition-colors">
          <span class="text-[10px] font-black tracking-widest bg-slate-100 group-hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-all">XÓA</span>
        </button>
      </div>

      <div class="sticky top-4 z-40 bg-white/80 backdrop-blur-xl py-4 px-6 mb-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0 w-full lg:w-auto">
          <button 
            v-for="cat in categoryStats" :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'whitespace-nowrap px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95',
              selectedCategory === cat 
                ? 'bg-red-600 text-white shadow-lg shadow-red-100' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <div class="hidden lg:block w-px h-6 bg-slate-200"></div>

        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <button 
            v-for="brand in brandStats" :key="brand"
            @click="selectedBrand = brand"
            :class="[
              'whitespace-nowrap px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all active:scale-95',
              selectedBrand === brand 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
            ]"
          >
            {{ brand }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="bg-white border border-slate-100 rounded-3xl p-4 space-y-4 shadow-sm">
          <div class="aspect-square bg-slate-50 animate-pulse rounded-2xl"></div>
          <div class="h-3 bg-slate-100 animate-pulse rounded w-1/3"></div>
          <div class="h-4 bg-slate-100 animate-pulse rounded w-3/4"></div>
          <div class="h-5 bg-slate-100 animate-pulse rounded w-1/2"></div>
        </div>
      </div>

      <div v-else>
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          <RouterLink 
            v-for="product in filteredProducts" :key="product.id"
            :to="'/product/' + product.id"
            class="group bg-white rounded-4xl border border-slate-100 p-4 shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-500 flex flex-col justify-between"
          >
            <div>
              <div class="relative aspect-square bg-[#f8fafc] rounded-2xl overflow-hidden mb-4 flex items-center justify-center p-6 transition-all duration-500">
                <img :src="product.image" class="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" />
                
                <div v-if="getSalePrice(product)" class="absolute top-3 right-3 bg-linear-to-r from-red-600 to-orange-500 text-white px-2.5 py-1 rounded-xl text-[9px] font-black shadow-md shadow-red-100 z-10 tracking-widest">
                  ƯU ĐÃI
                </div>

                <div v-if="getActivePromo(product)?.end_date && getCountdown(getActivePromo(product).end_date)" class="absolute bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-sm py-2 text-center transition-all opacity-0 group-hover:opacity-100 duration-300">
                   <p class="text-[8px] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                     ⏱️ Kết thúc: <span class="text-red-400 font-mono text-[9px] font-black">{{ getCountdown(getActivePromo(product).end_date) }}</span>
                   </p>
                </div>

                <div class="absolute bottom-3 left-3 bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
                  {{ product.brand }}
                </div>
              </div>

              <div class="px-1">
                <p class="text-[9px] font-extrabold text-red-600 uppercase tracking-wider mb-1">
                  {{ product.category_vi || product.category }}
                </p>
                
                <h3 class="text-xs md:text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-3 group-hover:text-red-600 transition-colors">
                  {{ product.name_vi || product.name }}
                </h3>
              </div>
            </div>

            <div class="px-1 mt-2 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div v-if="getSalePrice(product)" class="flex flex-col">
                <span class="text-xs font-semibold text-slate-400 line-through leading-none mb-1">
                  {{ product.price?.toLocaleString() }} đ
                </span>
                <span class="text-sm md:text-base font-black text-red-600 leading-none">
                  {{ Math.round(getSalePrice(product)).toLocaleString() }}<span class="text-[10px] font-bold ml-0.5">đ</span>
                </span>
              </div>
              <div v-else class="text-sm md:text-base font-black text-slate-900 leading-none">
                {{ product.price?.toLocaleString() }}<span class="text-[10px] font-bold ml-0.5">đ</span>
              </div>

              <div class="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-all duration-300 transform group-hover:translate-x-1">
                <svg class="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-else class="text-center py-36 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div class="text-4xl mb-3">⚙️</div>
          <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">Không tìm thấy sản phẩm phù hợp</p>
          <button @click="selectedBrand = 'Tất cả Hãng'; selectedCategory = 'Tất cả'; localSearch = ''" class="mt-4 text-[10px] font-black bg-slate-900 hover:bg-slate-800 text-white uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-md active:scale-95">
            Đặt lại bộ lọc
          </button>
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