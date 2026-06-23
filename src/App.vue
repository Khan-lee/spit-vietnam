<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import CartView from './views/CartView.vue'
import { db } from './firebase'
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore'
import { useSearchStore } from './stores/search'
import AIChatWidget from './components/AIChatWidget.vue'

const route = useRoute()
const { locale } = useI18n()
const searchStore = useSearchStore()

const webConfig = ref({
  hotline: '',
  email: ''
})
const cartItems = ref([])
const promotions = ref([]) // Thêm state lưu CTKM ngay tại đây
const isCartOpen = ref(false)
const searchQuery = ref('')

watch(searchQuery, (newVal) => {
  searchStore.setSearchQuery(newVal)
})

let unsubConfig = null

const displayAnnouncement = computed(() => {
  const currentAnnouncement = webConfig.value.announcement || webConfig.value.announcement_vi
  if (locale.value === 'vi') {
    return currentAnnouncement
  } else {
    return webConfig.value.announcement_en || 'Professional Technology Solutions'
  }
})

const isHideLayout = computed(() => {
  return route.path.startsWith('/spit-system-manager') || route.path.startsWith('/admin') || route.path === '/login'
})

const updateCart = () => {
  const data = localStorage.getItem('spit_cart')
  cartItems.value = data ? JSON.parse(data) : []
}

// Giữ nguyên các hàm quản lý giỏ hàng của mày
const cartCount = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))

const changeQuantity = (productId, delta) => {
  const item = cartItems.value.find(i => i.id === productId)
  if (item) {
    item.quantity += delta
    if (item.quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart()
    }
  }
}

const removeFromCart = (productId) => {
  cartItems.value = cartItems.value.filter(item => item.id !== productId)
  saveCart()
}

const saveCart = () => {
  localStorage.setItem('spit_cart', JSON.stringify(cartItems.value))
  window.dispatchEvent(new Event('cart-updated'))
}

// Lấy các chương trình khuyến mãi đang hoạt động từ Firestore
const fetchActivePromotions = async () => {
  try {
    const now = new Date().getTime()
    const q = query(collection(db, "promotions"), where("is_active", "==", true))
    const snap = await getDocs(q)
    
    // Lọc các chiến dịch còn trong thời hạn
    promotions.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => {
        const start = new Date(p.start_date).getTime()
        const end = new Date(p.end_date).getTime()
        return now >= start && now <= end
      })
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi ở App.vue:", e)
  }
}

// BẬT PHÉP THUẬT: Tự động tính toán giá dựa theo mốc số lượng (Tiers)
const cartWithDiscounts = computed(() => {
  return cartItems.value.map(item => {
    let finalPrice = item.price
    let discountAmount = 0
    let appliedPromoTitle = null

    // Tìm xem sản phẩm này có nằm trong chiến dịch nào không
    const matchedPromo = promotions.value.find(p => 
      p.apply_to === 'all' || (p.applied_ids && p.applied_ids.includes(item.id))
    )

    if (matchedPromo && matchedPromo.tiers) {
      // Sắp xếp các mốc số lượng từ cao xuống thấp để check mốc lớn nhất trước
      const sortedTiers = [...matchedPromo.tiers].sort((a, b) => b.quantity - a.quantity)
      const matchedTier = sortedTiers.find(t => item.quantity >= t.quantity)

      if (matchedTier) {
        appliedPromoTitle = matchedPromo.title
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
      finalPrice, // Giá sau giảm cho 1 sản phẩm
      discountAmount, // Số tiền được giảm trên 1 sản phẩm
      appliedPromoTitle, // Tên chương trình áp dụng
      itemTotal: finalPrice * item.quantity, // Tổng tiền dòng này
      originalTotal: item.price * item.quantity // Tổng tiền gốc dòng này
    }
  })
})

onMounted(() => {
  updateCart()
  fetchActivePromotions() // Gọi lấy CTKM khi vào web
  
  window.addEventListener('storage', updateCart)
  window.addEventListener('cart-updated', updateCart)

  unsubConfig = onSnapshot(doc(db, "settings", "website"), (docSnap) => {
    if (docSnap.exists()) webConfig.value = { ...webConfig.value, ...docSnap.data() }
  })
})

onUnmounted(() => {
  window.removeEventListener('storage', updateCart)
  window.removeEventListener('cart-updated', updateCart)
  if (unsubConfig) unsubConfig()
})
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
    <div v-if="!isHideLayout" class="bg-[#0f172a] text-white py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] relative z-60">
      <div class="container mx-auto px-4 overflow-hidden whitespace-nowrap">
        <span class="inline-block animate-marquee">
          {{ displayAnnouncement }} — {{ displayAnnouncement }} — {{ displayAnnouncement }}
        </span>
      </div>
    </div>

    <Header
      v-if="!isHideLayout"
      :cartCount="cartCount"
      v-model:searchQuery="searchQuery"
      @openCart="isCartOpen = true"
    />

    <transition name="cart-slide">
      <CartView
        v-if="isCartOpen"
        :cart="cartWithDiscounts"
        @close="isCartOpen = false"
        @change-qty="changeQuantity"
        @remove-item="removeFromCart"
      />
    </transition>

    <main class="grow">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </RouterView>
    </main>

    <Footer v-if="!isHideLayout" :config="webConfig" />
    <AIChatWidget v-if="!isHideLayout" />
  </div>
</template>