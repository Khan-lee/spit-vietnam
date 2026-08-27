<script setup>
import { ref, reactive, computed, watch } from 'vue'
// ⚡ UPDATE MỚI: Import useRouter để xử lý nút "Xem tất cả danh mục" (điều hướng thẳng
// về /products không kèm ?category=..., thoát khỏi chế độ sidebar thu gọn)
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  // ⚡ UPDATE MỚI: Prop MỚI "categoryDocs" — nhận dữ liệu THÔ của danh mục (đầy đủ id, name_vi,
  // parentId, order...), khác với prop "categories" cũ (chỉ là mảng TÊN CHUỖI phẳng, không đủ
  // thông tin để component này tự biết đâu là Danh mục cha, đâu là Danh mục con). Prop này là
  // TÙY CHỌN (default mảng rỗng) — nếu file cha (HomeView.vue/ProductsView.vue) CHƯA kịp truyền
  // vào, component tự động rơi về hiển thị PHẲNG như cũ (xem categoryTree bên dưới), không bao
  // giờ bị "trắng trơn" không hiện gì.
  categoryDocs: {
    type: Array,
    default: () => []
  },
  // ⚡ UPDATE MỚI: Prop MỚI "focusCategoryName" — khi file cha (hiện tại là ProductsView.vue)
  // truyền vào tên 1 Danh mục đang được xem (lấy từ ?category=... trên URL), sidebar sẽ TỰ
  // ĐỘNG THU GỌN lại, chỉ hiện đúng Danh mục CHA liên quan + các Danh mục CON anh em của nó
  // (giống đúng kiểu thietbi247.vn: bấm vào 1 danh mục con thì sidebar chỉ còn thấy các danh
  // mục con khác CÙNG CHA, không hiện lẫn lộn các nhóm cha khác không liên quan). Để trống
  // (mặc định) = hiện đầy đủ cây Cha/Con như bình thường (không đổi hành vi cũ).
  focusCategoryName: {
    type: String,
    default: ''
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

// =========================================================================
// ⚡ UPDATE MỚI: XÂY DỰNG CÂY DANH MỤC CHA/CON (categoryTree) + TRẠNG THÁI ACCORDION
// -------------------------------------------------------------------------
// Dùng "categoryDocs" (dữ liệu thô có parentId) để gom thành từng nhóm Cha kèm mảng
// "children" (Danh mục con thuộc về nó) — y hệt cách đã làm ở AdminCategoryTab.vue.
// Nếu file cha CHƯA truyền categoryDocs (mảng rỗng) -> tự động rơi về hiển thị PHẲNG,
// mỗi "nhóm" chỉ có đúng 1 phần tử là chính nó, không có con -> giao diện hoạt động y
// hệt bản cũ trước khi có phân cấp, không phá vỡ gì cả.
// =========================================================================
const categoryTree = computed(() => {
  if (!props.categoryDocs || props.categoryDocs.length === 0) {
    return categoryOptions.value.map(name => ({ id: name, name, children: [] }))
  }

  const activeDocs = props.categoryDocs.filter(c => c.isActive !== false)
  const parents = activeDocs
    .filter(c => !c.parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  return parents.map(parent => ({
    id: parent.id,
    name: parent.name_vi,
    children: activeDocs
      .filter(c => c.parentId === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(c => ({ id: c.id, name: c.name_vi }))
  }))
})

// Trạng thái đóng/mở từng nhóm Danh mục cha (accordion) — mặc định MỞ hết (undefined !== false),
// khách có thể tự bấm thu gọn nhóm không quan tâm để nhìn gọn gàng hơn
const expandedCategoryGroups = ref({})
const toggleCategoryGroup = (groupId) => {
  expandedCategoryGroups.value[groupId] = expandedCategoryGroups.value[groupId] === false ? true : false
}

// =========================================================================
// ⚡ UPDATE MỚI: XÁC ĐỊNH NHÓM CHA CẦN "THU GỌN VỀ" KHI ĐANG XEM 1 DANH MỤC CỤ THỂ
// -------------------------------------------------------------------------
// Nếu props.focusCategoryName trùng tên 1 Danh mục CHA -> dùng thẳng nhóm đó.
// Nếu props.focusCategoryName trùng tên 1 Danh mục CON -> tìm ngược lên nhóm CHA chứa nó.
// Nếu không tìm thấy gì khớp (hoặc focusCategoryName để trống) -> trả về null, sidebar hiện
// đầy đủ cây như bình thường (không có gì thay đổi so với trước).
// =========================================================================
const focusedGroup = computed(() => {
  if (!props.focusCategoryName) return null
  const asParent = categoryTree.value.find(g => g.name === props.focusCategoryName)
  if (asParent) return asParent
  return categoryTree.value.find(g => g.children.some(c => c.name === props.focusCategoryName)) || null
})

// Bấm "Xem tất cả danh mục" -> điều hướng về /products (bỏ hẳn ?category=...) để thoát
// khỏi chế độ sidebar thu gọn, quay lại xem đầy đủ cây Cha/Con
// ⚡ UPDATE MỚI: Đóng luôn Drawer Mobile nếu đang mở, tiện khách xem kết quả ngay
const clearCategoryFocus = () => {
  router.push('/products')
  isOpenMobile.value = false
}

// ⚡ UPDATE MỚI: Mở rộng danh sách tên Danh mục ĐANG CHỌN ra thành tập hợp cần khớp khi lọc —
// nếu 1 tên đang chọn là Danh mục CHA, mở rộng thành chính nó + tên TẤT CẢ Danh mục CON thuộc
// về nó (vì sản phẩm luôn được gán cho danh mục con cụ thể, không gán trực tiếp cho danh mục
// cha). Đồng bộ đúng nguyên tắc đã áp dụng ở ProductsView.vue (hàm expandCategoryNames).
const expandSelectedCategoryNames = (names) => {
  const expanded = new Set()
  names.forEach(name => {
    expanded.add(name)
    const group = categoryTree.value.find(g => g.name === name)
    if (group) {
      group.children.forEach(child => expanded.add(child.name))
    }
  })
  return expanded
}

// =========================================================================
// ⚡ UPDATE MỚI: Tách riêng logic xác định "Danh mục đang active" (activeCategory)
// ra thành 1 computed dùng chung, thay vì tính lại bên trong needsOptions như cũ.
// Lý do: giờ cần biết CHÍNH XÁC category nào đang active để lồng khối
// "Tính năng / Nhu cầu" ngay bên dưới ĐÚNG dòng danh mục đó trong template
// (thay vì hiển thị thành 1 khối tách biệt phía dưới toàn bộ danh sách danh mục).
// =========================================================================
const activeCategoryForNeeds = computed(() => {
  // ⚡ UPDATE MỚI: Ưu tiên props.focusCategoryName nếu nó là 1 Danh mục CON hợp lệ (đang xem
  // qua URL) — vì trong chế độ sidebar thu gọn, danh mục con anh em giờ là LINK ĐIỀU HƯỚNG
  // (không còn dùng checkbox nội bộ selectedFilters.categories để chọn nữa, xem giải thích
  // ở khối template "focusedGroup"), nên cần lấy trực tiếp từ URL để khối "Tính năng/Nhu
  // cầu" vẫn hiện đúng dưới danh mục con đang xem.
  if (props.focusCategoryName && categoryTree.value.some(g => g.children.some(c => c.name === props.focusCategoryName))) {
    return props.focusCategoryName
  }

  if (!props.products || props.products.length === 0) return null

  if (selectedFilters.categories.length === 1) {
    return selectedFilters.categories[0]
  }
  if (selectedFilters.categories.length === 0) {
    const uniqueCategories = [...new Set(props.products.map(p => p.category_vi).filter(Boolean))]
    if (uniqueCategories.length === 1) {
      return uniqueCategories[0]
    }
  }
  return null
})

// 2. TỰ ĐỘNG LẤY TÍNH NĂNG / NHU CẦU TỪ SẢN PHẨM
const needsOptions = computed(() => {
  // ⚡ UPDATE MỚI: Dùng lại activeCategoryForNeeds thay vì tính riêng ở đây
  const activeCategory = activeCategoryForNeeds.value
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
      // ⚡ UPDATE MỚI: So khớp với TẬP HỢP tên đã mở rộng (gồm cả con nếu chọn danh mục cha),
      // thay vì chỉ so khớp === với đúng 1 tên duy nhất như trước
      const expandedNames = expandSelectedCategoryNames(selectedFilters.categories)
      if (!expandedNames.has(product.category_vi)) return false
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

    <!-- 
      KHỐI 2: DANH MỤC
      ⚡ UPDATE MỚI: ĐỔI SANG HIỂN THỊ DẠNG CÂY CHA/CON VỚI ACCORDION MƯỢT MÀ
      -----------------------------------------------------------------------
      Mỗi Danh mục CHA là 1 hàng bấm được (mũi tên xoay 90° khi mở/đóng), bên dưới là các
      Danh mục CON thụt lề — dùng kỹ thuật CSS "grid-rows 0fr -> 1fr" để animate chiều cao
      mượt mà khi mở/đóng (không cần đo chiều cao bằng JS, mượt và nhẹ). Khối "Tính năng /
      Nhu cầu" vẫn được lồng ngay dưới đúng Danh mục con đang chọn như trước, không đổi.
      Nếu 1 nhóm cha KHÔNG có danh mục con nào (chưa kịp phân cấp) -> hiển thị như 1 dòng
      checkbox bình thường, không có accordion, y hệt hành vi cũ.
    -->
    <!-- 
      ⚡ UPDATE MỚI: KHI ĐANG XEM 1 DANH MỤC CỤ THỂ (focusedGroup có giá trị) — CHỈ HIỆN
      ĐÚNG NHÓM CHA LIÊN QUAN + CÁC CON ANH EM CỦA NÓ, giống đúng kiểu thietbi247.vn, thay vì
      hiện lẫn lộn cả 3 nhóm cha như trước gây rối mắt. Có nút "Xem tất cả danh mục" để thoát
      ra xem lại đầy đủ cây khi cần.
      
      ⚡ UPDATE MỚI (2) — SỬA LỖI "0 SẢN PHẨM" KHI BẤM SANG DANH MỤC CON KHÁC:
      Trước đây các danh mục con anh em ở đây là CHECKBOX (dùng chung selectedFilters.categories
      với chế độ lọc thông thường). Nhưng ProductsView.vue có 1 bộ lọc "BẮT BUỘC" riêng dựa
      trên URL (?category=...) luôn ép kết quả chỉ được thuộc ĐÚNG 1 danh mục trên URL. Khi
      tick thêm checkbox 1 danh mục con KHÁC (VD "MŨI KHOAN" trong lúc URL vẫn là "DAO PHAY"),
      2 điều kiện lọc "chỏi nhau" (giao rỗng) -> luôn ra 0 sản phẩm.
      CÁCH SỬA: đổi các danh mục con anh em ở đây thành LINK ĐIỀU HƯỚNG THẲNG (router-link)
      tới ?category=<tên con đó> thay vì checkbox lọc thêm — bấm vào là CHUYỂN HẲN URL sang
      danh mục mới, không còn 2 bộ lọc xung đột nữa. Đúng y hệt cách thietbi247.vn làm (danh
      mục con anh em của họ cũng là link trơn, không phải checkbox).
    -->
    <div v-if="focusedGroup" class="flex flex-col gap-1">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-[11px] font-bold uppercase text-red-600 truncate">{{ focusedGroup.name }}</h3>
        <button 
          type="button" 
          @click="clearCategoryFocus" 
          class="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          Xem tất cả
        </button>
      </div>
      <div class="flex flex-col gap-1 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <template v-for="child in focusedGroup.children" :key="child.id">
          <router-link
            :to="{ path: '/products', query: { category: child.name } }"
            class="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors truncate"
            :class="child.name === focusCategoryName ? 'bg-red-50 text-red-600 font-black' : 'text-slate-700 font-medium hover:bg-slate-50 hover:text-red-600'"
          >
            <span class="truncate">{{ child.name }}</span>
          </router-link>

          <!-- Khối "Tính năng / Nhu cầu" vẫn lồng ngay dưới đúng danh mục con đang active -->
          <div 
            v-if="child.name === activeCategoryForNeeds && needsOptions.length > 0" 
            class="flex flex-col gap-2 pl-6 py-1 border-l-2 border-red-100 ml-3"
          >
            <span class="text-[10px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</span>
            <label 
              v-for="need in needsOptions" 
              :key="need"
              class="flex items-start gap-2.5 group cursor-pointer"
            >
              <input 
                type="checkbox" 
                :checked="selectedFilters.needs.includes(need)"
                @change="toggleFilterItem('needs', need)"
                class="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
              />
              <span class="text-[11px] font-medium text-slate-600 group-hover:text-red-600 transition-colors leading-relaxed">{{ need }}</span>
            </label>
          </div>
        </template>
      </div>
    </div>

    <!-- Cây đầy đủ (accordion) — chỉ hiện khi KHÔNG đang thu gọn theo focusedGroup -->
    <div v-else-if="categoryTree.length > 0" class="flex flex-col gap-1">
      <h3 class="text-[11px] font-bold uppercase text-slate-400 mb-2">Loại hàng / Danh mục</h3>
      <div class="flex flex-col gap-1 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div v-for="group in categoryTree" :key="group.id" class="flex flex-col">

          <!-- Trường hợp nhóm cha CHƯA có con -> checkbox thường, không accordion -->
          <label v-if="group.children.length === 0" class="flex items-center gap-3 group cursor-pointer py-1.5">
            <input 
              type="checkbox" 
              :checked="selectedFilters.categories.includes(group.name)" 
              @change="toggleFilterItem('categories', group.name)" 
              class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
            />
            <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors truncate">{{ group.name }}</span>
          </label>

          <!-- Trường hợp nhóm cha CÓ con -> hàng tiêu đề bấm mở/đóng (accordion) -->
          <template v-else>
            <button
              type="button"
              @click="toggleCategoryGroup(group.id)"
              class="flex items-center justify-between gap-2 py-1.5 w-full text-left cursor-pointer group/head"
            >
              <span class="text-xs font-black text-slate-800 uppercase tracking-wide group-hover/head:text-red-600 transition-colors truncate">
                {{ group.name }}
              </span>
              <svg 
                class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out" 
                :class="expandedCategoryGroups[group.id] === false ? '' : 'rotate-90'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- ⚡ Khung animate mở/đóng bằng kỹ thuật CSS Grid (0fr <-> 1fr), mượt & nhẹ -->
            <div 
              class="grid transition-all duration-300 ease-in-out"
              :class="expandedCategoryGroups[group.id] === false ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'"
            >
              <div class="overflow-hidden">
                <div class="flex flex-col gap-2 pl-4 border-l-2 border-slate-100 ml-1 pb-2 pt-1">
                  <template v-for="child in group.children" :key="child.id">
                    <label class="flex items-center gap-3 group cursor-pointer">
                      <input 
                        type="checkbox" 
                        :checked="selectedFilters.categories.includes(child.name)" 
                        @change="toggleFilterItem('categories', child.name)" 
                        class="w-3.5 h-3.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                      />
                      <span class="text-xs font-medium text-slate-700 group-hover:text-red-600 transition-colors truncate">{{ child.name }}</span>
                    </label>

                    <!-- Khối "Tính năng / Nhu cầu" lồng ngay dưới đúng danh mục con đang active -->
                    <div 
                      v-if="child.name === activeCategoryForNeeds && needsOptions.length > 0" 
                      class="flex flex-col gap-2 pl-6 py-1 border-l-2 border-red-100 ml-1"
                    >
                      <span class="text-[10px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</span>
                      <label 
                        v-for="need in needsOptions" 
                        :key="need"
                        class="flex items-start gap-2.5 group cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          :checked="selectedFilters.needs.includes(need)"
                          @change="toggleFilterItem('needs', need)"
                          class="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                        />
                        <span class="text-[11px] font-medium text-slate-600 group-hover:text-red-600 transition-colors leading-relaxed">{{ need }}</span>
                      </label>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ⚡ UPDATE MỚI: Dòng phân cách hiện được cho cả 2 trường hợp (thu gọn theo focusedGroup HOẶC cây đầy đủ) -->
    <div v-if="focusedGroup || categoryTree.length > 0" class="w-full h-px bg-slate-100 mt-1"></div>

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

        <!-- 
          Danh mục
          ⚡ UPDATE MỚI: Đồng bộ dạng cây cha/con + accordion mượt mà với bản Desktop ở trên,
          kèm chế độ thu gọn theo focusedGroup khi đang xem 1 danh mục cụ thể.
        -->
        <div v-if="focusedGroup" class="flex flex-col gap-1">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-[11px] font-bold uppercase text-red-600 truncate">{{ focusedGroup.name }}</h3>
            <button 
              type="button" 
              @click="clearCategoryFocus" 
              class="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
            >
              Xem tất cả
            </button>
          </div>
          <!-- ⚡ UPDATE MỚI: Đổi checkbox -> router-link điều hướng thẳng (giải thích chi tiết
               ở bản Desktop phía trên) — sửa lỗi "0 sản phẩm" khi bấm sang danh mục con khác.
               Có thêm @click đóng luôn Drawer Mobile sau khi điều hướng, tiện tay khách xem
               kết quả ngay không cần tự bấm nút đóng. -->
          <div class="flex flex-col gap-1 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <template v-for="child in focusedGroup.children" :key="'m-focus-' + child.id">
              <router-link
                :to="{ path: '/products', query: { category: child.name } }"
                @click="isOpenMobile = false"
                class="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors truncate"
                :class="child.name === focusCategoryName ? 'bg-red-50 text-red-600 font-black' : 'text-slate-700 font-medium hover:bg-slate-50 hover:text-red-600'"
              >
                <span class="truncate">{{ child.name }}</span>
              </router-link>
              <div 
                v-if="child.name === activeCategoryForNeeds && needsOptions.length > 0" 
                class="flex flex-col gap-2 pl-5 py-1 border-l-2 border-red-100 ml-2"
              >
                <span class="text-[10px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</span>
                <label v-for="need in needsOptions" :key="'m-focus-need-' + need" class="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    :checked="selectedFilters.needs.includes(need)"
                    @change="toggleFilterItem('needs', need)"
                    class="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                  />
                  <span class="text-[11px] font-medium text-slate-600 leading-relaxed">{{ need }}</span>
                </label>
              </div>
            </template>
          </div>
        </div>

        <div v-else-if="categoryTree.length > 0" class="flex flex-col gap-1">
          <h3 class="text-[11px] font-bold uppercase text-slate-400 mb-2">Loại hàng / Danh mục</h3>
          <div class="flex flex-col gap-1 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div v-for="group in categoryTree" :key="'m-' + group.id" class="flex flex-col">

              <!-- Trường hợp nhóm cha CHƯA có con -> checkbox thường, không accordion -->
              <label v-if="group.children.length === 0" class="flex items-center gap-3 cursor-pointer py-1.5">
                <input 
                  type="checkbox" 
                  :checked="selectedFilters.categories.includes(group.name)" 
                  @change="toggleFilterItem('categories', group.name)" 
                  class="w-4 h-4 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                />
                <span class="text-xs font-medium text-slate-700 truncate">{{ group.name }}</span>
              </label>

              <!-- Trường hợp nhóm cha CÓ con -> hàng tiêu đề bấm mở/đóng (accordion) -->
              <template v-else>
                <button
                  type="button"
                  @click="toggleCategoryGroup(group.id)"
                  class="flex items-center justify-between gap-2 py-1.5 w-full text-left cursor-pointer"
                >
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                    {{ group.name }}
                  </span>
                  <svg 
                    class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out" 
                    :class="expandedCategoryGroups[group.id] === false ? '' : 'rotate-90'"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div 
                  class="grid transition-all duration-300 ease-in-out"
                  :class="expandedCategoryGroups[group.id] === false ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'"
                >
                  <div class="overflow-hidden">
                    <div class="flex flex-col gap-2 pl-4 border-l-2 border-slate-100 ml-1 pb-2 pt-1">
                      <template v-for="child in group.children" :key="'m-' + child.id">
                        <label class="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            :checked="selectedFilters.categories.includes(child.name)" 
                            @change="toggleFilterItem('categories', child.name)" 
                            class="w-3.5 h-3.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                          />
                          <span class="text-xs font-medium text-slate-700 truncate">{{ child.name }}</span>
                        </label>

                        <div 
                          v-if="child.name === activeCategoryForNeeds && needsOptions.length > 0" 
                          class="flex flex-col gap-2 pl-6 py-1 border-l-2 border-red-100 ml-1"
                        >
                          <span class="text-[10px] font-bold uppercase text-slate-400">Tính năng / Nhu cầu</span>
                          <label v-for="need in needsOptions" :key="'m-need-' + need" class="flex items-start gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              :checked="selectedFilters.needs.includes(need)"
                              @change="toggleFilterItem('needs', need)"
                              class="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 accent-red-600 focus:ring-red-500 cursor-pointer shrink-0" 
                            />
                            <span class="text-[11px] font-medium text-slate-600 leading-relaxed">{{ need }}</span>
                          </label>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- ⚡ UPDATE MỚI: Dòng phân cách hiện được cho cả 2 trường hợp (thu gọn HOẶC cây đầy đủ) -->
        <div v-if="focusedGroup || categoryTree.length > 0" class="w-full h-px bg-slate-100"></div>

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