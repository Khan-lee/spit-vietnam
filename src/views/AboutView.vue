<template>
  <div class="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
    
    <div class="relative py-28 md:py-36 bg-slate-950 text-white overflow-hidden flex items-center justify-center">
      <div class="absolute inset-0 z-0 select-none pointer-events-none">
        <img 
          :src="aboutData.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070'" 
          alt="SPIT Industrial Background" 
          class="w-full h-full object-cover opacity-25 scale-105 filter blur-[2px]"
        />
        <div class="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-900/90 to-[#f8fafc]"></div>
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 24px 24px;"></div>
      </div>
      
      <div class="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-6">
        <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-red-600/10 text-red-500 uppercase tracking-widest border border-red-600/20">
          <span class="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> Profile Doanh Nghiệp
        </span>
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none text-white">
          {{ aboutData.title || 'SÀI GÒN PRECISION INDUSTRIAL TOOL' }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto text-sm md:text-md font-medium tracking-wide">
          Nhà cung cấp giải pháp toàn diện và phân phối dụng cụ cắt gọt, thiết bị phụ trợ gia công cơ khí chính xác hàng đầu Việt Nam.
        </p>
        <div class="h-1.5 w-20 bg-red-600 mx-auto rounded-full shadow-lg shadow-red-500/50"></div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-24 space-y-16">
      
      <div v-if="loading" class="flex justify-center items-center bg-white rounded-[3rem] p-20 shadow-xl border border-slate-100">
        <div class="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div class="lg:col-span-5 relative group">
            <div class="absolute inset-0 bg-linear-to-tr from-red-600 to-amber-500 rounded-[2.5rem] transform rotate-3 scale-98 opacity-10 group-hover:rotate-1 transition-transform duration-500"></div>
            <div class="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative bg-slate-100 aspect-4/3 lg:aspect-square">
              <img 
                :src="aboutData.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070'" 
                alt="Năng lực SPIT" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>

          <div class="lg:col-span-7 space-y-6 lg:pl-4">
            <div class="space-y-2">
              <h2 class="text-xs font-black tracking-widest text-red-600 uppercase">Giới thiệu tổng quan</h2>
              <h3 class="text-2xl md:text-3xl font-black text-slate-900 uppercase italic">Về chúng tôi — <span class="text-red-600">SPIT</span></h3>
            </div>
            
            <div class="prose prose-slate max-w-none">
              <div 
                class="text-slate-600 leading-relaxed text-[15px] md:text-base font-medium space-y-4 custom-about-content"
                v-html="aboutData.content"
              ></div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px); background-size: 40px 40px;"></div>
          
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 relative z-10 text-center divide-y-0 divide-x-0 lg:divide-x divide-slate-800">
            <div class="space-y-1">
              <div class="text-3xl md:text-5xl font-black text-red-500 font-mono tracking-tight">10+</div>
              <div class="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-wider">Năm kinh nghiệm kỹ thuật</div>
            </div>
            <div class="space-y-1">
              <div class="text-3xl md:text-5xl font-black text-red-500 font-mono tracking-tight">1,000+</div>
              <div class="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-wider">Khách hàng & Nhà xưởng</div>
            </div>
            <div class="space-y-1 lg:pt-0">
              <div class="text-3xl md:text-5xl font-black text-red-500 font-mono tracking-tight">500+</div>
              <div class="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-wider">Mã sản phẩm chính hãng</div>
            </div>
            <div class="space-y-1 lg:pt-0">
              <div class="text-3xl md:text-5xl font-black text-red-500 font-mono tracking-tight">100%</div>
              <div class="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-wider">Cam kết chính xác & Tối ưu</div>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="text-center space-y-2">
            <h2 class="text-xs font-black tracking-widest text-red-600 uppercase">Kim chỉ nam hành động</h2>
            <h3 class="text-2xl md:text-3xl font-black text-slate-900 uppercase italic">Giá trị cốt lõi bền vững</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start space-y-4">
              <div class="p-3.5 bg-red-50 text-red-600 rounded-2xl text-2xl">⚙️</div>
              <h4 class="text-md font-black uppercase text-slate-900 tracking-tight">Chất Lượng Tuyệt Đối</h4>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">
                Mỗi sản phẩm mảnh cắt insert, cán dao tiện hay dụng cụ phụ trợ do SPIT cung ứng đều cam kết đạt chuẩn kiểm định khắt khe nhất của quốc tế.
              </p>
            </div>
            <div class="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start space-y-4">
              <div class="p-3.5 bg-blue-50 text-blue-600 rounded-2xl text-2xl">💡</div>
              <h4 class="text-md font-black uppercase text-slate-900 tracking-tight">Giải Pháp Tối Ưu</h4>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">
                Chúng tôi không chỉ bán thiết bị thuần túy, đội ngũ kỹ sư của chúng tôi luôn đồng hành khảo sát và tư vấn phương án giúp tối ưu hóa tiến trình gia công.
              </p>
            </div>
            <div class="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start space-y-4">
              <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl text-2xl">🤝</div>
              <h4 class="text-md font-black uppercase text-slate-900 tracking-tight">Uy Tín Trường Tồn</h4>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">
                Đảm bảo tiến độ giao hàng hỏa tốc, chính sách hậu mãi rõ ràng, trung thực minh bạch trong mọi cam kết hợp tác kinh doanh.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
          <div class="text-center space-y-1">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Đại diện phân phối trực tiếp</h4>
            <h3 class="text-lg font-black uppercase text-slate-800">Đối tác chiến lược toàn cầu</h3>
          </div>
          
          <div v-if="isLoadingBrands" class="text-center py-10 text-slate-400 text-sm font-bold uppercase tracking-wider">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent mx-auto mb-2"></div>
            Đang tải danh sách nhãn hàng...
          </div>
          
          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <div 
              v-for="brand in brands" 
              :key="brand.id"
              @click="$router.push('/brand/' + brand.id)"
              class="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center h-28 hover:bg-red-50/30 transition-all cursor-pointer select-none"
            >
              <img 
                v-if="brand.logoUrl" 
                :src="brand.logoUrl" 
                :alt="brand.name" 
                class="max-h-12 max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
              <span v-else class="font-black text-xs text-slate-400 uppercase tracking-widest">
                {{ brand.name }}
              </span>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore'

const aboutData = ref({
  title: '',
  content: '',
  imageUrl: ''
})
const brands = ref([])
const loading = ref(true)
const isLoadingBrands = ref(true)
let unsubscribe = null

const fetchBrands = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'brands'))
    const fetchedBrands = []
    querySnapshot.forEach((doc) => {
      fetchedBrands.push({
        id: doc.id,
        ...doc.data()
      })
    })
    brands.value = fetchedBrands
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu nhãn hàng từ collection brands:", error)
  } finally {
    isLoadingBrands.value = false
  }
}

onMounted(() => {
  // 1. Fetch danh sách nhãn hàng từ collection brands có sẵn
  fetchBrands()

  // 2. Lắng nghe real-time cấu hình trang giới thiệu chính
  const docRef = doc(db, 'settings', 'about')
  unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      aboutData.value = docSnap.data()
    } else {
      aboutData.value = {
        title: 'Sài Gòn Precision Industrial Tool',
        content: '<p>Chào mừng bạn đến với SPIT. Chúng tôi cung cấp các giải pháp công cụ công nghiệp chính xác hoàn hảo...</p>',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070'
      }
    }
    loading.value = false
  }, (error) => {
    console.error("Lỗi khi lắng nghe dữ liệu settings/about:", error)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
:deep(.custom-about-content p) {
  margin-bottom: 1.25rem;
  line-height: 1.75;
}
:deep(.custom-about-content p:last-child) {
  margin-bottom: 0;
}
</style>