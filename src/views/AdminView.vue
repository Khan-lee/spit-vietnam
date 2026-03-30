<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { db, auth } from '../firebase'
// --- PHẦN THÊM MỚI ---
import AdminSidebar from '../components/AdminSidebar.vue'

const router = useRouter()
const isAuthenticated = ref(false)
const isInitialLoading = ref(true)
const isSubmitting = ref(false)
const loginError = ref(false)
const passwordInput = ref('')
const ADMIN_EMAIL = 'spitsaigon@gmail.com'

// --- GIỮ NGUYÊN LOGIC CŨ ---
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

// Tìm đến hàm handleLogin trong AdminView.vue và cập nhật đường dẫn:
const handleLogin = async () => {
  if (!passwordInput.value) return
  try {
    loginError.value = false; isSubmitting.value = true
    await setPersistence(auth, browserSessionPersistence)
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput.value)
    
    // CẬP NHẬT: Điều hướng vào dashboard sau khi đăng nhập thành công
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
const name = ref(''); const brand = ref(''); const category = ref('');
const price = ref(0); const image = ref(''); const description = ref('');
const stock = ref(0); const editingId = ref(null)

const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"))
  products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const handleSubmit = async () => {
  if (!name.value || !brand.value || !price.value) return alert("Thiếu thông tin!")
  try {
    isSubmitting.value = true
    const data = {
      name: name.value, brand: brand.value, category: category.value,
      price: Number(price.value), stock: Number(stock.value),
      image: image.value || 'https://via.placeholder.com/200',
      description: description.value, updatedAt: serverTimestamp()
    }
    if (editingId.value) {
      await updateDoc(doc(db, "products", editingId.value), data)
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() })
    }
    resetForm(); fetchProducts()
  } catch (e) { alert("Lỗi kết nối!") }
  finally { isSubmitting.value = false }
}

const startEdit = (p) => {
  editingId.value = p.id; name.value = p.name; brand.value = p.brand;
  category.value = p.category; price.value = p.price; image.value = p.image;
  description.value = p.description || ''; stock.value = p.stock || 0;
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const confirmDelete = async (id, pName) => {
  if (confirm(`Xóa ${pName}?`)) { await deleteDoc(doc(db, id)); fetchProducts() }
}

const resetForm = () => {
  editingId.value = null; name.value = ''; brand.value = ''; category.value = ''; 
  price.value = 0; image.value = ''; description.value = ''; stock.value = 0;
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
          </div>
        </div>

        <div v-else-if="isAuthenticated" class="max-w-6xl mx-auto p-6 md:p-10">
          <div class="flex justify-between items-center mb-10">
            <h1 class="text-2xl font-black text-slate-900 uppercase italic">Quản lý hàng hóa</h1>
            <button @click="handleLogout" class="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all">Đăng xuất</button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1">
              <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 sticky top-6">
                <div class="space-y-4">
                  <input v-model="name" placeholder="Tên sản phẩm" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" />
                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="brand" placeholder="Hãng" class="p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                    <input v-model="category" placeholder="Loại" class="p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="price" type="number" class="p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-red-600" />
                    <input v-model="stock" type="number" placeholder="Kho" class="p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-blue-600" />
                  </div>
                  <input v-model="image" placeholder="Link ảnh (URL)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                  <textarea v-model="description" rows="4" placeholder="Mô tả..." class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm"></textarea>
                  <button @click="handleSubmit" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all uppercase text-[10px]">XÁC NHẬN</button>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2 bg-white rounded-4xl shadow-xl overflow-hidden border border-slate-100">
              <table class="w-full text-left">
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="p in products" :key="p.id" class="hover:bg-blue-50/30">
                    <td class="p-5 flex items-center gap-4">
                      <img :src="p.image" class="w-12 h-12 rounded-xl object-contain bg-slate-50 border p-1" />
                      <div>
                        <div class="text-sm font-black text-slate-800">{{ p.name }}</div>
                        <div class="text-[9px] font-black text-blue-500 uppercase">TỒN: {{ p.stock || 0 }}</div>
                      </div>
                    </td>
                    <td class="p-5 text-right font-black text-sm italic">{{ p.price?.toLocaleString() }}đ</td>
                    <td class="p-5 text-right">
                      <button @click="startEdit(p)" class="text-blue-500 font-black text-[10px] uppercase mr-3">Sửa</button>
                      <button @click="confirmDelete(p.id, p.name)" class="text-red-300 hover:text-red-500 font-black text-[10px] uppercase">Xóa</button>
                    </td>
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