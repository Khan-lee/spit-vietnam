<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../../firebase' 
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const brands = ref([])
const isUploading = ref(false)
const storage = getStorage()

// Lấy danh sách nhãn hàng
const fetchBrands = async () => {
  const querySnapshot = await getDocs(collection(db, "brands"))
  brands.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Xử lý Upload file từ máy tính
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploading.value = true
  
  try {
    // 1. Tạo đường dẫn lưu file trên Storage (ví dụ: brands/tên-file)
    const fileRef = storageRef(storage, `brands/${Date.now()}_${file.name}`)
    
    // 2. Tải file lên
    const snapshot = await uploadBytes(fileRef, file)
    
    // 3. Lấy Link ảnh công khai
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // 4. Lưu Link này vào Firestore
    await addDoc(collection(db, "brands"), {
      logoUrl: downloadURL,
      storagePath: snapshot.ref.fullPath // Lưu đường dẫn để sau này xóa file cho sạch
    })

    await fetchBrands()
    alert('Tải logo lên thành công!')
  } catch (e) {
    console.error("Lỗi upload:", e)
    alert('Có lỗi xảy ra khi tải ảnh lên.')
  } finally {
    isUploading.value = false
    event.target.value = '' // Reset input file
  }
}

// Xóa nhãn hàng (Xóa cả trên Store và Firestore)
const deleteBrand = async (brand) => {
  if (confirm('Bạn có chắc muốn xóa nhãn hàng này?')) {
    try {
      // Xóa file trên Storage nếu có đường dẫn
      if (brand.storagePath) {
        const fileRef = storageRef(storage, brand.storagePath)
        await deleteObject(fileRef)
      }
      // Xóa record trên Firestore
      await deleteDoc(doc(db, "brands", brand.id))
      await fetchBrands()
    } catch (e) {
      console.error("Lỗi khi xóa:", e)
    }
  }
}

onMounted(fetchBrands)
</script>

<template>
  <div class="p-8 bg-white rounded-4xl shadow-sm border border-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-2xl font-black uppercase italic">Quản lý nhãn hàng đối tác</h2>
      
      <label class="relative cursor-pointer bg-slate-950 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
        <span v-if="!isUploading">➕ TẢI LOGO MỚI</span>
        <span v-else class="animate-pulse">ĐANG TẢI...</span>
        <input type="file" class="hidden" accept="image/*" @change="handleFileUpload" :disabled="isUploading" />
      </label>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div v-for="brand in brands" :key="brand.id" 
           class="group relative bg-slate-50 p-6 rounded-4xl border border-slate-100 aspect-video flex items-center justify-center hover:shadow-xl transition-all duration-500">
        
        <img :src="brand.logoUrl" class="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all shadow-sm" />
        
        <button @click="deleteBrand(brand)" 
                class="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:scale-110">
          ✕
        </button>
      </div>
    </div>

    <div v-if="brands.length === 0" class="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">
      Chưa có logo nào được tải lên
    </div>
  </div>
</template>