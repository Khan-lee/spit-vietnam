<template>
  <div class="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
    
    <div class="relative py-24 md:py-32 bg-slate-950 text-white overflow-hidden flex items-center justify-center">
      <div class="absolute inset-0 z-0 select-none pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070" 
          alt="SPIT Industrial Background" 
          class="w-full h-full object-cover opacity-15 scale-105 filter blur-[3px]"
        />
        <div class="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-900/90 to-[#f8fafc]"></div>
        <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 24px 24px;"></div>
      </div>
      
      <div class="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-4">
        <button 
          @click="$router.back()" 
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer border border-white/10"
        >
          ← Quay lại
        </button>
        
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-white">
          {{ brand?.name || 'Đang tải nhãn hàng...' }}
        </h1>
        
        <div class="h-1.5 w-16 bg-red-600 mx-auto rounded-full shadow-lg shadow-red-500/50"></div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-24 space-y-12">
      
      <div v-if="loading" class="flex justify-center items-center bg-white rounded-[3rem] p-20 shadow-xl border border-slate-100">
        <div class="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>

      <template v-else-if="brand">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white p-6 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div class="lg:col-span-4 relative group top-6">
            <div class="absolute inset-0 bg-linear-to-tr from-red-600 to-amber-500 rounded-[2.5rem] transform rotate-2 scale-98 opacity-5"></div>
            <div class="rounded-[2.5rem] bg-slate-50 p-8 border border-slate-100 flex items-center justify-center aspect-square shadow-inner">
              <img 
                v-if="brand.logoUrl" 
                :src="brand.logoUrl" 
                :alt="brand.name" 
                class="max-h-32 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-500" 
              />
              <span v-else class="text-2xl font-black text-slate-300 uppercase tracking-widest">
                {{ brand.name }}
              </span>
            </div>
          </div>

          <div class="lg:col-span-8 space-y-6 lg:pl-6">
            <div class="space-y-2">
              <h2 class="text-xs font-black tracking-widest text-red-600 uppercase">Thông tin thương hiệu</h2>
              <h3 class="text-2xl md:text-3xl font-black text-slate-900 uppercase italic">
                Đối tác <span class="text-red-600">{{ brand.name }}</span>
              </h3>
            </div>
            
            <div class="prose prose-slate max-w-none">
              <div 
                v-if="brand.description"
                class="text-slate-600 leading-relaxed text-[15px] md:text-base font-medium space-y-4 custom-brand-content"
                v-html="brand.description"
              ></div>
              <div v-else class="text-slate-400 italic text-sm">
                Nội dung giới thiệu chi tiết về thương hiệu này đang được cập nhật...
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div class="space-y-1">
              <h2 class="text-xs font-black tracking-widest text-red-600 uppercase">Danh mục sản phẩm</h2>
              <h3 class="text-2xl font-black text-slate-900 uppercase italic">
                Giải pháp kỹ thuật từ <span class="text-red-600">{{ brand.name }}</span>
              </h3>
            </div>
            <span v-if="!loadingProducts" class="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Tìm thấy {{ products.length }} sản phẩm
            </span>
          </div>

          <div v-if="loadingProducts" class="text-center py-16 text-slate-400 text-sm font-bold uppercase tracking-wider">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent mx-auto mb-3"></div>
            Đang đồng bộ danh sách sản phẩm...
          </div>

          <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div 
              v-for="product in products" 
              :key="product.id"
              class="bg-white rounded-4xl border border-slate-100 shadow-md shadow-slate-100/70 overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group"
            >
              <div class="p-6 bg-slate-50 flex items-center justify-center aspect-square relative border-b border-slate-100/50 overflow-hidden">
                <img 
                  :src="product.imageUrl || product.image || 'https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?q=80&w=600'" 
                  :alt="product.name" 
                  class="max-h-40 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-1.5">
                  <span v-if="product.sku || product.code" class="inline-block text-[10px] font-black tracking-wider text-red-600 uppercase bg-red-50 px-2.5 py-0.5 rounded-md">
                    Mã: {{ product.sku || product.code }}
                  </span>
                  <h4 class="text-sm font-black text-slate-800 line-clamp-2 uppercase leading-snug group-hover:text-red-600 transition-colors">
                    {{ product.name }}
                  </h4>
                </div>

                <button 
                  @click="$router.push('/product/' + product.id)"
                  class="w-full py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-red-600 text-white uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  Xem chi tiết ➔
                </button>
              </div>
            </div>
          </div>

          <div v-else class="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center space-y-2">
            <div class="text-3xl">📦</div>
            <h4 class="text-sm font-black text-slate-700 uppercase">Sản phẩm đang được cập nhật</h4>
            <p class="text-xs text-slate-400 max-w-md mx-auto font-medium">
              Các dòng mảnh cắt, dụng cụ phụ trợ chính xác cao của thương hiệu này đang được đội ngũ kỹ thuật đồng bộ dữ liệu lên hệ thống SPIT.
            </p>
          </div>
        </div>
      </template>

      <div v-else class="text-center bg-white rounded-[3rem] p-16 shadow-xl border border-slate-100 space-y-4">
        <div class="text-4xl">🔍</div>
        <h3 class="text-lg font-black text-slate-800 uppercase">Không tìm thấy nhãn hàng</h3>
        <p class="text-xs text-slate-500 max-w-xs mx-auto font-medium">
          Dữ liệu của thương hiệu này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <button @click="$router.push('/about')" class="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white uppercase tracking-wider transition-all cursor-pointer">
          Quay lại trang Giới thiệu
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const brand = ref(null)
const products = ref([])
const loading = ref(true)
const loadingProducts = ref(true)
const dbError = ref(null) // Bổ sung biến kiểm tra lỗi index

let unsubscribeBrand = null
let unsubscribeProducts = null

const applyBrandSEO = (brandName, richTextDescription) => {
  document.title = `Thương hiệu ${brandName} chính hãng | SPIT - Dụng cụ cắt gọt chính xác`
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.setAttribute('name', 'description')
    document.head.appendChild(metaDescription)
  }
  let cleanDesc = ''
  if (richTextDescription) {
    cleanDesc = richTextDescription.replace(/<[^>]*>/g, '').trim()
  }
  if (cleanDesc.length > 0) {
    metaDescription.setAttribute('content', cleanDesc.substring(0, 155) + '...')
  } else {
    metaDescription.setAttribute('content', `Cung cấp giải pháp kỹ thuật, phân phối dụng cụ phụ trợ cơ khí và mảnh cắt gia công thương hiệu ${brandName} chính hãng chất lượng cao tại SPIT.`)
  }
}

onMounted(() => {
  const docRef = doc(db, 'brands', props.id)
  unsubscribeBrand = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      brand.value = { id: docSnap.id, ...data }
      applyBrandSEO(data.name, data.description)
    } else {
      brand.value = null
      document.title = 'Không tìm thấy nhãn hàng | SPIT'
    }
    loading.value = false
  })

  const productsRef = collection(db, 'products')
  const q = query(productsRef, where('brandId', '==', props.id))
  
  unsubscribeProducts = onSnapshot(q, (querySnapshot) => {
    const fetchedProducts = []
    querySnapshot.forEach((doc) => {
      fetchedProducts.push({ id: doc.id, ...doc.data() })
    })
    products.value = fetchedProducts
    loadingProducts.value = false
  }, (error) => {
    console.error("Lỗi truy vấn Firestore (Có thể cần Index):", error)
    dbError.value = error
    loadingProducts.value = false
  })
})

onUnmounted(() => {
  if (unsubscribeBrand) unsubscribeBrand()
  if (unsubscribeProducts) unsubscribeProducts()
  document.title = 'Sài Gòn Precision Industrial Tool | SPIT'
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', 'Nhà cung cấp giải pháp toàn diện và phân phối dụng cụ cắt gọt, thiết bị phụ trợ gia công cơ khí chính xác hàng đầu Việt Nam.')
  }
})
</script>

<style scoped>
:deep(.custom-brand-content p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}
:deep(.custom-brand-content p:last-child) {
  margin-bottom: 0;
}
:deep(.custom-brand-content strong) {
  color: #0f172a;
  font-weight: 800;
}
</style>