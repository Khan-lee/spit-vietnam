<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { uploadToCloudinary } from '../utils/cloudinary'

// Dữ liệu danh mục độc lập
const categories = ref([])
const isUploading = ref(false)

// Trạng thái Form Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentCategoryId = ref(null)
// ⚡ UPDATE MỚI: Thêm trường "parentId" — nếu để null/trống nghĩa là DANH MỤC CHA (gốc),
// nếu có giá trị nghĩa là DANH MỤC CON, giá trị đó chính là ID của danh mục cha nó thuộc về.
// Toàn bộ danh mục CŨ (chưa từng có trường này) mặc định được coi là Danh mục cha,
// KHÔNG có gì thay đổi trên web cho tới khi Admin chủ động vào sửa lại từng danh mục.
const formData = ref({
  name_vi: '',
  name_en: '',
  slug: '',
  isActive: true,
  order: 1,
  parentId: null
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

// =========================================================================
// ⚡ UPDATE MỚI: LOGIC XÂY DỰNG CÂY DANH MỤC CHA/CON
// =========================================================================

// Danh sách "Danh mục cha" hợp lệ để chọn trong dropdown của Form (chỉ những danh mục
// KHÔNG có parentId mới được chọn làm cha -> tự động giới hạn tối đa 2 cấp (cha -> con),
// không cho lồng sâu hơn, tránh phức tạp hóa không cần thiết).
// Khi đang SỬA 1 danh mục, phải loại chính nó ra khỏi danh sách để không thể tự chọn chính
// mình làm cha của chính mình.
const parentCategoryOptions = computed(() => {
  return categories.value.filter(c => !c.parentId && c.id !== currentCategoryId.value)
})

// Gom danh mục thành dạng cây: mỗi phần tử là 1 Danh mục cha kèm mảng "children" (danh mục
// con thuộc về nó). Danh mục con nào có parentId trỏ tới 1 cha ĐÃ BỊ XÓA (không còn tồn tại)
// sẽ được gom vào nhóm "Chưa phân loại" ở cuối để không bị "mất tích" khỏi giao diện quản lý.
const categoryTree = computed(() => {
  const parents = categories.value.filter(c => !c.parentId)
  const tree = parents.map(parent => ({
    ...parent,
    children: categories.value.filter(c => c.parentId === parent.id)
  }))

  const parentIds = new Set(parents.map(p => p.id))
  const orphanChildren = categories.value.filter(c => c.parentId && !parentIds.has(c.parentId))
  if (orphanChildren.length > 0) {
    tree.push({ id: '__orphan__', name_vi: 'Chưa phân loại (danh mục cha đã bị xóa)', children: orphanChildren, isOrphanGroup: true })
  }

  return tree
})

// 3. Xử lý Modal Thêm/Sửa
const openAddModal = () => {
  isEditing.value = false
  currentCategoryId.value = null
  // ⚡ UPDATE MỚI: Reset kèm parentId = null (mặc định thêm mới là Danh mục cha)
  formData.value = { name_vi: '', name_en: '', slug: '', isActive: true, order: categories.value.length + 1, parentId: null }
  showModal.value = true
}

const openEditModal = (cat) => {
  isEditing.value = true
  currentCategoryId.value = cat.id
  // ⚡ UPDATE MỚI: Chuẩn hóa parentId khi nạp vào Form — danh mục CŨ chưa từng có trường
  // này sẽ mặc định là null (Danh mục cha), tránh lỗi hiển thị sai trong dropdown chọn cha.
  formData.value = { ...cat, parentId: cat.parentId || null }
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

  // ⚡ UPDATE MỚI: Kiểm tra an toàn — không cho phép 1 danh mục tự chọn chính nó làm cha
  if (isEditing.value && formData.value.parentId === currentCategoryId.value) {
    alert("Danh mục không thể tự chọn chính nó làm Danh mục cha!")
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
  // ⚡ UPDATE MỚI: Chặn xóa 1 Danh mục cha nếu bên trong nó vẫn còn Danh mục con —
  // tránh làm "mồ côi" hàng loạt danh mục con một cách âm thầm không kiểm soát được.
  const childrenCount = categories.value.filter(c => c.parentId === id).length
  if (childrenCount > 0) {
    alert(`Không thể xóa! Danh mục này đang có ${childrenCount} Danh mục con bên trong.\nVui lòng xóa hoặc chuyển các danh mục con sang danh mục cha khác trước.`)
    return
  }

  if (!confirm("⚠️ Chú ý: Xóa danh mục này sẽ không xóa các sản phẩm bên trong nó. Bạn có chắc chắn muốn xóa?")) return
  try {
    await deleteDoc(doc(db, 'categories', id))
    fetchCategories()
  } catch (error) {
    console.error("Lỗi xóa danh mục:", error)
    alert("Có lỗi xảy ra khi xóa!")
  }
}

// 6. Upload Banner qua Cloudinary
const handleBannerUpload = async (event, catId) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isUploading.value = true
    
    // Gọi trực tiếp hàm helper uploadToCloudinary
    const downloadUrl = await uploadToCloudinary(file)

    if (downloadUrl) {
      await updateDoc(doc(db, 'categories', catId), {
        bannerUrl: downloadUrl,
        updatedAt: serverTimestamp()
      })

      alert("Đã cập nhật banner thành công!")
      fetchCategories()
    }
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
      Đang tải ảnh lên Cloudinary, vui lòng đợi...
    </div>

    <!-- 
      ⚡ UPDATE MỚI: ĐỔI TỪ LƯỚI PHẲNG SANG HIỂN THỊ DẠNG CÂY (CHA -> CON)
      Mỗi Danh mục cha là 1 khối tiêu đề lớn, bên dưới là lưới các Danh mục con thuộc về
      nó (thụt lề, viền trái để phân biệt rõ quan hệ cha-con). Danh mục cha nào chưa có
      con nào vẫn hiển thị bình thường (không có gì thay đổi so với trước), đảm bảo không
      phá vỡ trải nghiệm hiện tại khi Admin chưa kịp gán danh mục con cho cha nào cả.
    -->
    <div class="space-y-8">
      <div v-for="group in categoryTree" :key="group.id" class="space-y-3">
        
        <!-- Tiêu đề nhóm Danh mục cha -->
        <div class="flex items-center gap-2.5 pb-2 border-b-2" :class="group.isOrphanGroup ? 'border-amber-200' : 'border-blue-100'">
          <span :class="['w-2 h-6 rounded-full inline-block', group.isOrphanGroup ? 'bg-amber-400' : 'bg-blue-600']"></span>
          <h3 class="text-sm font-black uppercase tracking-wide" :class="group.isOrphanGroup ? 'text-amber-600' : 'text-slate-800'">
            {{ group.name_vi }}
          </h3>
          <span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{{ group.children.length }} danh mục con</span>
        </div>

        <!-- Card của chính Danh mục cha (bỏ qua với nhóm "Chưa phân loại" vì nó không phải 1 category thật) -->
        <div v-if="!group.isOrphanGroup" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div :class="['border rounded-2xl overflow-hidden shadow-sm transition-all group flex flex-col ring-2 ring-blue-100', group.isActive ? 'border-slate-200 bg-slate-50' : 'border-red-100 bg-red-50/30 opacity-70']">
            
            <!-- Khung ảnh Banner -->
            <div class="h-32 bg-slate-200 relative flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="group.bannerUrl" :src="group.bannerUrl" class="w-full h-full object-cover" />
              <div v-else class="text-slate-400 flex flex-col items-center">
                <span class="text-2xl mb-1">🖼️</span>
                <span class="text-[9px] font-black uppercase tracking-wider">Chưa có Banner</span>
              </div>
              
              <label class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span class="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-600 rounded-lg">
                  {{ group.bannerUrl ? 'Đổi banner' : 'Tải banner lên' }}
                </span>
                <input type="file" class="hidden" accept="image/*" @change="e => handleBannerUpload(e, group.id)" :disabled="isUploading" />
              </label>
            </div>

            <!-- Thông tin & Nút chức năng -->
            <div class="p-4 flex-1 flex flex-col justify-between bg-white">
              <div class="mb-4">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">{{ group.order }}</span>
                  <h3 class="text-sm font-black text-slate-800 uppercase">{{ group.name_vi }}</h3>
                </div>
                <p v-if="group.name_en" class="text-[10px] font-bold text-slate-400 ml-8 uppercase">{{ group.name_en }}</p>
                <p class="text-[10px] text-blue-500 mt-2 bg-blue-50 px-2 py-1 rounded-lg inline-block font-mono">/{{ group.slug }}</p>
                <!-- ⚡ UPDATE MỚI: Nhãn xác nhận đây là Danh mục cha -->
                <span class="block mt-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-max uppercase">📁 Danh mục cha</span>
              </div>
              
              <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                <button @click="toggleVisibility(group)" :class="['text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer', group.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200']">
                  {{ group.isActive ? 'Đang hiện' : 'Đang ẩn' }}
                </button>
                <div class="flex gap-2">
                  <button @click="openEditModal(group)" class="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Sửa">✏️</button>
                  <button @click="deleteCategory(group.id)" class="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Xóa">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lưới các Danh mục CON thuộc về nhóm cha này (thụt lề, viền trái để phân biệt) -->
        <div v-if="group.children.length > 0" class="pl-4 sm:pl-6 border-l-4 border-blue-100 ml-2">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="cat in group.children" :key="cat.id" 
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
                  <!-- ⚡ UPDATE MỚI: Nhãn xác nhận đây là Danh mục con, thuộc cha nào -->
                  <span class="block mt-1.5 text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-max uppercase">↳ Con của: {{ group.name_vi }}</span>
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
          </div>
        </div>
      </div>

      <div v-if="categoryTree.length === 0" class="p-10 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
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

          <!-- ⚡ UPDATE MỚI: DROPDOWN CHỌN DANH MỤC CHA (nếu để "Đây là danh mục cha" thì
               danh mục này sẽ hiển thị như 1 nhóm gốc; nếu chọn 1 cha cụ thể, danh mục này
               sẽ trở thành Danh mục con, nằm thụt lề bên trong nhóm cha đó) -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Thuộc Danh mục cha</label>
            <select v-model="formData.parentId" class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-0 transition-colors outline-none bg-white cursor-pointer">
              <option :value="null">— Đây là Danh mục cha (không có cha) —</option>
              <option v-for="p in parentCategoryOptions" :key="p.id" :value="p.id">{{ p.name_vi }}</option>
            </select>
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