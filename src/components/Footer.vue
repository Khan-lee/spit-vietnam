<template>
  <footer class="bg-primary text-black py-16 px-6 md:px-12 border-t border-slate-800/50">
    <!-- Đổi từ grid-cols-3 thành grid-cols-1 md:grid-cols-2 lg:grid-cols-4 để thành 4 cột -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
      
      <!-- CỘT 1: THÔNG TIN THƯƠNG HIỆU & MẠNG XÃ HỘI -->
      <div class="space-y-6">
        <div class="flex items-center gap-4 flex-wrap">
          
          <!-- LOGO TO RÕ RÀNG VÀ CÓ BO GÓC TRỰC TIẾP TRÊN BỨC ẢNH (rounded-2xl) -->
          <img 
            v-if="dynamicLogoUrl || config.logoUrl || config.logo || config.url" 
            :src="dynamicLogoUrl || config.logoUrl || config.logo || config.url" 
            alt="SPIT Logo" 
            class="h-16 md:h-20 w-auto object-contain rounded-2xl shadow-md transition-transform duration-300 hover:scale-105" 
          />
          <img 
            v-else 
            src="../assets/noBG_logo.png" 
            alt="SPIT Logo" 
            class="h-16 md:h-20 w-auto object-contain rounded-2xl shadow-md transition-transform duration-300 hover:scale-105" 
          />

          <!-- TÊN THƯƠNG HIỆU ĐỘNG: Lấy từ config Firestore -->
          <span class="font-black text-xl md:text-2xl uppercase tracking-tight text-slate-900">
            {{ config.siteName || config.brandName || config.site_name || 'Vietnam' }}
          </span>
        </div>

        <p class="text-black text-sm leading-relaxed max-w-xs font-medium">
          {{ $t('footer.about_text') }}
        </p>

        <!-- ICON MẠNG XÃ HỘI (ĐỘNG) -->
        <div class="flex items-center gap-4 pt-2">
          <!-- Facebook Icon -->
          <a :href="config.facebook || 'https://www.facebook.com/vnspit'" target="_blank" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <!-- YouTube Icon -->
          <a :href="config.youtube || 'https://www.youtube.com/channel/UCevP--LZsdjHn3EQwgesoFA'" target="_blank" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" stroke="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.42-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FFFFFF"/></svg>
          </a>
        </div>
      </div>

      <!-- CỘT 2: CHÍNH SÁCH BÁN HÀNG -->
      <div class="space-y-6">
        <h3 class="text-black font-black text-xs uppercase tracking-[0.2em]">CHÍNH SÁCH BÁN HÀNG</h3>
        <ul class="space-y-3 text-sm font-bold text-black">
          <!-- Nếu đã lấy dữ liệu từ Firebase thành công -->
          <template v-if="isLoaded">
            <li v-for="policy in chinhSachList" :key="policy.id">
              <RouterLink :to="`/chinh-sach/${policy.slug || policy.id}`" class="hover:underline hover:text-slate-700 transition-colors duration-200">
                {{ policy.title }}
              </RouterLink>
            </li>
          </template>
          
          <!-- Chỉ hiện danh sách mặc định nếu chưa kết nối dữ liệu/chưa load lần nào -->
          <template v-else>
            <li><RouterLink to="/chinh-sach/bao-mat" class="hover:underline hover:text-slate-700 transition-colors">Chính sách bảo mật</RouterLink></li>
            <li><RouterLink to="/chinh-sach/van-chuyen" class="hover:underline hover:text-slate-700 transition-colors">Chính sách vận chuyển</RouterLink></li>
            <li><RouterLink to="/chinh-sach/quy-trinh-giao-hang" class="hover:underline hover:text-slate-700 transition-colors">Quy trình giao hàng</RouterLink></li>
            <li><RouterLink to="/chinh-sach/doi-tra" class="hover:underline hover:text-slate-700 transition-colors">Chính sách đổi trả hàng</RouterLink></li>
          </template>
          
          <li v-if="config.shippingFee" class="text-[11px] text-black italic pt-1">
            {{ $t('footer.shipping_fee') }}: {{ Number(config.shippingFee).toLocaleString() }} VNĐ
          </li>
        </ul>
      </div>

      <!-- CỘT 3: HỖ TRỢ KHÁCH HÀNG -->
      <div class="space-y-6">
        <h3 class="text-black font-black text-xs uppercase tracking-[0.2em]">HỖ TRỢ KHÁCH HÀNG</h3>
        <ul class="space-y-3 text-sm font-bold text-black">
          <template v-if="isLoaded">
            <li v-for="policy in hoTroList" :key="policy.id">
              <RouterLink :to="`/chinh-sach/${policy.slug || policy.id}`" class="hover:underline hover:text-slate-700 transition-colors duration-200">
                {{ policy.title }}
              </RouterLink>
            </li>
          </template>
          <template v-else>
            <li><RouterLink to="/ho-tro/huong-dan-mua-hang" class="hover:underline hover:text-slate-700 transition-colors">Hướng dẫn mua hàng</RouterLink></li>
            <li><RouterLink to="/ho-tro/huong-dan-thanh-toan" class="hover:underline hover:text-slate-700 transition-colors">Hướng dẫn thanh toán</RouterLink></li>
            <li><RouterLink to="/ho-tro/hinh-thuc-mua-hang" class="hover:underline hover:text-slate-700 transition-colors">Các hình thức mua hàng</RouterLink></li>
            <li><RouterLink to="/ho-tro/so-do-duong-di" class="hover:underline hover:text-slate-700 transition-colors">Sơ đồ đường đi</RouterLink></li>
          </template>
        </ul>
      </div>

      <!-- CỘT 4: LIÊN HỆ -->
      <div class="space-y-6">
        <h3 class="text-black font-black text-xs uppercase tracking-[0.2em]">{{ $t('nav.contact') }}</h3>
        <ul class="space-y-4 text-sm text-black">
          <li class="flex items-start gap-3 group">
            <span class="text-black">📍</span>
            <span class="hover:text-slate-700 transition-colors leading-relaxed whitespace-pre-line">
              {{ config[`address_${locale}`] || config.address || '361 Le Trong Tan, Tan Phu, Ho Chi Minh City' }}
            </span>
          </li>
          <li class="flex items-center gap-3 font-bold text-black">
            <span class="text-black">📞</span>
            <a :href="'tel:' + config.hotline" class="hover:text-slate-700 transition-colors">
              Hotline/Zalo: {{ config.hotline || '1900 xxxx' }}
            </a>
          </li>
          <li v-if="config.email" class="flex items-center gap-3 text-black">
            <span class="text-black">✉️</span>
            <a :href="'mailto:' + config.email" class="hover:text-slate-700 transition-colors text-xs">{{ config.email }}</a>
          </li>
        </ul>

        <!-- LOGO ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG -->

      </div>

    </div>

    <!-- HÀNG BẢN QUYỀN -->
    <div class="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-black">
      <p class="italic">© 2026 VTCNVC VIETNAM. All rights reserved.</p>
      <p>Designed by VATTUVOCUC</p>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { db } from '../firebase'
import { doc, collection, onSnapshot } from 'firebase/firestore'

const { locale } = useI18n()

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})

const dynamicLogoUrl = ref('')
const policiesList = ref([])
const isLoaded = ref(false) // Đánh dấu khi đã tải xong dữ liệu từ Firebase

let unsubLogo = null
let unsubPolicies = null

// Chỉ lấy những bài có is_active !== false
const chinhSachList = computed(() => {
  return policiesList.value
    .filter(p => p.category === 'chinh-sach' && p.is_active !== false)
    .sort((a, b) => (a.stt || 0) - (b.stt || 0))
})

const hoTroList = computed(() => {
  return policiesList.value
    .filter(p => p.category === 'ho-tro' && p.is_active !== false)
    .sort((a, b) => (a.stt || 0) - (b.stt || 0))
})

onMounted(() => {
  // 1. Lắng nghe Logo
  unsubLogo = onSnapshot(doc(db, 'settings', 'logo'), (docSnap) => {
    if (docSnap.exists() && docSnap.data().url) {
      dynamicLogoUrl.value = docSnap.data().url
    }
  })

  // 2. Lắng nghe Collection policies từ Firestore
  unsubPolicies = onSnapshot(collection(db, 'policies'), (snapshot) => {
    const items = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() })
    })
    policiesList.value = items
    isLoaded.value = true // Đã đồng bộ xong dữ liệu Firebase
  }, (err) => {
    console.error('Lỗi khi tải chính sách:', err)
  })
})

onUnmounted(() => {
  if (unsubLogo) unsubLogo()
  if (unsubPolicies) unsubPolicies()
})
</script>