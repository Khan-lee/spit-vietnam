<template>
  <div class="fixed inset-0 flex justify-end" style="z-index: 99999;">
    <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"></div>
    
    <div class="relative w-full max-w-md bg-white h-full shadow-2xl p-5 sm:p-6 md:p-8 flex flex-col border-l border-slate-100">
      
      <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tight text-slate-900">Giỏ hàng của bạn</h2>
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
            Đang chọn {{ cart?.length || 0 }} mã sản phẩm kỹ thuật
          </p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-slate-100 rounded-xl transition-all group border border-transparent hover:border-slate-200">
          <svg class="group-hover:rotate-90 text-slate-500 group-hover:text-slate-900 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="grow overflow-y-auto pr-1 custom-scrollbar">
        <div v-if="isCartEmpty" class="text-center py-24 flex flex-col items-center justify-center">
          <span class="text-3xl mb-3 opacity-40">🛒</span>
          <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Giỏ hàng đang trống</p>
          <button @click="$emit('close')" class="mt-4 text-[10px] font-black text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors uppercase tracking-wider">Tiếp tục xem sản phẩm</button>
        </div>
        
        <div v-else class="space-y-3.5">
          <div v-for="item in cart" :key="item.id" 
               :class="['group flex gap-4 p-3.5 bg-white rounded-xl border border-slate-200/70 transition-all duration-300 relative overflow-hidden', 
                       item.isSoldOut ? 'bg-slate-50/80 opacity-60 border-slate-200' : 'hover:border-slate-900 hover:shadow-xs']"
          >
            <div class="relative overflow-hidden rounded-xl w-20 h-20 shadow-2xs border border-slate-100 shrink-0 bg-slate-50">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            
            <div class="flex flex-col justify-between grow min-w-0">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <span v-if="item.brand" class="inline-block text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md mb-1">
                    {{ item.brand }}
                  </span>
                  <h3 class="text-[12px] font-black text-slate-900 line-clamp-2 leading-tight uppercase tracking-tight">{{ item.name }}</h3>
                  
                  <p v-if="item.appliedPromoTitle" class="text-[10px] text-emerald-600 font-bold mt-1">
                    🎉 {{ item.appliedPromoTitle }}
                  </p>
                </div>
                <button @click="removeItemWithoutPopup(item.id)" class="text-slate-300 hover:text-red-600 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
              
              <div class="flex items-end justify-between mt-2.5">
                <div class="space-y-0.5">
                  <p v-if="item.finalPrice < item.price" class="text-[11px] text-slate-400 line-through">
                    {{ item.price.toLocaleString() }}₫
                  </p>
                  <p class="text-[14px] font-black text-red-600 tracking-tight">
                    {{ item.finalPrice.toLocaleString() }}₫
                  </p>
                </div>

                <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                  <button @click="changeQty(item.id, -1)" class="w-8 h-full font-black text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center text-sm">
                    <span v-if="item.quantity > 1">−</span>
                    <span v-else class="text-[10px]">🗑️</span>
                  </button>
                  <span class="px-2 text-[11px] font-black min-w-7 text-center text-slate-900 bg-white border-x border-slate-200 h-full flex items-center justify-center">
                    {{ item.quantity }}
                  </span>
                  <button @click="changeQty(item.id, 1)" class="w-8 h-full font-black text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center text-sm">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-900 pt-5 space-y-4 shrink-0">
        <div v-if="!isCartEmpty" class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tổng cộng tạm tính:</span>
            <span class="text-2xl font-black text-slate-950 tracking-tight">{{ totalAmount.toLocaleString() }}₫</span>
          </div>
        </div>

        <button 
          @click="handleProceed"
          :disabled="isCartEmpty || hasSoldOutInCart"
          class="w-full py-4 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all duration-300 bg-red-600 text-white shadow-lg shadow-red-600/10 hover:bg-slate-950 active:scale-[0.98] cursor-pointer"
        >
          TIẾN HÀNH THANH TOÁN ĐƠN HÀNG
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

// KHÔNG CẦN hàm calculateItemPrice tự chế nữa, vì App.vue đã tính sẵn 'finalPrice' cực chuẩn rồi!

// Tổng tiền lấy trực tiếp từ thuộc tính 'itemTotal' mà App.vue đã cộng sẵn theo Tiers
const totalAmount = computed(() => 
  props.cart?.reduce((t, i) => t + (i.itemTotal || (i.price * i.quantity)), 0) || 0
)

const hasSoldOutInCart = computed(() => props.cart?.some(item => item.isSoldOut))

const changeQty = (id, delta) => {
  const item = props.cart?.find(i => i.id === id)
  if (item && item.quantity === 1 && delta === -1) emit('remove-item', id)
  else emit('change-qty', id, delta)
}

const removeItemWithoutPopup = (id) => emit('remove-item', id)
const handleProceed = () => { if (!isCartEmpty.value) { emit('close'); router.push('/checkout') } }
</script>