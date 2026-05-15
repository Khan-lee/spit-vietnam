<template>
  <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
    <h3 class="text-lg font-black uppercase text-slate-800">Thanh toán chuyển khoản qua QR</h3>
    
    <div class="relative inline-block p-4 bg-white border-2 border-red-500/10 rounded-2xl">
      <img 
        :src="qrUrl" 
        alt="Mã QR Thanh Toán" 
        class="w-52 h-52 object-contain mx-auto"
      />
      <div class="absolute inset-0 flex items-center justify-center bg-white/90" v-if="loading">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    </div>

    <div class="space-y-2 text-sm text-slate-600">
      <p>Số tiền: <span class="font-bold text-red-600">{{ formatPrice(amount) }}đ</span></p>
      <p>Nội dung: <span class="font-bold text-slate-900">{{ memo }}</span></p>
    </div>

    <div class="p-4 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed text-left">
      <p class="font-bold mb-1 text-slate-700">Hướng dẫn:</p>
      <ol class="list-decimal ml-4">
        <li>Mở ứng dụng Ngân hàng/SmartBanking.</li>
        <li>Chọn chức năng Quét mã QR.</li>
        <li>Quét mã phía trên để thanh toán tự động.</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  amount: { type: Number, required: true }, // Số tiền đơn hàng
  orderId: { type: String, required: true } // Mã đơn hàng để làm nội dung CK
})

const loading = ref(false)

// Thông tin ngân hàng của sếp cung cấp
const bankConfig = {
  bankId: 'VCB', // Vietcombank
  accountNo: '0071000622079',
  template: 'compact' // Giao diện mã QR gọn gàng
}

const memo = computed(() => `THANH TOAN DON HANG ${props.orderId}`)

// Tạo Link QR động từ VietQR API
const qrUrl = computed(() => {
  return `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-${bankConfig.template}.png?amount=${props.amount}&addInfo=${encodeURIComponent(memo.value)}`
})

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}
</script>