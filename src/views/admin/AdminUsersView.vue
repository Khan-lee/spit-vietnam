<template>
  <!-- ⚡ FILE MỚI: Trang quản lý người dùng cho Admin -->
  <div class="flex min-h-screen bg-slate-50 font-sans relative">
    <AdminSidebar />

    <div class="flex-1 ml-20 md:ml-64 p-6 md:p-12 transition-all">

      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-black uppercase text-slate-900 tracking-tight">Quản lý người dùng</h1>
          <p class="text-sm text-slate-500 mt-1">Danh sách khách hàng đã đăng ký tài khoản trên website.</p>
        </div>
        <button @click="reload" class="text-[11px] font-black uppercase tracking-wider border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-white transition-colors">
          ↻ Tải lại
        </button>
      </div>

      <!-- THỐNG KÊ NHANH -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tổng người dùng</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ users.length }}</p>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Đang hoạt động</p>
          <p class="text-2xl font-black text-emerald-600 mt-1">{{ users.filter(u => !u.disabled).length }}</p>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bị khoá</p>
          <p class="text-2xl font-black text-red-600 mt-1">{{ users.filter(u => u.disabled).length }}</p>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mới trong 30 ngày</p>
          <p class="text-2xl font-black text-blue-600 mt-1">{{ newLast30 }}</p>
        </div>
      </div>

      <!-- TÌM KIẾM -->
      <div class="mb-5">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm theo tên, số điện thoại hoặc email..."
          class="w-full max-w-md px-5 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-400"
        />
      </div>

      <!-- BẢNG -->
      <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div v-if="isLoading" class="p-16 text-center text-slate-400 text-sm font-bold">Đang tải danh sách người dùng...</div>

        <div v-else-if="loadError" class="p-16 text-center space-y-2">
          <p class="text-red-600 text-sm font-black">Không đọc được dữ liệu người dùng.</p>
          <p class="text-[11px] text-slate-400 font-medium">{{ loadError }}</p>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="p-16 text-center text-slate-400 text-sm font-bold">
          Chưa có người dùng nào khớp.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[820px]">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="p-5">Khách hàng</th>
                <th class="p-5">Liên hệ</th>
                <th class="p-5 text-center">Vai trò</th>
                <th class="p-5 text-center">Đơn hàng</th>
                <th class="p-5">Ngày tạo</th>
                <th class="p-5">Đăng nhập gần nhất</th>
                <th class="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="u in filteredUsers" :key="u.id" :class="['hover:bg-slate-50/70 transition-colors', u.disabled ? 'bg-red-50/40' : '']">
                <td class="p-5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                      {{ initials(u.displayName) }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-black text-slate-800 truncate">{{ u.displayName || 'Chưa đặt tên' }}</p>
                      <p class="text-[10px] text-slate-400 font-mono truncate">{{ u.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-5">
                  <p v-if="u.phone" class="font-bold text-slate-700">{{ prettyPhone(u.phone) }}</p>
                  <p v-if="realEmail(u)" class="text-[11px] text-slate-400 font-medium truncate max-w-[220px]">{{ realEmail(u) }}</p>
                  <p v-if="!u.phone && !realEmail(u)" class="text-[11px] text-slate-300 italic">—</p>
                </td>
                <td class="p-5 text-center">
                  <span :class="['text-[9px] font-black uppercase px-2.5 py-1 rounded-full border', roleBadgeClass(u)]">
                    {{ roleLabel(u) }}
                  </span>
                </td>
                <td class="p-5 text-center font-black text-slate-700">{{ orderCountMap[u.id] || 0 }}</td>
                <td class="p-5 text-[11px] font-bold text-slate-500">{{ fmtDate(u.createdAt) }}</td>
                <td class="p-5 text-[11px] font-bold text-slate-500">{{ fmtDate(u.lastLoginAt) }}</td>
                <td class="p-5">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="toggleDisabled(u)"
                      :class="['text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-colors',
                               u.disabled
                                 ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                 : 'border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white']"
                    >
                      {{ u.disabled ? 'Mở khoá' : 'Khoá' }}
                    </button>
                    <button
                      @click="removeUser(u)"
                      class="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-600 transition-colors"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="mt-4 text-[11px] text-slate-400 font-medium leading-relaxed">
        * "Khoá" đánh dấu <code>disabled: true</code> trong hồ sơ — lần đăng nhập kế tiếp khách sẽ bị chặn và tự đăng xuất.
        "Xoá" chỉ xoá hồ sơ Firestore, không xoá tài khoản đăng nhập (việc đó cần Firebase Console / Admin SDK).
      </p>

      <!-- TOAST -->
      <div v-if="toast.show" :class="['fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-white text-xs font-black shadow-xl z-50', toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900']">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, getDocs, doc, updateDoc, deleteDoc, query } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminSidebar from '../../components/AdminSidebar.vue'
import { isAdminEmail } from '../../config/admins'
import { prettyPhone, isSyntheticEmail } from '../../utils/authHelpers'

const users = ref([])
const orderCountMap = ref({})
const isLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

let unsubUsers = null

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// --- TẢI DANH SÁCH NGƯỜI DÙNG (realtime) ---
const listenUsers = () => {
  isLoading.value = true
  loadError.value = ''
  unsubUsers = onSnapshot(
    query(collection(db, 'users')),
    (snap) => {
      users.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      isLoading.value = false
    },
    (err) => {
      console.error('Lỗi tải users:', err)
      loadError.value = err.code === 'permission-denied'
        ? 'Firestore Rules đang chặn admin đọc collection "users". Hãy deploy firestore.rules.'
        : err.message
      isLoading.value = false
    }
  )
}

// --- ĐẾM SỐ ĐƠN THEO userId ---
const fetchOrderCounts = async () => {
  try {
    const snap = await getDocs(collection(db, 'orders'))
    const map = {}
    snap.forEach(d => {
      const uid = d.data().userId
      if (uid) map[uid] = (map[uid] || 0) + 1
    })
    orderCountMap.value = map
  } catch (e) {
    console.error('Lỗi đếm đơn:', e)
  }
}

const reload = () => {
  if (unsubUsers) unsubUsers()
  listenUsers()
  fetchOrderCounts()
}

onMounted(() => {
  listenUsers()
  fetchOrderCounts()
})
onUnmounted(() => {
  if (unsubUsers) unsubUsers()
})

// --- HELPERS HIỂN THỊ ---
const toMs = (ts) => {
  if (!ts) return 0
  if (typeof ts.toDate === 'function') return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  const d = new Date(ts)
  return isNaN(d) ? 0 : d.getTime()
}
const fmtDate = (ts) => {
  const ms = toMs(ts)
  return ms ? new Date(ms).toLocaleDateString('vi-VN') : '—'
}
const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || '?'
}
const realEmail = (u) => (u.email && !isSyntheticEmail(u.email)) ? u.email : ''
const isAdminUser = (u) => isAdminEmail(u.email) || isAdminEmail(u.authEmail) || u.role === 'admin'
const roleLabel = (u) => isAdminUser(u) ? 'Quản trị' : 'Khách hàng'
const roleBadgeClass = (u) => isAdminUser(u)
  ? 'bg-blue-50 text-blue-600 border-blue-200'
  : 'bg-slate-50 text-slate-500 border-slate-200'

const newLast30 = computed(() => {
  const cut = Date.now() - 30 * 864e5
  return users.value.filter(u => toMs(u.createdAt) >= cut).length
})

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    String(u.displayName || '').toLowerCase().includes(q) ||
    String(u.phone || '').includes(q.replace(/\D/g, '')) ||
    String(u.email || '').toLowerCase().includes(q)
  )
})

// --- HÀNH ĐỘNG ---
const toggleDisabled = async (u) => {
  const next = !u.disabled
  if (!confirm(next ? `Khoá tài khoản "${u.displayName || u.id}"?` : `Mở khoá cho "${u.displayName || u.id}"?`)) return
  try {
    await updateDoc(doc(db, 'users', u.id), { disabled: next })
    showToast(next ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.')
  } catch (e) {
    console.error(e)
    showToast('Thao tác thất bại (kiểm tra Rules).', 'error')
  }
}

const removeUser = async (u) => {
  if (!confirm(`Xoá hồ sơ người dùng "${u.displayName || u.id}"? (Không xoá tài khoản đăng nhập)`)) return
  try {
    await deleteDoc(doc(db, 'users', u.id))
    showToast('Đã xoá hồ sơ người dùng.')
  } catch (e) {
    console.error(e)
    showToast('Xoá thất bại (kiểm tra Rules).', 'error')
  }
}
</script>
