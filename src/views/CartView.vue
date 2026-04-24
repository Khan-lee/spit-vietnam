<template>
  <div class="fixed inset-0 z-9999 flex justify-end">
    <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
    
    <div class="relative w-full max-w-md bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tighter text-[#1e293b]">Giỏ hàng của bạn</h2>
          <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Đang có {{ cart?.length || 0 }} loại sản phẩm</p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-slate-100 rounded-full transition-all group">
          <svg class="group-hover:rotate-90 transition-transform" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="grow overflow-y-auto pr-2 custom-scrollbar">
        <div v-if="isCartEmpty" class="text-center py-20">
          <p class="text-slate-400 text-sm font-bold uppercase">Giỏ hàng đang trống</p>
        </div>
        
        <div v-else class="space-y-4">
          <div v-for="item in cart" :key="item.id" 
            :class="['group flex gap-4 p-3 rounded-2xl border border-slate-100 transition-all relative', 
                     item.isSoldOut ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50']"
          >
            <div class="relative overflow-hidden rounded-xl w-20 h-20 shadow-sm border border-slate-50">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div v-if="item.isSoldOut" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span class="text-[8px] font-black text-white border border-white px-1 py-0.5 rounded uppercase">Hết hàng</span>
              </div>
            </div>
            
            <div class="flex flex-col justify-between grow">
              <div class="flex justify-between items-start gap-2">
                <h3 class="text-[12px] font-black text-slate-800 line-clamp-2 leading-tight uppercase">{{ item.name }}</h3>
                <button @click="removeItem(item.id)" class="text-slate-300 hover:text-[#e11d48]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
              
              <div class="flex items-end justify-between mt-2">
                <div>
                  <p class="text-[13px] font-black text-[#e11d48] tracking-tight">{{ item.price?.toLocaleString() }}₫</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">SL: {{ item.quantity }}</p>
                </div>

                <div :class="['flex items-center bg-white border border-slate-200 rounded-lg shadow-sm', 
                               item.isSoldOut ? 'pointer-events-none opacity-30' : '']">
                  <button @click="changeQty(item.id, -1)" class="px-2 py-1 hover:text-[#e11d48]">-</button>
                  <span class="px-2 text-[11px] font-black min-w-6 text-center">{{ item.quantity }}</span>
                  <button @click="changeQty(item.id, 1)" class="px-2 py-1 hover:text-[#e11d48]">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 border-t border-slate-900 pt-6 space-y-4">
        <p v-if="hasSoldOutInCart" class="text-[10px] font-bold text-red-500 text-center animate-pulse">Vui lòng xóa sản phẩm đã hết hàng!</p>
        
        <div v-if="!isCartEmpty" class="flex justify-between items-center mb-2">
          <span class="text-[11px] font-black uppercase text-slate-400">Tổng cộng:</span>
          <span class="text-2xl font-black text-[#0f172a] tracking-tighter">{{ totalAmount.toLocaleString() }}₫</span>
        </div>

        <button 
          @click="handleProceed"
          :disabled="isCartEmpty || hasSoldOutInCart"
          class="w-full py-5 rounded-3xl font-black uppercase text-[12px] tracking-widest transition-all duration-300 flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 bg-[#e11d48] text-white shadow-xl shadow-red-100 active:scale-95"
        >
          <span>TIẾN HÀNH THANH TOÁN NGAY 🚀</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const props = defineProps(['cart'])
const emit = defineEmits(['close', 'change-qty', 'remove-item'])
const isCartEmpty = computed(() => !props.cart || props.cart.length === 0)
const totalAmount = computed(() => props.cart?.reduce((t, i) => t + (i.isSoldOut ? 0 : (i.price * i.quantity)), 0) || 0)
const hasSoldOutInCart = computed(() => props.cart?.some(item => item.isSoldOut))
const changeQty = (id, delta) => emit('change-qty', id, delta)
const removeItem = (id) => { if(confirm('Bạn muốn xóa sản phẩm này?')) emit('remove-item', id) }
const handleProceed = () => { if (!isCartEmpty.value && !hasSoldOutInCart.value) { emit('close'); router.push('/checkout') } }
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>