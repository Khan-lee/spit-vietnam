<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
// Import thêm NewsSection để hiển thị bài viết từ Firestore
import NewsSection from '../components/NewsSection.vue' 

const products = ref([])
const isLoading = ref(true)
const selectedCategory = ref('Tất cả')

const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) { console.error("Lỗi:", e) }
  finally { isLoading.value = false }
}

const categories = computed(() => ['Tất cả', ...new Set(products.value.map(p => p.category))])
const filteredProducts = computed(() => 
  selectedCategory.value === 'Tất cả' ? products.value : products.value.filter(p => p.category === selectedCategory.value)
)

onMounted(fetchProducts)
</script>

<template>
  <div class="bg-white">
    <section class="relative bg-slate-900 text-white py-20 px-6 md:px-12 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070" class="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div class="relative z-10 max-w-4xl">
        <h1 class="text-4xl md:text-6xl font-black uppercase italic leading-tight mb-4">
          Giải pháp <span class="text-red-600">Công nghiệp</span> <br> Chính xác tuyệt đối
        </h1>
        <p class="text-slate-300 max-w-xl mb-8 font-medium">Cung cấp dụng cụ cơ khí chính xác và thiết bị nhà máy hàng đầu cho SPIT VIETNAM.</p>
        <div class="flex gap-4">
          <button class="bg-red-600 px-8 py-3 rounded-lg font-black uppercase text-xs hover:bg-red-700 transition">Sản phẩm mới</button>
        </div>
      </div>
    </section>

    <NewsSection />

    <div class="py-12 px-6 md:px-12">
      <h2 class="text-2xl font-black text-center text-slate-800 mb-8 uppercase italic tracking-tight">Danh mục sản phẩm SPIT VIETNAM</h2>
      <div class="flex flex-wrap justify-center gap-2 mb-12">
        <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
                :class="['px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all border', 
                selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200']">
          {{ cat }}
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-20 font-bold text-slate-300">ĐANG TẢI...</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="p in filteredProducts" :key="p.id" class="border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-2xl transition-all group bg-white">
          <div class="h-48 mb-6 flex items-center justify-center">
            <img :src="p.image" class="max-h-full object-contain group-hover:scale-110 transition-transform" />
          </div>
          <span class="text-[9px] font-black text-blue-500 uppercase mb-2">{{ p.category }} | {{ p.brand }}</span>
          <h3 class="font-bold text-slate-800 mb-4 line-clamp-2 h-12">{{ p.name }}</h3>
          <div class="mt-auto">
            <div class="text-xl font-black text-red-600 mb-4">{{ p.price?.toLocaleString() }} VNĐ</div>
            <router-link :to="'/product/' + p.id" class="block w-full text-center bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition">
              Chi tiết sản phẩm
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>