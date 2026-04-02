<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

const router = useRouter()
const cartItems = ref([])
const totalPrice = ref(0)
const isProcessing = ref(false)

// THÔNG TIN KHÁCH HÀNG (ĐÃ THÊM CÁC TRƯỜNG DOANH NGHIỆP MỚI)
const customer = ref({ 
  name: '', 
  phone: '', 
  address: '', 
  note: '',
  // --- PHẦN MỚI ---
  companyName: '',
  taxCode: '',
  contractEmail: ''
})

onMounted(() => {
  const savedCart = JSON.parse(localStorage.getItem('spit_cart')) || []
  cartItems.value = savedCart
  totalPrice.value = savedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const handleCheckout = async () => {
  if (!customer.value.name || !customer.value.phone) return alert("Vui lòng nhập tên và số điện thoại!")
  if (cartItems.value.length === 0) return alert("Giỏ hàng trống!")

  try {
    isProcessing.value = true

    // 1. Lưu đơn hàng vào collection "orders" (ĐÃ CẬP NHẬT TRƯỜNG MỚI)
    const orderData = {
      customerName: customer.value.name,
      phone: customer.value.phone,
      address: customer.value.address,
      note: customer.value.note,
      // --- DỮ LIỆU DOANH NGHIỆP MỚI ---
      companyName: customer.value.companyName,
      taxCode: customer.value.taxCode,
      contractEmail: customer.value.contractEmail,
      // ----------------------------
      items: cartItems.value,
      totalPrice: totalPrice.value,
      status: 'pending',
      createdAt: serverTimestamp()
    }
    await addDoc(collection(db, "orders"), orderData)

    // 2. Cập nhật số lượng tồn kho (Stock) cho từng sản phẩm (GIỮ NGUYÊN)
    const updatePromises = cartItems.value.map(item => {
      const productRef = doc(db, "products", item.id)
      return updateDoc(productRef, {
        stock: increment(-item.quantity)
      })
    })
    await Promise.all(updatePromises)

    // 3. Xóa giỏ hàng và hoàn tất (GIỮ NGUYÊN)
    localStorage.removeItem('spit_cart')
    window.dispatchEvent(new Event('cart-updated'))
    alert("Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận hệ thống.")
    router.push('/')

  } catch (error) {
    console.error("Lỗi thanh toán:", error)
    alert("Có lỗi xảy ra, vui lòng thử lại sau.")
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-6">
    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
      
      <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h2 class="text-xl font-black uppercase italic mb-6 text-slate-900">Thông tin giao hàng</h2>
        <div class="space-y-4">
          <input v-model="customer.name" placeholder="Họ và tên *" class="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 text-sm font-bold" />
          <input v-model="customer.phone" placeholder="Số điện thoại *" class="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 text-sm font-bold" />
          <textarea v-model="customer.address" placeholder="Địa chỉ giao hàng" rows="2" class="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-medium resize-none"></textarea>
          
          <div class="pt-4 border-t border-dashed border-slate-200 mt-2 space-y-3">
            <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Thông tin doanh nghiệp (Nếu có)</p>
            <input v-model="customer.companyName" placeholder="Tên công ty" class="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 text-xs font-bold" />
            <div class="grid grid-cols-2 gap-3">
              <input v-model="customer.taxCode" placeholder="Mã số thuế" class="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 text-xs font-bold" />
              <input v-model="customer.contractEmail" type="email" placeholder="Email nhận hợp đồng" class="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 text-xs font-bold" />
            </div>
          </div>

          <textarea v-model="customer.note" placeholder="Ghi chú thêm..." class="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-medium"></textarea>
        </div>
      </div>

      <div class="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
        <h2 class="text-xl font-black uppercase italic mb-6 text-blue-400">Đơn hàng của bạn</h2>
        <div class="grow overflow-y-auto max-h-64 mb-6 space-y-4 pr-2">
          <div v-for="item in cartItems" :key="item.id" class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div class="text-[11px] font-bold uppercase tracking-wider">
              {{ item.name }} <span class="text-blue-500">x{{ item.quantity }}</span>
            </div>
            <div class="text-xs font-black italic">{{ (item.price * item.quantity).toLocaleString() }}đ</div>
          </div>
        </div>
        
        <div class="border-t border-slate-700 pt-6 mt-auto">
          <div class="flex justify-between items-end mb-8">
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tổng cộng</span>
            <span class="text-3xl font-black text-red-500 italic">{{ totalPrice.toLocaleString() }}đ</span>
          </div>
          <button @click="handleCheckout" :disabled="isProcessing" class="w-full py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
            {{ isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>