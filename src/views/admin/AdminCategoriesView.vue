<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminSidebar from '../../components/AdminSidebar.vue'
import AdminCategoryTab from '../../components/AdminCategoryTab.vue'

const products = ref([])
const isLoading = ref(true)

const fetchProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"))
    products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi lấy sản phẩm phục vụ quản lý danh mục:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
    <AdminSidebar />

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-10 transition-all duration-300">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
         <div class="animate-pulse font-black text-slate-400 uppercase tracking-widest text-xs">ĐANG TẢI DỮ LIỆU...</div>
      </div>
      
      <div v-else class="max-w-6xl mx-auto space-y-6">
        <div class="space-y-1">
           <h1 class="text-2xl font-black text-slate-900 uppercase italic">Hệ thống quản lý SPIT</h1>
           <p class="text-[10px] font-bold text-slate-400 uppercase">Danh mục & Banner đại diện</p>
        </div>
        
        <AdminCategoryTab :products="products" />
      </div>
    </div>
  </div>
</template>