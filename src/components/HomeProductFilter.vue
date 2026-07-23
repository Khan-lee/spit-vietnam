<script setup>
import { reactive, computed, watch } from 'vue'

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filteredProducts', 'update:hasActiveFilter'])

// Thêm categories vào bộ lọc
const selectedFilters = reactive({
  categories: [],
  brands: [],
  priceRanges: [],
  needs: [],
  sortBy: 'default'
})

// 1. TỰ ĐỘNG LẤY DANH MỤC TỪ SẢN PHẨM (Không hardcode)
const categoryOptions = computed(() => {
  if (!props.products) return []
  return [...new Set(props.products.map(p => p.category_vi).filter(Boolean))]
})

// 2. TỰ ĐỘNG LẤY TÍNH NĂNG / NHU CẦU TỪ SẢN PHẨM (Lấy từ field tags/đặc tính của Admin)
const needsOptions = computed(() => {
  if (!props.products) return []
  
  // Lọc ra các sản phẩm thuộc danh mục đang chọn (nếu có chọn danh mục)
  // Để hiển thị tính năng tương ứng với danh mục đó
  let relevantProducts = props.products
  if (selectedFilters.categories.length > 0) {
    relevantProducts = relevantProducts.filter(p => selectedFilters.categories.includes(p.category_vi))
  }

  // Quét toàn bộ tags/đặc tính của các sản phẩm này
  const allTags = relevantProducts.reduce((acc, product) => {
    const tags = product.tags || []
    return acc.concat(tags)
  }, [])

  // Loại bỏ các tính năng trùng lặp
  return [...new Set(allTags)]
})

// Xóa tags đang chọn nếu đổi danh mục (để tránh bị kẹt tag cũ)
watch(() => selectedFilters.categories, () => {
  selectedFilters.needs = []
}, { deep: true })

// 3. TỰ ĐỘNG LẤY THƯƠNG HIỆU TỪ SẢN PHẨM
const brandOptions = computed(() => {
  return [...new Set(props.products.map(p => p.brand).filter(Boolean))]
})

// Các mức giá cố định
const priceOptions = [
  { id: 'under-5m', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { id: '5m-10m', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { id: '10m-20m', label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { id: 'above-20m', label: 'Trên 20 triệu', min: 20000000, max: Infinity }
]

const toggleFilterItem = (type, value) => {
  const index = selectedFilters[type].indexOf(value)
  if (index > -1) {
    selectedFilters[type].splice(index, 1)
  } else {
    selectedFilters[type].push(value)
  }
}

const removeSingleFilter = (type, value) => {
  const index = selectedFilters[type].indexOf(value)
  if (index > -1) selectedFilters[type].splice(index, 1)
}

const resetAllFilters = () => {
  selectedFilters.categories = []
  selectedFilters.brands = []
  selectedFilters.priceRanges = []
  selectedFilters.needs = []
  selectedFilters.sortBy = 'default'
}

const totalActiveFilters = computed(() => {
  return selectedFilters.categories.length + selectedFilters.brands.length + selectedFilters.priceRanges.length + selectedFilters.needs.length
})

watch(totalActiveFilters, (newVal) => {
  emit('update:hasActiveFilter', newVal > 0)
}, { immediate: true })

const filteredProducts = computed(() => {
  return props.products.filter(product => {
    const finalPrice = product.salePrice || product.price || 0

    // Lọc theo Danh mục
    if (selectedFilters.categories.length > 0) {
      if (!selectedFilters.categories.includes(product.category_vi)) return false
    }

    // Lọc theo Thương hiệu
    if (selectedFilters.brands.length > 0) {
      if (!selectedFilters.brands.includes(product.brand)) return false
    }

    // Lọc theo Giá
    if (selectedFilters.priceRanges.length > 0) {
      const matchPrice = selectedFilters.priceRanges.some(priceId => {
        const option = priceOptions.find(o => o.id === priceId)
        return option && finalPrice >= option.min && finalPrice <= option.max
      })
      if (!matchPrice) return false
    }

    // Lọc theo Tính năng / Nhu cầu (Tags từ Admin)
    if (selectedFilters.needs.length > 0) {
      const pTags = product.tags || []
      const matchNeed = selectedFilters.needs.some(need => pTags.includes(need))
      if (!matchNeed) return false
    }

    return true
  }).sort((a, b) => {
    const priceA = a.salePrice || a.price || 0
    const priceB = b.salePrice || b.price || 0
    if (selectedFilters.sortBy === 'price-asc') return priceA - priceB
    if (selectedFilters.sortBy === 'price-desc') return priceB - priceA
    return 0
  })
})

watch(filteredProducts, (newVal) => {
  emit('update:filteredProducts', newVal)
}, { immediate: true })
</script>

<template>
  <aside class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col gap-6 sticky top-22.5 max-h-[calc(100vh-110px)] overflow-y-auto z-20 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
    
    <!-- HEADER BỘ LỌC -->
    <div class="flex flex-col gap-2 border-b border-slate-100 pb-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
          <span class="text-red-600"></span> Bộ Lọc
        </h2>
        <button 
          v-if="totalActiveFilters > 0" 
          @click="resetAllFilters"
          class="text-[11px] font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          Xóa tất cả
        </button>
      </div>
      <div class="text-xs font-semibold text-slate-500">
        Tìm thấy <span class="font-black text-red-600">{{ filteredProducts.length }}</span> kết quả
      </div>
    </div>

    <!-- DANH SÁCH TAGS ĐANG CHỌN -->
    <div v-if="totalActiveFilters > 0" class="flex flex-wrap gap-1.5">
      <span 
        v-for="c in selectedFilters.categories" 
        :key="'c-' + c"
        class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
      >
        {{ c }}
        <button @click="removeSingleFilter('categories', c)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
      </span>
      <span 
        v-for="b in selectedFilters.brands" 
        :key="'b-' + b"
        class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
      >
        {{ b }}
        <button @click="removeSingleFilter('brands', b)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
      </span>
      <span 
        v-for="priceId in selectedFilters.priceRanges" 
        :key="'p-' + priceId"
        class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
      >
        {{ priceOptions.find(o => o.id === priceId)?.label }}
        <button @click="removeSingleFilter('priceRanges', priceId)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
      </span>
      <span 
        v-for="need in selectedFilters.needs" 
        :key="'n-' + need"
        class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
      >
        {{ need }}
        <button @click="removeSingleFilter('needs', need)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
      </span>
    </div>

    <!-- KHỐI 1: SẮP XẾP -->
    <div class="flex flex-col gap-2">
      <h3 class="text-[11px] font-bold uppercase text-slate-400">Sắp xếp theo</h3>
      <select 
        v-model="selectedFilters.sortBy" 
        class="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
      >
        <option value="default">Nổi bật nhất</option>
        <option value="price-asc">Giá: Thấp đến Cao</option>
        <option value="price-desc">Giá: Cao đến Thấp</option>
      </select>
    </div>

    <div class="w-full h-px bg-slate-100"></div>

    <!-- KHỐI MỚI: DANH MỤC (Lấy từ Admin) -->
    <div v-if="categoryOptions.length > 0" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="text-[11px] font-bold uppercase text-slate-400">Loại hàng / Danh mục</h3>
      </div>
      <div class="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <label 
          v-for="c in categoryOptions" 
          :key="c" 
          class="flex items-center gap-3 group cursor-pointer"
        >
          <input 
            type="checkbox" 
            :checked="selectedFilters.categories.includes(c)" 
            @change="toggleFilterItem('categories', c)" 
            class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
          />
          <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors truncate">{{ c }}</span>
        </label>
      </div>
    </div>

    <div v-if="categoryOptions.length > 0" class="w-full h-px bg-slate-100 mt-1"></div>

    <!-- KHỐI 2: MỨC GIÁ -->
    <div class="flex flex-col gap-3">
      <h3 class="text-[11px] font-bold uppercase text-slate-400">Khoảng giá</h3>
      <div class="flex flex-col gap-2.5">
        <label 
          v-for="p in priceOptions" 
          :key="p.id" 
          class="flex items-center gap-3 group cursor-pointer"
        >
          <input 
            type="checkbox" 
            :checked="selectedFilters.priceRanges.includes(p.id)" 
            @change="toggleFilterItem('priceRanges', p.id)" 
            class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer" 
          />
          <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors">{{ p.label }}</span>
        </label>
      </div>
    </div>

    <div class="w-full h-px bg-slate-100"></div>

    <!-- KHỐI 3: THƯƠNG HIỆU -->
    <div v-if="brandOptions.length > 0" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="text-[11px] font-bold uppercase text-slate-400">Thương hiệu</h3>
        <span class="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{{ brandOptions.length }}</span>
      </div>
      <div class="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <label 
          v-for="b in brandOptions" 
          :key="b" 
          class="flex items-center gap-3 group cursor-pointer"
        >
          <input 
            type="checkbox" 
            :checked="selectedFilters.brands.includes(b)" 
            @change="toggleFilterItem('brands', b)" 
            class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
          />
          <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors truncate">{{ b }}</span>
        </label>
      </div>
      <div v-if="needsOptions.length > 0" class="w-full h-px bg-slate-100 mt-3"></div>
    </div>

    <!-- KHỐI 4: TÍNH NĂNG / NHU CẦU (Lấy từ Admin) -->
    <div v-if="needsOptions.length > 0" class="flex flex-col gap-3">
      <h3 class="text-[11px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</h3>
      <div class="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <label 
          v-for="need in needsOptions" 
          :key="need"
          class="flex items-start gap-3 group cursor-pointer"
        >
          <input 
            type="checkbox" 
            :checked="selectedFilters.needs.includes(need)"
            @change="toggleFilterItem('needs', need)"
            class="w-4 h-4 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
          />
          <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors leading-relaxed">{{ need }}</span>
        </label>
      </div>
    </div>

  </aside>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #e2e8f0; 
  border-radius: 10px;
}
</style>