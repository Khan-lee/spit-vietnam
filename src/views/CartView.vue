<template>
  <div class="fixed inset-0 z-[100] flex justify-end">
    <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
    
    <div class="relative w-full max-w-md bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tighter">Giỏ hàng</h2>
          <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Đang có {{ cart?.length || 0 }} loại sản phẩm</p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all group">
          <svg class="group-hover:rotate-90 transition-transform" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="grow overflow-y-auto pr-2 custom-scrollbar">
        <div v-if="isCartEmpty" class="text-center py-20">
          <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="text-slate-300" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <p class="text-slate-400 text-sm font-bold">Giỏ hàng đang trống</p>
        </div>
        
        <div v-else class="space-y-4">
          <div v-for="item in cart" :key="item.id" class="group flex gap-4 p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
            <div class="relative overflow-hidden rounded-xl w-20 h-20 shadow-sm border border-slate-50">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <div class="flex flex-col justify-between grow">
              <div class="flex justify-between items-start gap-2">
                <h3 class="text-[12px] font-black text-slate-800 line-clamp-2 leading-tight uppercase">{{ item.name }}</h3>
                <button @click="removeItem(item.id)" class="text-slate-300 hover:text-red-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
              
              <div class="flex items-end justify-between mt-2">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 line-through">{{ (item.price * 1.1).toLocaleString() }}₫</p>
                  <p class="text-[13px] font-black text-red-600 tracking-tight">{{ item.price?.toLocaleString() }}₫</p>
                </div>

                <div class="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                  <button @click="changeQty(item.id, -1)" class="px-2 py-1 hover:text-red-600 transition-colors">-</button>
                  <span class="px-2 text-[11px] font-black min-w-[24px] text-center">{{ item.quantity }}</span>
                  <button @click="changeQty(item.id, 1)" class="px-2 py-1 hover:text-red-600 transition-colors">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 border-t border-slate-100 pt-6 space-y-4">
        <div v-if="!isCartEmpty" class="space-y-2">
          <div class="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Tạm tính</span>
            <span>{{ totalAmount.toLocaleString() }}₫</span>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span class="text-[13px] font-black uppercase text-slate-900">Tổng cộng:</span>
            <span class="text-2xl font-black text-red-600 tracking-tighter">{{ totalAmount.toLocaleString() }}₫</span>
          </div>
        </div>

        <button 
          @click="handleProceed"
          :disabled="isCartEmpty"
          class="w-full py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none bg-red-600 text-white hover:bg-slate-900 shadow-red-100"
        >
          <span>{{ isCartEmpty ? 'Chưa có sản phẩm' : 'Thanh toán ngay' }}</span>
          <svg v-if="!isCartEmpty" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
const totalAmount = computed(() => props.cart?.reduce((t, i) => t + (i.price * i.quantity), 0) || 0)

// Emit sự kiện lên App.vue để xử lý dữ liệu tập trung
const changeQty = (id, delta) => emit('change-qty', id, delta)
const removeItem = (id) => {
  if(confirm('Bạn muốn xóa sản phẩm này?')) emit('remove-item', id)
}

const handleProceed = () => {
  if (!isCartEmpty.value) {
    emit('close')
    router.push('/checkout')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
</style>