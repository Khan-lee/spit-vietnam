<template>
  <div class="mt-10">
    <button 
      @click="handleProceed"
      :disabled="isCartEmpty"
      :class="[
        'w-full py-5 rounded-4xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-500 shadow-xl',
        isCartEmpty 
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
          : 'bg-red-600 text-white hover:bg-slate-900 shadow-red-100 active:scale-95'
      ]"
    >
      <span>{{ isCartEmpty ? 'Giỏ hàng đang trống' : 'Tiến hành thanh toán ngay 🚀' }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps(['cart'])

const isCartEmpty = computed(() => !props.cart || props.cart.length === 0)

const handleProceed = () => {
  if (!isCartEmpty.value) {
    // 1. Lưu vào máy với key 'spit_cart'
    localStorage.setItem('spit_cart', JSON.stringify(props.cart))
    
    // 2. Kích hoạt sự kiện để Header cập nhật kịp thời
    window.dispatchEvent(new Event('storage'))
    
    // 3. Chuyển trang
    router.push('/checkout')
  }
}
</script>