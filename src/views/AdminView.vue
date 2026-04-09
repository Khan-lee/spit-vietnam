<script setup>
import { ref, onMounted, computed } from 'vue' // Thêm computed
import { useRouter } from 'vue-router'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { db, auth } from '../firebase'
import AdminSidebar from '../components/AdminSidebar.vue'

const router = useRouter()
const isAuthenticated = ref(false)
const isInitialLoading = ref(true)
const isSubmitting = ref(false)
const loginError = ref(false)
const passwordInput = ref('')
const ADMIN_EMAIL = 'spitsaigon@gmail.com'

// --- BIẾN TÌM KIẾM ---
const searchQuery = ref('')

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      fetchProducts()
    } else {
      isAuthenticated.value = false
    }
    isInitialLoading.value = false
  })
})

const handleLogin = async () => {
  if (!passwordInput.value) return
  try {
    loginError.value = false; isSubmitting.value = true
    await setPersistence(auth, browserSessionPersistence)
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput.value)
    router.push('/admin/dashboard')
    passwordInput.value = ''
  } catch (error) {
    loginError.value = true
  } finally {
    isSubmitting.value = false
  }
}

const handleLogout = async () => {
  await signOut(auth)
  router.push('/')
}

const products = ref([])
const editingId = ref(null)

// --- CẬP NHẬT BIẾN ĐA NGÔN NGỮ ---
const name_vi = ref(''); const name_en = ref('');
const category_vi = ref(''); const category_en = ref('');
const description_vi = ref(''); const description_en = ref('');
const brand = ref(''); const price = ref(0); const stock = ref(0);
const image = ref('');

// Logic lọc sản phẩm theo tên hoặc hãng
const filteredProducts = computed(() => {
  return products.value.filter(p => 
    (p.name_vi?.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
    (p.brand?.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"))
  products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const handleSubmit = async () => {
  if (!name_vi.value || !brand.value || !price.value) return alert("Thiếu thông tin quan trọng!")
  
  try {
    isSubmitting.value = true
    const data = {
      name_vi: name_vi.value,
      name_en: name_en.value || name_vi.value,
      category_vi: category_vi.value,
      category_en: category_en.value || category_vi.value,
      description_vi: description_vi.value,
      description_en: description_en.value || description_vi.value,
      brand: brand.value,
      price: Number(price.value),
      stock: Number(stock.value),
      image: image.value || 'https://via.placeholder.com/200',
      updatedAt: serverTimestamp()
    }

    if (editingId.value) {
      await updateDoc(doc(db, "products", editingId.value), data)
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() })
    }
    resetForm(); fetchProducts()
    alert("Cập nhật hàng hóa thành công!")
  } catch (e) { 
    alert("Lỗi kết nối Firebase!") 
  } finally { 
    isSubmitting.value = false 
  }
}

const startEdit = (p) => {
  editingId.value = p.id;
  name_vi.value = p.name_vi || p.name || '';
  name_en.value = p.name_en || '';
  category_vi.value = p.category_vi || p.category || '';
  category_en.value = p.category_en || '';
  description_vi.value = p.description_vi || p.description || '';
  description_en.value = p.description_en || '';
  brand.value = p.brand || '';
  price.value = p.price || 0;
  stock.value = p.stock || 0;
  image.value = p.image || '';
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const confirmDelete = async (id, pName) => {
  if (confirm(`Xóa ${pName}?`)) { 
    await deleteDoc(doc(db, "products", id)); 
    fetchProducts() 
  }
}

const resetForm = () => {
  editingId.value = null;
  name_vi.value = ''; name_en.value = '';
  category_vi.value = ''; category_en.value = '';
  description_vi.value = ''; description_en.value = '';
  brand.value = ''; price.value = 0; stock.value = 0; image.value = '';
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
    <AdminSidebar v-if="isAuthenticated" />

    <div :class="['flex-1 transition-all duration-300', isAuthenticated ? 'ml-20 md:ml-64' : '']">
      <Transition name="page-fade" mode="out-in">
        
        <div v-if="!isAuthenticated && !isInitialLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
          <div class="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
            <div class="text-center mb-8">
              <h2 class="text-xl font-black uppercase tracking-tight text-slate-800 italic">Hệ thống SPIT</h2>
              <p class="text-slate-400 text-[10px] font-bold uppercase mt-1">Admin Panel</p>
            </div>
            <input v-model="passwordInput" type="password" @keyup.enter="handleLogin" placeholder="••••••••" class="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500 text-center font-bold" />
            <button @click="handleLogin" :disabled="isSubmitting" class="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">LOGIN</button>
            <p v-if="loginError" class="text-red-500 text-[10px] font-bold text-center mt-4 uppercase">Sai mật khẩu hệ thống</p>
          </div>
        </div>

        <div v-else-if="isAuthenticated" class="max-w-6xl mx-auto p-6 md:p-10">
          <div class="flex justify-between items-center mb-10">
            <h1 class="text-2xl font-black text-slate-900 uppercase italic">Quản lý hàng hóa</h1>
            <button @click="handleLogout" class="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all">Đăng xuất</button>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-5">
              <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 sticky top-6">
                <div v-if="image" class="mb-6 flex justify-center">
                   <img :src="image" class="w-32 h-32 object-contain rounded-2xl border-2 border-dashed border-slate-200 p-2 shadow-inner" @error="image = 'https://via.placeholder.com/200'" />
                </div>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 gap-2">
                    <input v-model="name_vi" placeholder="Tên sản phẩm (VI)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold border border-transparent focus:border-blue-200" />
                    <input v-model="name_en" placeholder="Product Name (EN)" class="w-full p-3 bg-slate-100/50 rounded-xl outline-none text-sm italic border border-transparent focus:border-blue-200" />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="brand" placeholder="Hãng / Brand" class="p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                    <div class="space-y-1">
                      <input v-model="category_vi" placeholder="Loại (VI)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                      <input v-model="category_en" placeholder="Category (EN)" class="w-full p-2 bg-slate-100/50 rounded-lg outline-none text-[10px] italic" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div class="relative">
                      <input v-model="price" type="number" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-red-600 pl-8" />
                      <span class="absolute left-3 top-3.5 text-[10px] font-bold text-red-400">₫</span>
                    </div>
                    <input v-model="stock" type="number" placeholder="Kho" class="p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-blue-600" />
                  </div>

                  <input v-model="image" placeholder="Link ảnh (URL)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />

                  <div class="space-y-2">
                    <textarea v-model="description_vi" rows="3" placeholder="Mô tả chi tiết (VI)..." class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm leading-relaxed"></textarea>
                    <textarea v-model="description_en" rows="3" placeholder="Technical Description (EN)..." class="w-full p-3 bg-slate-100/50 rounded-xl outline-none text-sm italic leading-relaxed"></textarea>
                  </div>

                  <button @click="handleSubmit" :disabled="isSubmitting" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all uppercase text-[10px] tracking-[0.2em]">
                    {{ isSubmitting ? 'ĐANG XỬ LÝ...' : (editingId ? 'CẬP NHẬT SẢN PHẨM' : 'XÁC NHẬN THÊM MỚI') }}
                  </button>
                  <button v-if="editingId" @click="resetForm" class="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Hủy chỉnh sửa</button>
                </div>
              </div>
            </div>

            <div class="xl:col-span-7 bg-white rounded-4xl shadow-xl overflow-hidden border border-slate-100">
              <div class="p-5 border-b border-slate-50">
                <input v-model="searchQuery" placeholder="Tìm kiếm tên sản phẩm hoặc hãng..." class="w-full px-4 py-2 bg-slate-50 rounded-full text-xs outline-none border border-transparent focus:border-slate-200" />
              </div>

              <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th class="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                    <th class="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá bán</th>
                    <th class="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="p in filteredProducts" :key="p.id" class="hover:bg-blue-50/30 transition-colors group">
                    <td class="p-5 flex items-center gap-4">
                      <div class="relative">
                        <img :src="p.image" class="w-14 h-14 rounded-2xl object-contain bg-white border border-slate-100 p-1 shadow-sm group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div class="text-sm font-black text-slate-800 leading-tight">{{ p.name_vi || p.name }}</div>
                        <div class="text-[10px] font-medium text-slate-400 italic mb-1">{{ p.name_en }}</div>
                        <div class="inline-flex items-center gap-2">
                           <span class="px-2 py-0.5 rounded-full bg-blue-50 text-[8px] font-black text-blue-500 uppercase tracking-tighter">TỒN: {{ p.stock || 0 }}</span>
                           <span class="text-[8px] font-bold text-slate-300 uppercase">{{ p.brand }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-5 text-right font-black text-sm italic text-slate-700">
                      {{ p.price?.toLocaleString() }}<span class="text-[10px] ml-0.5">đ</span>
                    </td>
                    <td class="p-5 text-right">
                      <div class="flex justify-end gap-2">
                        <button @click="startEdit(p)" class="p-2 hover:bg-blue-100 rounded-lg transition-colors group/btn">
                          <span class="text-blue-500 font-black text-[10px] uppercase">Sửa</span>
                        </button>
                        <button @click="confirmDelete(p.id, p.name_vi || p.name)" class="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <span class="text-red-300 hover:text-red-500 font-black text-[10px] uppercase">Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredProducts.length === 0">
                    <td colspan="3" class="p-10 text-center text-slate-400 text-xs italic">Không tìm thấy sản phẩm nào...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>