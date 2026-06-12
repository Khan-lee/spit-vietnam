<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import PaymentQR from '../components/PaymentQR.vue'

const router = useRouter()
const cartItems = ref([])
const cartSubtotal = ref(0)
const shippingFee = ref(0) 
const isProcessing = ref(false)
const isLoadingSettings = ref(true)

// [MỚI] Quản lý phương thức thanh toán & Yêu cầu báo giá
const paymentMethod = ref('transfer') // 'transfer' hoặc 'cod'
const requestQuote = ref(false) // Yêu cầu gửi báo giá/hợp đồng

// Quản lý trạng thái hiển thị Modal & Toast
const showPaymentQR = ref(false)
const showSuccessModal = ref(false) // [MỚI] Modal cho đơn COD
const newOrderId = ref('')
const toast = ref({ show: false, message: '', type: 'error' })

const triggerToast = (message, type = 'error') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3500)
}

// THÔNG TIN KHÁCH HÀNG
const customer = ref({ 
  name: '', 
  phone: '', 
  address: '', 
  note: '',
  companyName: '',
  taxCode: '',
  contractEmail: ''
})

const finalTotal = computed(() => cartSubtotal.value + shippingFee.value)

onMounted(async () => {
  const savedCart = JSON.parse(localStorage.getItem('spit_cart')) || []
  cartItems.value = savedCart
  cartSubtotal.value = savedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  try {
    const settingsRef = doc(db, "settings", "website")
    const settingsSnap = await getDoc(settingsRef)
    if (settingsSnap.exists()) {
      shippingFee.value = settingsSnap.data().shippingFee || 0
    }
  } catch (e) {
    console.error("Lỗi khi tải phí vận chuyển:", e)
  } finally {
    isLoadingSettings.value = false
  }
})

const handleCheckout = async () => {
  if (!customer.value.name || !customer.value.phone) {
    return triggerToast("Vui lòng nhập tên và số điện thoại liên hệ!")
  }
  if (!customer.value.address) {
    return triggerToast("Vui lòng nhập địa chỉ để chúng tôi giao hàng!")
  }
  if (requestQuote.value && !customer.value.contractEmail) {
    return triggerToast("Vui lòng nhập Email để chúng tôi gửi báo giá!")
  }
  if (cartItems.value.length === 0) {
    return triggerToast("Giỏ hàng của bạn đang trống, không thể thanh toán!")
  }

  try {
    isProcessing.value = true

    // 1. Lưu đơn hàng vào collection "orders" (Thêm method và quote)
    const orderData = {
      userId: auth.currentUser ? auth.currentUser.uid : null,
      customerName: customer.value.name,
      phone: customer.value.phone,
      address: customer.value.address,
      note: customer.value.note,
      companyName: customer.value.companyName,
      taxCode: customer.value.taxCode,
      contractEmail: customer.value.contractEmail,
      items: cartItems.value,
      subtotal: cartSubtotal.value,
      shippingFee: shippingFee.value, 
      totalPrice: finalTotal.value,  
      paymentMethod: paymentMethod.value, // [MỚI]
      requestQuote: requestQuote.value,   // [MỚI]
      status: 'pending',
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, "orders"), orderData)
    newOrderId.value = docRef.id

    // 2. Cập nhật số lượng tồn kho (Stock)
    const updatePromises = cartItems.value.map(item => {
      const productRef = doc(db, "products", item.id)
      return updateDoc(productRef, {
        stock: increment(-item.quantity)
      })
    })
    await Promise.all(updatePromises)

    // 3. Xóa giỏ hàng và đồng bộ trạng thái hệ thống
    localStorage.removeItem('spit_cart')
    window.dispatchEvent(new Event('cart-updated'))
    
    // 4. [MỚI] Điều hướng Modal dựa trên phương thức thanh toán
    if (paymentMethod.value === 'transfer') {
      showPaymentQR.value = true
    } else {
      showSuccessModal.value = true
    }

  } catch (error) {
    console.error("Lỗi thanh toán:", error)
    triggerToast("Hệ thống bận, vui lòng thử lại sau ít phút!")
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 antialiased font-sans">
    
    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-6 right-6 z-99999 max-w-sm bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-xl flex items-center gap-3">
        <span class="w-5 h-5 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center font-black text-xs">✕</span>
        <p class="text-xs font-bold tracking-wide">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      
      <div class="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
        <h2 class="text-lg font-black uppercase italic tracking-tight mb-6 text-slate-900 flex items-center gap-2">
          <span class="w-2 h-2 bg-red-600 rounded-full"></span> Thông tin nhận hàng & Báo giá
        </h2>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Họ và tên khách hàng *</label>
              <input v-model="customer.name" :disabled="isProcessing" placeholder="Nhập tên người nhận..." class="admin-input" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số điện thoại liên hệ *</label>
              <input v-model="customer.phone" :disabled="isProcessing" placeholder="Số điện thoại gọi giao hàng..." class="admin-input" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa chỉ giao hàng thực tế *</label>
            <textarea v-model="customer.address" :disabled="isProcessing" placeholder="Số nhà, tên đường, khu công nghiệp, tỉnh thành..." rows="2" class="admin-input resize-none"></textarea>
          </div>
          
          <div class="pt-5 border-t border-dashed border-slate-200/80 mt-4 space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-[10px] font-black uppercase text-slate-900 tracking-wider">Thông tin xuất hóa đơn VAT / Báo giá</p>
              <span class="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">B2B KHỐI NHÀ MÁY</span>
            </div>
            
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tên pháp nhân công ty / Nhà xưởng</label>
              <input v-model="customer.companyName" :disabled="isProcessing" placeholder="Ví dụ: Công ty TNHH Kỹ Thuật Chế Tạo..." class="admin-input" />
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mã số thuế doanh nghiệp</label>
                <input v-model="customer.taxCode" :disabled="isProcessing" placeholder="Nhập MST để đối chiếu..." class="admin-input" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email nhận hồ sơ / Hợp đồng</label>
                <input v-model="customer.contractEmail" type="email" :disabled="isProcessing" placeholder="accounting@company.com" class="admin-input" />
              </div>
            </div>

            <label class="flex items-start gap-2.5 mt-2 cursor-pointer group">
              <div class="relative flex items-center justify-center mt-0.5">
                <input type="checkbox" v-model="requestQuote" :disabled="isProcessing" class="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded bg-white checked:bg-red-600 checked:border-red-600 transition-all cursor-pointer">
                <svg class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="text-[11px] font-bold text-slate-700 group-hover:text-red-600 transition-colors">Yêu cầu gửi Báo giá / Đề nghị thanh toán (PDF)</span>
                <span class="text-[10px] text-slate-500 font-medium mt-0.5">Hệ thống sẽ tự động gửi file báo giá có mộc đỏ công ty vào email phía trên.</span>
              </div>
            </label>
          </div>

          <div class="pt-5 border-t border-dashed border-slate-200/80 mt-4 space-y-3">
            <p class="text-[10px] font-black uppercase text-slate-900 tracking-wider">Phương thức thanh toán</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <label class="relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all"
                     :class="paymentMethod === 'transfer' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-slate-300'">
                <input type="radio" v-model="paymentMethod" value="transfer" :disabled="isProcessing" class="sr-only" />
                <span class="flex flex-1">
                  <span class="flex flex-col">
                    <span class="block text-xs font-black uppercase" :class="paymentMethod === 'transfer' ? 'text-red-700' : 'text-slate-700'">Chuyển khoản (Mã QR)</span>
                    <span class="mt-1 flex items-center text-[10px] text-slate-500 font-medium">Thanh toán tự động, xét duyệt ngay</span>
                  </span>
                </span>
                <svg v-if="paymentMethod === 'transfer'" class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
              </label>

              <label class="relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all"
                     :class="paymentMethod === 'cod' ? 'border-red-600 bg-red-50/30' : 'border-slate-200 bg-white hover:border-slate-300'">
                <input type="radio" v-model="paymentMethod" value="cod" :disabled="isProcessing" class="sr-only" />
                <span class="flex flex-1">
                  <span class="flex flex-col">
                    <span class="block text-xs font-black uppercase" :class="paymentMethod === 'cod' ? 'text-red-700' : 'text-slate-700'">Thanh toán khi nhận</span>
                    <span class="mt-1 flex items-center text-[10px] text-slate-500 font-medium">Nhận hàng, kiểm tra và thanh toán (COD)</span>
                  </span>
                </span>
                <svg v-if="paymentMethod === 'cod'" class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
              </label>

            </div>
          </div>

          <div class="space-y-1 pt-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ghi chú vận chuyển hoặc thông số kỹ thuật đi kèm</label>
            <textarea v-model="customer.note" :disabled="isProcessing" placeholder="Ví dụ: Giao trong giờ hành chính, cần CO/CQ sản phẩm..." rows="2" class="admin-input resize-none"></textarea>
          </div>
        </div>
      </div>

      <div class="md:col-span-5 bg-slate-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-900 shadow-xl flex flex-col relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <h2 class="text-lg font-black uppercase italic tracking-tight mb-5 text-red-500">Tóm tắt đơn hàng</h2>
        
        <div class="grow overflow-y-auto max-h-72 mb-6 space-y-3.5 pr-1 custom-scrollbar">
          <div v-for="item in cartItems" :key="item.id" class="flex gap-3 items-center border-b border-slate-900 pb-3.5 last:border-none">
            <img :src="item.image" class="w-11 h-11 object-cover rounded-lg border border-slate-800 bg-slate-900 shrink-0" />
            <div class="min-w-0 grow">
              <h4 class="text-[11px] font-black uppercase tracking-tight text-slate-200 line-clamp-1">{{ item.name }}</h4>
              <p class="text-[10px] text-slate-500 font-bold mt-0.5">
                Mức giá: {{ item.price.toLocaleString() }}đ <span class="text-red-500 font-black ml-1">x{{ item.quantity }}</span>
              </p>
            </div>
            <div class="text-[12px] font-black text-slate-100 shrink-0 pl-2">
              {{ (item.price * item.quantity).toLocaleString() }}₫
            </div>
          </div>
        </div>
        
        <div class="border-t border-slate-900 pt-4 space-y-2.5 text-[11px] font-bold text-slate-400">
          <div class="flex justify-between">
            <span>Tiền hàng tạm tính:</span>
            <span class="text-slate-200">{{ cartSubtotal.toLocaleString() }}₫</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Phí giao hàng toàn quốc:</span>
            <span v-if="isLoadingSettings" class="text-[9px] text-slate-600 animate-pulse">ĐANG TÍNH...</span>
            <span v-else class="text-slate-200">{{ shippingFee === 0 ? 'MIỄN PHÍ' : `${shippingFee.toLocaleString()}₫` }}</span>
          </div>
          
          <div class="border-t border-slate-900 pt-4 mt-2 flex justify-between items-end">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng chi phí thanh toán</span>
            <span class="text-2xl font-black text-red-500 tracking-tight italic">
              {{ finalTotal.toLocaleString() }}₫
            </span>
          </div>
          
          <button 
            @click="handleCheckout" 
            :disabled="isProcessing" 
            class="w-full mt-5 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md shadow-red-950/40 disabled:bg-slate-800 disabled:text-slate-600 cursor-pointer flex items-center justify-center gap-2"
          >
            <span v-if="isProcessing" class="w-3 h-3 border-2 border-slate-600 border-t-white rounded-full animate-spin"></span>
            {{ isProcessing ? 'ĐANG KHÓA & TẠO ĐƠN...' : (requestQuote ? 'ĐẶT HÀNG & NHẬN BÁO GIÁ' : 'XÁC NHẬN ĐẶT HÀNG NGAY') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPaymentQR" class="fixed inset-0 z-999999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      
      <div class="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 no-scrollbar">
        <PaymentQR 
          :amount="finalTotal" 
          :orderId="newOrderId" 
        />
        <p v-if="requestQuote" class="mt-4 text-[11px] text-slate-500 font-medium">
          Hệ thống đang khởi tạo file Báo Giá và sẽ gửi vào email của bạn trong ít phút tới.
        </p>
        <button 
          @click="router.push('/')" 
          class="w-full mt-5 py-3.5 bg-slate-950 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg shadow-slate-950/20"
        >
          Tôi đã hoàn tất chuyển khoản - Về trang chủ
        </button>
      </div>
    </div>

    <div v-if="showSuccessModal" class="fixed inset-0 z-999999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      
      <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-black uppercase text-slate-900 tracking-tight">ĐẶT HÀNG THÀNH CÔNG!</h3>
        <p class="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
          Mã đơn hàng của bạn là: <span class="font-black text-slate-800">{{ newOrderId.slice(0,8).toUpperCase() }}</span><br/>
          Chúng tôi sẽ sớm liên hệ để xác nhận giao hàng.
        </p>
        <p v-if="requestQuote" class="mt-3 p-3 bg-blue-50 rounded-lg text-[10.5px] text-blue-700 font-bold">
          📄 Báo giá đang được tạo và sẽ gửi vào email của bạn.
        </p>
        <button 
          @click="router.push('/')" 
          class="w-full mt-6 py-3.5 bg-slate-950 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg shadow-slate-950/20"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
@reference "../style.css";

.admin-input {
  @apply w-full mt-1 p-3.5 border border-slate-200 bg-slate-50/60 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400/80;
}
.admin-input:focus {
  @apply border-slate-950 bg-white ring-4;
  --tw-ring-color: rgba(2, 6, 23, 0.05);
}
.admin-input:disabled {
  @apply bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed;
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>