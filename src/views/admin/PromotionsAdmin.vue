<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'

// State quản lý dữ liệu
const promotions = ref([])
const products = ref([])
const loading = ref(false)

// State tìm kiếm sản phẩm & thông báo Toast
const adminSearchQuery = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

// State cho Form thêm mới (Đã update mảng tiers)
const newPromo = ref({
  title: '',
  apply_to: 'specific_products', 
  applied_ids: [],
  start_date: '', 
  end_date: '',   
  is_active: true,
  // Thêm mảng chứa các mốc số lượng, mặc định có 1 mốc trống
  tiers: [
    { quantity: 1, discount_type: 'percentage', discount_value: 0 }
  ]
})

// Các hàm xử lý mốc số lượng (Tiers)
const addTier = () => {
  newPromo.value.tiers.push({ quantity: 1, discount_type: 'percentage', discount_value: 0 })
}

const removeTier = (index) => {
  newPromo.value.tiers.splice(index, 1)
}

// Kích hoạt thông báo Toast UI
const triggerToast = (message, type = 'success') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3500)
}

// Lấy danh sách sản phẩm
const fetchProducts = async () => {
  try {
    const snap = await getDocs(collection(db, "products"))
    products.value = snap.docs.map(d => ({ 
      id: d.id, 
      name: d.data().name_vi || d.data().name,
      brand: d.data().brand || ''
    }))
  } catch (e) {
    console.error(e)
  }
}

// Lọc sản phẩm trong ô chọn
const filteredAdminProducts = computed(() => {
  const queryText = adminSearchQuery.value.toLowerCase().trim()
  if (!queryText) return products.value
  
  return products.value.filter(p => 
    p.name.toLowerCase().includes(queryText) || 
    p.brand.toLowerCase().includes(queryText)
  )
})

// Tìm tên sản phẩm từ ID để hiển thị các tag đã chọn
const getSelectedProductsDetails = computed(() => {
  return products.value.filter(p => newPromo.value.applied_ids.includes(p.id))
})

// Gỡ nhanh sản phẩm ra khỏi danh sách áp dụng
const removeAppliedId = (id) => {
  newPromo.value.applied_ids = newPromo.value.applied_ids.filter(item => item !== id)
}

// Lấy danh sách khuyến mãi
const fetchPromotions = async () => {
  loading.value = true
  try {
    const q = query(collection(db, "promotions"), orderBy("created_at", "desc"))
    const snap = await getDocs(q)
    promotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Lỗi lấy danh sách:", e)
    triggerToast("Không thể tải danh sách khuyến mãi", "error")
  }
  loading.value = false
}

// Hàm tính toán trạng thái thực tế dựa trên thời gian thực
const getPromoStatus = (promo) => {
  if (!promo.is_active) return { text: 'Đã dừng', color: 'bg-slate-100 text-slate-600 border-slate-200' }
  
  const now = new Date()
  const start = new Date(promo.start_date)
  const end = new Date(promo.end_date)
  
  if (now < start) return { text: 'Sắp diễn ra', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (now > end) return { text: 'Quá hạn', color: 'bg-rose-50 text-rose-600 border-rose-200' }
  return { text: 'Đang chạy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

// Thống kê nhanh chỉ số ở đầu Dashboard
const analytics = computed(() => {
  const now = new Date()
  let active = 0
  let expired = 0
  
  promotions.value.forEach(p => {
    if (p.is_active) {
      if (now > new Date(p.end_date)) expired++
      else if (now >= new Date(p.start_date)) active++
    }
  })
  
  return {
    total: promotions.value.length,
    active,
    expired
  }
})

// Định dạng tiền tệ cho giá cố định
const formatDiscount = (type, value) => {
  if (type === 'percentage') return `${value}%`
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

// Thêm khuyến mãi mới
const handleAddPromo = async () => {
  if (!newPromo.value.title || !newPromo.value.start_date || !newPromo.value.end_date) {
    triggerToast("Vui lòng điền đủ thông tin và chọn thời gian!", "error")
    return
  }
  
  if (new Date(newPromo.value.start_date) >= new Date(newPromo.value.end_date)) {
    triggerToast("Ngày kết thúc phải sau ngày bắt đầu!", "error")
    return
  }

  // Validate các mốc số lượng (không được rỗng, số lượng >= 1, giá trị > 0)
  const invalidTier = newPromo.value.tiers.find(t => t.quantity < 1 || t.discount_value <= 0)
  if (invalidTier || newPromo.value.tiers.length === 0) {
    triggerToast("Vui lòng nhập đầy đủ số lượng và giá trị giảm hợp lệ cho các mốc!", "error")
    return
  }

  try {
    await addDoc(collection(db, "promotions"), {
      title: newPromo.value.title,
      apply_to: newPromo.value.apply_to,
      applied_ids: newPromo.value.applied_ids,
      start_date: newPromo.value.start_date,
      end_date: newPromo.value.end_date,
      is_active: newPromo.value.is_active,
      tiers: newPromo.value.tiers, // Lưu mảng tiers thay vì 1 giá trị
      created_at: new Date().toISOString()
    })
    triggerToast("Tạo chiến dịch khuyến mãi thành công!")
    
    // Reset Form
    newPromo.value = {
      title: '', apply_to: 'specific_products', applied_ids: [],
      start_date: '', end_date: '', is_active: true,
      tiers: [{ quantity: 1, discount_type: 'percentage', discount_value: 0 }]
    }
    fetchPromotions()
  } catch (e) {
    triggerToast("Lỗi hệ thống: " + e.message, "error")
  }
}

// Bật/Tắt trạng thái hoạt động thủ công
const toggleStatus = async (promo) => {
  try {
    const promoRef = doc(db, "promotions", promo.id)
    await updateDoc(promoRef, { is_active: !promo.is_active })
    triggerToast(`Đã chuyển trạng thái chiến dịch: ${promo.title}`)
    fetchPromotions()
  } catch (e) {
    triggerToast("Lỗi cập nhật trạng thái", "error")
  }
}

// Xóa khuyến mãi kèm hộp thoại confirm ẩn
const activeConfirmId = ref(null)
const askDelete = (id) => { activeConfirmId.value = id }
const cancelDelete = () => { activeConfirmId.value = null }

const confirmDelete = async (id) => {
  try {
    await deleteDoc(doc(db, 'promotions', id))
    triggerToast("Đã xóa chiến dịch khuyến mãi thành công", "success")
    activeConfirmId.value = null
    fetchPromotions()
  } catch (e) {
    triggerToast("Lỗi khi xóa dữ liệu", "error")
  }
}

onMounted(() => {
  fetchProducts()
  fetchPromotions()
})
</script>

<template>
  <div class="p-4 sm:p-8 bg-slate-50 min-h-screen font-sans antialiased">
    
    <transition name="slide-fade">
      <div v-if="toast.show" class="fixed top-6 right-6 z-100 max-w-sm text-white p-4 rounded-xl shadow-xl flex items-center gap-3 border"
           :class="toast.type === 'success' ? 'bg-slate-900 border-slate-800' : 'bg-red-600 border-red-500'">
        <span class="text-sm font-bold shadow-md bg-white/20 w-6 h-6 rounded-lg flex items-center justify-center">
          {{ toast.type === 'success' ? '✓' : '✕' }}
        </span>
        <p class="text-xs font-bold tracking-wide">{{ toast.message }}</p>
      </div>
    </transition>

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-black italic uppercase text-slate-900 tracking-tight">
          Quản lý <span class="text-red-600">Khuyến mãi</span>
        </h1>
        <p class="text-slate-400 text-xs font-semibold mt-1">Cấu hình chiến dịch chiết khấu dụng cụ cắt gọt SPIT</p>
      </div>
      
      <div class="grid grid-cols-3 gap-3 shrink-0">
        <div class="bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-xs text-center">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số</p>
          <p class="text-lg font-black text-slate-800">{{ analytics.total }}</p>
        </div>
        <div class="bg-white px-4 py-2.5 rounded-xl border border-emerald-100 shadow-xs text-center">
          <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Đang chạy</p>
          <p class="text-lg font-black text-emerald-600">{{ analytics.active }}</p>
        </div>
        <div class="bg-white px-4 py-2.5 rounded-xl border border-rose-100 shadow-xs text-center">
          <p class="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Quá hạn</p>
          <p class="text-lg font-black text-rose-600">{{ analytics.expired }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <div class="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 h-fit">
        <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <span class="w-2 h-2 bg-red-600 rounded-full"></span> Thiết lập chương trình
        </h2>
        
        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên chương trình</label>
            <input v-model="newPromo.title" type="text" class="admin-input" placeholder="VD: Giảm giá Insert hợp kim mùa hè">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày bắt đầu</label>
              <input v-model="newPromo.start_date" type="datetime-local" class="admin-input text-xs">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày kết thúc</label>
              <input v-model="newPromo.end_date" type="datetime-local" class="admin-input text-xs">
            </div>
          </div>
          
          <div class="space-y-2 pt-2 border-t border-slate-50">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các mốc giảm giá (Tiers)</label>
              <button type="button" @click="addTier" class="text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md hover:bg-red-100 transition-colors shadow-xs">
                + Thêm mốc
              </button>
            </div>
            
            <div class="space-y-2 max-h-45 overflow-y-auto pr-1">
              <div v-for="(tier, index) in newPromo.tiers" :key="index" class="flex items-center gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200">
                <div class="flex-1 space-y-1">
                  <label class="text-[9px] font-bold text-slate-500">Từ (Sản phẩm)</label>
                  <input v-model="tier.quantity" type="number" min="1" class="admin-input mt-0 py-1.5 px-2 text-xs h-8">
                </div>
                <div class="flex-1 space-y-1">
                  <label class="text-[9px] font-bold text-slate-500">Loại giảm</label>
                  <select v-model="tier.discount_type" class="admin-input mt-0 py-1.5 px-2 text-xs h-8 cursor-pointer">
                    <option value="percentage">%</option>
                    <option value="fixed_amount">VNĐ</option>
                  </select>
                </div>
                <div class="flex-1 space-y-1">
                  <label class="text-[9px] font-bold text-slate-500">Giá trị</label>
                  <input v-model="tier.discount_value" type="number" min="0" class="admin-input mt-0 py-1.5 px-2 text-xs h-8">
                </div>
                <button v-if="newPromo.tiers.length > 1" type="button" @click="removeTier(index)" class="mt-4 text-slate-300 hover:text-red-600 px-1 font-black transition-colors">✕</button>
              </div>
            </div>
          </div>

          <div class="space-y-1 pt-2 border-t border-slate-50">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Sản phẩm áp dụng</span>
              <span v-if="newPromo.applied_ids.length > 0" class="text-red-600 font-bold normal-case">Đã chọn: {{ newPromo.applied_ids.length }}</span>
            </label>
            
            <input 
              v-model="adminSearchQuery" 
              type="text" 
              placeholder="🔍 Tìm nhanh hãng (Norton, Achteck...) hoặc tên..." 
              class="w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-red-500 transition-all placeholder:font-medium placeholder:text-slate-400"
            />

            <select v-model="newPromo.applied_ids" multiple class="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold h-32 focus:border-slate-400 outline-none cursor-pointer">
              <option v-for="p in filteredAdminProducts" :key="p.id" :value="p.id">
                {{ p.brand ? `[${p.brand.toUpperCase()}] ` : '' }}{{ p.name }}
              </option>
            </select>
            <p class="text-[9px] text-slate-400 font-medium italic mt-0.5">* Giữ phím Ctrl / Cmd để chọn nhiều dòng</p>
            
            <div v-if="getSelectedProductsDetails.length > 0" class="mt-2 p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 max-h-24 overflow-y-auto flex flex-wrap gap-1">
              <span v-for="p in getSelectedProductsDetails" :key="p.id" class="inline-flex items-center gap-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                <span class="text-slate-400">{{ p.brand.toUpperCase() }}</span> - {{ p.name }}
                <button type="button" @click="removeAppliedId(p.id)" class="text-slate-400 hover:text-red-600 font-black ml-0.5">✕</button>
              </span>
            </div>
          </div>

          <button @click="handleAddPromo" class="w-full bg-slate-950 text-white font-black py-3.5 rounded-xl hover:bg-red-600 transition-colors uppercase text-[10px] tracking-widest mt-2 shadow-md shadow-slate-900/10 active:scale-[0.99]">
            TẠO CHIẾN DỊCH KHUYẾN MÃI
          </button>
        </div>
      </div>

      <div class="lg:col-span-8 space-y-4">
        <div v-if="loading" class="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold animate-pulse tracking-widest">
          ĐANG TRUY XUẤT DỮ LIỆU FIRESTORE...
        </div>
        
        <div v-else v-for="promo in promotions" :key="promo.id" 
             class="bg-white p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all relative overflow-hidden"
             :class="promo.is_active ? 'border-l-4 border-l-emerald-500 shadow-sm' : 'opacity-65 border-slate-200 bg-slate-50/50'">
          
          <div class="space-y-1.5 max-w-xl">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-black text-slate-900 text-base tracking-tight">{{ promo.title }}</h3>
              
              <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
                    :class="getPromoStatus(promo).color">
                {{ getPromoStatus(promo).text }}
              </span>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              <div class="mb-1 inline-flex items-center">Mức chiết khấu:</div>
              <span v-if="promo.tiers && promo.tiers.length > 0">
                <span v-for="(t, i) in promo.tiers" :key="i" class="font-black text-red-600 bg-red-50 border border-red-100/60 px-2 py-1 rounded-md mr-1 mb-1 inline-block shadow-xs">
                  Mua {{ t.quantity }} ➔ Giảm {{ formatDiscount(t.discount_type, t.discount_value) }}
                </span>
              </span>
              <span v-else class="font-black text-red-600 bg-red-50 border border-red-100/60 px-2 py-1 rounded-md">
                {{ formatDiscount(promo.discount_type, promo.discount_value) }}
              </span>
              
              <span class="mx-2 text-slate-300 hidden sm:inline">|</span> 
              <div class="mt-1 sm:mt-0 sm:inline-block">Áp dụng cho: <span class="font-bold text-slate-800">{{ promo.applied_ids?.length || 0 }} dụng cụ kỹ thuật</span></div>
            </div>
            
            <div v-if="promo.start_date" class="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-200/50 mt-2">
              📅 {{ new Date(promo.start_date).toLocaleString('vi-VN') }} 
              <span class="text-slate-300">➔</span> 
              {{ new Date(promo.end_date).toLocaleString('vi-VN') }}
            </div>
          </div>
          
          <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
            <button @click="toggleStatus(promo)"
                    class="px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    :class="promo.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'">
              {{ promo.is_active ? 'Dừng chạy' : 'Kích hoạt' }}
            </button>
            
            <div v-if="activeConfirmId === promo.id" class="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1 rounded-lg">
              <button @click="confirmDelete(promo.id)" class="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-md">Xóa</button>
              <button @click="cancelDelete" class="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md">Hủy</button>
            </div>
            <button v-else @click="askDelete(promo.id)" class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              🗑️
            </button>
          </div>
        </div>
        
        <div v-if="promotions.length === 0 && !loading" class="text-center py-20 bg-white rounded-2xl border border-slate-200/60 text-slate-400 italic text-sm font-medium">
          Chưa có chiến dịch khuyến mãi nào được cấu hình trong hệ thống Firestore.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../style.css";

.admin-input {
  @apply w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 ring-slate-900/5 transition-all outline-none;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>