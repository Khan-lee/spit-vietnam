<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  }
})

// [MỚI] Thêm emit hasActiveFilter để báo cho file cha biết trạng thái đóng/mở
const emit = defineEmits(['update:filteredProducts', 'update:hasActiveFilter'])

const selectedFilters = reactive({
  brands: [],
  priceRanges: [],
  needs: [],
  sortBy: 'default'
})

const activeDropdown = ref(null)

const toggleDropdown = (name) => {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

const brandOptions = computed(() => {
  return [...new Set(props.products.map(p => p.brand).filter(Boolean))]
})

const priceOptions = [
  { id: 'under-5m', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { id: '5m-10m', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { id: '10m-20m', label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { id: 'above-20m', label: 'Trên 20 triệu', min: 20000000, max: Infinity }
]

const needsOptions = [
  { label: 'Gia công cơ khí chính xác (CNC)', value: 'cnc-precision', icon: '' },
  { label: 'Gia công tốc độ cao (HSM)', value: 'hsm', icon: '' },
  { label: 'Cắt thô / Chịu tải nặng', value: 'roughing', icon: '' },
  { label: 'Cắt tinh / Bóng bề mặt', value: 'finishing', icon: '' },
  { label: 'Gia công thép cứng / Thép nhiệt luyện', value: 'hardened-steel', icon: '' },
  { label: 'Gia công Nhôm & Kim loại màu', value: 'aluminum-nonferrous', icon: '' },
  { label: 'Tiết kiệm chi phí / Sản xuất hàng loạt', value: 'cost-effective', icon: '' }
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
  selectedFilters.brands = []
  selectedFilters.priceRanges = []
  selectedFilters.needs = []
  selectedFilters.sortBy = 'default'
  activeDropdown.value = null
}

const totalActiveFilters = computed(() => {
  return selectedFilters.brands.length + selectedFilters.priceRanges.length + selectedFilters.needs.length
})

// [MỚI] Theo dõi tổng số lượng lọc, báo cho cha biết để ẩn/hiện phần kết quả
watch(totalActiveFilters, (newVal) => {
  emit('update:hasActiveFilter', newVal > 0)
}, { immediate: true })

const filteredProducts = computed(() => {
  return props.products.filter(product => {
    const finalPrice = product.salePrice || product.price || 0

    if (selectedFilters.brands.length > 0) {
      if (!selectedFilters.brands.includes(product.brand)) return false
    }

    if (selectedFilters.priceRanges.length > 0) {
      const matchPrice = selectedFilters.priceRanges.some(priceId => {
        const option = priceOptions.find(o => o.id === priceId)
        return option && finalPrice >= option.min && finalPrice <= option.max
      })
      if (!matchPrice) return false
    }

    if (selectedFilters.needs.length > 0) {
      const pTags = product.tags || product.features || []
      const matchNeed = selectedFilters.needs.some(needId => pTags.includes(needId))
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
  <!-- [SỬA LẠI CSS]: Bỏ bo góc dưới (rounded-b-none), bỏ border dưới, bỏ margin bottom để nó liền mạch với khối kết quả -->
  <div class="bg-white rounded-t-2xl shadow-sm border border-slate-200/80 border-b-0 p-4 relative" :class="totalActiveFilters === 0 ? 'rounded-b-2xl border-b' : ''">
    
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-base"></span>
        <h2 class="text-xs font-black uppercase text-slate-800 tracking-wide">Bộ Lọc Sản Phẩm</h2>
        <span v-if="totalActiveFilters > 0" class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Đã chọn {{ totalActiveFilters }}
        </span>
      </div>

      <button 
        v-if="totalActiveFilters > 0" 
        @click="resetAllFilters"
        class="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
      >
        <span>✕</span> Bỏ chọn tất cả
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 relative">
      <!-- 1. Dropdown Thương Hiệu -->
      <div class="relative">
        <button 
          @click="toggleDropdown('brands')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer"
          :class="selectedFilters.brands.length > 0 ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'"
        >
          <span>Thương hiệu</span>
          <span v-if="selectedFilters.brands.length > 0" class="bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
            {{ selectedFilters.brands.length }}
          </span>
          <span class="text-[10px]">▼</span>
        </button>

        <div v-if="activeDropdown === 'brands'" class="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          <p class="text-[11px] font-bold text-slate-400 mb-2">Chọn thương hiệu:</p>
          <div class="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            <label 
              v-for="b in brandOptions" 
              :key="b" 
              class="flex items-center gap-2 text-xs font-semibold p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 select-none"
            >
              <input 
                type="checkbox" 
                :checked="selectedFilters.brands.includes(b)" 
                @change="toggleFilterItem('brands', b)" 
                class="accent-red-600 rounded" 
              />
              <span class="truncate">{{ b }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 2. Dropdown Khoảng Giá -->
      <div class="relative">
        <button 
          @click="toggleDropdown('prices')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer"
          :class="selectedFilters.priceRanges.length > 0 ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'"
        >
          <span>Mức giá</span>
          <span v-if="selectedFilters.priceRanges.length > 0" class="bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
            {{ selectedFilters.priceRanges.length }}
          </span>
          <span class="text-[10px]">▼</span>
        </button>

        <div v-if="activeDropdown === 'prices'" class="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          <p class="text-[11px] font-bold text-slate-400 mb-2">Chọn khoảng giá:</p>
          <div class="space-y-1">
            <label 
              v-for="p in priceOptions" 
              :key="p.id" 
              class="flex items-center gap-2 text-xs font-semibold p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 select-none"
            >
              <input 
                type="checkbox" 
                :checked="selectedFilters.priceRanges.includes(p.id)" 
                @change="toggleFilterItem('priceRanges', p.id)" 
                class="accent-red-600 rounded" 
              />
              <span>{{ p.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 3. Dropdown Nhu Cầu -->
      <div class="relative">
        <button 
          @click="toggleDropdown('needs')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer"
          :class="selectedFilters.needs.length > 0 ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'"
        >
          <span>Nhu cầu</span>
          <span v-if="selectedFilters.needs.length > 0" class="bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
            {{ selectedFilters.needs.length }}
          </span>
          <span class="text-[10px]">▼</span>
        </button>

        <div v-if="activeDropdown === 'needs'" class="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          <p class="text-[11px] font-extrabold uppercase text-slate-400">Tính năng / Nhu cầu gia công:</p>
          <div class="space-y-1.5">
            <label 
              v-for="item in needsOptions" 
              :key="item.value"
              class="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-red-600 font-medium py-1"
            >
              <!-- [SỬA LỖI]: Bỏ v-model="selectedNeeds", dùng cấu trúc giống giá và hãng -->
              <input 
                type="checkbox" 
                :checked="selectedFilters.needs.includes(item.value)"
                @change="toggleFilterItem('needs', item.value)"
                class="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4" 
              />
              <span>{{ item.icon }} {{ item.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 4. Dropdown Sắp Xếp -->
      <div class="ml-auto flex items-center gap-1.5">
        <span class="text-xs font-semibold text-slate-400 hidden sm:inline">Sắp xếp:</span>
        <select 
          v-model="selectedFilters.sortBy" 
          class="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-red-600 cursor-pointer"
        >
          <option value="default">Nổi bật nhất</option>
          <option value="price-asc">Giá: Thấp đến Cao</option>
          <option value="price-desc">Giá: Cao đến Thấp</option>
        </select>
      </div>
    </div>

    <!-- Click outside để đóng Popup -->
    <div v-if="activeDropdown" @click="activeDropdown = null" class="fixed inset-0 z-40 bg-transparent"></div>

    <!-- DANH SÁCH TAGS (CHIPS) ĐANG CHỌN -->
    <div v-if="totalActiveFilters > 0" class="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
      <span class="text-[11px] font-bold text-slate-400 mr-1">Đang chọn:</span>

      <span 
        v-for="b in selectedFilters.brands" 
        :key="'b-' + b"
        class="bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
      >
        {{ b }}
        <button @click="removeSingleFilter('brands', b)" class="hover:text-red-800 text-xs cursor-pointer">✕</button>
      </span>

      <span 
        v-for="priceId in selectedFilters.priceRanges" 
        :key="'p-' + priceId"
        class="bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
      >
        {{ priceOptions.find(o => o.id === priceId)?.label }}
        <button @click="removeSingleFilter('priceRanges', priceId)" class="hover:text-red-800 text-xs cursor-pointer">✕</button>
      </span>

      <!-- [SỬA LỖI]: needsOptions thay vì needOptions, value thay vì id -->
      <span 
        v-for="needId in selectedFilters.needs" 
        :key="'n-' + needId"
        class="bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
      >
        {{ needsOptions.find(o => o.value === needId)?.label }}
        <button @click="removeSingleFilter('needs', needId)" class="hover:text-red-800 text-xs cursor-pointer">✕</button>
      </span>
    </div>

    <!-- SỐ KẾT QUẢ CÒN LẠI -->
    <div class="mt-2.5 text-[11px] font-semibold text-slate-400">
      Tìm thấy <span class="font-black text-red-600">{{ filteredProducts.length }}</span> sản phẩm
    </div>
  </div>
</template>