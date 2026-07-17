<script setup>
import { ref, onMounted } from 'vue'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

// Dữ liệu danh mục độc lập
const categories = ref([])
const isUploading = ref(false)

// Trạng thái Form Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentCategoryId = ref(null)
const formData = ref({
  name_vi: '',
  name_en: '',
  slug: '',
  isActive: true,
  order: 1
})

// 1. Hàm hỗ trợ: Tự động tạo Slug chuẩn SEO từ Tiếng Việt
const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const updateSlug = () => {
  if (!isEditing.value) {
    formData.value.slug = generateSlug(formData.value.name_vi)
  }
}

// 2. Lấy dữ liệu từ Collection 'categories'
const fetchCategories = async () => {
  try {
    const snap = await getDocs(collection(db, 'categories'))
    const data = []
    snap.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() })
    })
    // Sắp xếp theo thứ tự (order)
    categories.value = data.sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error)
  }
}

onMounted(fetchCategories)

// 3. Xử lý Modal Thêm/Sửa
const openAddModal = () => {
  isEditing.value = false
  formData.value = { name_vi: '', name_en: '', slug: '', isActive: true, order: categories.value.length + 1 }
  showModal.value = true
}

const openEditModal = (cat) => {
  isEditing.value = true
  currentCategoryId.value = cat.id
  formData.value = { ...cat } // Copy dữ liệu vào form
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// 4. Lưu dữ liệu (Create & Update)
const saveCategory = async () => {
  if (!formData.value.name_vi) {
    alert("Vui lòng nhập tên danh mục (Tiếng Việt)!")
    return
  }
  
  try {
    if (isEditing.value) {
      // Sửa
      await updateDoc(doc(db, 'categories', currentCategoryId.value), {
        ...formData.value,
        updatedAt: serverTimestamp()
      })
      alert("Cập nhật danh mục thành công!")
    } else {
      // Thêm mới
      await addDoc(collection(db, 'categories'), {
        ...formData.value,
        bannerUrl: null, 
        createdAt: serverTimestamp()
      })
      alert("Thêm danh mục mới thành công!")
    }
    closeModal()
    fetchCategories()
  } catch (error) {
    console.error("Lỗi lưu danh mục:", error)
    alert("Có lỗi xảy ra khi lưu!")
  }
}

// 5. Xóa danh mục
const deleteCategory = async (id) => {
  if (!confirm("⚠️ Chú ý: Xóa danh mục này sẽ không xóa các sản phẩm bên trong nó. Bạn có chắc chắn muốn xóa?")) return
  try {
    await deleteDoc(doc(db, 'categories', id))
    fetchCategories()
  } catch (error) {
    console.error("Lỗi xóa danh mục:", error)
    alert("Có lỗi xảy ra khi xóa!")
  }
}

// 6. Upload Banner
const handleBannerUpload = async (event, catId) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isUploading.value = true
    const fileRef = storageRef(storage, `banners/categories/${Date.now()}_${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadUrl = await getDownloadURL(fileRef)

    await updateDoc(doc(db, 'categories', catId), {
      bannerUrl: downloadUrl,
      updatedAt: serverTimestamp()
    })

    alert("Đã cập nhật banner thành công!")
    fetchCategories()
  } catch (error) {
    alert("Lỗi upload ảnh banner!")
    console.error(error)
  } finally {
    isUploading.value = false
    event.target.value = '' 
  }
}

// 7. Bật/Tắt nhanh hiển thị
const toggleVisibility = async (cat) => {
  try {
    await updateDoc(doc(db, 'categories', cat.id), {
      isActive: !cat.isActive
    })
    cat.isActive = !cat.isActive
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error)
  }
}
</script>

<template>
  <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 animate-fade-in relative">
    
    <!-- Tiêu đề & Nút Thêm -->
    <div class="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-black text-slate-800 uppercase">Quản lý Danh Mục</h2>
        <p class="text-xs text-slate-400 font-medium mt-1">Hệ thống danh mục độc lập. Quản lý hiển thị, thứ tự và banner.</p>
      </div>
      <button @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all cursor-pointer">
        + Thêm danh mục
      </button>
    </div>

    <!-- Thông báo Upload -->
    <div v-if="isUploading" class="mb-4 p-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl text-center animate-pulse">
      Đang tải ảnh lên server, vui lòng đợi...
    </div>

    <!-- Lưới hiển thị danh mục -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="cat in categories" :key="cat.id" 
           :class="['border rounded-2xl overflow-hidden shadow-sm transition-all group flex flex-col', cat.isActive ? 'border-slate-200 bg-slate-50' : 'border-red-100 bg-red-50/30 opacity-70']">
        
        <!-- Khung ảnh Banner -->
        <div class="h-32 bg-slate-200 relative flex items-center justify-center overflow-hidden shrink-0">
          <img v-if="cat.bannerUrl" :src="cat.bannerUrl" class="w-full h-full object-cover" />
          <div v-else class="text-slate-400 flex flex-col items-center">
            <span class="text-2xl mb-1">🖼️</span>
            <span class="text-[9px] font-black uppercase tracking-wider">Chưa có Banner</span>
          </div>
          
          <label class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span class="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-600 rounded-lg">
              {{ cat.bannerUrl ? 'Đổi banner' : 'Tải banner lên' }}
            </span>
            <input type="file" class="hidden" accept="image/*" @change="e => handleBannerUpload(e, cat.id)" :disabled="isUploading" />
          </label>
        </div>

        <!-- Thông tin & Nút chức năng -->
        <div class="p-4 flex-1 flex flex-col justify-between bg-white">
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">{{ cat.order }}</span>
              <h3 class="text-sm font-black text-slate-800 uppercase">{{ cat.name_vi }}</h3>
            </div>
            <p v-if="cat.name_en" class="text-[10px] font-bold text-slate-400 ml-8 uppercase">{{ cat.name_en }}</p>
            <p class="text-[10px] text-blue-500 mt-2 bg-blue-50 px-2 py-1 rounded-lg inline-block font-mono">/{{ cat.slug }}</p>
          </div>
          
          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <button @click="toggleVisibility(cat)" :class="['text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer', cat.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200']">
              {{ cat.isActive ? 'Đang hiện' : 'Đang ẩn' }}
            </button>
            <div class="flex gap-2">
              <button @click="openEditModal(cat)" class="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Sửa">✏️</button>
              <button @click="deleteCategory(cat.id)" class="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Xóa">🗑️</button>
            </div>
          </div>
        </div>

      </div>

      <div v-if="categories.length === 0" class="col-span-full p-10 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        Chưa có danh mục nào. Hãy bấm "Thêm danh mục" để bắt đầu!
      </div>
    </div>

    <!-- Modal Thêm/Sửa -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-black uppercase text-slate-800 tracking-wide">{{ isEditing ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-800 text-xl font-bold cursor-pointer">&times;</button>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Tên tiếng Việt -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tên danh mục (VI) <span class="text-red-500">*</span></label>
            <input v-model="formData.name_vi" @input="updateSlug" type="text" placeholder="VD: Máy Phay CNC..." class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-0 transition-colors outline-none" />
          </div>

          <!-- Tên tiếng Anh -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tên danh mục (EN)</label>
            <input v-model="formData.name_en" type="text" placeholder="VD: CNC Milling Machine..." class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-0 transition-colors outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Slug -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Đường dẫn (Slug)</label>
              <input v-model="formData.slug" type="text" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 focus:border-blue-500 outline-none" />
            </div>
            
            <!-- Vị trí -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Thứ tự hiển thị</label>
              <input v-model.number="formData.order" type="number" min="1" class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none text-center" />
            </div>
          </div>

          <!-- Trạng thái -->
          <div class="flex items-center gap-3 pt-2">
            <input v-model="formData.isActive" type="checkbox" id="status" class="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
            <label for="status" class="text-sm font-bold text-slate-700 cursor-pointer">Hiển thị danh mục này trên Web</label>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="closeModal" class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">Hủy</button>
          <button @click="saveCategory" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-colors cursor-pointer">Lưu dữ liệu</button>
        </div>
      </div>
    </div>

  </div>
</template>