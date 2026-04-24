<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase' 
import { collection, getDocs } from 'firebase/firestore'

const brands = ref([])
const loading = ref(true)

const fetchBrands = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "brands"))
    brands.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi lấy logo nhãn hàng:", error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchBrands)
</script>

<template>
  <div v-if="brands.length > 0" class="bg-white py-12 md:py-16 overflow-hidden border-t border-slate-100">
    <div class="container mx-auto px-6 mb-10 text-center">
      <h3 class="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic">
        Đối tác & Nhãn hàng liên kết
      </h3>
    </div>

    <div class="relative flex overflow-hidden group">
      <div class="flex gap-12 md:gap-20 items-center animate-marquee whitespace-nowrap min-w-full">
        <div v-for="brand in brands" :key="'a-' + brand.id" 
             class="w-32 md:w-44 h-16 md:h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <img :src="brand.logoUrl" class="max-w-full max-h-full object-contain pointer-events-none" />
        </div>
        
        <div v-for="brand in brands" :key="'b-' + brand.id" 
             class="w-32 md:w-44 h-16 md:h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <img :src="brand.logoUrl" class="max-w-full max-h-full object-contain pointer-events-none" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    /* Chạy hết 50% chiều dài (tức là hết 1 bộ logo) thì reset lại */
    transform: translateX(-50%);
  }
}

.animate-marquee {
  display: flex;
  width: max-content;
  /* 40s là tốc độ vừa phải, sang trọng. Muốn nhanh hơn thì giảm xuống 20s */
  animation: marquee 40s linear infinite;
}

/* Dừng lại khi khách hàng rê chuột vào logo bất kỳ */
.group:hover .animate-marquee {
  animation-play-state: paused;
}

/* Fix cho Safari để animation mượt hơn */
.animate-marquee {
  will-change: transform;
}
</style>