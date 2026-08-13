<template>
  <div class="p-6 bg-slate-50 min-h-screen text-slate-800">
    <!-- 1. HEADER TRANG -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-black uppercase text-slate-900 tracking-tight">Quản lý chính sách</h1>
        <p class="text-sm text-slate-500 mt-1">Quản lý các bài viết chính sách bán hàng và hỗ trợ khách hàng ở Footer</p>
      </div>
      <button 
        @click="openModalForCreate"
        class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Thêm bài viết mới</span>
      </button>
    </div>

    <!-- 2. THANH LỌC VÀ TÌM KIẾM -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <!-- Ô tìm kiếm -->
      <div class="w-full sm:w-80 relative">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Tìm kiếm chính sách..." 
          class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Chọn phân loại -->
      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <select 
          v-model="selectedCategory" 
          class="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">Tất cả phân loại</option>
          <option value="chinh-sach">Chính sách bán hàng</option>
          <option value="ho-tro">Hỗ trợ khách hàng</option>
        </select>
      </div>
    </div>

    <!-- 3. BẢNG DANH SÁCH BÀI VIẾT (Giống hệt hình 3) -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100/70 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <th class="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  @change="toggleSelectAll" 
                  :checked="isAllSelected" 
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </th>
              <th class="p-4 w-20 text-center">STT</th>
              <th class="p-4 w-24 text-center">Hình</th>
              <th class="p-4">Tiêu đề</th>
              <th class="p-4 w-44">Phân loại</th>
              <th class="p-4 w-28 text-center">Hiển thị</th>
              <th class="p-4 w-32 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="filteredPolicies.length === 0">
              <td colspan="7" class="p-8 text-center text-slate-400 font-medium">Chưa có bài viết chính sách nào.</td>
            </tr>

            <tr 
              v-for="policy in filteredPolicies" 
              :key="policy.id" 
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <!-- Checkbox chọn dòng -->
              <td class="p-4 text-center">
                <input 
                  type="checkbox" 
                  v-model="selectedIds" 
                  :value="policy.id" 
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </td>

              <!-- Ô thay đổi STT -->
              <td class="p-4 text-center">
                <input 
                  type="number" 
                  v-model.number="policy.stt" 
                  @change="updateOrder(policy)"
                  class="w-14 text-center border border-slate-200 rounded-lg py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Hình đại diện -->
              <td class="p-4 text-center">
                <div class="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden mx-auto">
                  <img v-if="policy.image" :src="policy.image" class="w-full h-full object-cover" />
                  <div v-else class="text-[9px] text-slate-400 font-bold uppercase text-center p-1 leading-tight">NO IMAGE AVAILABLE</div>
                </div>
              </td>

              <!-- Tiêu đề & Nút thao tác nhanh bên dưới (View | Edit | Delete) -->
              <td class="p-4">
                <div class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {{ policy.title }}
                </div>
                <div class="flex items-center gap-3 mt-1.5 text-xs">
                  <a :href="`/chinh-sach/${policy.slug}`" target="_blank" class="text-blue-500 hover:underline flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View</span>
                  </a>
                  <span class="text-slate-300">|</span>
                  <button @click="openModalForEdit(policy)" class="text-amber-600 hover:underline flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <span class="text-slate-300">|</span>
                  <button @click="deletePolicy(policy.id)" class="text-rose-600 hover:underline flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </td>

              <!-- Nhãn phân loại -->
              <td class="p-4">
                <span 
                  class="px-2.5 py-1 rounded-lg text-xs font-bold inline-block"
                  :class="policy.category === 'chinh-sach' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ policy.category === 'chinh-sach' ? 'Chính sách bán hàng' : 'Hỗ trợ khách hàng' }}
                </span>
              </td>

              <!-- Checkbox Toggle Bật/Tắt hiển thị -->
              <td class="p-4 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="policy.is_active" 
                    @change="toggleStatus(policy)" 
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </td>

              <!-- Thao tác cột bên phải -->
              <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openModalForEdit(policy)"
                    class="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all"
                    title="Chỉnh sửa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="deletePolicy(policy.id)"
                    class="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Xóa bài"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. MODAL THÊM / SỬA CHÍNH SÁCH -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-bold text-slate-900 text-lg">
            {{ isEditing ? 'Chỉnh sửa chính sách' : 'Thêm chính sách mới' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form nhập dữ liệu -->
        <form @submit.prevent="savePolicy" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Tiêu đề bài viết <span class="text-rose-500">*</span></label>
            <input 
              v-model="form.title" 
              type="text" 
              required 
              placeholder="Nhập tiêu đề (VD: Chính sách vận chuyển)" 
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Phân loại cột Footer <span class="text-rose-500">*</span></label>
              <select 
                v-model="form.category" 
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="chinh-sach">Chính sách bán hàng</option>
                <option value="ho-tro">Hỗ trợ khách hàng</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Số thứ tự (STT)</label>
              <input 
                v-model.number="form.stt" 
                type="number" 
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Đường dẫn hình ảnh đại diện (Nếu có)</label>
            <input 
              v-model="form.image" 
              type="text" 
              placeholder="https://domain.com/uploads/hinh-anh.png" 
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Nội dung chi tiết</label>
            <textarea 
              v-model="form.content" 
              rows="5" 
              placeholder="Nhập nội dung văn bản chính sách ở đây..." 
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input 
              id="is_active" 
              type="checkbox" 
              v-model="form.is_active" 
              class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
            />
            <label for="is_active" class="text-sm font-medium text-slate-700 cursor-pointer">Hiển thị bài viết này trên website</label>
          </div>

          <!-- Nút hành động trong Modal -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              @click="closeModal" 
              class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              {{ isEditing ? 'Lưu thay đổi' : 'Tạo bài viết' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../../firebase' // Kiểm tra đúng đường dẫn tới file firebase.js của bạn
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore'

const policies = ref([])
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedIds = ref([])

const isModalOpen = ref(false)
const isEditing = ref(false)
const form = ref({
  id: null,
  title: '',
  category: 'chinh-sach',
  stt: 0,
  image: '',
  content: '',
  is_active: true
})

// 1. Lắng nghe Realtime dữ liệu từ Firestore collection 'policies'
onMounted(() => {
  onSnapshot(collection(db, 'policies'), (snapshot) => {
    const items = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() })
    })
    policies.value = items
  })
})

// Lọc & sắp xếp danh sách
const filteredPolicies = computed(() => {
  return policies.value.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  }).sort((a, b) => (a.stt || 0) - (b.stt || 0))
})

const isAllSelected = computed(() => {
  return filteredPolicies.value.length > 0 && selectedIds.value.length === filteredPolicies.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredPolicies.value.map(p => p.id)
  }
}

// Mở Modal
const openModalForCreate = () => {
  isEditing.value = false
  const autoId = 'policy_' + Date.now()
  form.value = {
    id: autoId,
    title: '',
    category: 'chinh-sach',
    stt: policies.value.length,
    image: '',
    content: '',
    is_active: true
  }
  isModalOpen.value = true
}

const openModalForEdit = (policy) => {
  isEditing.value = true
  form.value = { ...policy }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

// 2. TẠO HOẶC CẬP NHẬT LÊN FIREBASE
const savePolicy = async () => {
  try {
    const generatedSlug = form.value.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, '-')

    const docId = form.value.id || ('policy_' + Date.now())
    const payload = {
      ...form.value,
      slug: generatedSlug,
      updatedAt: new Date()
    }

    // Lưu vào collection 'policies'
    await setDoc(doc(db, 'policies', docId), payload, { merge: true })
    closeModal()
  } catch (error) {
    console.error("Lỗi khi lưu bài viết chính sách:", error)
    alert("Có lỗi xảy ra khi lưu bài viết!")
  }
}

// 3. XÓA BÀI VIẾT TRÊN FIREBASE
const deletePolicy = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa bài viết chính sách này không?')) {
    try {
      await deleteDoc(doc(db, 'policies', id))
    } catch (error) {
      console.error("Lỗi khi xóa bài viết:", error)
    }
  }
}

// 4. BẬT / TẮT HIỂN THỊ REALTIME LÊN FIREBASE
const toggleStatus = async (policy) => {
  try {
    await updateDoc(doc(db, 'policies', policy.id), {
      is_active: policy.is_active
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái:", error)
  }
}

// 5. CẬP NHẬT STT LÊN FIREBASE
const updateOrder = async (policy) => {
  try {
    await updateDoc(doc(db, 'policies', policy.id), {
      stt: policy.stt
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật STT:", error)
  }
}
</script>