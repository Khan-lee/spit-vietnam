<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const isAdding = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const addToCart = (item) => {
  if (item.stock <= 0) return; // Bảo vệ nếu khách hàng cố tình bấm nút disable
  
  isAdding.value = true
  setTimeout(() => {
    const cart = JSON.parse(localStorage.getItem('spit_cart')) || []
    const existingItem = cart.find(i => i.id === route.params.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ id: route.params.id, name: item.name, price: item.price, image: item.image, quantity: 1 })
    }
    
    localStorage.setItem('spit_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))

    isAdding.value = false
    toastMessage.value = `Đã thêm "${item.name}" vào giỏ hàng!`
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3000)
  }, 200)
}

onMounted(async () => {
  try {
    const docRef = doc(db, "products", route.params.id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) product.value = docSnap.data()
  } catch (error) {
    console.error("Lỗi lấy dữ liệu:", error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
    <transition name="slide-fade">
      <div v-if="showToast" class="fixed top-24 right-6 md:right-10 z-100 max-w-sm bg-slate-900 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 backdrop-blur-sm">
        <div class="shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg">✓</div>
        <div class="grow">
          <p class="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Thành công</p>
          <p class="text-xs font-bold leading-relaxed text-slate-100 line-clamp-2">{{ toastMessage }}</p>
        </div>
        <button @click="showToast = false" class="text-slate-500 hover:text-white text-lg p-1">✕</button>
      </div>
    </transition>

    <div class="container mx-auto max-w-6xl py-12 md:py-20 px-6" v-if="product">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
        
        <div class="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex items-center justify-center aspect-square shadow-inner sticky top-24">
          <img :src="product.image || 'https://via.placeholder.com/400'" class="max-h-full object-contain hover:scale-105 transition-transform duration-500" />
        </div>
        
        <div class="space-y-6 md:space-y-8">
          <div>
            <span class="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">
              {{ product.brand }}
            </span>
            <h1 class="text-4xl md:text-5xl font-black text-slate-950 mt-6 mb-3 uppercase italic leading-none tracking-tighter">
              {{ product.name }}
            </h1>
            <p class="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] ml-1">{{ product.category }}</p>
          </div>
          
          <div class="text-5xl font-black text-red-600 tracking-tight flex items-baseline gap-1.5 bg-red-50 p-6 rounded-2xl border border-red-100">
            {{ product.price?.toLocaleString('vi-VN') }} <span class="text-xl font-bold">VNĐ</span>
          </div>

          <div class="flex items-center gap-4 mt-6">
            <div :class="[
              'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors',
              product.stock > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            ]">
              ● {{ product.stock > 0 ? 'Còn hàng' : 'Hết hàng' }}
            </div>
            <div v-if="product.stock > 0" class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Sẵn có trong kho: <span class="text-slate-900">{{ product.stock }}</span>
            </div>
          </div>

          <button 
            @click="addToCart(product)"
            :disabled="isAdding || product.stock <= 0"
            class="group w-full relative overflow-hidden py-5 rounded-2xl font-black uppercase text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="product.stock > 0 ? 'bg-slate-950 text-white hover:shadow-blue-600/30' : 'bg-slate-200 text-slate-400'"
          >
            <span v-if="product.stock > 0" class="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span class="relative z-10 tracking-[0.2em] flex items-center justify-center gap-2">
              <template v-if="product.stock > 0">
                {{ isAdding ? 'ĐANG XỬ LÝ...' : 'THÊM VÀO GIỎ HÀNG 🛒' }}
              </template>
              <template v-else>SẢN PHẨM TẠM HẾT HÀNG</template>
            </span>
          </button>

          <div v-if="product.description" class="mt-10 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-6 bg-red-600 rounded-full"></span>
              <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Thông số & Đặc điểm</h3>
            </div>
            <div class="bg-slate-50/50 p-6 rounded-4xl border border-slate-100/80 backdrop-blur-sm">
              <p class="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line tracking-tight">{{ product.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>