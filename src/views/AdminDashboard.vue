<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase' 
import AdminSidebar from '../components/AdminSidebar.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RevenueChart from '../components/RevenueChart.vue'
import OrderDetailModal from '../components/OrderDetailModal.vue' 
import * as XLSX from 'xlsx'

// --- TRẠNG THÁI DỮ LIỆU ---
const orders = ref([])
const products = ref([])
const contacts = ref([])
const activeTab = ref('orders')
const isLoading = ref(true)
const searchQuery = ref('')

// TRẠNG THÁI MODAL CHI TIẾT
const selectedContact = ref(null)
const selectedOrder = ref(null) 
const isModalOpen = ref(false)
const isOrderModalOpen = ref(false) 

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// --- LOGIC MODAL ---
const openContactDetail = (item) => {
  selectedContact.value = item
  isModalOpen.value = true
}

const openOrderDetail = (order) => {
  selectedOrder.value = order
  isOrderModalOpen.value = true
}

const closeDetail = () => {
  isModalOpen.value = false
  isOrderModalOpen.value = false 
  setTimeout(() => { 
    selectedContact.value = null 
    selectedOrder.value = null 
  }, 300)
}

// --- FETCH DATA ---
const fetchData = async () => {
  try {
    isLoading.value = true
    const [ordersSnap, productsSnap, contactsSnap] = await Promise.all([
      getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
      getDocs(collection(db, "products")),
      getDocs(query(collection(db, "contacts"), orderBy("createdAt", "desc")))
    ])
    orders.value = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    products.value = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    contacts.value = contactsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    showToast("Lỗi tải dữ liệu!", "error")
  } finally {
    isLoading.value = false
  }
}

// --- LOGIC XỬ LÝ BẢN VẼ ---
const viewBlueprint = (url) => {
  if (!url) return showToast("Không có bản vẽ!", "error")
  window.open(url, '_blank')
}

const downloadBlueprint = async (url, customerName) => {
  if (!url) return
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `SPIT_BanVe_${customerName || 'KhachHang'}.jpg`
    link.click()
    URL.revokeObjectURL(blobUrl)
    showToast("Đang tải bản vẽ...")
  } catch (e) { 
    showToast("Lỗi khi tải file!", "error") 
  }
}

// --- BỘ LỌC & THỐNG KÊ ---
const filteredOrders = computed(() => {
  return orders.value.filter(order => 
    order.customerName?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    order.phone?.includes(searchQuery.value) ||
    order.orderCode?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const conversionRate = computed(() => {
  if (contacts.value.length === 0) return 0
  const successfulOrders = orders.value.filter(o => o.status !== 'pending').length
  return ((successfulOrders / contacts.value.length) * 100).toFixed(1)
})

const totalRevenue = computed(() => {
  return orders.value
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0)
})

const monthlyRevenueData = computed(() => {
  const revenueArray = new Array(12).fill(0)
  orders.value.forEach(order => {
    if (order.status === 'completed' && order.totalPrice) {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
      const month = date.getMonth()
      revenueArray[month] += Number(order.totalPrice)
    }
  })
  return {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      backgroundColor: '#10b981',
      borderRadius: 8,
      data: revenueArray
    }]
  }
})

const lowStock = computed(() => products.value.filter(p => p.stock <= 5))

const topProducts = computed(() => {
  const counts = {}
  orders.value.forEach(order => {
    const pName = order.productName || order.name || (order.items && order.items[0]?.name)
    if (pName) {
      counts[pName] = (counts[pName] || 0) + 1
    }
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
})

// --- CÁC HÀNH ĐỘNG KHÁC ---
const exportToExcel = (data, fileName) => {
  if (data.length === 0) return showToast("Không có dữ liệu!", "error")
  const cleanData = data.map(({ id, createdAt, items, ...rest }) => ({
    'ID': id,
    'Ngày': createdAt?.toDate().toLocaleString('vi-VN') || '',
    'Khách hàng': rest.customerName || rest.name || '',
    'SĐT': rest.phone || '',
    'Email': rest.email || rest.contractEmail || '',
    'Công ty': rest.companyName || '',
    'Địa chỉ': rest.companyAddress || '',
    'Sản phẩm': rest.productName || ''
  }))
  const worksheet = XLSX.utils.json_to_sheet(cleanData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
  XLSX.writeFile(workbook, `SPIT_${fileName}_${new Date().getTime()}.xlsx`)
  showToast("Đã xuất báo cáo! 📊")
}

const sendQuickEmail = (item) => {
  const email = item.email || item.contractEmail
  if (email) {
    const subject = encodeURIComponent(`[SPIT Vietnam] Phản hồi yêu cầu tư vấn`)
    const body = encodeURIComponent(`Chào ${item.name},\n\nChúng tôi đã nhận được yêu cầu về sản phẩm ${item.productName || ''} của bạn...\n\nTrân trọng!`)
    window.location.href = `mailto:${email}?subject=${subject}?body=${body}`
  } else {
    if (confirm("Gọi điện cho " + item.name + "?")) window.location.href = `tel:${item.phone}`
  }
}

const updateStock = async (productId, newStock) => {
  try {
    const val = parseInt(newStock); if (isNaN(val)) return
    await updateDoc(doc(db, "products", productId), { stock: val })
    showToast("Cập nhật kho thành công!"); fetchData()
  } catch (e) { showToast("Lỗi!", "error") }
}

const updateStatus = async (id, next) => {
  try { 
    await updateDoc(doc(db, "orders", id), { status: next })
    await fetchData()
    showToast("Cập nhật trạng thái thành công!") 
  } catch (e) { showToast("Lỗi!", "error") }
}

const deleteOrder = async (id, name) => { 
  if (confirm(`Xóa đơn của ${name}?`)) { 
    try {
      await deleteDoc(doc(db, "orders", id))
      await fetchData()
      showToast("Đã xóa đơn hàng!") 
    } catch (e) { showToast("Lỗi!", "error") }
  } 
}

const deleteContact = async (id, name) => {
  if (confirm(`Xóa yêu cầu tư vấn của ${name}?`)) {
    try {
      await deleteDoc(doc(db, "contacts", id))
      await fetchData()
      showToast("Đã xóa yêu cầu!")
      if (isModalOpen.value) closeDetail()
    } catch (e) { showToast("Lỗi khi xóa!", "error") }
  }
}

const updateContactStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "contacts", id), { status: status })
    if (selectedContact.value && selectedContact.value.id === id) {
      selectedContact.value.status = status
    }
    await fetchData() 
    showToast("Đã cập nhật trạng thái tư vấn!")
  } catch (e) {
    showToast("Lỗi cập nhật!", "error")
  }
}

const getContactStatusBadge = (status) => {
  const badges = {
    new: "bg-blue-50 text-blue-600 border-blue-200",
    processing: "bg-amber-50 text-amber-600 border-amber-200",
    quoted: "bg-purple-50 text-purple-600 border-purple-200",
    closed: "bg-emerald-50 text-emerald-600 border-emerald-200"
  }
  return badges[status] || "bg-slate-50 text-slate-500 border-slate-200"
}

const handleClearData = async () => {
  if (activeTab.value === 'orders') {
    const completed = orders.value.filter(o => o.status === 'completed')
    if (completed.length === 0) return showToast("Không có đơn hoàn tất", "error")
    if (confirm(`Dọn dẹp ${completed.length} đơn hàng đã hoàn tất?`)) {
      const batch = writeBatch(db)
      completed.forEach(o => batch.delete(doc(db, "orders", o.id)))
      await batch.commit(); await fetchData(); showToast("Sạch sẽ! ✨")
    }
  } else {
    if (contacts.value.length === 0) return showToast("Hòm thư đã trống", "error")
    if (confirm(`Bạn có chắc muốn xóa TẤT CẢ ${contacts.value.length} thư tư vấn?`)) {
      const batch = writeBatch(db)
      contacts.value.forEach(c => batch.delete(doc(db, "contacts", c.id)))
      await batch.commit(); await fetchData(); showToast("Đã dọn sạch thư rác! 🧹")
    }
  }
}

const getStatusBadge = (status) => {
  const badges = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    confirmed: "bg-blue-50 text-blue-600 border-blue-200",
    shipping: "bg-purple-50 text-purple-600 border-purple-200",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-200"
  }
  return badges[status] || "bg-slate-50 text-slate-500 border-slate-200"
}

onMounted(fetchData)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans relative">
    <AdminSidebar />
    
    <Transition name="fade">
      <OrderDetailModal 
        v-if="isOrderModalOpen && selectedOrder" 
        :order="selectedOrder" 
        @close="closeDetail" 
      />
    </Transition>

    <Transition name="toast">
      <div v-if="toast.show" :class="['fixed top-10 right-10 z-120 px-6 py-4 rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 border-b-4 bg-white', toast.type === 'success' ? 'text-emerald-600 border-emerald-500' : 'text-red-600 border-red-500']">
        <span>{{ toast.type === 'success' ? '✅' : '⚠️' }}</span> {{ toast.message }}
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="isModalOpen && selectedContact" class="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
          <div class="bg-slate-900 p-8 text-white flex justify-between items-center">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-black uppercase italic tracking-tighter">Yêu cầu từ: {{ selectedContact.name }}</h2>
                <span :class="['text-[9px] px-2 py-0.5 rounded-full font-black uppercase border', getContactStatusBadge(selectedContact.status || 'new')]">
                   {{ 
                    selectedContact.status === 'processing' ? 'Đang xử lý' : 
                    selectedContact.status === 'quoted' ? 'Đã báo giá' : 
                    selectedContact.status === 'closed' ? 'Hoàn tất' : 'Mới' 
                  }}
                </span>
              </div>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{{ selectedContact.id.slice(0,8) }}</p>
            </div>
            <button @click="closeDetail" class="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all text-xl">✕</button>
          </div>

          <div class="p-8 max-h-[60vh] overflow-y-auto custom-scroll grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-blue-600 uppercase border-b pb-2">👤 Thông tin khách</h3>
              <div><p class="text-[9px] text-slate-400 font-black uppercase">Họ và tên</p><p class="text-sm font-black text-slate-800">{{ selectedContact.name }}</p></div>
              <div><p class="text-[9px] text-slate-400 font-black uppercase">Số điện thoại</p><p class="text-sm font-black text-blue-600">{{ selectedContact.phone }}</p></div>
              <div><p class="text-[9px] text-slate-400 font-black uppercase">Email</p><p class="text-sm font-bold text-slate-700">{{ selectedContact.email || 'N/A' }}</p></div>
              <div v-if="selectedContact.companyAddress"><p class="text-[9px] text-slate-400 font-black uppercase">Địa chỉ công ty</p><p class="text-[11px] font-bold text-slate-600 leading-tight">{{ selectedContact.companyAddress }}</p></div>
            </div>

            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-emerald-600 uppercase border-b pb-2">⚙️ Chi tiết sản phẩm</h3>
              <div><p class="text-[9px] text-slate-400 font-black uppercase">Tên sản phẩm</p><p class="text-sm font-black text-slate-800">{{ selectedContact.productName || 'N/A' }}</p></div>
              <div class="flex gap-8">
                <div><p class="text-[9px] text-slate-400 font-black uppercase">Số lượng</p><p class="text-sm font-black text-red-600">{{ selectedContact.quantity || '0' }}</p></div>
                <div><p class="text-[9px] text-slate-400 font-black uppercase">Thời gian yêu cầu</p><p class="text-sm font-black text-blue-600">{{ selectedContact.deadline || 'Sớm nhất' }}</p></div>
              </div>
              <div>
                <p class="text-[9px] text-slate-400 font-black uppercase">Vật liệu</p>
                <p class="text-sm font-black text-slate-800">{{ selectedContact.material || 'N/A' }}</p>
              </div>
            </div>

            <div v-if="selectedContact.companyName" class="md:col-span-2 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
              <p class="text-[9px] text-blue-400 font-black uppercase mb-1">🏢 Doanh nghiệp</p>
              <p class="text-xs font-black text-slate-800 uppercase">{{ selectedContact.companyName }}</p>
              <p v-if="selectedContact.taxCode" class="text-[10px] font-bold text-slate-500 mt-1 italic">
                MST: {{ selectedContact.taxCode }}
              </p>
            </div>

            <div class="md:col-span-2 bg-slate-50 p-6 rounded-3xl">
              <p class="text-[9px] text-slate-400 font-black uppercase mb-2">Nội dung yêu cầu</p>
              <p class="text-xs font-medium text-slate-700 leading-relaxed italic whitespace-pre-line">
                "{{ selectedContact.message || 'Không có ghi chú thêm.' }}"
              </p>
            </div>
          </div>

          <div class="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-2 items-center overflow-x-auto">
            <span class="text-[9px] font-black uppercase text-slate-400 mr-2 shrink-0">Cập nhật:</span>
            <button @click="updateContactStatus(selectedContact.id, 'processing')" 
                    class="px-3 py-2 bg-white border border-amber-200 text-amber-600 text-[9px] font-black uppercase rounded-xl hover:bg-amber-50 shrink-0 shadow-sm">
              Đang liên hệ
            </button>
            <button @click="updateContactStatus(selectedContact.id, 'quoted')" 
                    class="px-3 py-2 bg-white border border-purple-200 text-purple-600 text-[9px] font-black uppercase rounded-xl hover:bg-purple-50 shrink-0 shadow-sm">
              Đã báo giá
            </button>
            <button @click="updateContactStatus(selectedContact.id, 'closed')" 
                    class="px-3 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-emerald-700 shrink-0 shadow-md">
              Hoàn tất
            </button>
          </div>

          <div class="p-8 bg-white flex flex-wrap gap-3 justify-between border-t border-slate-100">
            <div class="flex gap-2">
              <button @click="deleteContact(selectedContact.id, selectedContact.name)" class="px-4 py-3 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-2xl hover:bg-red-500 hover:text-white">Xóa 🗑️</button>
              <button v-if="selectedContact.drawingUrl" @click="viewBlueprint(selectedContact.drawingUrl)" class="px-6 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-2xl">👁️ Xem bản vẽ</button>
              <button v-if="selectedContact.drawingUrl" @click="downloadBlueprint(selectedContact.drawingUrl, selectedContact.name)" class="px-6 py-3 bg-blue-500 text-white text-[10px] font-black uppercase rounded-2xl">📥 Tải</button>
            </div>
            <button @click="sendQuickEmail(selectedContact)" class="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg">Phản hồi 📧</button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-12 transition-all">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 class="text-3xl font-black text-slate-900 uppercase italic">Quản Lý Hệ Thống</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bảng điều khiển: SPIT Vietnam</p>
          </div>
          <div class="flex gap-3">
            <input v-model="searchQuery" type="text" placeholder="Tìm kiếm nhanh..." class="text-[10px] font-bold px-4 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 ring-blue-500 w-64 bg-white" />
            <button @click="exportToExcel(activeTab === 'orders' ? filteredOrders : contacts, activeTab)" class="text-[9px] font-black text-emerald-600 uppercase italic bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:bg-emerald-500 hover:text-white">📥 Xuất Excel</button>
            <button @click="handleClearData" class="text-[9px] font-black text-red-500 uppercase italic bg-red-50 px-4 py-2 rounded-full border border-red-100 hover:bg-red-500 hover:text-white">Dọn dẹp</button>
          </div>
        </div>

        <div v-if="isLoading" class="p-20 flex justify-center"><LoadingSpinner /></div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
              <h3 class="text-[9px] font-black uppercase opacity-60 mb-2 italic tracking-widest">Doanh thu (Đã xong)</h3>
              <div class="text-2xl font-black italic text-emerald-400">{{ totalRevenue.toLocaleString() }}đ</div>
              <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between items-end">
                <div><p class="text-[8px] font-black uppercase opacity-40">Tỷ lệ chốt</p><p class="text-lg font-black text-blue-400">{{ conversionRate }}%</p></div>
                <div class="text-[20px]">📊</div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="text-slate-900 font-black uppercase text-[10px] mb-4 italic flex justify-between">
                📈 Biến động doanh thu 
                <span class="text-[8px] text-slate-400 font-normal">Theo tháng</span>
              </h3>
              <RevenueChart :chartData="monthlyRevenueData" />
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="text-red-600 font-black uppercase text-[10px] mb-4 italic">⚠️ Cảnh báo tồn kho</h3>
              <div class="max-h-40 overflow-y-auto pr-2 custom-scroll">
                <div v-for="p in lowStock" :key="p.id" class="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2 text-[10px] font-bold">
                  <span class="truncate w-24">{{ p.name }}</span> 
                  <input type="number" v-model="p.stock" @change="updateStock(p.id, p.stock)" class="w-12 bg-white border border-slate-200 rounded text-center text-red-600 font-black" />
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="text-blue-600 font-black uppercase text-[10px] mb-4 italic">🏆 Sản phẩm tiêu biểu</h3>
              <div class="space-y-4">
                <div v-for="(p, index) in topProducts" :key="index" class="flex items-center gap-3">
                  <span class="text-xs font-black text-slate-300">0{{ index + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black uppercase text-slate-700 truncate">{{ p.name }}</p>
                    <div class="w-full bg-slate-100 h-1 rounded-full mt-1">
                      <div class="bg-blue-500 h-1 rounded-full transition-all duration-500" :style="{ width: Math.min(p.count * 20, 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
                <p v-if="topProducts.length === 0" class="text-[8px] text-slate-400 text-center font-bold italic uppercase">Chưa có dữ liệu bán</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3 space-y-6">
            <div class="bg-white p-2 rounded-4xl shadow-sm border border-slate-100 flex gap-2">
              <button @click="activeTab = 'orders'" :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all', activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50']">📦 Đơn hàng ({{ orders.length }})</button>
              <button @click="activeTab = 'contacts'" :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all', activeTab === 'contacts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50']">📩 Tư vấn ({{ contacts.length }})</button>
            </div>

            <div v-if="activeTab === 'orders'" class="space-y-4">
              <div v-for="order in filteredOrders" :key="order.id" @click="openOrderDetail(order)" class="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all group shadow-sm cursor-pointer">
                <div class="flex flex-wrap justify-between items-start gap-4">
                  <div class="flex gap-4">
                    <div :class="getStatusBadge(order.status)" class="w-12 h-12 flex items-center justify-center rounded-2xl text-xl shrink-0 border font-black italic uppercase">
                      {{ order.status === 'completed' ? '✅' : '⏳' }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-xs font-black text-slate-800 uppercase italic">{{ order.customerName }}</h4>
                        <span class="px-2 py-0.5 bg-blue-100 text-[8px] font-black text-blue-600 rounded italic">SL: {{ order.quantity || 1 }}</span>
                        <span v-if="order.companyName" class="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-black italic">B2B</span>
                      </div>
                      <p class="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{{ order.phone }} • {{ order.createdAt?.toDate().toLocaleString('vi-VN') }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-black text-red-600">{{ Number(order.totalPrice || 0).toLocaleString() }}đ</div>
                    <div class="flex gap-2 mt-3 justify-end">
                      <button v-if="order.status === 'pending'" @click.stop="updateStatus(order.id, 'confirmed')" class="text-[9px] font-black text-blue-600 uppercase border border-blue-600 px-3 py-1.5 rounded-lg">Duyệt</button>
                      <button v-if="order.status === 'confirmed'" @click.stop="updateStatus(order.id, 'shipping')" class="text-[9px] font-black text-purple-600 uppercase border border-purple-600 px-3 py-1.5 rounded-lg">Giao</button>
                      <button v-if="order.status === 'shipping'" @click.stop="updateStatus(order.id, 'completed')" class="text-[9px] font-black text-emerald-600 uppercase border border-emerald-600 px-3 py-1.5 rounded-lg">Xong</button>
                      <button @click.stop="deleteOrder(order.id, order.customerName)" class="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'contacts'" class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table class="w-full text-left">
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="item in contacts" :key="item.id" @click="openContactDetail(item)" class="hover:bg-blue-50/50 group transition-all cursor-pointer">
                    <td class="p-6">
                      <div class="flex items-center gap-2">
                        <div class="text-[11px] font-black text-slate-800 uppercase italic">{{ item.name }}</div>
                        <span :class="['text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border', getContactStatusBadge(item.status || 'new')]">
                          {{ 
                            item.status === 'processing' ? 'Đang xử lý' : 
                            item.status === 'quoted' ? 'Đã báo giá' : 
                            item.status === 'closed' ? 'Hoàn tất' : 'Mới' 
                          }}
                        </span>
                      </div>
                      <div class="text-[10px] font-bold text-blue-600 mt-1">{{ item.phone }}</div>
                    </td>
                    <td class="p-6 max-w-xs">
                       <p class="text-[10px] font-black text-slate-800 truncate">{{ item.productName || 'Yêu cầu gia công' }}</p>
                       <p class="text-[9px] font-medium text-slate-400 italic mt-1 truncate">{{ item.message }}</p>
                    </td>
                    <td class="p-6 text-right flex items-center justify-end gap-3">
                       <span class="text-[8px] text-slate-300 font-bold uppercase">{{ item.createdAt?.toDate().toLocaleString('vi-VN') }}</span>
                       <button @click.stop="deleteContact(item.id, item.name)" class="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slide-up { animation: slide-up 0.4s ease-out; }
</style>