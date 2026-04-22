<template>
  <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
    <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
    
    <div class="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
      <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 class="text-xl font-black uppercase italic tracking-tighter text-slate-800 text-shadow-sm">Thông tin đơn hàng</h2>
          <p class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-[0.2em]">Mã vận đơn: #{{ order.id?.toUpperCase() }}</p>
        </div>
        <button @click="$emit('close')" class="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:rotate-90 hover:bg-red-50 hover:text-red-500 transition-all duration-300 text-xl border border-slate-100">✕</button>
      </div>

      <div class="p-8 overflow-y-auto custom-scrollbar space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-5">
            <h3 class="text-[10px] font-black text-blue-600 uppercase border-b border-blue-100 pb-2 tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 bg-blue-600 rounded-full"></span> 👤 Người nhận
            </h3>
            <div>
              <p class="text-[9px] text-slate-400 font-black uppercase mb-1">Họ và tên</p>
              <p class="text-sm font-black text-slate-800 uppercase italic">{{ order.customerName }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-400 font-black uppercase mb-1">Số điện thoại</p>
              <p class="text-sm font-black text-blue-600 tracking-tighter">{{ order.phone }}</p>
            </div>
          </div>
          
          <div class="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <h3 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 bg-emerald-600 rounded-full"></span> 🏢 Doanh nghiệp
            </h3>
            
            <div v-if="order.companyName">
              <p class="text-[10px] font-black text-slate-800 uppercase leading-tight italic">{{ order.companyName }}</p>
              <p v-if="order.taxCode" class="text-[10px] font-bold text-slate-500 mt-1 italic">MST: {{ order.taxCode }}</p>
            </div>
            <div v-else>
              <p class="text-[10px] font-bold text-slate-400 italic text-shadow-sm">Khách hàng cá nhân</p>
            </div>

            <div class="pt-2 border-t border-slate-200/60">
              <p class="text-[9px] text-slate-400 font-black uppercase mb-1">Email nhận hợp đồng</p>
              <p class="text-[11px] font-black text-slate-700 break-all select-all decoration-blue-500 underline underline-offset-2 italic">
                {{ order.email || order.contractEmail || 'Chưa cung cấp email' }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black text-slate-800 uppercase border-b border-slate-100 pb-2 tracking-widest mb-4 flex items-center gap-2">
            <span class="w-2 h-2 bg-slate-800 rounded-full"></span> 📦 Sản phẩm đã đặt
          </h3>
          
          <div class="space-y-3">
            <template v-if="order.items && order.items.length > 0">
              <div v-for="(item, index) in order.items" :key="index" 
                   class="flex items-center gap-4 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
                <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-xl shadow-inner italic font-black text-slate-300">
                  <img v-if="item.image || item.productImage" :src="item.image || item.productImage" class="w-full h-full object-cover rounded-2xl" />
                  <span v-else>SP</span>
                </div>
                
                <div class="grow">
                  <p class="text-xs font-black text-slate-800 uppercase leading-tight italic">{{ item.name || item.productName || 'Sản phẩm gia công' }}</p>
                  
                  <div class="flex items-center gap-2 mt-1">
                    <span class="px-2 py-0.5 bg-blue-50 text-[8px] font-black text-blue-500 rounded-md uppercase tracking-tighter">Gia công SPIT</span>
                    
                    <p class="text-[10px] font-bold text-slate-400">
                      SL: <span class="text-blue-600 font-black">{{ item.quantity || 1 }}</span> 
                      <span class="mx-1">x</span> 
                      {{ Number(item.price || 0).toLocaleString() }}₫
                    </p>
                  </div>
                </div>
                
                <p class="text-sm font-black text-slate-900 tracking-tighter italic">
                  {{ (Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString() }}₫
                </p>
              </div>
            </template>

            <template v-else>
              <div class="flex items-center gap-4 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
                <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-xl shadow-inner italic font-black text-slate-300">SP</div>
                
                <div class="grow">
                  <p class="text-xs font-black text-slate-800 uppercase leading-tight italic">{{ order.productName || 'Đồ gá / Linh kiện' }}</p>
                  
                  <div class="flex items-center gap-2 mt-1">
                    <span class="px-2 py-0.5 bg-blue-50 text-[8px] font-black text-blue-500 rounded-md uppercase tracking-tighter">Gia công SPIT</span>
                    
                    <p class="text-[10px] font-bold text-slate-400">
                      SL: <span class="text-blue-600 font-black">{{ order.quantity || 1 }}</span> 
                      <span class="mx-1">x</span> 
                      {{ (Number(order.totalPrice || 0) / (Number(order.quantity) || 1)).toLocaleString() }}₫
                    </p>
                  </div>
                </div>
                
                <p class="text-sm font-black text-slate-900 tracking-tighter italic">
                  {{ Number(order.totalPrice || 0).toLocaleString() }}₫
                </p>
              </div>
            </template>
          </div>
        </div>

        <div v-if="order.note" class="bg-yellow-50/50 p-5 rounded-3xl border border-yellow-100/50">
          <p class="text-[9px] text-yellow-600 font-black uppercase mb-2 flex items-center gap-1">📝 Ghi chú từ Khang:</p>
          <p class="text-[11px] font-medium text-slate-600 leading-relaxed italic">"{{ order.note }}"</p>
        </div>
      </div>

      <div class="p-8 border-t border-slate-100 flex justify-between items-end bg-white">
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tổng thanh toán</p>
          <p class="text-[9px] font-bold text-emerald-500 uppercase mt-1">Hệ thống SPIT VIETNAM</p>
        </div>
        <div class="text-right">
           <span class="text-3xl font-black text-[#e11d48] tracking-tighter italic drop-shadow-sm">
            {{ Number(order.totalPrice || 0).toLocaleString() }}₫
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['order'])
defineEmits(['close'])
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
@keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
</style>