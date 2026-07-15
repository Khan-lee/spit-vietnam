<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
// Đã thêm 'limit' vào import của firebase để giới hạn số lượng query
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore'
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

// --- BIẾN QUẢN LÝ ẢNH ĐANG ĐƯỢC CHỌN HIỂN THỊ LỚN ---
const activeImage = ref('')

// --- THÊM MỚI: BIẾN QUẢN LÝ SẢN PHẨM LIÊN QUAN ---
const relatedProducts = ref([])

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

  // Kiểm tra khuyến mãi riêng lẻ trong product
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
const hasPromo = () => {
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

// Tự động phân tách nội dung mô tả thành mảng các thông số kỹ thuật (Dành cho Spec Table)
const parsedSpecifications = computed(() => {
  if (!product.value) return [];
  const desc = product.value[`description_${locale.value}`] || product.value.description || '';
  
  // Tìm các dòng chứa dấu hai chấm ":" để chuyển đổi thành cặp Key - Value
  return desc.split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const parts = line.split(':');
      return {
        key: parts[0].trim(),
        value: parts.slice(1).join(':').trim()
      };
    });
});

// Nội dung văn bản mô tả thuần túy còn lại (bỏ các dòng thông số dạng key:value)
const pureDescription = computed(() => {
  if (!product.value) return '';
  const desc = product.value[`description_${locale.value}`] || product.value.description || '';
  return desc.split('\n')
    .filter(line => !line.includes(':'))
    .join('\n').trim();
});

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
    toastMessage.value = locale.value === 'vi' ? `Đã thêm vào giỏ hàng thành công!` : `Added to cart successfully!`
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3000)
  }, 200)
}

// --- THÊM MỚI: HÀM LẤY SẢN PHẨM CÙNG DANH MỤC (CÓ LOGS DEBUG) ---
const fetchRelatedProducts = async (categoryStr) => {
  if (!categoryStr) {
    console.warn("⚠️ Không tìm thấy tên Category để truy vấn sản phẩm liên quan.");
    return;
  }
  try {
    console.log("🔍 Đang tìm sản phẩm liên quan với Category keyword:", categoryStr);
    
    // Thử tìm theo trường 'category' thông thường
    let q = query(collection(db, "products"), where("category", "==", categoryStr), limit(6));
    let snap = await getDocs(q);
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Nếu không tìm thấy, thử tìm theo trường 'category_vi' (Localized field)
    if (items.length <= 1) { 
      console.log("🔍 Tìm theo 'category' không ra hoặc chỉ có chính nó, thử tìm theo 'category_vi'...");
      q = query(collection(db, "products"), where("category_vi", "==", categoryStr), limit(6));
      snap = await getDocs(q);
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    console.log("📦 Danh sách thô lấy từ Firestore:", items);

    // Lọc bỏ sản phẩm hiện tại đang xem ra khỏi danh sách liên quan
    relatedProducts.value = items.filter(item => item.id !== route.params.id).slice(0, 4);
    console.log("✨ Danh sách sản phẩm liên quan sau khi lọc trùng:", relatedProducts.value);
  } catch (e) {
    console.error("❌ Lỗi truy vấn sản phẩm liên quan từ Firestore:", e);
  }
}

onMounted(async () => {
  try {
    await fetchActivePromotions();
    const docRef = doc(db, "products", route.params.id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      product.value = { id: docSnap.id, ...docSnap.data() }
      console.log("ℹ️ Dữ liệu sản phẩm hiện tại:", product.value);

      if (product.value.image) {
        activeImage.value = product.value.image
      }
      
      // --- Xử lý lấy Category an toàn từ database ---
      const targetCategory = product.value.category || product.value.category_vi || product.value.category_en;
      console.log("🎯 Category xác định được:", targetCategory);

      if (targetCategory) {
        await fetchRelatedProducts(targetCategory);
      } else {
        console.warn("⚠️ Sản phẩm này không chứa bất kỳ trường category nào (category, category_vi, category_en) trong Firestore.");
      }
    }
  } catch (error) {
    console.error("Lỗi kết nối dữ liệu:", error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải chi tiết sản phẩm...</p>
    </div>
  </div>

  <div class="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-900 selection:bg-red-100" v-else-if="product">
    
    <transition name="slide-fade">
      <div v-if="showToast" class="fixed top-24 right-6 z-100 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800">
        <div class="shrink-0 w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-md shadow-red-900/30">✓</div>
        <p class="text-xs font-bold grow tracking-wide">{{ toastMessage }}</p>
      </div>
    </transition>

    <div class="container mx-auto max-w-6xl py-10 md:py-16 px-4 sm:px-6">
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 mb-10">
        
        <div class="lg:sticky lg:top-24 space-y-5 w-full">
          <div class="relative bg-[#f8fafc] p-8 md:p-12 rounded-4xl border border-slate-100 flex items-center justify-center aspect-square shadow-inner overflow-hidden group">
            
            <div v-if="hasPromo()" 
                 class="absolute top-5 left-5 z-10 text-white font-black text-[10px] tracking-wider px-3 py-1.5 rounded-xl shadow-md uppercase"
                 :class="effectivePromo.label === 'CAMPAIGN' ? 'bg-linear-to-r from-orange-500 to-amber-500' : 'bg-linear-to-r from-red-600 to-red-500'">
              🔥 {{ effectivePromo.label }} {{ effectivePromo.type === 'percentage' ? `-${effectivePromo.value}%` : 'OFF' }}
            </div>
            
            <img :src="activeImage" class="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>

          <div v-if="product.sub_images && product.sub_images.length > 0" class="flex flex-wrap gap-3 px-1 justify-center lg:justify-start">
            <div @click="activeImage = product.image" 
                 :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === product.image ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="product.image" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" />
            </div>

            <div v-for="(subImg, index) in product.sub_images" :key="index"
                 @click="activeImage = subImg"
                 :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === subImg ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="subImg" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" />
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div>
            <div class="flex flex-wrap gap-2 items-center mb-4">
              <span class="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                {{ product.brand }}
              </span>
              <span class="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                MÃ SP: {{ product.sku || product.id?.substring(0,7).toUpperCase() }}
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 uppercase leading-tight tracking-tight mb-2">
              {{ product[`name_${locale}`] || product.name }}
            </h1>
            
            <p class="text-red-600 font-extrabold uppercase text-[10px] tracking-widest border-b border-slate-100 pb-4">
              {{ product[`category_${locale}`] || product.category }}
            </p>

            <div v-if="product[`gift_${locale}`] || product.gift_vi" class="mt-4 p-4 bg-orange-50/70 border-l-4 border-orange-500 rounded-r-2xl shadow-sm shadow-orange-100">
              <h4 class="text-[9px] font-black uppercase text-orange-700 mb-1 tracking-widest flex items-center gap-1.5">
                <span>🎁</span> Ưu đãi tặng kèm đặc biệt:
              </h4>
              <p class="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-snug">
                {{ product[`gift_${locale}`] || product.gift_vi }}
              </p>
            </div>
          </div>
          
          <div class="p-6 sm:p-8 rounded-4xl border transition-all duration-500" 
               :class="hasPromo() ? 'bg-red-50/50 border-red-100' : 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'">
               <div class="flex flex-col gap-1">
                 <div v-if="hasPromo()" class="text-slate-400 font-bold text-xs sm:text-sm line-through opacity-70">
                   {{ cleanNumber(product.price).toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ</span>
                 </div>
                 
                 <div class="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-baseline gap-1.5"
                      :class="hasPromo() ? 'text-red-600' : 'text-white'">
                   {{ getDiscountedPrice(product).toLocaleString('vi-VN') }} 
                   <span class="text-xs sm:text-sm font-extrabold opacity-50 uppercase shrink-0">VNĐ</span>
                 </div>
               </div>
          </div>

          <button @click="addToCart(product)" 
                  :disabled="isAdding || product.stock <= 0" 
                  class="group w-full relative overflow-hidden py-5 rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-[0.98]" 
                  :class="product.stock > 0 ? 'bg-slate-950 text-white shadow-slate-950/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
            <span v-if="product.stock > 0" class="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span class="relative z-10 tracking-[0.2em] flex items-center justify-center gap-2">
                {{ isAdding ? '...' : (product.stock > 0 ? (locale === 'vi' ? 'Thêm vào giỏ hàng 🛒' : 'Add to cart 🛒') : 'Hết hàng tạm thời') }}
            </span>
          </button>

          <div class="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="text-lg mb-0.5">🛡️</div>
              <p class="text-[9px] font-black uppercase text-slate-800 tracking-wider">Chính Hãng 100%</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="text-lg mb-0.5">🎯</div>
              <p class="text-[9px] font-black uppercase text-slate-800 tracking-wider">Chính Xác Micro</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="text-lg mb-0.5">🚚</div>
              <p class="text-[9px] font-black uppercase text-slate-800 tracking-wider">Giao Toàn Quốc</p>
            </div>
          </div>

        </div>
      </div>

      <div class="bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        <div :class="parsedSpecifications.length > 0 ? 'md:col-span-7' : 'md:col-span-12'" class="space-y-4">
          <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900 border-l-4 border-red-600 pl-3 mb-6">
            {{ locale === 'vi' ? 'Thông Số Kỹ Thuật Chi Tiết' : 'Technical Specifications' }}
          </h3>
          
          <div v-if="parsedSpecifications.length > 0" class="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <tbody>
                <tr v-for="(spec, idx) in parsedSpecifications" :key="idx" 
                    :class="idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'" 
                    class="border-b border-slate-100 hover:bg-slate-100/40 transition-colors">
                  <td class="px-4 py-3.5 font-bold text-slate-500 w-1/3 bg-slate-50/30 border-r border-slate-100 uppercase text-[10px] tracking-wider">{{ spec.key }}</td>
                  <td class="px-4 py-3.5 font-extrabold text-slate-800 font-mono">{{ spec.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-else class="text-slate-400 text-xs py-4 italic">
            Không có bảng thông số kỹ thuật riêng lẻ cho thiết bị này.
          </div>
        </div>

        <div :class="parsedSpecifications.length > 0 ? 'md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8' : 'md:col-span-12'" class="space-y-4">
          <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900 border-l-4 border-slate-900 pl-3 mb-6">
            {{ locale === 'vi' ? 'Đặc Tính & Mô Tả Dụng Cụ' : 'Product Features' }}
          </h3>
          <p class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-line">
            {{ pureDescription || product[`description_${locale}`] || product.description }}
          </p>
        </div>

      </div>

      <div v-if="relatedProducts.length > 0" class="mt-12 md:mt-16">
        <h2 class="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
          <span class="w-2 h-8 bg-red-600 inline-block rounded-full"></span>
          {{ locale === 'vi' ? 'Có thể bạn quan tâm' : 'You might also like' }}
        </h2>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <a v-for="item in relatedProducts" :key="item.id" :href="`/product/${item.id}`" 
             class="group bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
            
            <div class="aspect-square bg-[#f8fafc] rounded-2xl mb-4 overflow-hidden p-4 flex items-center justify-center shrink-0">
              <img :src="item.image" class="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out" />
            </div>
            
            <div class="flex flex-col grow justify-between space-y-3">
              <div>
                <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{{ item.brand || 'SPIT' }}</p>
                <h3 class="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                  {{ item[`name_${locale}`] || item.name }}
                </h3>
              </div>
              <div class="pt-3 border-t border-slate-50 flex items-baseline gap-1">
                <span class="font-black text-slate-900 text-sm sm:text-base">{{ cleanNumber(item.price).toLocaleString('vi-VN') }}</span>
                <span class="text-[9px] font-extrabold text-slate-400 uppercase">VNĐ</span>
              </div>
            </div>
            
          </a>
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