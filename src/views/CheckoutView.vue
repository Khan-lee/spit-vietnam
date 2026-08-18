<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import PaymentQR from '../components/PaymentQR.vue'

// Bảng tra cứu phí vận chuyển dựa trên bảng giá 34 tỉnh thành
const SHIPPING_RATES = {
  // Nhóm D1 (Nội thành TP.HCM)
  'Hồ Chí Minh': 32076,

  // Nhóm D3
  'Đồng Nai': 81972,
  'Đồng Tháp': 81972,
  'Tây Ninh': 81972,
  'Vĩnh Long': 81972,

  // Nhóm Hà Nội
  'Hà Nội': 90526,

  // Nhóm D4 (Mặc định cho tất cả các tỉnh thành còn lại)
  DEFAULT_D4: 97654
}
const router = useRouter()

const rawCartItems = ref([])
const promotions = ref([]) 
// 1. Tự động lấy tên Tỉnh/Thành phố đang chọn (Khách hàng chính hoặc Địa chỉ khác)
const activeProvince = computed(() => {
  return shipToOtherAddress.value ? otherAddress.value.province : customer.value.province
})

// 2. Tra cứu cước phí tương ứng theo tỉnh thành
const baseShippingFee = computed(() => {
  if (!activeProvince.value) return 0

  // Tìm tên tỉnh khớp trong SHIPPING_RATES
  const matchedProvince = Object.keys(SHIPPING_RATES).find(key => 
    activeProvince.value.includes(key)
  )

  // Nếu tìm thấy trả về giá tương ứng, nếu không tìm thấy trả về cước D4 mặc định
  return matchedProvince ? SHIPPING_RATES[matchedProvince] : SHIPPING_RATES.DEFAULT_D4
})
const isProcessing = ref(false)
const isLoadingSettings = ref(true)

const paymentMethod = ref('cod')
const shippingMethod = ref('standard')
const shipToOtherAddress = ref(false)
const requestVAT = ref(false)

const showPaymentQR = ref(false)
const showSuccessModal = ref(false)
const newOrderId = ref('')
const toast = ref({ show: false, message: '', type: 'error' })

const triggerToast = (message, type = 'error') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3500)
}

// Data form chính (Lưu code để query API, lưu name để gửi order)
const customer = ref({ 
  name: '', phone: '', address: '', 
  provinceCode: '', province: '', 
  districtCode: '', district: '', 
  note: ''
})

// Data form phụ
const otherAddress = ref({
  name: '', phone: '', address: '', 
  provinceCode: '', province: '', 
  districtCode: '', district: ''
})

const vatInfo = ref({ companyName: '', companyAddress: '', taxCode: '', email: '' })

// Danh sách Tỉnh/Quận
const provinces = ref([])
const customerDistricts = ref([])
const otherDistricts = ref([])

// 1. Lấy danh sách Tỉnh/Thành
const fetchProvinces = async () => {
  try {
    const res = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
    const data = await res.json()
    if (data.error === 0) {
      provinces.value = data.data.map(item => ({
        code: item.id,
        name: item.name,          // Dùng tên ngắn gọn (Hà Nội, An Giang...)
        fullName: item.full_name  // Tên đầy đủ
      }))
    }
  } catch (error) {
    console.error("Lỗi lấy dữ liệu tỉnh/thành:", error)
  }
}

// 2. Dùng WATCH thay vì @change để tự động bắt thay đổi (kể cả khi load từ DB)
watch(() => customer.value.provinceCode, async (newCode) => {
  customer.value.districtCode = ''
  customer.value.district = ''
  customerDistricts.value = []

  if (!newCode) return

  // Lưu lại tên Tỉnh/Thành vào object customer
  const foundProv = provinces.value.find(p => p.code === newCode)
  if (foundProv) customer.value.province = foundProv.name

  try {
    const res = await fetch(`https://esgoo.net/api-tinhthanh/2/${newCode}.htm`)
    const data = await res.json()
    if (data.error === 0) {
      customerDistricts.value = data.data.map(item => ({
        code: item.id,
        name: item.name,
        fullName: item.full_name
      }))
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách quận/huyện:", error)
  }
})

// Tự động cập nhật tên Quận/Huyện chính
watch(() => customer.value.districtCode, (newCode) => {
  const foundDist = customerDistricts.value.find(d => d.code === newCode)
  if (foundDist) customer.value.district = foundDist.name
})

// Watch cho Địa chỉ khác
watch(() => otherAddress.value.provinceCode, async (newCode) => {
  otherAddress.value.districtCode = ''
  otherAddress.value.district = ''
  otherDistricts.value = []

  if (!newCode) return

  const foundProv = provinces.value.find(p => p.code === newCode)
  if (foundProv) otherAddress.value.province = foundProv.name

  try {
    const res = await fetch(`https://esgoo.net/api-tinhthanh/2/${newCode}.htm`)
    const data = await res.json()
    if (data.error === 0) {
      otherDistricts.value = data.data.map(item => ({
        code: item.id,
        name: item.name,
        fullName: item.full_name
      }))
    }
  } catch (error) {
    console.error("Lỗi lấy quận/huyện địa chỉ khác:", error)
  }
})

watch(() => otherAddress.value.districtCode, (newCode) => {
  const foundDist = otherDistricts.value.find(d => d.code === newCode)
  if (foundDist) otherAddress.value.district = foundDist.name
})

// Logic Giao hàng nhanh TP.HCM
const isExpressAvailable = computed(() => {
  const currentProvince = shipToOtherAddress.value ? otherAddress.value.province : customer.value.province
  return currentProvince ? currentProvince.includes('Hồ Chí Minh') : false
})

watch(isExpressAvailable, (available) => {
  if (!available && shippingMethod.value === 'express') {
    shippingMethod.value = 'standard'
  }
})

const shippingFee = computed(() => {
  return shippingMethod.value === 'express' ? baseShippingFee.value + 100000 : baseShippingFee.value
})

const fetchActivePromotions = async () => {
  try {
    const now = new Date().getTime()
    const q = query(collection(db, "promotions"), where("is_active", "==", true))
    const snap = await getDocs(q)
    
    promotions.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => {
        const start = new Date(p.start_date).getTime()
        const end = new Date(p.end_date).getTime()
        return now >= start && now <= end
      })
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi:", e)
  }
}

const cartItems = computed(() => {
  return rawCartItems.value.map(item => {
    let finalPrice = item.price
    let appliedPromoTitle = null

    const matchedPromo = promotions.value.find(p => 
      p.apply_to === 'all' || (p.applied_ids && p.applied_ids.includes(item.id))
    )

    if (matchedPromo && matchedPromo.tiers) {
      const sortedTiers = [...matchedPromo.tiers].sort((a, b) => b.quantity - a.quantity)
      const matchedTier = sortedTiers.find(t => item.quantity >= t.quantity)

      if (matchedTier) {
        appliedPromoTitle = matchedPromo.title
        let discountAmount = 0
        if (matchedTier.discount_type === 'percentage') {
          discountAmount = item.price * (matchedTier.discount_value / 100)
        } else if (matchedTier.discount_type === 'fixed_amount') {
          discountAmount = matchedTier.discount_value
        }
        finalPrice = Math.max(0, item.price - discountAmount)
      }
    }

    return {
      ...item,
      finalPrice,
      appliedPromoTitle,
      itemTotal: finalPrice * item.quantity
    }
  })
})

const cartSubtotal = computed(() => cartItems.value.reduce((sum, item) => sum + item.itemTotal, 0))
const finalTotal = computed(() => cartSubtotal.value + shippingFee.value)

onMounted(async () => {
  rawCartItems.value = JSON.parse(localStorage.getItem('spit_cart')) || []
  await fetchActivePromotions()
  await fetchProvinces()
  isLoadingSettings.value = false
})

const handleCheckout = async () => {
  if (!customer.value.name || !customer.value.phone) return triggerToast("Vui lòng nhập tên và số điện thoại liên hệ!")
  if (!customer.value.address) return triggerToast("Vui lòng nhập địa chỉ để chúng tôi giao hàng!")
  if (!customer.value.provinceCode || !customer.value.districtCode) return triggerToast("Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện!")
  
  if (shipToOtherAddress.value && (!otherAddress.value.name || !otherAddress.value.address || !otherAddress.value.provinceCode || !otherAddress.value.districtCode)) {
    return triggerToast("Vui lòng điền đủ thông tin và địa chỉ người nhận khác!")
  }
  
  if (requestVAT.value && (!vatInfo.value.companyName || !vatInfo.value.taxCode || !vatInfo.value.email)) {
    return triggerToast("Vui lòng nhập đầy đủ Tên công ty, Mã số thuế và Email nhận hóa đơn!")
  }

  if (cartItems.value.length === 0) return triggerToast("Giỏ hàng của bạn đang trống, không thể thanh toán!")

  try {
    isProcessing.value = true

// Chuẩn hóa địa chỉ đầy đủ cho khách hàng
const fullCustomerAddress = [
  customer.value.address,
  customer.value.district,
  customer.value.province
].filter(Boolean).join(', ')

// Chuẩn hóa địa chỉ đầy đủ cho người nhận khác (nếu có)
const fullShippingAddress = shipToOtherAddress.value ? {
  ...otherAddress.value,
  fullAddress: [
    otherAddress.value.address,
    otherAddress.value.district,
    otherAddress.value.province
  ].filter(Boolean).join(', ')
} : null

const orderData = {
  userId: auth.currentUser ? auth.currentUser.uid : null,
  customer: {
    ...customer.value,
    fullAddress: fullCustomerAddress // Thêm địa chỉ ghép đầy đủ
  },
  shippingAddress: fullShippingAddress,
  vatInfo: requestVAT.value ? {
    companyName: vatInfo.value.companyName,
    companyAddress: vatInfo.value.companyAddress,
    taxCode: vatInfo.value.taxCode,
    email: vatInfo.value.email,     // Lưu email VAT
    vatEmail: vatInfo.value.email  // Backup thêm key vatEmail
  } : null,
  note: customer.value.note || '', // Đảm bảo lưu ghi chú đơn hàng
  shippingMethod: shippingMethod.value,
  paymentMethod: paymentMethod.value,
  items: cartItems.value,
  subtotal: cartSubtotal.value,
  shippingFee: shippingFee.value,  
  totalPrice: finalTotal.value,  
  status: 'pending',
  createdAt: serverTimestamp()
}
    
    const docRef = await addDoc(collection(db, "orders"), orderData)
    newOrderId.value = docRef.id

    const updatePromises = cartItems.value.map(item => {
      const productRef = doc(db, "products", item.id)
      return updateDoc(productRef, { stock: increment(-item.quantity) })
    })
    await Promise.all(updatePromises)

    localStorage.removeItem('spit_cart')
    window.dispatchEvent(new Event('cart-updated'))
    
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
  <div class="min-h-screen bg-[#f5f6f8] py-8 px-4 sm:px-6 font-sans text-gray-800">
    
    <!-- Toast Message -->
    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-6 right-6 z-50 max-w-sm bg-white border-l-4 border-red-500 p-4 rounded shadow-lg flex items-center gap-3">
        <span class="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-xs">✕</span>
        <p class="text-sm font-medium">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- CỘT TRÁI: FORM THÔNG TIN -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- THÔNG TIN KHÁCH HÀNG -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="font-bold text-base uppercase text-gray-800">Thông tin khách hàng</h2>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <input v-model="customer.name" placeholder="Họ và tên *" class="v-input" />
              </div>
              <div class="md:col-span-2">
                <input v-model="customer.phone" placeholder="Điện thoại *" class="v-input" />
              </div>
              <div class="md:col-span-2">
                <input v-model="customer.address" placeholder="Địa chỉ *" class="v-input" />
              </div>
              
<!-- Select Tỉnh / Thành phố Khách hàng -->
<div>
  <select v-model="customer.provinceCode" class="v-input cursor-pointer">
    <option value="" disabled selected>Chọn Tỉnh/ Thành phố *</option>
    <option v-for="p in provinces" :key="p.code" :value="p.code">
      {{ p.name }}
    </option>
  </select>
</div>

<!-- Select Quận / Huyện Khách hàng -->
<div>
  <select 
    v-model="customer.districtCode" 
    class="v-input cursor-pointer"
    :disabled="!customer.provinceCode"
  >
    <option value="" disabled selected>Chọn Quận/ Huyện *</option>
    <option v-for="d in customerDistricts" :key="d.code" :value="d.code">
      {{ d.name }}
    </option>
  </select>
</div>

              <div class="md:col-span-2">
                <textarea v-model="customer.note" placeholder="Ghi chú cho hóa đơn" rows="2" class="v-input resize-none"></textarea>
              </div>
            </div>

            <!-- Toggle Địa chỉ khác -->
            <div class="bg-gray-50 border border-gray-200 rounded px-4 py-3 flex items-center gap-3 cursor-pointer" @click="shipToOtherAddress = !shipToOtherAddress">
              <input type="checkbox" v-model="shipToOtherAddress" class="w-4 h-4 text-blue-600 rounded border-gray-300 pointer-events-none">
              <span class="text-sm font-medium flex-1">Giao hàng tại địa chỉ khác</span>
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

<!-- Form Địa chỉ khác -->
<div v-if="shipToOtherAddress" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
  <div class="md:col-span-2">
    <input v-model="otherAddress.name" placeholder="Họ và tên *" class="v-input" />
  </div>
  <div class="md:col-span-2">
    <input v-model="otherAddress.phone" placeholder="Điện thoại *" class="v-input" />
  </div>
  <div class="md:col-span-2">
    <input v-model="otherAddress.address" placeholder="Địa chỉ *" class="v-input" />
  </div>
  
  <!-- Select Tỉnh / Thành phố Khác -->
  <div>
    <select 
      v-model="otherAddress.provinceCode" 
      class="v-input cursor-pointer"
    >
      <option value="" disabled selected>Chọn Tỉnh/ Thành phố *</option>
      <option v-for="p in provinces" :key="p.code" :value="p.code">
        {{ p.name }}
      </option>
    </select>
  </div>
  
  <!-- Select Quận / Huyện Khác -->
  <div>
    <select 
      v-model="otherAddress.districtCode" 
      class="v-input cursor-pointer"
      :disabled="!otherAddress.provinceCode"
    >
      <option value="" disabled selected>Chọn Quận/ Huyện *</option>
      <option v-for="d in otherDistricts" :key="d.code" :value="d.code">
        {{ d.name }}
      </option>
    </select>
  </div>
</div>

            <!-- Toggle Xuất VAT -->
            <div class="bg-gray-50 border border-gray-200 rounded px-4 py-3 flex items-center gap-3 cursor-pointer" @click="requestVAT = !requestVAT">
              <input type="checkbox" v-model="requestVAT" class="w-4 h-4 text-blue-600 rounded border-gray-300 pointer-events-none">
              <span class="text-sm font-medium flex-1">Yêu cầu xuất hóa đơn VAT cho công ty hoặc tổ chức</span>
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <!-- Form Xuất VAT -->
            <div v-if="requestVAT" class="grid grid-cols-1 gap-4 pt-2">
              <input v-model="vatInfo.companyName" placeholder="Tên công ty *" class="v-input" />
              <input v-model="vatInfo.companyAddress" placeholder="Địa chỉ công ty" class="v-input" />
              <input v-model="vatInfo.taxCode" placeholder="Mã số thuế *" class="v-input" />
              <input v-model="vatInfo.email" placeholder="Email nhận hóa đơn *" class="v-input" />
            </div>
          </div>
        </div>

        <!-- PHƯƠNG THỨC GIAO HÀNG -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="font-bold text-base uppercase text-gray-800">Phương thức giao hàng</h2>
          </div>
          <div class="p-5 space-y-3">
            <label class="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer"
                   :class="{'border-yellow-400 bg-yellow-50/30': shippingMethod === 'standard'}">
              <input type="radio" v-model="shippingMethod" value="standard" class="mt-1 text-yellow-500 focus:ring-yellow-400">
              <div>
                <span class="block text-sm font-bold">Giao hàng tiêu chuẩn</span>
                <span class="block text-xs text-gray-500 mt-1">Theo chính sách giao hàng của công ty.<br/></span>
              </div>
            </label>
            <!-- GIAO HÀNG NHANH CÓ HIỂN THỊ +100.000đ -->
            <label v-if="isExpressAvailable" 
                   class="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer"
                   :class="{'border-yellow-400 bg-yellow-50/30': shippingMethod === 'express'}">
              <input type="radio" v-model="shippingMethod" value="express" class="mt-1 text-yellow-500 focus:ring-yellow-400">
              <div class="flex-1">
                <div class="flex justify-between items-center">
                   <span class="block text-sm font-bold">Giao hàng nhanh</span>
                   <span class="text-sm font-bold text-red-600">+100.000 đ</span>
                </div>
                <span class="block text-xs text-gray-500 mt-1">Giao hàng nhanh trong 1-2 ngày khi đơn hàng của Quý khách được xác nhận<br/>Xem chính sách vận chuyển</span>
              </div>
            </label>
          </div>
        </div>

        <!-- PHƯƠNG THỨC THANH TOÁN -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="font-bold text-base uppercase text-gray-800">Phương thức thanh toán</h2>
          </div>
          <div class="p-5 space-y-3">
            <label class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer"
                   :class="{'border-yellow-400 bg-yellow-50/30': paymentMethod === 'cod'}">
              <input type="radio" v-model="paymentMethod" value="cod" class="text-yellow-500 focus:ring-yellow-400">
              <span class="text-sm font-bold">Trả trực tiếp khi nhận hàng</span>
            </label>
            <label class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer"
                   :class="{'border-yellow-400 bg-yellow-50/30': paymentMethod === 'transfer'}">
              <input type="radio" v-model="paymentMethod" value="transfer" class="text-yellow-500 focus:ring-yellow-400">
              <span class="text-sm font-bold">Thanh toán chuyển khoản</span>
            </label>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI: TÓM TẮT ĐƠN HÀNG -->
      <div class="lg:col-span-4 sticky top-6">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h2 class="font-bold text-base uppercase text-gray-800">Thông tin giỏ hàng</h2>
          </div>
          
          <div class="p-5">
            <div class="space-y-4 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-2">
              <div v-for="item in cartItems" :key="item.id" class="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <img :src="item.image" class="w-16 h-16 object-contain border border-gray-200 rounded bg-white p-1" />
                <div class="flex-1">
                  <h4 class="text-xs text-blue-600 font-medium leading-tight mb-1">{{ item.name }}</h4>
                  <p v-if="item.appliedPromoTitle" class="text-[10px] text-gray-500 italic mb-1">Item #{{ item.id.slice(0,8) }}</p>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="font-bold text-gray-800">{{ item.quantity }}</span>
                    <span class="text-gray-400">x</span>
                    <span class="font-bold text-red-600">{{ item.finalPrice.toLocaleString() }} đ</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3 pt-4 border-t border-gray-100 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Thành tiền</span>
                <span class="font-medium">{{ cartSubtotal.toLocaleString() }} đ</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Giảm giá coupon</span>
                <span class="font-medium">0 đ</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Giá vận chuyển:</span>
                <span class="font-medium">{{ shippingFee === 0 ? '0 đ' : `${shippingFee.toLocaleString()} đ` }}</span>
              </div>
              
              <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                <span class="font-bold uppercase">Tổng cộng</span>
                <span class="text-lg font-bold text-red-600">{{ finalTotal.toLocaleString() }} đ</span>
              </div>
            </div>

            <button 
              @click="handleCheckout" 
              :disabled="isProcessing"
              class="w-full mt-6 py-3 bg-[#ffc107] hover:bg-yellow-500 text-gray-900 rounded font-bold uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <span v-if="isProcessing" class="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
              {{ isProcessing ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN' }}
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modals -->
    <div v-if="showPaymentQR" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 text-center">
        <PaymentQR :amount="finalTotal" :orderId="newOrderId" />
        <button @click="router.push('/')" class="w-full mt-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded font-bold uppercase text-sm">
          Tôi đã hoàn tất chuyển khoản
        </button>
      </div>
    </div>

    <div v-if="showSuccessModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-bold uppercase text-gray-900">Đặt hàng thành công!</h3>
        <p class="text-sm text-gray-600 mt-2">Mã đơn hàng: <span class="font-bold text-gray-900">{{ newOrderId.slice(0,8).toUpperCase() }}</span></p>
        <button @click="router.push('/')" class="w-full mt-6 py-3 bg-[#ffc107] hover:bg-yellow-500 text-gray-900 rounded font-bold uppercase text-sm">
          Tiếp tục mua sắm
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
@reference "../style.css";

.v-input {
  @apply w-full px-4 py-2.5 border border-gray-300 rounded text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 bg-white;
}
.v-input:focus {
  @apply border-yellow-400 ring-1 ring-yellow-400;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>