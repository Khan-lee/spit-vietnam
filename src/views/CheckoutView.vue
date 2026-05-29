<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import PaymentQR from '../components/PaymentQR.vue'

const router = useRouter()
const cartItems = ref([])
const cartSubtotal = ref(0)
const shippingFee = ref(0) // [MỚI] Tự động đồng bộ từ cấu hình hệ thống
const isProcessing = ref(false)
const isLoadingSettings = ref(true)

// Quản lý trạng thái hiển thị QR & Toast
const showPaymentQR = ref(false)
const newOrderId = ref('')
const toast = ref({ show: false, message: '', type: 'error' })

const triggerToast = (message, type = 'error') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3500)
}

// THÔNG TIN KHÁCH HÀNG (GIỮ NGUYÊN HOÀN TOÀN BIẾN)
const customer = ref({ 
  name: '', 
  phone: '', 
  address: '', 
  note: '',
  companyName: '',
  taxCode: '',
  contractEmail: ''
})

// [MỚI] Tính toán tổng chi phí cuối cùng
const finalTotal = computed(() => cartSubtotal.value + shippingFee.value)

onMounted(async () => {
  // 1. Tải dữ liệu giỏ hàng từ LocalStorage
  const savedCart = JSON.parse(localStorage.getItem('spit_cart')) || []
  cartItems.value = savedCart
  cartSubtotal.value = savedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // 2. [MỚI] Truy xuất phí ship mặc định từ cấu hình hệ thống trên Firestore
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
  // Thay thế các hàm alert thô sơ bằng cụm Toast UI cao cấp
  if (!customer.value.name || !customer.value.phone) {
    return triggerToast("Vui lòng nhập tên và số điện thoại liên hệ!")
  }
  if (!customer.value.address) {
    return triggerToast("Vui lòng nhập địa chỉ để chúng tôi giao hàng!")
  }
  if (cartItems.value.length === 0) {
    return triggerToast("Giỏ hàng của bạn đang trống, không thể thanh toán!")
  }

  try {
    isProcessing.value = true

    // 1. Lưu đơn hàng vào collection "orders" với cấu trúc dữ liệu chuẩn B2B
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
      shippingFee: shippingFee.value, // Lưu kèm phí ship tại thời điểm đặt hàng
      totalPrice: finalTotal.value,   // Tổng tiền chuẩn sau cộng phí
      status: 'pending',
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, "orders"), orderData)
    newOrderId.value = docRef.id

    // 2. Cập nhật số lượng tồn kho (Stock) tối ưu hóa
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
    
    // Kích hoạt hiển thị Modal QR chuyển khoản chuyên nghiệp
    showPaymentQR.value = true

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
              <p class="text-[10px] font-black uppercase text-slate-900 tracking-wider">Thông tin xuất hóa đơn VAT (Nếu có)</p>
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
            {{ isProcessing ? 'ĐANG KHÓA & TẠO ĐƠN...' : 'XÁC NHẬN ĐẶT HÀNG NGAY 🚀' }}
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
        <button 
          @click="router.push('/')" 
          class="w-full mt-5 py-3.5 bg-slate-950 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg shadow-slate-950/20"
        >
          Tôi đã hoàn tất chuyển khoản - Về trang chủ
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