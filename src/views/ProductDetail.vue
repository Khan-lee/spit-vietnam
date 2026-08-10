<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase'

const { locale } = useI18n()
const route = useRoute()
const product = ref(null)
const loading = ref(true)
const isAdding = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// --- TAB MÔ TẢ VÀ ĐẶC TÍNH ---
const activeTab = ref('description')

// --- CHIẾN DỊCH KHUYẾN MÃI ---
const activePromotions = ref([])
const activeImage = ref('')
const isZoomed = ref(false)
const relatedProducts = ref([])

// --- SO SÁNH SẢN PHẨM ---
const isCompareOpen = ref(false)
const selectedCompareId = ref('')

const compareProduct = computed(() => {
  if (!selectedCompareId.value) return null
  return relatedProducts.value.find(p => p.id === selectedCompareId.value) || null
})

const openCompareModal = () => {
  isCompareOpen.value = true
  if (relatedProducts.value.length > 0 && !selectedCompareId.value) {
    selectedCompareId.value = relatedProducts.value[0].id
  }
}

// --- HÀM BÓC TÁCH THÔNG SỐ KỸ THUẬT (ĐÃ FIX LỖI TÁCH THẺ HTML) ---
const getParsedSpecs = (item) => {
  if (!item) return {}
  
  // 1. Nếu trong Firestore lưu sẵn dạng Object
  if (item.specs && typeof item.specs === 'object' && !Array.isArray(item.specs)) {
    return item.specs
  }

  // 2. Nếu lưu dạng Text/HTML
  const rawText = item[`specifications_${locale.value}`] || item.specifications || item[`features_${locale.value}`] || item.features || ''
  if (!rawText) return {}

  let cleaned = rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n') // Chỉ xuống dòng ở cuối thẻ khối
    .replace(/<[^>]*>/g, '') // Xóa sạch các thẻ HTML còn lại (strong, b, span...)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)
  
  const result = {}
  lines.forEach(line => {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const val = line.substring(colonIndex + 1).trim()
      
      if (key && val && key.length < 40) { // Tránh quét nhầm đoạn văn dài
        result[key] = val
      }
    }
  })
  
  return result
}

// Helper lấy giá trị thông số (Không phân biệt hoa/thường)
const getSpecValue = (specs, targetKey) => {
  if (!specs) return '-'
  if (specs[targetKey]) return specs[targetKey]
  
  const normalizedTarget = targetKey.toLowerCase().trim()
  const foundKey = Object.keys(specs).find(k => k.toLowerCase().trim() === normalizedTarget)
  
  return foundKey ? specs[foundKey] : '-'
}

// Lấy danh sách tất cả các Key thông số của cả 2 sản phẩm (Khử trùng lặp thông minh)
const allSpecKeys = computed(() => {
  if (!product.value || !compareProduct.value) return []
  const specs1 = getParsedSpecs(product.value)
  const specs2 = getParsedSpecs(compareProduct.value)
  
  const rawKeys = [...Object.keys(specs1), ...Object.keys(specs2)]
  
  const uniqueKeys = []
  rawKeys.forEach(k => {
    const trimmed = k.trim()
    if (trimmed && !uniqueKeys.some(uk => uk.toLowerCase() === trimmed.toLowerCase())) {
      uniqueKeys.push(trimmed)
    }
  })
  
  return uniqueKeys
})

const cleanNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0
  const cleaned = String(val).replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

const fetchActivePromotions = async () => {
  try {
    const q = query(collection(db, "promotions"), where("is_active", "==", true))
    const snap = await getDocs(q)
    activePromotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi:", e)
  }
}

const effectivePromo = computed(() => {
  if (!product.value) return null
  const campaign = activePromotions.value.find(p => p.applied_ids?.includes(route.params.id))
  if (campaign) {
    return { type: campaign.discount_type, value: cleanNumber(campaign.discount_value), label: 'CAMPAIGN' }
  }
  const val = cleanNumber(product.value.promotionValue)
  const type = product.value.promotionType
  if (val > 0 && (type === 'percentage' || type === 'fixed')) {
    return { type, value: val, label: 'SALE' }
  }
  return null
})

const hasPromo = () => !!effectivePromo.value

const getDiscountedPrice = (item) => {
  if (!item || !item.price) return 0
  const basePrice = cleanNumber(item.price)
  if (item.id === product.value?.id) {
    const promo = effectivePromo.value
    if (!promo) return basePrice
    if (promo.type === 'percentage') return basePrice * (1 - promo.value / 100)
    if (promo.type === 'fixed') return Math.max(0, basePrice - promo.value)
  }
  return basePrice
}

const addToCart = (item) => {
  if (item.stock <= 0) return
  isAdding.value = true

  setTimeout(() => {
    const cart = JSON.parse(localStorage.getItem('spit_cart')) || []
    const existingItem = cart.find(i => i.id === route.params.id)
    const pName = item[`name_${locale.value}`] || item.name
    const finalPrice = getDiscountedPrice(item)

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

const fetchRelatedProducts = async (categoryStr) => {
  if (!categoryStr) return
  try {
    let q = query(collection(db, "products"), where("category", "==", categoryStr), limit(6))
    let snap = await getDocs(q)
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (items.length <= 1) { 
      q = query(collection(db, "products"), where("category_vi", "==", categoryStr), limit(6))
      snap = await getDocs(q)
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    relatedProducts.value = items.filter(item => item.id !== route.params.id).slice(0, 5)
  } catch (e) {
    console.error("Lỗi lấy sp liên quan:", e)
  }
}

onMounted(async () => {
  try {
    await fetchActivePromotions()
    const docRef = doc(db, "products", route.params.id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      product.value = { id: docSnap.id, ...docSnap.data() }
      if (product.value.image) activeImage.value = product.value.image
      const targetCategory = product.value.category || product.value.category_vi || product.value.category_en
      if (targetCategory) await fetchRelatedProducts(targetCategory)
    }
  } catch (error) {
    console.error("Lỗi kết nối:", error)
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

    <!-- MODAL PHÓNG TO ẢNH -->
    <transition name="fade">
      <div v-if="isZoomed" class="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 sm:p-8" @click.self="isZoomed = false">
        <button @click="isZoomed = false" class="absolute top-6 right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl transition-colors backdrop-blur-lg">✕</button>
        <img :src="activeImage" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl pointer-events-none select-none" />
      </div>
    </transition>

    <!-- MODAL SO SÁNH SẢN PHẨM PHIÊN BẢN CHUẨN CƠ KHÍ (CHIA HÀNG CHI TIẾT) -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="isCompareOpen" class="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md" @click.self="isCompareOpen = false">
          <div class="bg-white rounded-4xl sm:rounded-[2.5rem] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            
            <!-- Header Modal -->
            <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div class="flex items-center gap-3">
                <span class="w-3 h-8 bg-red-600 rounded-full"></span>
                <div>
                  <h3 class="font-black text-white text-base sm:text-xl uppercase tracking-wider">
                    BẢNG SO SÁNH THÔNG SỐ KỸ THUẬT
                  </h3>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    So sánh chi tiết đặc tính kỹ thuật sản phẩm cơ khí
                  </p>
                </div>
              </div>
              <button @click="isCompareOpen = false" class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors">✕</button>
            </div>

            <!-- Body Modal -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-6 grow">
              
              <!-- Khối 2 Sản Phẩm Đầu Bảng -->
              <div class="grid grid-cols-2 gap-3 sm:gap-6">
                <!-- Sản phẩm hiện tại -->
                <div class="bg-slate-50/80 p-4 rounded-3xl border border-slate-200 flex flex-col items-center text-center relative">
                  <span class="text-[9px] font-black uppercase bg-red-600 text-white px-3 py-1 rounded-full mb-3 tracking-widest">
                    ĐANG XEM
                  </span>
                  <img :src="product.image" class="w-24 h-24 sm:w-32 sm:h-32 object-contain mix-blend-multiply mb-3" />
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ product.brand || 'SPIT' }}</p>
                  <h4 class="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">{{ product[`name_${locale}`] || product.name }}</h4>
                  <p class="text-red-600 font-black text-sm sm:text-lg mt-2">
                    {{ getDiscountedPrice(product).toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ</span>
                  </p>
                </div>

                <!-- Sản phẩm đối chiếu -->
                <div class="bg-slate-50/80 p-4 rounded-3xl border border-slate-200 flex flex-col items-center text-center relative">
                  <span class="text-[9px] font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-full mb-3 tracking-widest">
                    SẢN PHẨM ĐỐI CHIẾU
                  </span>

                  <select v-model="selectedCompareId" class="w-full text-xs font-bold border-2 border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 mb-3 cursor-pointer focus:border-red-600 focus:outline-none transition-colors truncate">
                    <option value="" disabled>-- Chọn sản phẩm so sánh --</option>
                    <option v-for="item in relatedProducts" :key="item.id" :value="item.id">
                      {{ item.brand ? `[${item.brand}] ` : '' }}{{ item[`name_${locale}`] || item.name }}
                    </option>
                  </select>

                  <template v-if="compareProduct">
                    <img :src="compareProduct.image" class="w-24 h-24 sm:w-32 sm:h-32 object-contain mix-blend-multiply mb-3" />
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ compareProduct.brand || 'SPIT' }}</p>
                    <h4 class="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">{{ compareProduct[`name_${locale}`] || compareProduct.name }}</h4>
                    <p class="text-red-600 font-black text-sm sm:text-lg mt-2">
                      {{ cleanNumber(compareProduct.price).toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ</span>
                    </p>
                  </template>

                  <template v-else>
                    <div class="h-40 flex items-center justify-center text-slate-400 text-xs font-medium italic">
                      Chọn sản phẩm ở menu trên để bắt đầu so sánh
                    </div>
                  </template>
                </div>
              </div>

              <!-- BẢNG SO SÁNH PHÂN RA TỪNG HÀNG THÔNG SỐ CỤ THỂ -->
              <div v-if="compareProduct" class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table class="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th class="p-3.5 w-1/3 bg-slate-200/60">Thông số kỹ thuật</th>
                      <th class="p-3.5 w-1/3 border-l border-slate-200">{{ product.brand || 'SPIT' }}</th>
                      <th class="p-3.5 w-1/3 border-l border-slate-200">{{ compareProduct.brand || 'SPIT' }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    
                    <!-- THÔNG SỐ TỰ ĐỘNG BÓC TÁCH THÀNH HÀNG RỜI -->
                    <template v-if="allSpecKeys.length > 0">
                      <tr v-for="key in allSpecKeys" :key="key" class="hover:bg-slate-50/80 transition-colors">
                        <td class="p-3 font-extrabold text-slate-700 bg-slate-50/60 uppercase text-[10px] tracking-wider">{{ key }}</td>
                        <td class="p-3 font-bold text-slate-900 border-l border-slate-200">
                          {{ getSpecValue(getParsedSpecs(product), key) }}
                        </td>
                        <td class="p-3 font-bold text-slate-900 border-l border-slate-200">
                          {{ getSpecValue(getParsedSpecs(compareProduct), key) }}
                        </td>
                      </tr>
                    </template>

                    <!-- NẾU KHÔNG TÁCH ĐƯỢC KEY THÌ HIỂN THỊ NGUYÊN KHỐI MÔ TẢ ĐẶC TÍNH KỸ THUẬT -->
                    <tr v-else>
                      <td class="p-3.5 font-black text-red-600 uppercase tracking-wider bg-slate-50/60 align-top">
                        Đặc tính & Thông số
                      </td>
                      <td class="p-3.5 align-top border-l border-slate-200">
                        <div class="raw-html-content text-slate-800 font-medium leading-relaxed"
                             v-html="product[`specifications_${locale}`] || product.specifications || product[`features_${locale}`] || product.features || 'Chưa có thông số chi tiết.'">
                        </div>
                      </td>
                      <td class="p-3.5 align-top border-l border-slate-200">
                        <div class="raw-html-content text-slate-800 font-medium leading-relaxed"
                             v-html="compareProduct[`specifications_${locale}`] || compareProduct.specifications || compareProduct[`features_${locale}`] || compareProduct.features || 'Chưa có thông số chi tiết.'">
                        </div>
                      </td>
                    </tr>

                    <!-- HÀM MÔ TẢ TÓM TẮT -->
                    <tr class="bg-slate-50/30">
                      <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60 align-top">Mô tả sản phẩm</td>
                      <td class="p-3.5 align-top border-l border-slate-200 text-slate-600">
                        <div class="raw-html-content max-h-36 overflow-y-auto" v-html="product[`description_${locale}`] || product.description || 'Chưa có thông tin.'"></div>
                      </td>
                      <td class="p-3.5 align-top border-l border-slate-200 text-slate-600">
                        <div class="raw-html-content max-h-36 overflow-y-auto" v-html="compareProduct[`description_${locale}`] || compareProduct.description || 'Chưa có thông tin.'"></div>
                      </td>
                    </tr>

                    <!-- CÁC THÔNG TIN HỆ THỐNG CƠ BẢN -->
                    <tr>
                      <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Thương hiệu</td>
                      <td class="p-3.5 font-black text-slate-900 border-l border-slate-200">{{ product.brand || 'SPIT' }}</td>
                      <td class="p-3.5 font-black text-slate-900 border-l border-slate-200">{{ compareProduct.brand || 'SPIT' }}</td>
                    </tr>
                    <tr>
                      <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Mã sản phẩm / SKU</td>
                      <td class="p-3.5 font-mono font-bold text-slate-800 border-l border-slate-200">{{ product.sku || product.id?.substring(0,8).toUpperCase() }}</td>
                      <td class="p-3.5 font-mono font-bold text-slate-800 border-l border-slate-200">{{ compareProduct.sku || compareProduct.id?.substring(0,8).toUpperCase() }}</td>
                    </tr>
                    <tr>
                      <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Tình trạng kho</td>
                      <td class="p-3.5 border-l border-slate-200">
                        <span :class="product.stock > 0 ? 'text-green-600 font-extrabold' : 'text-red-500 font-extrabold'">
                          {{ product.stock > 0 ? `Còn ${product.stock} sp` : 'Hết hàng' }}
                        </span>
                      </td>
                      <td class="p-3.5 border-l border-slate-200">
                        <span :class="compareProduct.stock > 0 ? 'text-green-600 font-extrabold' : 'text-red-500 font-extrabold'">
                          {{ compareProduct.stock > 0 ? `Còn ${compareProduct.stock} sp` : 'Hết hàng' }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Catalog / PDF</td>
                      <td class="p-3.5 border-l border-slate-200">
                        <a v-if="product.catalog_link" :href="product.catalog_link" target="_blank" class="text-blue-600 font-bold hover:underline">📄 Xem File Catalog</a>
                        <span v-else class="text-slate-300 italic">Không có</span>
                      </td>
                      <td class="p-3.5 border-l border-slate-200">
                        <a v-if="compareProduct.catalog_link" :href="compareProduct.catalog_link" target="_blank" class="text-blue-600 font-bold hover:underline">📄 Xem File Catalog</a>
                        <span v-else class="text-slate-300 italic">Không có</span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- CONTAINER TRANG CHI TIẾT SẢN PHẨM -->
    <div class="container mx-auto max-w-6xl py-10 md:py-16 px-4 sm:px-6">
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 mb-10">
        
        <!-- Cột hình ảnh -->
        <div class="lg:sticky lg:top-24 space-y-5 w-full">
          <div class="relative bg-[#f8fafc] p-8 md:p-12 rounded-4xl border border-slate-100 flex items-center justify-center aspect-square shadow-inner overflow-hidden group">
            <div v-if="hasPromo()" class="absolute top-5 left-5 z-10 text-white font-black text-[10px] tracking-wider px-3 py-1.5 rounded-xl shadow-md uppercase" :class="effectivePromo.label === 'CAMPAIGN' ? 'bg-linear-to-r from-orange-500 to-amber-500' : 'bg-linear-to-r from-red-600 to-red-500'">
              🔥 {{ effectivePromo.label }} {{ effectivePromo.type === 'percentage' ? `-${effectivePromo.value}%` : 'OFF' }}
            </div>
            <img :src="activeImage" @click="isZoomed = true" class="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out cursor-zoom-in" title="Bấm để phóng to ảnh" />
          </div>

          <div v-if="product.sub_images && product.sub_images.length > 0" class="flex flex-wrap gap-3 px-1 justify-center lg:justify-start">
            <div @click="activeImage = product.image" :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === product.image ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="product.image" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" />
            </div>
            <div v-for="(subImg, index) in product.sub_images" :key="index" @click="activeImage = subImg" :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === subImg ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="subImg" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" />
            </div>
          </div>
        </div>
        
        <!-- Cột thông tin sản phẩm -->
        <div class="space-y-6">
          <div>
            <div class="flex flex-wrap gap-2 items-center mb-4">
              <span class="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{{ product.brand || 'SPIT' }}</span>
              <span class="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">MÃ SP: {{ product.sku || product.id?.substring(0,7).toUpperCase() }}</span>
              <span v-if="product.stock > 0" class="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {{ locale === 'vi' ? `CÒN HÀNG: ${product.stock}` : `IN STOCK: ${product.stock}` }}
              </span>
              <span v-else class="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {{ locale === 'vi' ? 'TẠM HẾT HÀNG' : 'OUT OF STOCK' }}
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 uppercase leading-tight tracking-tight mb-2">
              {{ product[`name_${locale}`] || product.name }}
            </h1>
            <p class="text-red-600 font-extrabold uppercase text-[10px] tracking-widest border-b border-slate-100 pb-4">
              {{ product[`category_${locale}`] || product.category }}
            </p>
          </div>
          
          <div class="p-6 sm:p-8 rounded-4xl border transition-all duration-500" :class="hasPromo() ? 'bg-red-50/50 border-red-100' : 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'">
            <div class="flex flex-col gap-1">
              <div v-if="hasPromo()" class="text-slate-400 font-bold text-xs sm:text-sm line-through opacity-70">
                {{ cleanNumber(product.price).toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ</span>
              </div>
              <div class="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-baseline gap-1.5" :class="hasPromo() ? 'text-primary' : 'text-white'">
                {{ getDiscountedPrice(product).toLocaleString('vi-VN') }} 
                <span class="text-xs sm:text-sm font-extrabold opacity-50 uppercase shrink-0">VNĐ</span>
              </div>
            </div>
          </div>

          <!-- NÚT MUA HÀNG VÀ SO SÁNH -->
          <div class="space-y-3">
            <button @click="addToCart(product)" :disabled="isAdding || product.stock <= 0" class="group w-full relative overflow-hidden py-5 rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-[0.98]" :class="product.stock > 0 ? 'bg-slate-950 text-white shadow-slate-950/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
              <span v-if="product.stock > 0" class="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <span class="relative z-10 tracking-[0.2em] flex items-center justify-center gap-2">
                {{ isAdding ? '...' : (product.stock > 0 ? (locale === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to cart') : 'Hết hàng tạm thời') }}
              </span>
            </button>

            <a v-if="product.catalog_link" :href="product.catalog_link" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950 active:scale-[0.98]">
              <span class="tracking-[0.2em]">{{ locale === 'vi' ? 'Xem Catalog / Tài liệu' : 'View Catalog / Specs' }}</span>
            </a>

            <!-- NÚT SO SÁNH -->
            <button @click="openCompareModal" class="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 border-slate-900 bg-slate-900 text-white hover:bg-red-600 hover:border-red-600 active:scale-[0.98] shadow-md shadow-slate-900/10">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              <span class="tracking-[0.2em]">{{ locale === 'vi' ? 'So sánh thông số kỹ thuật' : 'Compare Specifications' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- TABS MÔ TẢ & ĐẶC TÍNH -->
      <div class="bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 min-h-100">
        <div class="flex flex-wrap gap-3 mb-8 border-b border-slate-100 pb-5">
          <button @click="activeTab = 'description'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all" :class="activeTab === 'description' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'">
            {{ locale === 'vi' ? 'Mô tả chi tiết' : 'Description' }}
          </button>
          <button @click="activeTab = 'features'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all" :class="activeTab === 'features' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'">
            {{ locale === 'vi' ? 'Đặc tính & Thông số' : 'Features & Specs' }}
          </button>
        </div>

        <div class="w-full">
          <div v-if="activeTab === 'description'" class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium raw-html-content" v-html="product[`description_${locale}`] || product.description || 'Chưa có thông tin.'"></div>
          <div v-else-if="activeTab === 'features'" class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium raw-html-content" v-html="product[`specifications_${locale}`] || product.specifications || product[`features_${locale}`] || product.features || 'Chưa có thông số.'"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease-in-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.raw-html-content :deep(p) { margin-bottom: 0.5rem; }
.raw-html-content :deep(ul) { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; }
.raw-html-content :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
.raw-html-content :deep(td), .raw-html-content :deep(th) { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; }
</style>