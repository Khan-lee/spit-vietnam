import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export const useCartStore = defineStore('cart', () => {
  // 1. STATE
  const items = ref(JSON.parse(localStorage.getItem('spit_cart')) || [])
  const promotions = ref([])
  const isLoadingPromos = ref(false)

  // Tự động lưu LocalStorage khi có bất kỳ thay đổi nào trong giỏ hàng
  watch(() => items.value, (newVal) => {
    localStorage.setItem('spit_cart', JSON.stringify(newVal))
  }, { deep: true })

  // 2. ACTIONS
  // Gọi hàm này 1 lần ở App.vue để tải các CTKM đang chạy
  const fetchActivePromotions = async () => {
    isLoadingPromos.value = true
    try {
      const now = new Date().getTime()
      const q = query(collection(db, 'promotions'), where('is_active', '==', true))
      const snap = await getDocs(q)
      
      const validPromos = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => {
          const start = new Date(p.start_date).getTime()
          const end = new Date(p.end_date).getTime()
          return now >= start && now <= end
        })
        
      promotions.value = validPromos
    } catch (error) {
      console.error("Lỗi tải chương trình khuyến mãi:", error)
    } finally {
      isLoadingPromos.value = false
    }
  }

  const changeQuantity = (id, delta) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.quantity += delta
      if (item.quantity <= 0) removeItem(id)
    }
  }

  const removeItem = (id) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  const clearCart = () => {
    items.value = []
  }

  // 3. GETTERS (Phép thuật nằm ở đây)
  // Tính toán lại giỏ hàng kèm theo giá đã giảm
  const cartWithDiscounts = computed(() => {
    return items.value.map(item => {
      let finalPrice = item.price
      let discountAmount = 0
      let appliedPromoName = null

      // Lọc ra các CTKM có chứa ID sản phẩm này
      const applicablePromos = promotions.value.filter(p => 
        p.apply_to === 'all' || (p.applied_ids && p.applied_ids.includes(item.id))
      )

      if (applicablePromos.length > 0) {
        // Ưu tiên lấy CTKM đầu tiên tìm thấy (nếu mún phức tạp hơn thì so sánh cái nào hời nhất)
        const promo = applicablePromos[0]
        
        if (promo && promo.tiers) {
          // Sắp xếp mốc số lượng giảm dần (VD: 10 hộp, 5 hộp, 1 hộp) để check mốc to nhất trước
          const sortedTiers = [...promo.tiers].sort((a, b) => b.quantity - a.quantity)
          
          // Tìm mốc phù hợp với số lượng khách đang mua
          const matchedTier = sortedTiers.find(t => item.quantity >= t.quantity)

          if (matchedTier) {
            appliedPromoName = promo.title
            if (matchedTier.discount_type === 'percentage') {
              discountAmount = item.price * (matchedTier.discount_value / 100)
            } else if (matchedTier.discount_type === 'fixed_amount') {
              discountAmount = matchedTier.discount_value
            }
            
            // Chặn lỗi giảm lố qua giá gốc
            if (discountAmount > item.price) discountAmount = item.price
            finalPrice = item.price - discountAmount
          }
        }
      }

      return {
        ...item,
        finalPrice,
        discountAmount,
        appliedPromoName,
        itemTotal: finalPrice * item.quantity,
        originalTotal: item.price * item.quantity
      }
    })
  })

  // Tổng tiền phải thanh toán (Đã trừ chiết khấu)
  const subtotal = computed(() => cartWithDiscounts.value.reduce((sum, item) => sum + item.itemTotal, 0))
  
  // Tổng tiền gốc (Để hiển thị cục tiền bị gạch bỏ cho khách thèm)
  const originalTotal = computed(() => items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0))
  
  // Tổng số lượng item trên icon giỏ hàng
  const cartCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  return {
    items,
    promotions,
    isLoadingPromos,
    cartWithDiscounts,
    subtotal,
    originalTotal,
    cartCount,
    fetchActivePromotions,
    changeQuantity,
    removeItem,
    clearCart
  }
})