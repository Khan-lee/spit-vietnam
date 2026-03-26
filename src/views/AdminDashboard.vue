<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import AdminSidebar from '../components/AdminSidebar.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

// --- TRẠNG THÁI DỮ LIỆU ---
const orders = ref([])
const products = ref([])
const contacts = ref([])
const activeTab = ref('orders')
const isLoading = ref(true)

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// --- LOGIC VIỆT HÓA ---
const getStatusLabel = (status) => {
  const labels = { 'pending': 'Chờ duyệt', 'confirmed': 'Đã xác nhận', 'shipping': 'Đang giao', 'completed': 'Hoàn tất' }
  return labels[status] || status
}

const getStatusBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-[8px] font-black uppercase border "
  if (status === 'pending') return base + "bg-amber-50 text-amber-600 border-amber-200"
  if (status === 'confirmed') return base + "bg-blue-50 text-blue-600 border-blue-200"
  if (status === 'shipping') return base + "bg-purple-50 text-purple-600 border-purple-200"
  if (status === 'completed') return base + "bg-emerald-50 text-emerald-600 border-emerald-200"
  return base + "bg-slate-50 text-slate-500 border-slate-200"
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

// --- LOGIC IN HÓA ĐƠN ---
const printOrder = (order) => {
  const printWindow = window.open('', '_blank');
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px; font-weight: bold; text-transform: uppercase;">${item.name} x${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 12px; font-weight: 900;">${(item.price * item.quantity).toLocaleString()}đ</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Hóa đơn - ${order.customerName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .shop-name { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; italic; }
          .info { margin-bottom: 30px; line-height: 1.6; }
          .info-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: bold; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          .total { margin-top: 30px; text-align: right; border-top: 2px solid #000; pt: 20px; }
          .total-label { font-size: 12px; font-weight: 900; text-transform: uppercase; }
          .total-value { font-size: 24px; font-weight: 900; color: #ef4444; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name italic">SPIT VIETNAM</div>
          <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #64748b;">HÓA ĐƠN BÁN HÀNG</div>
        </div>
        <div class="info">
          <div class="info-label">Khách hàng</div>
          <div class="info-value">${order.customerName}</div>
          <div class="info-label">Điện thoại</div>
          <div class="info-value">${order.phone}</div>
          <div class="info-label">Địa chỉ</div>
          <div class="info-value">${order.address || 'Tại cửa hàng'}</div>
          ${order.note ? `<div class="info-label">Ghi chú</div><div class="info-value">${order.note}</div>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px;">Sản phẩm</th>
              <th style="text-align: right; font-size: 10px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">
          <span class="total-label">Tổng thanh toán: </span>
          <span class="total-value">${order.totalPrice.toLocaleString()}đ</span>
        </div>
        <div style="margin-top: 50px; text-align: center; font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
          Cảm ơn bạn đã tin tưởng SPIT VIETNAM!
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

// --- CÁC HÀNH ĐỘNG KHÁC (GIỮ NGUYÊN) ---
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

// --- THỐNG KÊ (COMPUTED) ---
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
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-10">
          <h1 class="text-3xl font-black text-slate-900 uppercase italic">Phân tích kinh doanh</h1>
          <div class="flex gap-3">
            <button @click="clearCompletedOrders" class="text-[9px] font-black text-red-500 uppercase italic bg-red-50 px-4 py-2 rounded-full border border-red-100 hover:bg-red-500 hover:text-white">Dọn đơn rác</button>
            <button @click="fetchData" class="text-[9px] font-black text-blue-600 uppercase italic bg-white px-4 py-2 rounded-full shadow-sm">Làm mới</button>
          </div>
        </div>

        <div v-if="isLoading" class="p-20 flex justify-center"><LoadingSpinner /></div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="space-y-8">
            <div class="bg-linear-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] shadow-xl text-white transform hover:scale-[1.02] transition-all">
              <h3 class="text-[10px] font-black uppercase opacity-80 mb-2 italic">Doanh thu</h3>
              <div class="text-3xl font-black italic">{{ totalRevenue.toLocaleString() }}đ</div>
            </div>

            <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-red-50">
              <h3 class="text-red-600 font-black uppercase text-[10px] mb-6 flex items-center gap-2">Cảnh báo kho</h3>
              <div v-for="p in lowStock" :key="p.id" class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl mb-2 text-[11px] font-bold uppercase">
                <span class="truncate w-32">{{ p.name }}</span> <span class="text-red-600 font-black">{{ p.stock }}</span>
              </div>
            </div>

            <div class="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
              <h3 class="text-blue-400 font-black uppercase text-[10px] mb-6 italic text-center">Sản phẩm tiêu biểu</h3>
              <div v-for="(item, idx) in topSelling" :key="idx" class="mb-5 last:mb-0">
                <div class="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span class="truncate w-32">{{ item.name }}</span> <span>{{ item.count }} SP</span>
                </div>
                <div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-full transition-all duration-1000" :style="{ width: (item.count / (topSelling[0]?.count || 1) * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            <div class="flex p-4 bg-slate-50/50 border-b border-slate-100 gap-4">
              <button @click="activeTab = 'orders'" :class="['px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all', activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-400']">Đơn hàng ({{ orders.length }})</button>
              <button @click="activeTab = 'contacts'" :class="['px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all', activeTab === 'contacts' ? 'bg-red-600 text-white' : 'text-slate-400']">Tư vấn ({{ contacts.length }})</button>
            </div>

            <div v-if="activeTab === 'orders'" class="overflow-x-auto">
              <table class="w-full text-left">
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="order in orders" :key="order.id" class="hover:bg-blue-50/30 group transition-all">
                    <td class="p-6">
                      <div class="flex items-center gap-3">
                        <button @click="deleteOrder(order.id, order.customerName)" class="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div>
                          <div class="text-xs font-black text-slate-800 uppercase">{{ order.customerName }}</div>
                          <span :class="getStatusBadge(order.status)">{{ getStatusLabel(order.status) }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-6 text-right">
                      <div class="flex flex-col items-end gap-2">
                        <div class="text-xs font-black text-red-600">{{ order.totalPrice?.toLocaleString() }}đ</div>
                        <div class="flex gap-2">
                          <button @click="printOrder(order)" class="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="In hóa đơn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                          <button v-if="order.status === 'pending'" @click="updateStatus(order.id, 'confirmed')" class="text-[9px] font-black text-blue-600 uppercase border border-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all">Duyệt</button>
                          <button v-if="order.status === 'confirmed'" @click="updateStatus(order.id, 'shipping')" class="text-[9px] font-black text-purple-600 uppercase border border-purple-600 px-3 py-1.5 rounded-xl hover:bg-purple-600 hover:text-white transition-all">Giao</button>
                          <button v-if="order.status === 'shipping'" @click="updateStatus(order.id, 'completed')" class="text-[9px] font-black text-emerald-600 uppercase border border-emerald-600 px-3 py-1.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Xong</button>
                          <span v-if="order.status === 'completed'" class="text-[9px] font-black text-emerald-500 uppercase italic flex items-center gap-1">Đã xong ✅</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="activeTab === 'contacts'" class="overflow-x-auto">
               <table class="w-full text-left">
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="item in contacts" :key="item.id" class="hover:bg-red-50/30 group transition-all">
                    <td class="p-6">
                      <div class="text-xs font-black text-slate-800 uppercase">{{ item.name }}</div>
                      <div class="text-[10px] font-bold text-blue-600 mt-1 italic">{{ item.phone }}</div>
                    </td>
                    <td class="p-6">
                      <p class="text-[10px] font-medium text-slate-500 italic border-l-2 border-slate-200 pl-4">{{ item.message }}</p>
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
.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-enter-from { transform: translateX(100%) scale(0.5); opacity: 0; }
.toast-leave-to { transform: translateX(100%) translateY(-20px); opacity: 0; }
</style>