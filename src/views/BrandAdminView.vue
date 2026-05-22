<template>
  <div class="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans antialiased text-slate-800">
    
    <div class="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div class="space-y-1">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-900 text-white uppercase tracking-widest">
          Hệ thống Quản trị
        </span>
        <h1 class="text-3xl font-black text-slate-900 uppercase italic tracking-tight">
          Quản lý <span class="text-red-600">Nhãn hàng đối tác</span>
        </h1>
        <p class="text-xs text-slate-500 font-medium">
          Thêm mới hoặc cập nhật bài viết giới thiệu, logo các thương hiệu chiến lược của SPIT.
        </p>
      </div>
      
      <button 
        @click="$router.push('/about')" 
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all cursor-pointer"
      >
        Xem trang Giới thiệu ➔
      </button>
    </div>

    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <div class="lg:col-span-5 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 sticky top-6">
        <div class="space-y-1 border-b border-slate-100 pb-3">
          <h3 class="text-md font-black uppercase text-slate-900 tracking-tight">
            {{ isEditing ? 'Cập nhật nhãn hàng' : 'Thêm nhãn hàng mới' }}
          </h3>
          <p class="text-[11px] text-slate-400 font-medium">
            {{ isEditing ? 'Thay đổi thông tin Document hiện tại trong Firestore.' : 'Khởi tạo một Document mới vào collection brands.' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-black uppercase text-slate-700 tracking-wide">Tên nhãn hàng *</label>
            <input 
              v-model="form.name" 
              type="text" 
              required
              placeholder="Ví dụ: KORLOY, LAMINA, SUMITOMO..."
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-red-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-black uppercase text-slate-700 tracking-wide">Đường dẫn ảnh Logo (URL) *</label>
            <input 
              v-model="form.logoUrl" 
              type="url" 
              required
              placeholder="https://domain.com/logo.png"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-red-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-black uppercase text-slate-700 tracking-wide">Nội dung giới thiệu (HTML) *</label>
              <span class="text-[10px] text-slate-400 font-bold">Hỗ trợ thẻ &lt;p&gt;, &lt;strong&gt;</span>
            </div>
            <textarea 
              v-model="form.description" 
              rows="8"
              required
              placeholder="<p>Nhập đoạn giới thiệu bọc trong thẻ p.</p> <p>Sử dụng thẻ <strong>để in đậm văn bản kỹ thuật</strong>...</p>"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-red-500 focus:bg-white transition-all font-mono leading-relaxed"
            ></textarea>
          </div>

          <div v-if="form.description" class="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-1.5">
            <span class="text-[10px] font-black uppercase text-amber-700 tracking-wider block">Live Preview Nội dung:</span>
            <div class="text-xs text-slate-600 custom-preview prose max-w-none font-medium" v-html="form.description"></div>
          </div>

          <div class="flex gap-3 pt-2">
            <button 
              type="submit" 
              :disabled="submitting"
              class="flex-1 py-3 rounded-xl text-xs font-black bg-slate-900 hover:bg-red-600 disabled:bg-slate-400 text-white uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-slate-900/10"
            >
              {{ submitting ? 'Đang xử lý...' : (isEditing ? 'Cập Nhật Ngay' : 'Đăng Nhãn Hàng') }}
            </button>
            <button 
              v-if="isEditing"
              type="button"
              @click="resetForm"
              class="px-4 py-3 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 uppercase tracking-wider transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>

      <div class="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-md font-black uppercase text-slate-900 tracking-tight">Danh sách dữ liệu hiện tại</h3>
            <p class="text-[11px] text-slate-400 font-medium">Real-time đồng bộ trực tiếp từ Firestore.</p>
          </div>
          <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {{ brands.length }} Đối tác
          </span>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent mx-auto mb-2"></div>
          Đang kết nối Firestore...
        </div>

        <div v-else-if="brands.length === 0" class="text-center py-12 text-slate-400 italic text-xs font-medium">
          Chưa có dữ liệu thương hiệu nào trong hệ thống, hãy khởi tạo ở form bên cạnh.
        </div>

        <div v-else class="overflow-hidden rounded-2xl border border-slate-100">
          <div class="divide-y divide-slate-100">
            <div 
              v-for="b in brands" 
              :key="b.id"
              class="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/80 transition-colors"
            >
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                  <img v-if="b.logoUrl" :src="b.logoUrl" :alt="b.name" class="max-h-full max-w-full object-contain" />
                  <span v-else class="text-[10px] font-black text-slate-400">NULL</span>
                </div>
                <div class="min-w-0">
                  <h4 class="text-sm font-black text-slate-900 uppercase truncate tracking-tight">{{ b.name }}</h4>
                  <p class="text-[10px] text-slate-400 font-mono truncate">ID: {{ b.id }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button 
                  @click="handleEdit(b)"
                  class="p-2 text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa hãng"
                >
                  Sửa
                </button>
                <button 
                  @click="handleDelete(b.id, b.name)"
                  class="p-2 text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa vĩnh viễn"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const brands = ref([])
const loading = ref(true)
const submitting = ref(false)
const isEditing = ref(false)
const currentBrandId = ref(null)

const form = ref({
  name: '',
  logoUrl: '',
  description: ''
})

let unsubscribe = null

// 1. Khởi chạy lắng nghe real-time toàn bộ collection 'brands' để render danh sách
onMounted(() => {
  const brandsRef = collection(db, 'brands')
  unsubscribe = onSnapshot(brandsRef, (snapshot) => {
    const fetched = []
    snapshot.forEach((docSnap) => {
      fetched.push({
        id: docSnap.id,
        ...docSnap.data()
      })
    })
    // Sắp xếp Alphabet theo tên nhãn hàng cho dễ nhìn
    brands.value = fetched.sort((a, b) => a.name.localeCompare(b.name))
    loading.value = false
  }, (error) => {
    console.error("Lỗi khi đồng bộ danh sách brands từ Firestore:", error)
    loading.value = false
  })
})

// Hủy lắng nghe khi rời trang
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// 2. Xử lý submit Form (Thêm mới hoặc Cập nhật)
const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.logoUrl.trim() || !form.value.description.trim()) return
  
  submitting.value = true
  try {
    if (isEditing.value && currentBrandId.value) {
      // Logic Cập nhật document đã có sẵn
      const docRef = doc(db, 'brands', currentBrandId.value)
      await updateDoc(docRef, {
        name: form.value.name.trim(),
        logoUrl: form.value.logoUrl.trim(),
        description: form.value.description.trim()
      })
      alert(`Đã cập nhật thông tin thương hiệu ${form.value.name} thành công!`)
    } else {
      // Logic Thêm mới hoàn toàn một document
      const collectionRef = collection(db, 'brands')
      await addDoc(collectionRef, {
        name: form.value.name.trim(),
        logoUrl: form.value.logoUrl.trim(),
        description: form.value.description.trim()
      })
      alert(`Đã thêm thành công thương hiệu ${form.value.name} mới!`)
    }
    resetForm()
  } catch (error) {
    console.error("Lỗi khi xử lý thao tác với Firestore:", error)
    alert("Có lỗi xảy ra trong quá trình ghi dữ liệu, vui lòng kiểm tra lại cấu hình rules.")
  } finally {
    submitting.value = false
  }
}

// 3. Đưa thông tin hãng lên form để tiến hành chỉnh sửa
const handleEdit = (brandItem) => {
  isEditing.value = true
  currentBrandId.value = brandItem.id
  form.value = {
    name: brandItem.name,
    logoUrl: brandItem.logoUrl,
    description: brandItem.description
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 4. Xóa vĩnh viễn nhãn hàng khỏi database
const handleDelete = async (id, name) => {
  const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn thương hiệu "${name}" không? \nHành động này không thể hoàn tác và sẽ ảnh hưởng trực tiếp đến các liên kết sản phẩm.`)
  if (!confirmDelete) return

  try {
    await deleteDoc(doc(db, 'brands', id))
    alert(`Đã xóa thành công thương hiệu ${name}.`)
    if (isEditing.value && currentBrandId.value === id) {
      resetForm()
    }
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error)
    alert("Không thể xóa tài liệu. Kiểm tra lại quyền hạn database.")
  }
}

// 5. Reset trạng thái form về trống
const resetForm = () => {
  isEditing.value = false
  currentBrandId.value = null
  form.value = {
    name: '',
    logoUrl: '',
    description: ''
  }
}
</script>

<style scoped>
/* Đồng bộ định dạng hiển thị cho ô Preview text */
:deep(.custom-preview p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}
:deep(.custom-preview p:last-child) {
  margin-bottom: 0;
}
:deep(.custom-preview strong) {
  color: #0f172a;
  font-weight: 700;
}
</style>