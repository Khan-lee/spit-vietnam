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
  <div v-if="brands.length > 0" class="bg-white py-12 md:py-20 border-t border-slate-100">
    <div class="container mx-auto px-6 mb-10 text-center">
      <h3 class="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic">
        Đối tác & Nhãn hàng liên kết
      </h3>
    </div>

    <!-- Container bọc ngoài cho phép cuộn ngang trên mobile -->
    <div class="marquee-container overflow-x-auto md:overflow-hidden cursor-grab active:cursor-grabbing group">
      <div class="flex gap-16 md:gap-32 items-center animate-marquee whitespace-nowrap">
        
        <!-- Bộ 1 -->
        <div v-for="brand in brands" :key="'list1-' + brand.id" 
             class="shrink-0 w-40 md:w-64 h-20 md:h-32 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 hover:scale-110 transform">
          <img :src="brand.logoUrl" :alt="brand.name" class="max-w-full max-h-full object-contain pointer-events-none p-2" />
        </div>
        
        <!-- Bộ 2 (Clone) -->
        <div v-for="brand in brands" :key="'list2-' + brand.id" 
             class="shrink-0 w-40 md:w-64 h-20 md:h-32 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 hover:scale-110 transform">
          <img :src="brand.logoUrl" :alt="brand.name" class="max-w-full max-h-full object-contain pointer-events-none p-2" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ẩn thanh cuộn (scrollbar) để giao diện sạch sẽ */
.marquee-container::-webkit-scrollbar {
  display: none;
}
.marquee-container {
  -ms-overflow-style: none;  /* IE và Edge */
  scrollbar-width: none;  /* Firefox */
  display: flex;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 50s linear infinite;
  will-change: transform;
}

/* 1. Dừng chạy khi di chuột vào (Desktop) */
.group:hover .animate-marquee {
  animation-play-state: paused;
}

/* 2. Hỗ trợ kéo tay trên Mobile */
@media (max-width: 768px) {
  .animate-marquee {
    /* Trên mobile, nếu bạn muốn ưu tiên kéo tay, có thể tắt animation 
       hoặc để animation chạy chậm hơn để không bị khựng khi buông tay */
    animation-duration: 60s;
  }
  
  .marquee-container {
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch; /* Cho phép cuộn mượt trên iOS */
  }
}
</style>