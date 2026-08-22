<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filteredProducts', 'update:hasActiveFilter', 'update:isFiltering']);

// --- [MOBILE DRAWER STATE] ---
const isOpenMobile = ref(false)

// Khóa cuộn trang khi mở Drawer trên Mobile
watch(isOpenMobile, (val) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})

// Bộ lọc được chọn
const selectedFilters = reactive({
  categories: [],
  brands: [],
  priceRanges: [],
  needs: [],
  sortBy: 'default'
})

// --- [ĐỒNG BỘ TỪ ADMIN] BẢN ĐỒ MAPPING TAGS THÔNG MINH ---
const categoryTagsMap = {
  'DAO PHAY': [
    'Phá thô / Chịu tải nặng',
    'Phay tinh / Bóng bề mặt',
    'Phay 3D / Phay mặt cong',
    'Phay góc R / Bo góc',
    'Phay rãnh / Hốc',
    'Gia công nhôm / Đồng / Nhựa',
    'Gia công thép cứng / Inox / Titan',
    'Cán dao / Đài dao'
  ],
  'DAO TIỆN': [
    'Tiện ngoài',
    'Tiện lỗ trong',
    'Tiện ren',
    'Tiện rãnh / Cắt đứt',
    'Mảnh dao tiện thay thế',
    'Cán dao / Đài dao'
  ],
  'MŨI KHOAN & MŨI TARO': [
    'Khoan mồi / Khoan tâm',
    'Khoan lỗ sâu',
    'Khoan vật liệu cứng',
    'Khoan tưới nguội xuyên tâm',
    'Taro cắt / Taro có phoi',
    'Taro nén / Taro không phoi',
    'Mũi doa lỗ'
  ],
  'ĐÁ MÀI': [
    'Mài phẳng',
    'Mài tròn ngoài',
    'Mài lỗ trong',
    'Mài bén dao cụ',
    'Đá mài kim cương / CBN',
    'Mũi mài hợp kim'
  ],
  'CHỔI ĐÁNH BÓNG': [
    'Đánh gỉ sét / Làm sạch bề mặt',
    'Đánh bavia / Bo mép cạnh',
    'Đánh bóng tinh / Bóng gương',
    'Chổi chén / Chổi bánh xe',
    'Chổi cước thép / Inox',
    'Chổi cước đồng',
    'Chổi nỉ / Vải / Lông cừu',
    'Sáp / Lơ đánh bóng'
  ],
  'LƯỠI CƯA': [
    'Lưỡi cưa đĩa / Hợp kim',
    'Lưỡi cưa vòng (Band saw)',
    'Cắt thép / Thép cứng',
    'Cắt Inox / Titan',
    'Cắt nhôm / Đồng / Nhựa',
    'Cắt gỗ / Vật liệu composite',
    'Răng thưa (Cắt thô / Nhanh)',
    'Răng dày (Cắt tinh / Mịn)'
  ],
  'LƯỠI CƯA': [
    'Lưỡi cưa đĩa / Hợp kim',
    'Lưỡi cưa vòng (Band saw)',
    'Cắt thép / Thép cứng',
    'Cắt Inox / Titan',
    'Cắt nhôm / Đồng / Nhựa',
    'Cắt gỗ / Vật liệu composite',
    'Răng thưa (Cắt thô / Nhanh)',
    'Răng dày (Cắt tinh / Mịn)'
  ],
  'DAO PHAY NGÓN': [
    'Phay sau nhiệt',
    'Phay trước nhiệt'
  ],
  'PHÔI': [
    'Phôi Carbide',
    'Phôi Ceramic'
  ]
}

// 1. TỰ ĐỘNG LẤY DANH MỤC TỪ SẢN PHẨM
const categoryOptions = computed(() => {
  if (props.categories && props.categories.length > 0) {
    return props.categories; 
  }
  if (!props.products) return []
  return [...new Set(props.products.map(p => p.category_vi).filter(Boolean))]
})

// 2. TỰ ĐỘNG LẤY TÍNH NĂNG / NHU CẦU TỪ SẢN PHẨM
const needsOptions = computed(() => {
  if (!props.products || props.products.length === 0) return []
  
  let activeCategory = null;

  if (selectedFilters.categories.length === 1) {
    activeCategory = selectedFilters.categories[0];
  } else if (selectedFilters.categories.length === 0) {
    const uniqueCategories = [...new Set(props.products.map(p => p.category_vi).filter(Boolean))];
    if (uniqueCategories.length === 1) {
      activeCategory = uniqueCategories[0];
    }
  }

  if (!activeCategory) return [];

  const upperCat = String(activeCategory).toUpperCase()
  if (upperCat.includes('DAO PHAY NGÓN')) return categoryTagsMap['DAO PHAY NGÓN']
  if (upperCat.includes('DAO PHAY')) return categoryTagsMap['DAO PHAY']
  if (upperCat.includes('DAO TIỆN')) return categoryTagsMap['DAO TIỆN']
  if (upperCat.includes('KHOAN') || upperCat.includes('TARO')) return categoryTagsMap['MŨI KHOAN & MŨI TARO']
  if (upperCat.includes('ĐÁ MÀI') || upperCat.includes('ĐÁ DOANH')) return categoryTagsMap['ĐÁ MÀI']
  if (upperCat.includes('CHỔI ĐÁNH BÓNG')) return categoryTagsMap['CHỔI ĐÁNH BÓNG']
  if (upperCat.includes('LƯỠI CƯA')) return categoryTagsMap['LƯỠI CƯA']
  if (upperCat.includes('PHÔI')) return categoryTagsMap['PHÔI']

  const relevantProducts = props.products.filter(p => p.category_vi === activeCategory);
  const allTags = relevantProducts.reduce((acc, product) => {
    const tags = product.tags || []
    return acc.concat(tags)
  }, [])

  return [...new Set(allTags)]
})

// Xóa tags đang chọn nếu đổi danh mục
watch(() => selectedFilters.categories, () => {
  selectedFilters.needs = []
}, { deep: true })

// 3. TỰ ĐỘNG LẤY THƯƠNG HIỆU TỪ SẢN PHẨM
const brandOptions = computed(() => {
  const validProducts = props.products.filter(p => {
    if (props.categories && props.categories.length > 0) {
      return props.categories.includes(p.category_vi)
    }
    return true
  })
  return [...new Set(validProducts.map(p => p.brand).filter(Boolean))]
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

const isCurrentlyFiltering = computed(() => {
  return totalActiveFilters.value > 0 || selectedFilters.sortBy !== 'default';
});

watch(isCurrentlyFiltering, (newVal) => {
  emit('update:isFiltering', newVal);
}, { immediate: true });

const filteredProducts = computed(() => {
  const sortType = selectedFilters.sortBy

  const result = props.products.filter(product => {
    const finalPrice = product.salePrice || product.price || 0

    if (selectedFilters.categories.length > 0) {
      if (!selectedFilters.categories.includes(product.category_vi)) return false
    }

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
      const pTags = product.tags || []
      const matchNeed = selectedFilters.needs.some(need => pTags.includes(need))
      if (!matchNeed) return false
    }

    return true
  })

  return result.sort((a, b) => {
    const priceA = Number(a.salePrice || a.price || 0)
    const priceB = Number(b.salePrice || b.price || 0)
    
    if (sortType === 'price-asc') return priceA - priceB
    if (sortType === 'price-desc') return priceB - priceA
    return 0
  })
})

watch(filteredProducts, (newVal) => {
  emit('update:filteredProducts', newVal)
}, { immediate: true })
</script>

<template>
  <!-- NÚT MỞ BỘ LỌC CHỈ HIỆN TRÊN MOBILE (< 768px) -->
  <div class="md:hidden mb-4 w-full">
    <button 
      @click="isOpenMobile = true"
      class="w-full bg-white border border-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl flex items-center justify-between shadow-xs hover:border-red-500 transition-colors cursor-pointer"
    >
      <div class="flex items-center gap-2 text-sm">
        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        <span>Bộ Lọc Sản Phẩm</span>
        <span v-if="totalActiveFilters > 0" class="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full font-extrabold">
          {{ totalActiveFilters }}
        </span>
      </div>
      <span class="text-xs text-slate-500 font-normal">
        {{ filteredProducts.length }} kết quả &rarr;
      </span>
    </button>
  </div>

  <!-- BỘ LỌC CHUẨN DÀNH CHO PC (>= 768px) - GIỮ NGUYÊN 100% CẤU TRÚC GỐC ĐỂ KHÔNG VỠ LAYOUT -->
  <aside class="hidden md:flex bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 flex-col gap-6 sticky top-22.5 max-h-[calc(100vh-110px)] overflow-y-auto z-20 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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

    <!-- KHỐI 2: DANH MỤC -->
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

    <!-- KHỐI 3: MỨC GIÁ -->
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

    <!-- KHỐI 4: THƯƠNG HIỆU -->
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

    <!-- KHỐI 5: TÍNH NĂNG / NHU CẦU -->
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

  <!-- MOBILE DRAWER (DÙNG TELEPORT NÊN KHÔNG BAO GIỜ BỊ ẢNH HƯỞNG BỞI LAYOUT CỦA TRANG CHỦ) -->
  <Teleport to="body">
    <div v-if="isOpenMobile" class="fixed inset-0 z-50 md:hidden">
      <!-- Overlay mờ background -->
      <div 
        @click="isOpenMobile = false" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      ></div>

      <!-- Khung Drawer trượt bên trái -->
      <div class="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white z-50 p-4 flex flex-col gap-6 overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <!-- Header Drawer -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div class="flex flex-col">
            <h2 class="text-sm font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
              <span class="text-red-600"></span> Bộ Lọc
            </h2>
            <div class="text-xs font-semibold text-slate-500 mt-0.5">
              Tìm thấy <span class="font-black text-red-600">{{ filteredProducts.length }}</span> kết quả
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              v-if="totalActiveFilters > 0" 
              @click="resetAllFilters"
              class="text-[11px] font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Xóa tất cả
            </button>
            <button 
              @click="isOpenMobile = false" 
              class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tags đang chọn -->
        <div v-if="totalActiveFilters > 0" class="flex flex-wrap gap-1.5">
          <span 
            v-for="c in selectedFilters.categories" 
            :key="'mc-' + c"
            class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
          >
            {{ c }}
            <button @click="removeSingleFilter('categories', c)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
          </span>
          <span 
            v-for="b in selectedFilters.brands" 
            :key="'mb-' + b"
            class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
          >
            {{ b }}
            <button @click="removeSingleFilter('brands', b)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
          </span>
          <span 
            v-for="priceId in selectedFilters.priceRanges" 
            :key="'mp-' + priceId"
            class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
          >
            {{ priceOptions.find(o => o.id === priceId)?.label }}
            <button @click="removeSingleFilter('priceRanges', priceId)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
          </span>
          <span 
            v-for="need in selectedFilters.needs" 
            :key="'mn-' + need"
            class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5"
          >
            {{ need }}
            <button @click="removeSingleFilter('needs', need)" class="hover:text-red-900 cursor-pointer text-xs leading-none">&times;</button>
          </span>
        </div>

        <!-- Sắp xếp -->
        <div class="flex flex-col gap-2">
          <h3 class="text-[11px] font-bold uppercase text-slate-400">Sắp xếp theo</h3>
          <select 
            v-model="selectedFilters.sortBy" 
            class="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:border-red-600 transition-all cursor-pointer"
          >
            <option value="default">Nổi bật nhất</option>
            <option value="price-asc">Giá: Thấp đến Cao</option>
            <option value="price-desc">Giá: Cao đến Thấp</option>
          </select>
        </div>

        <div class="w-full h-px bg-slate-100"></div>

        <!-- Danh mục -->
        <div v-if="categoryOptions.length > 0" class="flex flex-col gap-3">
          <h3 class="text-[11px] font-bold uppercase text-slate-400">Loại hàng / Danh mục</h3>
          <div class="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <label v-for="c in categoryOptions" :key="'m-cat-' + c" class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                :checked="selectedFilters.categories.includes(c)" 
                @change="toggleFilterItem('categories', c)" 
                class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
              />
              <span class="text-xs font-medium text-slate-700 truncate">{{ c }}</span>
            </label>
          </div>
        </div>

        <div v-if="categoryOptions.length > 0" class="w-full h-px bg-slate-100"></div>

        <!-- Khoảng giá -->
        <div class="flex flex-col gap-3">
          <h3 class="text-[11px] font-bold uppercase text-slate-400">Khoảng giá</h3>
          <div class="flex flex-col gap-2.5">
            <label v-for="p in priceOptions" :key="'m-pr-' + p.id" class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                :checked="selectedFilters.priceRanges.includes(p.id)" 
                @change="toggleFilterItem('priceRanges', p.id)" 
                class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer" 
              />
              <span class="text-xs font-medium text-slate-700">{{ p.label }}</span>
            </label>
          </div>
        </div>

        <div class="w-full h-px bg-slate-100"></div>

        <!-- Thương hiệu -->
        <div v-if="brandOptions.length > 0" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-[11px] font-bold uppercase text-slate-400">Thương hiệu</h3>
            <span class="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{{ brandOptions.length }}</span>
          </div>
          <div class="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <label v-for="b in brandOptions" :key="'m-brand-' + b" class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                :checked="selectedFilters.brands.includes(b)" 
                @change="toggleFilterItem('brands', b)" 
                class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
              />
              <span class="text-xs font-medium text-slate-700 truncate">{{ b }}</span>
            </label>
          </div>
        </div>

        <!-- Tính năng / Nhu cầu -->
        <div v-if="needsOptions.length > 0" class="flex flex-col gap-3">
          <div class="w-full h-px bg-slate-100"></div>
          <h3 class="text-[11px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</h3>
          <div class="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <label v-for="need in needsOptions" :key="'m-need-' + need" class="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                :checked="selectedFilters.needs.includes(need)"
                @change="toggleFilterItem('needs', need)"
                class="w-4 h-4 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
              />
              <span class="text-xs font-medium text-slate-700 leading-relaxed">{{ need }}</span>
            </label>
          </div>
        </div>

        <!-- Nút Xem sản phẩm chốt dưới đáy Drawer -->
        <div class="mt-auto pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-1">
          <button 
            @click="isOpenMobile = false" 
            class="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center cursor-pointer"
          >
            <span>Xem {{ filteredProducts.length }} sản phẩm</span>
          </button>
        </div>

      </div>
    </div>
  </Teleport>
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