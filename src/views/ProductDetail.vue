<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const { locale } = useI18n()
const route = useRoute()
const product = ref(null)
const loading = ref(true)
const isAdding = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// --- BIẾN LƯU TRỮ CHIẾN DỊCH KHUYẾN MÃI ĐANG CHẠY ---
const activePromotions = ref([])

// --- HÀM XỬ LÝ SỐ CỰC MẠNH (Trị dấu phẩy) ---
const cleanNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// 1. Tự động lấy danh sách Campaign đang hoạt động từ Firebase
const fetchActivePromotions = async () => {
  try {
    const q = query(collection(db, "promotions"), where("is_active", "==", true))
    const snap = await getDocs(q)
    activePromotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi hệ thống:", e)
  }
}

// 2. Logic đồng bộ: Ưu tiên Campaign > Khuyến mãi riêng lẻ
const effectivePromo = computed(() => {
  if (!product.value) return null;
  
  // Kiểm tra Campaign tổng
  const campaign = activePromotions.value.find(p => p.applied_ids?.includes(route.params.id));
  
  if (campaign) {
    return {
      type: campaign.discount_type,
      value: cleanNumber(campaign.discount_value),
      label: 'CAMPAIGN'
    };
  }

  // Kiểm tra khuyến mãi riêng lẻ trong product (code cũ của bạn)
  const val = cleanNumber(product.value.promotionValue);
  const type = product.value.promotionType;
  if (val > 0 && (type === 'percentage' || type === 'fixed')) {
    return {
      type: type,
      value: val,
      label: 'SALE'
    };
  }

  return null;
});

// Check khuyến mãi có thực sự tồn tại không (Dùng cho UI)
const hasPromo = (item) => {
  return !!effectivePromo.value;
}

// 3. Hàm tính giá (Đã fix lỗi NaN và hỗ trợ đồng bộ Campaign)
const getDiscountedPrice = (item) => {
  if (!item || !item.price) return 0;
  const basePrice = cleanNumber(item.price);
  const promo = effectivePromo.value;
  
  if (!promo) return basePrice;

  if (promo.type === 'percentage') {
    return basePrice * (1 - promo.value / 100);
  } else if (promo.type === 'fixed') {
    return Math.max(0, basePrice - promo.value);
  }
  return basePrice;
}

const addToCart = (item) => {
  if (item.stock <= 0) return;
  isAdding.value = true
  setTimeout(() => {
    const cart = JSON.parse(localStorage.getItem('spit_cart')) || []
    const existingItem = cart.find(i => i.id === route.params.id)
    const pName = item[`name_${locale.value}`] || item.name
    const finalPrice = getDiscountedPrice(item);

    if (existingItem) {
      existingItem.quantity += 1
      existingItem.price = finalPrice 
    } else {
      cart.push({ id: route.params.id, name: pName, price: finalPrice, image: item.image, quantity: 1 })
    }
    
    localStorage.setItem('spit_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    isAdding.value = false
    toastMessage.value = locale.value === 'vi' ? `Đã thêm vào giỏ hàng!` : `Added to cart!`
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3000)
  }, 200)
}

onMounted(async () => {
  try {
    await fetchActivePromotions();
    const docRef = doc(db, "products", route.params.id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) product.value = { id: docSnap.id, ...docSnap.data() }
  } catch (error) {
    console.error("Lỗi:", error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-blue-100 italic" v-if="product">
    
    <transition name="slide-fade">
      <div v-if="showToast" class="fixed top-24 right-6 md:right-10 z-100 max-w-sm bg-slate-900 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
        <div class="shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg">✓</div>
        <p class="text-xs font-bold grow">{{ toastMessage }}</p>
      </div>
    </transition>

    <div class="container mx-auto max-w-6xl py-12 md:py-20 px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl">
        
        <div class="relative bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex items-center justify-center aspect-square shadow-inner lg:sticky lg:top-24">
          <div v-if="hasPromo(product)" 
               class="absolute top-6 left-6 z-10 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg animate-bounce"
               :class="effectivePromo.label === 'CAMPAIGN' ? 'bg-orange-500' : 'bg-red-600'">
            {{ effectivePromo.label }} {{ effectivePromo.type === 'percentage' ? `-${effectivePromo.value}%` : 'OFF' }}
          </div>
          <img :src="product.image" class="max-h-full object-contain hover:scale-105 transition-transform duration-500" />
        </div>
        
        <div class="space-y-8">
          <div>
            <span class="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 mb-6 italic">
              {{ product.brand }}
            </span>
            <h1 class="text-4xl md:text-5xl font-black text-slate-950 uppercase italic leading-none tracking-tighter mb-2">
              {{ product[`name_${locale}`] || product.name }}
            </h1>
            <p class="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-6">{{ product[`category_${locale}`] || product.category }}</p>

            <div v-if="product[`gift_${locale}`] || product.gift_vi" class="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-2xl">
              <h4 class="text-[9px] font-black uppercase text-orange-600 mb-1 tracking-widest italic">🎁 Ưu đãi đặc biệt:</h4>
              <p class="text-sm font-bold text-slate-800 uppercase leading-snug">
                {{ product[`gift_${locale}`] || product.gift_vi }}
              </p>
            </div>
          </div>
          
          <div class="p-8 rounded-[2.5rem] transition-all duration-500" 
               :class="hasPromo(product) ? 'bg-red-50 border-red-100 shadow-red-100/50 shadow-lg' : 'bg-slate-900 border-slate-800 text-white shadow-2xl'">
               <div class="flex flex-col gap-1">
                 <div v-if="hasPromo(product)" class="text-slate-400 font-bold text-lg line-through opacity-60">
                   {{ cleanNumber(product.price).toLocaleString('vi-VN') }} VNĐ
                 </div>
                 
                 <div class="text-6xl font-black tracking-tight flex items-baseline gap-1.5"
                      :class="hasPromo(product) ? 'text-red-600' : 'text-white'">
                   {{ getDiscountedPrice(product).toLocaleString('vi-VN') }} 
                   <span class="text-xl font-bold opacity-40 uppercase">VNĐ</span>
                 </div>
               </div>
          </div>

          <button @click="addToCart(product)" :disabled="isAdding || product.stock <= 0" class="group w-full relative overflow-hidden py-6 rounded-2xl font-black uppercase text-xs transition-all shadow-xl active:scale-95" :class="product.stock > 0 ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-400'">
            <span v-if="product.stock > 0" class="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span class="relative z-10 tracking-[0.2em] flex items-center justify-center gap-2">
                {{ isAdding ? '...' : (product.stock > 0 ? (locale === 'vi' ? 'THÊM VÀO GIỎ HÀNG 🛒' : 'ADD TO CART 🛒') : 'HẾT HÀNG') }}
            </span>
          </button>

          <div class="mt-10 pt-8 border-t border-slate-100">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-4 italic underline decoration-red-600 decoration-4 underline-offset-8">Thông số/đặc điểm</h3>
            <p class="text-slate-500 text-sm leading-relaxed font-medium whitespace-pre-line">
              {{ product[`description_${locale}`] || product.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>