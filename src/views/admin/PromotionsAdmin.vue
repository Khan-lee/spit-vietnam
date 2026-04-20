<script setup>
import { ref, onMounted } from 'vue'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'

// State quản lý dữ liệu
const promotions = ref([])
const products = ref([])
const loading = ref(false)

// State cho Form thêm mới (ĐÃ THÊM: start_date, end_date)
const newPromo = ref({
  title: '',
  discount_type: 'percentage', // percentage hoặc fixed_amount
  discount_value: 0,
  apply_to: 'specific_products', // all, specific_products
  applied_ids: [],
  start_date: '', // THÊM MỚI
  end_date: '',   // THÊM MỚI
  is_active: true
})

// 1. Lấy danh sách sản phẩm để chọn (Multi-select)
const fetchProducts = async () => {
  const snap = await getDocs(collection(db, "products"))
  products.value = snap.docs.map(d => ({ id: d.id, name: d.data().name_vi || d.data().name }))
}

// 2. Lấy danh sách khuyến mãi hiện có
const fetchPromotions = async () => {
  loading.value = true
  try {
    const q = query(collection(db, "promotions"), orderBy("created_at", "desc"))
    const snap = await getDocs(q)
    promotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Lỗi lấy danh sách:", e)
  }
  loading.value = false
}

// 3. Xử lý thêm khuyến mãi
const handleAddPromo = async () => {
  // THÊM KIỂM TRA THỜI GIAN
  if (!newPromo.value.title || newPromo.value.discount_value <= 0 || !newPromo.value.start_date || !newPromo.value.end_date) {
    alert("Vui lòng nhập đầy đủ thông tin và chọn thời gian!")
    return
  }

  try {
    await addDoc(collection(db, "promotions"), {
      ...newPromo.value,
      created_at: new Date()
    })
    alert("🎉 Tạo chiến dịch khuyến mãi thành công!")
    
    // Reset form
    newPromo.value = {
      title: '',
      discount_type: 'percentage',
      discount_value: 0,
      apply_to: 'specific_products',
      applied_ids: [],
      start_date: '',
      end_date: '',
      is_active: true
    }
    
    fetchPromotions() // Refresh danh sách
  } catch (e) {
    console.error("Lỗi:", e)
    alert("Lỗi khi tạo: " + e.message)
  }
}

// 4. Bật/Tắt khuyến mãi nhanh
const toggleStatus = async (promo) => {
  const promoRef = doc(db, "promotions", promo.id)
  await updateDoc(promoRef, { is_active: !promo.is_active })
  fetchPromotions()
}

// 5. Xóa khuyến mãi
const handleDelete = async (id) => {
  if(confirm("Bạn có chắc muốn xóa khuyến mãi này?")) {
    await deleteDoc(doc(db, 'promotions', id))
    fetchPromotions()
  }
}

onMounted(() => {
  fetchProducts()
  fetchPromotions()
})
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <h1 class="text-2xl font-black italic uppercase text-slate-800 mb-8">
      Quản lý <span class="text-red-600">Khuyến mãi</span>
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
        <h2 class="font-bold mb-4">Thiết lập chương trình</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Tên chương trình</label>
            <input v-model="newPromo.title" type="text" class="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="VD: Giảm giá mùa hè">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase">Ngày bắt đầu</label>
              <input v-model="newPromo.start_date" type="datetime-local" class="w-full mt-1 p-2 border rounded-lg text-[11px]">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase">Ngày kết thúc</label>
              <input v-model="newPromo.end_date" type="datetime-local" class="w-full mt-1 p-2 border rounded-lg text-[11px]">
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase">Loại giảm</label>
              <select v-model="newPromo.discount_type" class="w-full mt-1 p-2 border rounded-lg text-sm">
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed_amount">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase">Giá trị</label>
              <input v-model="newPromo.discount_value" type="number" class="w-full mt-1 p-2 border rounded-lg text-sm">
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Sản phẩm áp dụng</label>
            <select v-model="newPromo.applied_ids" multiple class="w-full mt-1 p-2 border rounded-lg text-sm h-32">
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <p class="text-[10px] text-slate-400 mt-1">* Giữ Ctrl để chọn nhiều sản phẩm</p>
          </div>

          <button @click="handleAddPromo" class="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors uppercase text-xs tracking-widest">
            TẠO CHIẾN DỊCH
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div v-if="loading" class="text-center py-10 text-slate-400 animate-pulse">Đang tải...</div>
        
        <div v-else v-for="promo in promotions" :key="promo.id" 
             class="bg-white p-5 rounded-2xl border flex items-center justify-between transition-all"
             :class="promo.is_active ? 'border-l-4 border-l-green-500' : 'opacity-60 border-slate-200'">
          <div>
            <h3 class="font-bold text-slate-800">{{ promo.title }}</h3>
            <p class="text-xs text-slate-500">
              Giảm: <span class="font-bold text-red-600">{{ promo.discount_value }}{{ promo.discount_type === 'percentage' ? '%' : 'đ' }}</span>
              | Đối tượng: {{ promo.applied_ids?.length || 0 }} sản phẩm
            </p>
            <p v-if="promo.start_date" class="text-[10px] text-slate-400 mt-1 italic">
              Lịch chạy: {{ new Date(promo.start_date).toLocaleString() }} - {{ new Date(promo.end_date).toLocaleString() }}
            </p>
          </div>
          
          <div class="flex items-center gap-4">
            <button @click="toggleStatus(promo)" 
                    class="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                    :class="promo.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
              {{ promo.is_active ? 'Đang chạy' : 'Đã dừng' }}
            </button>
            <button @click="handleDelete(promo.id)" class="text-slate-300 hover:text-red-600">
              🗑️
            </button>
          </div>
        </div>
        
        <div v-if="promotions.length === 0 && !loading" class="text-center py-20 text-slate-400 italic">
          Chưa có chương trình khuyến mãi nào được tạo.
        </div>
      </div>
    </div>
  </div>
</template>