<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import AdminSidebar from '../components/AdminSidebar.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import * as XLSX from 'xlsx'

// --- TRẠNG THÁI DỮ LIỆU ---
const orders = ref([])
const products = ref([])
const contacts = ref([])
const activeTab = ref('orders')
const isLoading = ref(true)
const searchQuery = ref('')

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// --- LOGIC VIỆT HÓA & UI ---
const getStatusLabel = (status) => {
  const labels = { 'pending': 'Chờ duyệt', 'confirmed': 'Đã xác nhận', 'shipping': 'Đang giao', 'completed': 'Hoàn tất' }
  return labels[status] || status
}

const getStatusBadge = (status) => {
  if (status === 'pending') return "bg-amber-50 text-amber-600 border-amber-200"
  if (status === 'confirmed') return "bg-blue-50 text-blue-600 border-blue-200"
  if (status === 'shipping') return "bg-purple-50 text-purple-600 border-purple-200"
  if (status === 'completed') return "bg-emerald-50 text-emerald-600 border-emerald-200"
  return "bg-slate-50 text-slate-500 border-slate-200"
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

// --- BỘ LỌC THÔNG MINH ---
const filteredOrders = computed(() => {
  return orders.value.filter(order => 
    order.customerName?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    order.phone?.includes(searchQuery.value) ||
    order.orderCode?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const conversionRate = computed(() => {
  if (contacts.value.length === 0) return 0
  return ((orders.value.length / contacts.value.length) * 100).toFixed(1)
})

// --- 1. LOGIC XUẤT EXCEL (CẬP NHẬT CỘT EMAIL) ---
const exportToExcel = (data, fileName) => {
  if (data.length === 0) return showToast("Không có dữ liệu!", "error")
  const cleanData = data.map(({ id, createdAt, items, ...rest }) => ({
    'ID': id,
    'Ngày': createdAt?.toDate().toLocaleString('vi-VN') || '',
    'Khách hàng': rest.customerName || rest.name || '',
    'SĐT': rest.phone || '',
    'Email': rest.email || rest.contractEmail || '', // THÊM CỘT EMAIL
    'Tổng tiền': rest.totalPrice ? `${rest.totalPrice.toLocaleString()}đ` : '',
    'Nội dung/Công ty': rest.message || rest.companyName || ''
  }))
  const worksheet = XLSX.utils.json_to_sheet(cleanData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
  XLSX.writeFile(workbook, `SPIT_${fileName}_${new Date().getTime()}.xlsx`)
  showToast("Đã xuất báo cáo! 📊")
}

// --- 2. LOGIC GỬI EMAIL NHANH (CẬP NHẬT THÔNG MINH) ---
const sendQuickEmail = (item) => {
  const email = item.email || item.contractEmail // Ưu tiên email mới từ form contact
  
  if (email) {
    const subject = encodeURIComponent(`[SPIT Vietnam] Phản hồi yêu cầu tư vấn`)
    const body = encodeURIComponent(`Chào ${item.name},\n\nChúng tôi đã nhận được yêu cầu tư vấn của bạn thông qua hệ thống SPIT Vietnam.\n\nNội dung: "${item.message || 'Yêu cầu tư vấn'}"\n\nChúng tôi sẽ liên hệ lại sớm nhất.\n\nTrân trọng!`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  } else {
    // Nếu không có email (dữ liệu cũ), gợi ý gọi điện luôn cho Khang đỡ phải check tay
    if (confirm("Yêu cầu này không có Email. Bạn có muốn gọi điện trực tiếp cho " + item.name + " không?")) {
      window.location.href = `tel:${item.phone}`
    }
  }
}

// --- 3. QUẢN LÝ KHO TRỰC TIẾP ---
const updateStock = async (productId, newStock) => {
  try {
    const val = parseInt(newStock)
    if (isNaN(val)) return
    await updateDoc(doc(db, "products", productId), { stock: val })
    showToast("Cập nhật kho thành công!")
    fetchData()
  } catch (e) { showToast("Lỗi cập nhật!", "error") }
}

// --- LOGIC IN HÓA ĐƠN ---
const printOrder = (order) => {
  const printWindow = window.open('', '_blank');
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px; font-weight: bold; text-transform: uppercase;">${item.name} x${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 12px; font-weight: 900;">${(item.price * item.quantity).toLocaleString()}đ</td>
    </tr>
  `).join('');

  const html = `<html><head><title>Hóa đơn</title><style>body { font-family: sans-serif; padding: 40px; color: #1e293b; }.header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }.shop-name { font-size: 24px; font-weight: 900; text-transform: uppercase; }.info { margin-bottom: 30px; }.total { margin-top: 30px; text-align: right; border-top: 2px solid #000; padding-top: 20px; font-size: 24px; font-weight: 900; color: #ef4444; }</style></head><body><div class="header"><div class="shop-name">SPIT VIETNAM</div></div><div class="info"><div>Khách hàng: ${order.customerName}</div><div>SĐT: ${order.phone}</div></div><table>${itemsHtml}</table><div class="total">Tổng: ${order.totalPrice.toLocaleString()}đ</div></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

// --- HÀNH ĐỘNG ---
const updateStatus = async (id, next) => {
  try {
    await updateDoc(doc(db, "orders", id), { status: next })
    await fetchData()
    showToast("Cập nhật thành công!")
  } catch (e) { showToast("Lỗi!", "error") }
}

const deleteOrder = async (id, name) => {
  if (confirm(`Xóa đơn hàng của ${name}?`)) {
    await deleteDoc(doc(db, "orders", id))
    await fetchData()
    showToast("Đã xóa đơn hàng!")
  }
}

const deleteContact = async (id, name) => {
  if (confirm(`Bạn có chắc chắn muốn xóa yêu cầu tư vấn của ${name}?`)) {
    try {
      await deleteDoc(doc(db, "contacts", id))
      await fetchData()
      showToast("Đã xóa yêu cầu tư vấn!")
    } catch (e) { showToast("Lỗi khi xóa dữ liệu!", "error") }
  }
}

const clearCompletedOrders = async () => {
  const completed = orders.value.filter(o => o.status === 'completed')
  if (completed.length === 0) return showToast("Không có đơn hoàn tất", "error")
  if (confirm(`Dọn dẹp ${completed.length} đơn hoàn tất?`)) {
    const batch = writeBatch(db)
    completed.forEach(o => batch.delete(doc(db, "orders", o.id)))
    await batch.commit(); await fetchData();
    showToast("Đã dọn dẹp sạch sẽ! ✨")
  }
}

// --- THỐNG KÊ ---
const totalRevenue = computed(() => orders.value.filter(o => o.status === 'completed').reduce((s, o) => s + (o.totalPrice || 0), 0))
const lowStock = computed(() => products.value.filter(p => p.stock <= 5))
const topSelling = computed(() => {
  const map = {}
  orders.value.forEach(o => o.items?.forEach(i => map[i.name] = (map[i.name] || 0) + i.quantity))
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
})

onMounted(fetchData)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans relative">
    <AdminSidebar />
    
    <Transition name="toast">
      <div v-if="toast.show" :class="['fixed top-10 right-10 z-100 px-6 py-4 rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 border-b-4 bg-white', toast.type === 'success' ? 'text-emerald-600 border-emerald-500' : 'text-red-600 border-red-500']">
        <span>{{ toast.type === 'success' ? '✅' : '⚠️' }}</span> {{ toast.message }}
      </div>
    </Transition>

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-12 transition-all">
      <div class="max-w-7xl mx-auto">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 class="text-3xl font-black text-slate-900 uppercase italic">Phân tích kinh doanh</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hệ thống quản lý SPIT Vietnam</p>
          </div>
          <div class="flex gap-3">
            <input v-model="searchQuery" type="text" placeholder="Tìm tên, SĐT, mã đơn..." class="text-[10px] font-bold px-4 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 ring-blue-500 w-64 bg-white shadow-sm" />
            
            <button @click="exportToExcel(activeTab === 'orders' ? filteredOrders : contacts, activeTab)" 
                    class="text-[9px] font-black text-emerald-600 uppercase italic bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
              📥 Báo cáo
            </button>

            <button @click="clearCompletedOrders" class="text-[9px] font-black text-red-500 uppercase italic bg-red-50 px-4 py-2 rounded-full border border-red-100 hover:bg-red-500 hover:text-white transition-all">Dọn đơn rác</button>
            <button @click="fetchData" class="text-[9px] font-black text-blue-600 uppercase italic bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">Làm mới</button>
          </div>
        </div>

        <div v-if="isLoading" class="p-20 flex justify-center"><LoadingSpinner /></div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
              <h3 class="text-[9px] font-black uppercase opacity-60 mb-2 italic tracking-widest">Doanh thu hoàn tất</h3>
              <div class="text-2xl font-black italic text-emerald-400">{{ totalRevenue.toLocaleString() }}đ</div>
              <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between items-end">
                <div>
                  <p class="text-[8px] font-black uppercase opacity-40">Tỷ lệ chốt</p>
                  <p class="text-lg font-black text-blue-400">{{ conversionRate }}%</p>
                </div>
                <div class="text-[20px]">📈</div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="text-red-600 font-black uppercase text-[10px] mb-4 flex items-center gap-2 italic">⚠️ Cảnh báo kho</h3>
              <div v-for="p in lowStock" :key="p.id" class="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2 text-[10px] font-bold uppercase">
                <span class="truncate w-24">{{ p.name }}</span> 
                <input type="number" v-model="p.stock" @change="updateStock(p.id, p.stock)" 
                       class="w-12 bg-white border border-slate-200 rounded px-1 text-center text-red-600 font-black focus:outline-none" />
              </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 class="text-blue-600 font-black uppercase text-[10px] mb-4 italic">🏆 Sản phẩm tiêu biểu</h3>
              <div v-for="(item, idx) in topSelling" :key="idx" class="mb-4 last:mb-0">
                <div class="flex justify-between text-[10px] font-bold uppercase mb-1">
                  <span class="truncate w-32 text-slate-700">{{ item.name }}</span> <span>{{ item.count }} SP</span>
                </div>
                <div class="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-full transition-all duration-1000" :style="{ width: (item.count / (topSelling[0]?.count || 1) * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3 space-y-6">
            <div class="bg-white p-2 rounded-4xl shadow-sm border border-slate-100 flex gap-2">
              <button @click="activeTab = 'orders'" :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50']">📦 Đơn hàng ({{ filteredOrders.length }})</button>
              <button @click="activeTab = 'contacts'" :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', activeTab === 'contacts' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50']">💬 Tư vấn ({{ contacts.length }})</button>
            </div>

            <div v-if="activeTab === 'orders'" class="space-y-4">
              <div v-for="order in filteredOrders" :key="order.id" class="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all group shadow-sm">
                <div class="flex flex-wrap justify-between items-start gap-4">
                  <div class="flex gap-4">
                    <div :class="getStatusBadge(order.status)" class="w-12 h-12 flex items-center justify-center rounded-2xl text-xl shrink-0 border uppercase font-black">
                      {{ order.status === 'completed' ? '✅' : '⏳' }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-xs font-black text-slate-800 uppercase italic">{{ order.customerName }}</h4>
                        <span v-if="order.companyName" class="text-[8px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black italic">B2B Partner</span>
                      </div>
                      <p class="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{{ order.phone }} • {{ order.createdAt?.toDate().toLocaleString('vi-VN') }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-black text-red-600">{{ order.totalPrice?.toLocaleString() }}đ</div>
                    <div class="flex gap-2 mt-3 justify-end">
                      <button @click="printOrder(order)" class="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">🖨️</button>
                      <button v-if="order.status === 'pending'" @click="updateStatus(order.id, 'confirmed')" class="text-[9px] font-black text-blue-600 uppercase border border-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all">Duyệt</button>
                      <button v-if="order.status === 'confirmed'" @click="updateStatus(order.id, 'shipping')" class="text-[9px] font-black text-purple-600 uppercase border border-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-all">Giao</button>
                      <button v-if="order.status === 'shipping'" @click="updateStatus(order.id, 'completed')" class="text-[9px] font-black text-emerald-600 uppercase border border-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">Xong</button>
                      <button @click="deleteOrder(order.id, order.customerName)" class="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                  </div>
                </div>

                <div class="mt-5 pt-5 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-slate-50/50 p-4 rounded-2xl">
                    <p class="text-[8px] font-black text-slate-400 uppercase mb-2">Chi tiết sản phẩm</p>
                    <div v-for="item in order.items" class="text-[10px] font-bold text-slate-600 flex justify-between mb-1">
                      <span>{{ item.name }} x{{ item.quantity }}</span>
                      <span>{{ (item.price * item.quantity).toLocaleString() }}đ</span>
                    </div>
                  </div>
                  <div v-if="order.companyName" class="bg-blue-50/30 p-4 rounded-2xl border border-blue-50">
                    <p class="text-[8px] font-black text-blue-400 uppercase mb-1">Hồ sơ doanh nghiệp</p>
                    <p class="text-[10px] font-black text-slate-700 italic">{{ order.companyName }}</p>
                    <p class="text-[9px] font-bold text-slate-400 mt-1">MST: {{ order.taxCode }} | Email: {{ order.contractEmail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'contacts'" class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table class="w-full text-left">
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="item in contacts" :key="item.id" class="hover:bg-red-50/10 group transition-all">
                    <td class="p-6">
                      <div class="flex items-center gap-2">
                        <div class="text-xs font-black text-slate-800 uppercase italic">{{ item.name }}</div>
                        <span v-if="item.companyName" class="text-[7px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">B2B</span>
                      </div>
                      <div class="text-[10px] font-bold text-blue-600 mt-1">{{ item.phone }}</div>
                      <div v-if="item.email" class="text-[9px] font-medium text-slate-400 italic mt-0.5 truncate w-32">{{ item.email }}</div>
                    </td>
                    <td class="p-6">
                      <p class="text-[10px] font-medium text-slate-500 italic border-l-2 border-slate-200 pl-4 leading-relaxed">{{ item.message }}</p>
                      <p class="text-[8px] text-slate-300 font-bold mt-2 uppercase tracking-tighter">{{ item.createdAt?.toDate().toLocaleString('vi-VN') }}</p>
                    </td>
                    <td class="p-6 text-right">
                       <button @click="sendQuickEmail(item)" class="opacity-0 group-hover:opacity-100 p-2 text-blue-400 hover:text-blue-600 transition-all">📧</button>
                       <button @click="deleteContact(item.id, item.name)" class="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-600 transition-all">🗑️</button>
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