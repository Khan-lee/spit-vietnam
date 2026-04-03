<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { RouterLink } from 'vue-router'

const props = defineProps(['searchQuery'])
const products = ref([])
const loading = ref(true)
const selectedCategory = ref('Tất cả')
const selectedBrand = ref('Tất cả Hãng')

const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi:", error)
  } finally {
    loading.value = false
  }
}

const categoryStats = computed(() => {
  const uniqueCats = [...new Set(products.value.map(p => p.category).filter(Boolean))]
  return ['Tất cả', ...uniqueCats]
})

const brandStats = computed(() => {
  const uniqueBrands = [...new Set(products.value.map(p => p.brand).filter(Boolean))]
  return ['Tất cả Hãng', ...uniqueBrands]
})

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchCat = selectedCategory.value === 'Tất cả' || p.category === selectedCategory.value
    const matchBrand = selectedBrand.value === 'Tất cả Hãng' || p.brand === selectedBrand.value
    const matchSearch = !props.searchQuery || 
      [p.name, p.brand, p.category].some(f => f?.toLowerCase().includes(props.searchQuery.toLowerCase().trim()))
    return matchCat && matchBrand && matchSearch
  })
})

onMounted(fetchProducts)
</script>

<template>
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

        <div class="hidden md:block w-[1px] h-4 bg-slate-200"></div>

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
        <div v-for="n in 8" :key="n" class="aspect-[3/4] bg-slate-50 animate-pulse rounded-2xl"></div>
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
              
              <div class="absolute bottom-3 left-3 bg-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border border-slate-50">
                {{ product.brand }}
              </div>
            </div>

            <div class="px-1">
              <p class="text-[9px] font-bold text-red-600 uppercase mb-1">{{ product.category }}</p>
              <h3 class="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                {{ product.name }}
              </h3>
              <div class="text-base font-black text-slate-900">
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
/* Ẩn thanh scroll cho các trình duyệt */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>