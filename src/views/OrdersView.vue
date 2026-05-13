<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const orders = ref([])
const loading = ref(true)
const user = ref(null)

const fetchOrders = async (uid) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc') // Đã mở lại để sắp xếp đơn mới nhất lên đầu
    )
    const querySnapshot = await getDocs(q)
    orders.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error)
    // Nếu gặp lỗi Index (thường xảy ra khi mới thêm orderBy), hãy nhấn vào link ở Console F12 để tạo
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      fetchOrders(currentUser.uid)
    } else {
      loading.value = false
    }
  })
})

const formatDate = (date) => {
  if (!date) return 'Đang cập nhật...'
  return new Date(date.seconds * 1000).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-4 md:px-12">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-black uppercase tracking-tighter mb-8 border-l-4 border-primary pl-4">
        Lịch sử đơn hàng
      </h1>

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="orders.length === 0" class="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
        <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">Bạn chưa có đơn hàng nào</p>
        <RouterLink to="/products" class="inline-block mt-6 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase rounded-full">Mua sắm ngay</RouterLink>
      </div>

      <div v-else class="space-y-4">
        <div v-for="order in orders" :key="order.id" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-primary/30 transition-colors">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase">Mã đơn hàng: #{{ order.id.slice(0,8).toUpperCase() }}</p>
              <p class="text-xs font-bold text-slate-800">{{ formatDate(order.createdAt) }}</p>
            </div>
            <span class="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase rounded-full text-slate-500">
              {{ order.status === 'pending' ? 'Chờ xác nhận' : (order.status || 'Đang xử lý') }}
            </span>
          </div>

          <div class="border-t border-slate-50 pt-4">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-[11px] mb-2">
              <span class="font-bold text-slate-600">{{ item.name }} x{{ item.quantity }}</span>
              <span class="font-black">{{ (item.price * item.quantity).toLocaleString() }}đ</span>
            </div>
          </div>

          <div class="border-t border-slate-50 mt-4 pt-4 flex justify-between items-center">
            <span class="text-[10px] font-black uppercase text-slate-400">Tổng cộng</span>
            <span class="text-lg font-black text-primary">{{ order.totalPrice?.toLocaleString() }}đ</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>