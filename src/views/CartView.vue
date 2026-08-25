<template>
  <div class="fixed inset-0 flex justify-end" style="z-index: 99999;">
    <!-- Backdrop overlay -->
    <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"></div>
    
    <!-- Cart Drawer Content -->
    <div class="relative w-full max-w-md bg-white h-full shadow-2xl p-5 sm:p-6 md:p-8 flex flex-col border-l border-slate-100">
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tight text-slate-900">Giỏ hàng của bạn</h2>
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
            Đang chọn {{ cart?.length || 0 }} mã sản phẩm kỹ thuật
          </p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-slate-100 rounded-xl transition-all group border border-transparent hover:border-slate-200 cursor-pointer">
          <svg class="group-hover:rotate-90 text-slate-500 group-hover:text-slate-900 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- Danh sách sản phẩm -->
      <div class="grow overflow-y-auto pr-1 custom-scrollbar">
        <!-- Khi giỏ hàng trống -->
        <div v-if="isCartEmpty" class="text-center py-24 flex flex-col items-center justify-center">
          <span class="text-3xl mb-3 opacity-40">🛒</span>
          <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Giỏ hàng đang trống</p>
          <button @click="$emit('close')" class="mt-4 text-[10px] font-black text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors uppercase tracking-wider cursor-pointer">Tiếp tục xem sản phẩm</button>
        </div>
        
        <!-- Danh sách Item -->
        <div v-else class="space-y-3.5">
          <div v-for="item in cart" :key="item.id" 
               :class="['group flex gap-4 p-3.5 bg-white rounded-xl border border-slate-200/70 transition-all duration-300 relative overflow-hidden', 
                        item.isSoldOut ? 'bg-slate-50/80 opacity-60 border-slate-200' : 'hover:border-slate-900 hover:shadow-xs']"
          >
            <!-- Hình ảnh SP -->
            <div class="relative overflow-hidden rounded-xl w-20 h-20 shadow-2xs border border-slate-100 shrink-0 bg-slate-50">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            
            <!-- Chi tiết SP -->
            <div class="flex flex-col justify-between grow min-w-0">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <div class="flex flex-wrap items-center gap-1.5 mb-1">
                    <span v-if="item.brand" class="inline-block text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                      {{ item.brand }}
                    </span>
                    
                    <!-- ⚡ UPDATE: Hiển thị Quy cách mua (Mảnh / Hộp) -->
                    <span class="inline-block text-[9px] font-extrabold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {{ item.unit === 'box' ? (item.unitBoxName || 'Hộp') : (item.unitPieceName || 'Lẻ') }}
                    </span>
                  </div>

                  <h3 class="text-[12px] font-black text-slate-900 line-clamp-2 leading-tight uppercase tracking-tight">{{ item.name }}</h3>
                  
                  <!-- ⚡ HIỆN TÊN PROMO NẾU ĐẠT ĐIỀU KIỆN KHUYẾN MÃI -->
                  <p v-if="getItemPricing(item).promoTitle" class="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span>🎉</span> {{ getItemPricing(item).promoTitle }}
                  </p>
                </div>

                <!-- Nút xoá -->
                <button @click="removeItemWithoutPopup(item.id)" class="text-slate-300 hover:text-red-600 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-50 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
              
              <!-- Khối Giá & Bộ tăng giảm số lượng -->
              <div class="flex items-end justify-between mt-2.5">
                <div class="space-y-0.5">
                  <!-- ⚡ UPDATE: HIỂN THỊ GIÁ NIÊM YẾT ẢO (GẠCH ĐI) + BADGE % GIẢM -->
                  <div v-if="getItemPricing(item).hasDiscount" class="flex items-center gap-1.5">
                    <p class="text-[11px] text-slate-400 line-through font-semibold">
                      {{ getItemPricing(item).originalPrice.toLocaleString('vi-VN') }}₫
                    </p>
                    <span class="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1 rounded-xs">
                      -{{ getItemPricing(item).discountPercent }}%
                    </span>
                  </div>

                  <!-- GIÁ BÁN THỰC TẾ -->
                  <p class="text-[14px] font-black text-red-600 tracking-tight">
                    {{ getItemPricing(item).finalPrice.toLocaleString('vi-VN') }}₫
                  </p>
                </div>

                <!-- Nút tăng giảm số lượng -->
                <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                  <button @click="changeQty(item.id, -1)" class="w-8 h-full font-black text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center text-sm cursor-pointer">
                    <span v-if="item.quantity > 1">−</span>
                    <span v-else class="text-[10px]">🗑️</span>
                  </button>
                  <span class="px-2 text-[11px] font-black min-w-7 text-center text-slate-900 bg-white border-x border-slate-200 h-full flex items-center justify-center">
                    {{ item.quantity }}
                  </span>
                  <button @click="changeQty(item.id, 1)" class="w-8 h-full font-black text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center text-sm cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Giỏ hàng -->
      <div class="mt-6 border-t border-slate-900 pt-5 space-y-4 shrink-0">
        <div v-if="!isCartEmpty" class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tổng cộng tạm tính:</span>
            <span class="text-2xl font-black text-slate-950 tracking-tight">{{ totalAmount.toLocaleString('vi-VN') }}₫</span>
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
// ⚡ NEW: Import getAuth từ Firebase
import { getAuth } from 'firebase/auth'

const router = useRouter()
const props = defineProps(['cart'])
const emit = defineEmits(['close', 'change-qty', 'remove-item'])

const isCartEmpty = computed(() => !props.cart || props.cart.length === 0)

// Ref lưu danh sách Khuyến mãi tải từ Firestore
const activePromotions = ref([])

// Tải danh sách Khuyến mãi từ Firestore khi component được mount
const fetchPromotions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'promotions'))
    const list = []
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() })
    })
    activePromotions.value = list
  } catch (error) {
    console.error('Lỗi khi tải danh sách khuyến mãi:', error)
  }
}

onMounted(() => {
  fetchPromotions()
})

// ⚡ UPDATE: HÀM TÍNH GIÁ ĐỘNG CHUẨN ĐỒNG BỘ VỚI PRODUCT DETAIL & FIRESTORE PROMOTIONS
const getItemPricing = (item) => {
  if (!item) return { finalPrice: 0, originalPrice: 0, hasDiscount: false, discountPercent: 0, promoTitle: null, itemTotal: 0 }

  // 1. Xác định Giá bán mặc định & Giá Niêm Yết ẢO (được lưu từ ProductDetail hoặc cấu hình SP)
  const basePrice = Number(item.price) || 0
  
  // Lấy giá niêm yết ảo (được ưu tiên theo thứ tự: virtual_original_price -> displayOriginalPrice -> original_price -> virtual_price)
  let virtualOriginalPrice = Number(
    item.virtual_original_price || item.displayOriginalPrice || item.original_price || item.virtual_price || 0
  )

  const qty = Number(item.quantity) || 1
  const isBox = item.unit === 'box'
  const now = new Date()

  // 2. Lọc danh sách chiến dịch đang KÍCH HOẠT (is_active === true) và TRONG THỜI HẠN từ Firestore
  const validPromos = activePromotions.value.filter((promo) => {
    if (!promo.is_active) return false

    // Parse thời gian (hỗ trợ cả Firebase Timestamp và dạng String/Date)
    const start = promo.start_date?.toDate ? promo.start_date.toDate() : new Date(promo.start_date)
    const end = promo.end_date?.toDate ? promo.end_date.toDate() : new Date(promo.end_date)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
    if (now < start || now > end) return false

    // Kiểm tra áp dụng cho tất cả sản phẩm hay sản phẩm cụ thể
    if (promo.apply_to === 'all') return true
    if (Array.isArray(promo.applied_ids)) {
      return promo.applied_ids.includes(item.id) || promo.applied_ids.includes(item.productId)
    }
    return false
  })

  let bestDiscountAmount = 0
  let matchedPromoTitle = null

  // 3. Tính toán mốc chiết khấu (Tier) từ Khuyến mãi khi mua Hộp (hoặc sản phẩm chung)
  if (!item.unit || isBox) {
    validPromos.forEach((promo) => {
      if (!Array.isArray(promo.tiers) || promo.tiers.length === 0) return

      // Lọc các mốc đạt đủ số lượng mua
      const matchedTiers = promo.tiers.filter((t) => qty >= Number(t.quantity || 0))
      if (matchedTiers.length === 0) return

      // Lấy mốc có yêu cầu số lượng cao nhất đạt được
      matchedTiers.sort((a, b) => Number(a.quantity) - Number(b.quantity))
      const highestTier = matchedTiers[matchedTiers.length - 1]

      let discountVal = 0
      const type = highestTier.discount_type || 'percentage'
      const val = Number(highestTier.discount_value) || 0

      if (type === 'percentage') {
        discountVal = (basePrice * val) / 100
      } else if (type === 'amount' || type === 'fixed_discount') {
        discountVal = val
      }

      if (discountVal > bestDiscountAmount) {
        bestDiscountAmount = discountVal
        matchedPromoTitle = promo.title || promo.name || 'Khuyến mãi đại lý'
      }
    })
  }

  // Giá bán thực tế cuối cùng sau khi trừ khuyến mãi
  const finalPrice = Math.max(0, basePrice - bestDiscountAmount)

  // Xác định Giá Niêm Yết ẢO (Gạch đi) hiển thị:
  // Nếu có Giá niêm yết ảo cao hơn Giá bán thì ưu tiên dùng, nếu không có mà có Khuyến mãi Promo thì dùng basePrice
  let displayOriginalPrice = virtualOriginalPrice
  if (displayOriginalPrice <= finalPrice && bestDiscountAmount > 0) {
    displayOriginalPrice = basePrice
  }

  const hasDiscount = displayOriginalPrice > finalPrice
  const discountPercent = hasDiscount && displayOriginalPrice > 0 
    ? Math.round(((displayOriginalPrice - finalPrice) / displayOriginalPrice) * 100) 
    : 0

  return {
    finalPrice,
    originalPrice: displayOriginalPrice,
    hasDiscount,
    discountPercent,
    promoTitle: bestDiscountAmount > 0 ? matchedPromoTitle : null,
    itemTotal: finalPrice * qty
  }
}

// Tổng tiền tạm tính: Cộng dồn trực tiếp từ hàm getItemPricing
const totalAmount = computed(() => {
  return props.cart?.reduce((total, item) => total + getItemPricing(item).itemTotal, 0) || 0
})

const hasSoldOutInCart = computed(() => props.cart?.some((item) => item.isSoldOut))

const changeQty = (id, delta) => {
  const item = props.cart?.find((i) => i.id === id)
  if (item && item.quantity === 1 && delta === -1) emit('remove-item', id)
  else emit('change-qty', id, delta)
}

const removeItemWithoutPopup = (id) => emit('remove-item', id)

// ⚡ UPDATE: HÀM XỬ LÝ THANH TOÁN (KIỂM TRA DỰA TRÊN TRẠNG THÁI ĐĂNG NHẬP)
const handleProceed = () => {
  if (isCartEmpty.value) return

  const auth = getAuth()
  const currentUser = auth.currentUser

  // Đóng Drawer giỏ hàng
  emit('close')

  if (!currentUser) {
    // Nếu CHƯA ĐĂNG NHẬP: Điều hướng tới /login kèm query redirect=/checkout
    router.push({
      path: '/login',
      query: { redirect: '/checkout' }
    })
  } else {
    // Nếu ĐÃ ĐĂNG NHẬP: Cho sang thẳng trang Checkout
    router.push('/checkout')
  }
}
</script>