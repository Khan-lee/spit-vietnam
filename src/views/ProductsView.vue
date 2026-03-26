<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { RouterLink } from 'vue-router'

// Nhận từ khóa tìm kiếm từ App.vue
const props = defineProps(['searchQuery'])

const products = ref([])
const loading = ref(true)
const selectedCategory = ref('Tất cả')

// --- 1. LẤY DỮ LIỆU TỪ FIREBASE ---
const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error)
  } finally {
    loading.value = false
  }
}

// --- 2. TỰ ĐỘNG TẠO DANH MỤC & ĐẾM SỐ LƯỢNG ---
const categoryStats = computed(() => {
  // Lấy danh sách các loại hàng hiện có, loại bỏ trùng và rỗng
  const cats = products.value.map(p => p.category).filter(Boolean)
  const uniqueCats = [...new Set(cats)]
  
  // Tạo mảng đối tượng: { tên, số lượng }
  const stats = uniqueCats.map(cat => ({
    name: cat,
    count: products.value.filter(p => p.category === cat).length
  }))

  // Luôn có nút "Tất cả" ở đầu với tổng số lượng
  return [{ name: 'Tất cả', count: products.value.length }, ...stats]
})

// --- 3. LOGIC LỌC TỔNG HỢP (DANH MỤC + TÌM KIẾM) ---
const filteredProducts = computed(() => {
  let result = products.value

  // Lọc theo nút danh mục đang chọn
  if (selectedCategory.value !== 'Tất cả') {
    result = result.filter(p => 
      p.category?.toLowerCase() === selectedCategory.value?.toLowerCase()
    )
  }

  // Lọc thêm theo thanh tìm kiếm (nếu có gõ)
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase().trim()
    result = result.filter(p => 
      p.name?.toLowerCase().includes(query) || 
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    )
  }
  return result
})

onMounted(fetchProducts)
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-16 px-6">
    <div class="max-w-7xl mx-auto">
      
      <div class="mb-12 border-l-8 border-red-600 pl-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Danh mục <span class="text-red-600">Sản phẩm</span>
          </h1>
          <p class="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Dụng cụ công nghiệp chính xác SPIT
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 mb-16 justify-center">
        <button 
          v-for="cat in categoryStats" 
          :key="cat.name"
          @click="selectedCategory = cat.name"
          :class="[
            'group px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 flex items-center gap-3',
            selectedCategory === cat.name 
              ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
              : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600'
          ]"
        >
          <span>{{ cat.name }}</span>
          <span 
            :class="[
              'px-2 py-0.5 rounded-md text-[9px] font-black transition-colors',
              selectedCategory === cat.name ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50'
            ]"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div v-for="n in 8" :key="n" class="bg-white rounded-[2.5rem] h-96 animate-pulse border border-slate-100"></div>
      </div>

      <div v-else>
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 px-2">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="group bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col"
          >
            <div class="relative overflow-hidden rounded-3xl bg-slate-50 aspect-square flex items-center justify-center p-8 mb-6">
              <img :src="product.image" class="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div class="grow px-2">
              <h3 class="text-xs font-black uppercase text-slate-900 mb-2 leading-tight line-clamp-2 italic">
                {{ product.name }}
              </h3>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {{ product.category }} | {{ product.brand }}
              </p>
            </div>

            <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 px-2">
              <div class="text-sm font-black text-red-600">
                {{ product.price?.toLocaleString() }} <span class="text-[9px]">VNĐ</span>
              </div>
              <RouterLink 
                :to="'/product/' + product.id"
                class="bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg active:scale-90"
              >
                →
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 mx-2">
          <div class="text-5xl mb-6 opacity-20">📦</div>
          <h2 class="text-xl font-black uppercase italic text-slate-800">Không có sản phẩm</h2>
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Dữ liệu đang được cập nhật...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>