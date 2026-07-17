<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage' 
import { db, auth, storage } from '../firebase' 
import AdminSidebar from '../components/AdminSidebar.vue'

const router = useRouter()
const isAuthenticated = ref(false)
const isInitialLoading = ref(true)
const isSubmitting = ref(false)
const loginError = ref(false)
const passwordInput = ref('')
const ADMIN_EMAIL = 'spitsaigon@gmail.com'

// --- BIẾN ĐIỀU HƯỚNG TAB TRONG ADMIN ---
const currentTab = ref('products') // Có 2 chế độ: 'products' hoặc 'brands'

// --- BIẾN TÌM KIẾM ---
const searchQuery = ref('')
const brandSearchQuery = ref('')

// --- BIẾN QUẢN LÝ KHUYẾN MÃI ---
const hasPromotion = ref(false)
const promotionType = ref('percentage')
const promotionValue = ref('')
const activePromotions = ref([]) 

// --- BIẾN QUẢN LÝ THƯ VIỆN ẢNH PHỤ ---
const subImages = ref([])       // Lưu các chuỗi URL (ảnh đã có trên server hoặc link ngoài)
const subImageFiles = ref([])   // Lưu các file tạm chọn từ máy tính để chuẩn bị upload

// --- [ĐỒNG BỘ] BIẾN QUẢN LÝ NHÃN HÀNG (BRANDS) ---
const brands = ref([])
const brandName = ref('')
const brandLogoUrl = ref('')
const brandLogoFile = ref(null) // Biến lưu file logo tạm thời chọn từ máy
const brandDescription = ref('')
const editingBrandId = ref(null)

// --- [ĐỒNG BỘ] BIẾN QUẢN LÝ DANH MỤC (CATEGORIES) ---
const categories = ref([])
const categoryId = ref('') // Lưu ID document của Category để đồng bộ

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      fetchProducts()
      fetchBrands()
      fetchCategories() // Tải danh sách danh mục khi vào Admin
      fetchActivePromotions() 
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

const name_vi = ref(''); const name_en = ref('');
const category_vi = ref(''); const category_en = ref('');
const description_vi = ref(''); const description_en = ref('');
const gift_vi = ref(''); const gift_en = ref('');

const brand = ref(''); 
const brandId = ref(''); // Lưu ID document của Brand để đồng bộ truy vấn
const price = ref(0); const stock = ref(0);
const image = ref('');
const imageFile = ref(null);

// NÂNG CẤP: Thêm biến reactive lưu trữ Link sản phẩm tùy biến cấu hình từ Admin
const custom_url = ref('')

// --- HÀM LẤY DANH SÁCH DANH MỤC ---
const fetchCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "categories"))
    // Lấy danh mục đang active và sắp xếp theo số thứ tự order
    categories.value = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(c => c.isActive === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (e) {
    console.error("Lỗi lấy danh sách danh mục:", e)
  }
}

// Tự động gán tên danh mục (VI & EN) dựa trên ID được chọn ở dropdown
const handleCategorySelectChange = () => {
  const selected = categories.value.find(c => c.id === categoryId.value)
  if (selected) {
    category_vi.value = selected.name_vi || ''
    category_en.value = selected.name_en || ''
  } else {
    category_vi.value = ''
    category_en.value = ''
  }
}

// --- HÀM LẤY DANH SÁCH NHÃN HÀNG ---
const fetchBrands = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "brands"))
    brands.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name))
  } catch (e) {
    console.error("Lỗi lấy danh sách hãng:", e)
  }
}

// Tự động gán trường tên hãng (brand) dựa trên ID hãng được chọn ở dropdown
const handleBrandSelectChange = () => {
  const selected = brands.value.find(b => b.id === brandId.value)
  if (selected) {
    brand.value = selected.name
  } else {
    brand.value = ''
  }
}

const fetchActivePromotions = async () => {
  try {
    const q = query(collection(db, "promotions"), where("is_active", "==", true))
    const snap = await getDocs(q)
    activePromotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi:", e)
  }
}

const productsWithPromotions = computed(() => {
  return products.value.map(product => {
    const campaign = activePromotions.value.find(p => p.applied_ids?.includes(product.id))
    if (campaign) {
      return {
        ...product,
        displayPromoType: campaign.discount_type,
        displayPromoValue: campaign.discount_value,
        isCampaign: true 
      }
    }
    return {
      ...product,
      displayPromoType: product.promotionType,
      displayPromoValue: product.promotionValue,
      isCampaign: false
    }
  })
})

const filteredProducts = computed(() => {
  return productsWithPromotions.value.filter(p => 
    (p.name_vi?.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
    (p.brand?.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

// Bộ lọc tìm kiếm thời gian thực cho danh sách nhãn hàng
const filteredBrands = computed(() => {
  return brands.value.filter(b => 
    b.name?.toLowerCase().includes(brandSearchQuery.value.toLowerCase())
  )
})

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageFile.value = file
    image.value = URL.createObjectURL(file)
  }
}

const uploadImage = async () => {
  if (!imageFile.value) return image.value
  const fileRef = storageRef(storage, `products/${Date.now()}_${imageFile.value.name}`)
  await uploadBytes(fileRef, imageFile.value)
  return await getDownloadURL(fileRef)
}

const onSubFilesChange = (e) => {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    subImageFiles.value.push(file)
    subImages.value.push(URL.createObjectURL(file))
  })
}

const removeSubImage = (index) => {
  subImages.value.splice(index, 1)
  subImageFiles.value.splice(index, 1)
}

const uploadSubImages = async () => {
  const uploadedUrls = []
  for (let i = 0; i < subImages.value.length; i++) {
    const currentUrl = subImages.value[i]
    const currentFile = subImageFiles.value[i]

    if (currentFile) {
      const fileRef = storageRef(storage, `products/subs/${Date.now()}_${currentFile.name}`)
      await uploadBytes(fileRef, currentFile)
      const downloadUrl = await getDownloadURL(fileRef)
      uploadedUrls.push(downloadUrl)
    } else if (currentUrl && !currentUrl.startsWith('blob:')) {
      uploadedUrls.push(currentUrl)
    }
  }
  return uploadedUrls
}

const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"))
  products.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// --- THAO TÁC SUBMIT SẢN PHẨM ---
const handleSubmit = async () => {
  if (!name_vi.value || !brandId.value || !categoryId.value || !price.value) return alert("Thiếu thông tin quan trọng (Tên sản phẩm, Nhãn hàng, Danh mục, Giá bán)!")
  
  try {
    isSubmitting.value = true
    const finalImageUrl = await uploadImage()
    const finalSubImageUrls = await uploadSubImages()

    const data = {
      name_vi: name_vi.value,
      name_en: name_en.value || name_vi.value,
      categoryId: categoryId.value, // ĐỒNG BỘ BACKEND: Lưu ID danh mục
      category_vi: category_vi.value,
      category_en: category_en.value || category_vi.value,
      description_vi: description_vi.value,
      description_en: description_en.value || description_vi.value,
      gift_vi: gift_vi.value || '',
      gift_en: gift_en.value || '',
      brand: brand.value,
      brandId: brandId.value, // Lưu trữ phục vụ lọc On-page SEO
      price: Number(price.value),
      stock: Number(stock.value),
      image: finalImageUrl || 'https://via.placeholder.com/200',
      sub_images: finalSubImageUrls,
      custom_url: custom_url.value.trim(), // ĐỒNG BỘ BACKEND: Lưu link cấu hình tay vào Firestore
      updatedAt: serverTimestamp()
    }

    if (hasPromotion.value) {
      data.promotionType = promotionType.value
      data.promotionValue = promotionValue.value
    } else {
      data.promotionType = null
      data.promotionValue = null
    }

    if (editingId.value) {
      await updateDoc(doc(db, "products", editingId.value), data)
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() })
    }
    resetForm(); fetchProducts()
    alert("Cập nhật hàng hóa thành công!")
  } catch (e) { 
    alert("Lỗi kết nối Firebase khi lưu sản phẩm!") 
  } finally { 
    isSubmitting.value = false 
  }
}

// --- LOGIC TẢI ẢNH LOGO NHÃN HÀNG LÊN FIREBASE STORAGE ---
const onBrandLogoChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    brandLogoFile.value = file
    brandLogoUrl.value = URL.createObjectURL(file) 
  }
}

const uploadBrandLogo = async () => {
  if (!brandLogoFile.value) return brandLogoUrl.value 
  const fileRef = storageRef(storage, `brands/${Date.now()}_${brandLogoFile.value.name}`)
  await uploadBytes(fileRef, brandLogoFile.value)
  return await getDownloadURL(fileRef)
}

// --- THAO TÁC SUBMIT NHÃN HÀNG (BRANDS CRU) ---
const handleBrandSubmit = async () => {
  if (!brandName.value.trim() || (!brandLogoFile.value && !brandLogoUrl.value.trim()) || !brandDescription.value.trim()) {
    return alert("Vui lòng điền đủ thông tin nhãn hàng và cập nhật logo!")
  }

  try {
    isSubmitting.value = true
    const finalLogoUrl = await uploadBrandLogo()

    const brandData = {
      name: brandName.value.trim(),
      logoUrl: finalLogoUrl,
      description: brandDescription.value.trim(),
      updatedAt: serverTimestamp()
    }

    if (editingBrandId.value) {
      await updateDoc(doc(db, "brands", editingBrandId.value), brandData)
      alert(`Đã cập nhật thương hiệu ${brandName.value} thành công!`)
    } else {
      await addDoc(collection(db, "brands"), { ...brandData, createdAt: serverTimestamp() })
      alert(`Đã thêm mới thương hiệu ${brandName.value} thành công!`)
    }
    resetBrandForm(); fetchBrands(); fetchProducts(); 
  } catch (e) {
    alert("Lỗi kết nối Firebase khi lưu thương hiệu!")
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (p) => {
  editingId.value = p.id;
  name_vi.value = p.name_vi || p.name || '';
  name_en.value = p.name_en || '';
  
  // Tự động fill categoryId nếu đã lưu, nếu bản ghi cũ chưa lưu thì map ngược từ tên category_vi
  categoryId.value = p.categoryId || categories.value.find(c => c.name_vi === (p.category_vi || p.category))?.id || '';
  category_vi.value = p.category_vi || p.category || '';
  category_en.value = p.category_en || '';
  
  description_vi.value = p.description_vi || p.description || '';
  description_en.value = p.description_en || '';
  gift_vi.value = p.gift_vi || '';
  gift_en.value = p.gift_en || '';
  brandId.value = p.brandId || brands.value.find(b => b.name === p.brand)?.id || '';
  brand.value = p.brand || '';
  price.value = p.price || 0;
  stock.value = p.stock || 0;
  image.value = p.image || '';
  imageFile.value = null;

  // ĐỒNG BỘ BACKEND: Đổ dữ liệu link sản phẩm cũ ra ô input khi nhấn Edit
  custom_url.value = p.custom_url || '';

  subImages.value = p.sub_images ? [...p.sub_images] : []
  subImageFiles.value = p.sub_images ? new Array(p.sub_images.length).fill(null) : []

  if (p.displayPromoValue && p.displayPromoValue !== '0') {
    hasPromotion.value = true
    promotionType.value = p.displayPromoType || 'percentage'
    promotionValue.value = p.displayPromoValue
  } else {
    hasPromotion.value = false
    promotionValue.value = ''
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const startEditBrand = (b) => {
  editingBrandId.value = b.id
  brandName.value = b.name
  brandLogoUrl.value = b.logoUrl
  brandLogoFile.value = null 
  brandDescription.value = b.description
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const confirmDelete = async (id, pName) => {
  if (confirm(`Xóa ${pName}?`)) { 
    await deleteDoc(doc(db, "products", id)); 
    fetchProducts() 
  }
}

const confirmDeleteBrand = async (id, bName) => {
  if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn nhãn hàng "${bName}"?\nHành động này có thể làm ảnh hưởng đến các sản phẩm đang liên kết thuộc nhãn hàng này.`)) {
    await deleteDoc(doc(db, "brands", id))
    resetBrandForm(); fetchBrands(); fetchProducts();
  }
}

const resetForm = () => {
  editingId.value = null;
  name_vi.value = ''; name_en.value = '';
  categoryId.value = ''; // Reset ID Danh mục
  category_vi.value = ''; category_en.value = '';
  description_vi.value = ''; description_en.value = '';
  gift_vi.value = ''; gift_en.value = '';
  brandId.value = ''; brand.value = ''; 
  price.value = 0; stock.value = 0; image.value = '';
  imageFile.value = null;
  hasPromotion.value = false; promotionValue.value = '';
  custom_url.value = ''; // ĐỒNG BỘ BACKEND: Làm sạch input link sản phẩm khi reset form
  subImages.value = []
  subImageFiles.value = []
}

const resetBrandForm = () => {
  editingBrandId.value = null
  brandName.value = ''
  brandLogoUrl.value = ''
  brandLogoFile.value = null
  brandDescription.value = ''
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
          
          <div class="flex justify-between items-center mb-6">
            <div class="space-y-1">
              <h1 class="text-2xl font-black text-slate-900 uppercase italic">
                {{ currentTab === 'products' ? 'Quản lý hàng hóa' : 'Quản lý nhãn hàng đối tác' }}
              </h1>
              <p class="text-[10px] font-bold text-slate-400 uppercase">Hệ thống dữ liệu lõi SPIT</p>
            </div>
            <button @click="handleLogout" class="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all">Đăng xuất</button>
          </div>

          <div class="flex gap-6 mb-8 border-b border-slate-200/60 pb-3">
            <button 
              @click="currentTab = 'products'" 
              :class="['text-xs font-black uppercase tracking-wider pb-2 transition-all border-b-2 cursor-pointer', currentTab === 'products' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600']"
            >
              📦 Kho sản phẩm
            </button>
            <button 
              @click="currentTab = 'brands'" 
              :class="['text-xs font-black uppercase tracking-wider pb-2 transition-all border-b-2 cursor-pointer', currentTab === 'brands' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600']"
            >
              🏷️ Danh mục hãng đối tác
            </button>
          </div>

          <div v-if="currentTab === 'products'" class="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
            <div class="xl:col-span-5">
              <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 sticky top-6">
                
                <div class="mb-6">
                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 text-center">Hình ảnh sản phẩm</label>
                  <div class="relative group w-full aspect-square max-w-50 mx-auto overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all flex items-center justify-center bg-slate-50">
                    <input type="file" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                    <img v-if="image" :src="image" class="w-full h-full object-contain p-2" />
                    <div v-else class="text-center p-4">
                       <span class="text-2xl block">📷</span>
                       <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Chọn ảnh từ máy</p>
                    </div>
                  </div>

                  <div class="mt-4 pt-4 border-t border-slate-100">
                    <label class="block text-[10px] font-black uppercase text-slate-400 mb-2">Thư viện ảnh chi tiết (Nhiều hình ảnh)</label>
                    <div class="grid grid-cols-4 gap-2">
                      <div class="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors flex flex-col items-center justify-center bg-slate-50 cursor-pointer">
                        <input type="file" @change="onSubFilesChange" multiple class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                        <span class="text-sm font-bold text-slate-400">+ Ảnh</span>
                      </div>
                      <div v-for="(imgUrl, index) in subImages" :key="index" class="relative aspect-square rounded-xl border border-slate-100 bg-white p-1 group/thumb">
                        <img :src="imgUrl" class="w-full h-full object-contain" />
                        <button type="button" @click="removeSubImage(index)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black shadow-sm opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 gap-2">
                    <input v-model="name_vi" placeholder="Tên sản phẩm (VI)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold border border-transparent focus:border-blue-200" />
                    <input v-model="name_en" placeholder="Product Name (EN)" class="w-full p-3 bg-slate-100/50 rounded-xl outline-none text-sm italic border border-transparent focus:border-blue-200" />
                  </div>

                  <div class="grid grid-cols-1 gap-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <label class="text-[9px] font-black uppercase text-blue-400 ml-1 italic">Ưu đãi / Quà tặng (nếu có)</label>
                    <input v-model="gift_vi" placeholder="Ưu đãi (Ví dụ: Tặng kèm phụ kiện...)" class="w-full p-2 bg-white rounded-lg outline-none text-[11px] font-bold border border-transparent focus:border-blue-200" />
                    <input v-model="gift_en" placeholder="Special Offer (EN)" class="w-full p-2 bg-white/50 rounded-lg outline-none text-[10px] italic border border-transparent focus:border-blue-200" />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                      <select 
                        v-model="brandId" 
                        @change="handleBrandSelectChange"
                        class="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-blue-200"
                      >
                        <option value="">-- Chọn Hãng * --</option>
                        <option v-for="b in brands" :key="b.id" :value="b.id">
                          {{ b.name.toUpperCase() }}
                        </option>
                      </select>
                    </div>
                    
                    <!-- [CẬP NHẬT MỚI] Giao diện ô chọn Danh mục thay vì gõ tay -->
                    <div class="space-y-1">
                      <select 
                        v-model="categoryId" 
                        @change="handleCategorySelectChange"
                        class="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-blue-200 cursor-pointer"
                      >
                        <option value="">-- Chọn Danh Mục * --</option>
                        <option v-for="c in categories" :key="c.id" :value="c.id">
                          {{ c.name_vi.toUpperCase() }}
                        </option>
                      </select>
                      <!-- Input hiển thị tiếng Anh (Chỉ đọc) -->
                      <input v-model="category_en" readonly placeholder="Category (EN) - Tự động điền" class="w-full p-2 bg-slate-100/50 rounded-lg outline-none text-[10px] italic text-slate-400 cursor-not-allowed" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div class="relative">
                      <input v-model="price" type="number" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-red-600 pl-8" />
                      <span class="absolute left-3 top-3.5 text-[10px] font-bold text-red-400">₫</span>
                    </div>
                    <input v-model="stock" type="number" placeholder="Kho" class="p-3 bg-slate-50 rounded-xl outline-none text-sm font-black text-blue-600" />
                  </div>

                  <div class="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" v-model="hasPromotion" id="promo" class="w-4 h-4 accent-blue-600" />
                      <label for="promo" class="text-[10px] font-black uppercase text-slate-700 italic">Khuyến mãi (nếu có)</label>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-3 animate-slide-up" v-if="hasPromotion">
                      <select v-model="promotionType" class="p-2 bg-white rounded-xl text-[10px] font-bold border border-slate-100 outline-none">
                        <option value="percentage">Phần trăm (%)</option>
                        <option value="fixed">Tiền mặt (VNĐ)</option>
                      </select>
                      <input v-model="promotionValue" placeholder="Gía trị giảm" class="p-2 bg-white rounded-xl text-[10px] font-black outline-none border border-slate-100" />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="text-[9px] font-black uppercase text-slate-400 ml-1">Link sản phẩm điều hướng (Shopee / Landing page nếu có)</label>
                    <input v-model="custom_url" placeholder="Ví dụ: https://shopee.vn/san-pham-abc..." class="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-blue-200" />
                  </div>

                  <input v-model="image" placeholder="Link ảnh (Hoặc tự cập nhật khi chọn file)" class="w-full p-3 bg-slate-50 rounded-xl outline-none text-[10px]" />

                  <div class="space-y-2">
                    <textarea v-model="description_vi" rows="3" placeholder="Mô tả chi tiết (VI)..." class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm leading-relaxed"></textarea>
                    <textarea v-model="description_en" rows="3" placeholder="Technical Description (EN)..." class="w-full p-3 bg-slate-100/50 rounded-xl outline-none text-sm italic leading-relaxed"></textarea>
                  </div>

                  <button @click="handleSubmit" :disabled="isSubmitting" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all uppercase text-[10px] tracking-[0.2em] cursor-pointer">
                    {{ isSubmitting ? 'ĐANG XỬ LÝ...' : (editingId ? 'CẬP NHẬT SẢN PHẨM' : 'XÁC NHẬN THÊM MỚI') }}
                  </button>
                  <button v-if="editingId" @click="resetForm" class="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Hủy chỉnh sửa</button>
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
                        <div v-if="p.displayPromoValue && p.displayPromoValue !== '0'" 
                             class="absolute -top-1 -right-1 text-white text-[7px] font-black px-1 rounded-md shadow-sm"
                             :class="p.isCampaign ? 'bg-orange-500' : 'bg-red-500'">
                          {{ p.isCampaign ? 'CAMPAIGN' : 'SALE' }}
                        </div>
                      </div>
                      <div>
                        <div class="text-sm font-black text-slate-800 leading-tight">{{ p.name_vi || p.name }}</div>
                        <div class="text-[10px] font-medium text-slate-400 italic mb-1">{{ p.name_en }}</div>
                        <div class="inline-flex items-center gap-2">
                           <span class="px-2 py-0.5 rounded-full bg-blue-50 text-[8px] font-black text-blue-500 uppercase tracking-tighter">TỒN: {{ p.stock || 0 }}</span>
                           <span class="text-[8px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase font-mono">{{ p.brand }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-5 text-right font-black text-sm italic text-slate-700">
                      {{ p.price?.toLocaleString() }}<span class="text-[10px] ml-0.5">đ</span>
                    </td>
                    <td class="p-5 text-right">
                      <div class="flex justify-end gap-2">
                        <button @click="startEdit(p)" class="p-2 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                          <span class="text-blue-500 font-black text-[10px] uppercase">Sửa</span>
                        </button>
                        <button @click="confirmDelete(p.id, p.name_vi || p.name)" class="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
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

          <div v-else-if="currentTab === 'brands'" class="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
            <div class="xl:col-span-5">
              <div class="bg-white p-6 rounded-4xl shadow-xl border border-slate-100 sticky top-6 space-y-4">
                <div class="border-b border-slate-100 pb-2">
                  <h3 class="text-xs font-black uppercase text-slate-400 tracking-wider">Thông tin dữ liệu thương hiệu</h3>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase text-slate-500">Tên nhãn hàng *</label>
                  <input 
                    v-model="brandName" 
                    type="text" 
                    placeholder="Ví dụ: KORLOY, LAMINA, SUMITOMO..."
                    class="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold border border-transparent focus:border-red-400"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase text-slate-500">Logo nhãn hàng *</label>
                  <div class="relative group w-full h-32 overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 transition-all flex items-center justify-center bg-slate-50">
                    <input type="file" @change="onBrandLogoChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                    <img v-if="brandLogoUrl" :src="brandLogoUrl" class="max-h-full max-w-full object-contain p-2" />
                    <div v-else class="text-center p-4">
                       <span class="text-xl block">🖼️</span>
                       <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Chọn logo từ máy tính</p>
                    </div>
                  </div>
                  <input v-model="brandLogoUrl" placeholder="Hoặc dán trực tiếp link ảnh tại đây..." class="w-full p-2 bg-slate-100/50 rounded-xl outline-none text-[9px] font-mono border border-transparent mt-1" />
                </div>

                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <label class="text-[10px] font-black uppercase text-slate-500">Bài viết giới thiệu (Mã HTML) *</label>
                    <span class="text-[9px] text-slate-400 font-bold">Dùng &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;</span>
                  </div>
                  
                  <div class="p-2.5 bg-slate-900 rounded-xl text-[9.5px] text-slate-300 font-mono leading-relaxed space-y-1 shadow-inner">
                    <span class="text-amber-400 font-black block">💡 KHUNG CẤU TRÚC B2B SEO GỢI Ý:</span>
                    <p class="text-slate-400">&lt;p&gt;[Giới thiệu ngắn về lịch sử & xuất xứ của hãng]&lt;/p&gt;</p>
                    <p class="text-slate-400">&lt;h2&gt;Các dòng sản phẩm mũi nhọn của thương hiệu&lt;/h2&gt;</p>
                    <p class="text-slate-400">&lt;p&gt;Mô tả thế mạnh đặc thù kỹ thuật, dùng &lt;strong&gt;từ khóa công nghệ&lt;/strong&gt;.&lt;/p&gt;</p>
                    <p class="text-slate-400">&lt;h3&gt;Lý do nên chọn giải pháp gia công từ hãng&lt;/h3&gt;</p>
                    <p class="text-slate-400">&lt;p&gt;[Cam kết chất lượng hoặc ưu thế phân phối của SPIT]&lt;/p&gt;</p>
                  </div>

                  <textarea 
                    v-model="brandDescription" 
                    rows="6"
                    placeholder="<h2>Giới thiệu thương hiệu</h2> <p>Nhập thông tin giới thiệu bọc trong thẻ p.</p> <p>Dùng thẻ <strong>để nhấn mạnh</strong> kỹ thuật.</p>"
                    class="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-mono leading-relaxed border border-transparent focus:border-red-400 mt-2"
                  ></textarea>
                </div>

                <div v-if="brandDescription" class="p-3 bg-amber-50/50 rounded-xl border border-amber-100/70 space-y-1">
                  <span class="text-[9px] font-black uppercase text-amber-700 block">Xem trước hiển thị:</span>
                  <div class="text-[11px] text-slate-600 leading-relaxed max-w-none font-medium prose" v-html="brandDescription"></div>
                </div>

                <button 
                  @click.prevent="handleBrandSubmit"
                  :disabled="isSubmitting"
                  class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-red-600 transition-all uppercase text-[10px] tracking-[0.2em] cursor-pointer"
                >
                  {{ isSubmitting ? 'ĐANG XỬ LÝ DỮ LIỆU...' : (editingBrandId ? 'CẬP NHẬT THƯƠNG HIỆU' : 'XÁC NHẬN THÊM HÃNG') }}
                </button>
                <button v-if="editingBrandId" @click="resetBrandForm" class="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Hủy chỉnh sửa</button>
              </div>
            </div>

            <div class="xl:col-span-7 bg-white rounded-4xl shadow-xl overflow-hidden border border-slate-100">
              <div class="p-5 border-b border-slate-50">
                <input v-model="brandSearchQuery" placeholder="Tìm kiếm nhanh tên hãng..." class="w-full px-4 py-2 bg-slate-50 rounded-full text-xs outline-none border border-transparent focus:border-slate-200" />
              </div>

              <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th class="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thương hiệu</th>
                    <th class="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="b in filteredBrands" :key="b.id" class="hover:bg-red-50/30 transition-colors group">
                    <td class="p-5 flex items-center gap-4">
                      <img :src="b.logoUrl" class="w-12 h-12 rounded-xl object-contain bg-white border border-slate-100 p-1 shadow-sm" />
                      <div>
                        <div class="text-sm font-black text-slate-800 uppercase tracking-wider">{{ b.name }}</div>
                      </div>
                    </td>
                    <td class="p-5 text-right">
                      <div class="flex justify-end gap-2">
                        <button @click="startEditBrand(b)" class="p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
                          <span class="text-red-500 font-black text-[10px] uppercase">Sửa</span>
                        </button>
                        <button @click="confirmDeleteBrand(b.id, b.name)" class="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <span class="text-red-300 hover:text-red-500 font-black text-[10px] uppercase">Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredBrands.length === 0">
                    <td colspan="2" class="p-10 text-center text-slate-400 text-xs italic">Không tìm thấy thương hiệu nào...</td>
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

<style scoped>
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.25s ease; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; }
</style>