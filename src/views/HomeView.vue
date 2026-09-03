<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { collection, doc, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import NewsSection from '../components/NewsSection.vue' 
import BrandMarquee from '../components/BrandMarquee.vue'
import HomeProductFilter from '../components/HomeProductFilter.vue'
import { PLACEHOLDER_IMG } from '../utils/placeholder'
import { useSearchStore } from '../stores/search' 

// Import Swiper Vue.js components & modules
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

// Khai báo state lưu thông tin cấu hình website
const websiteSettings = ref({
  hotline: '0347527093',
  zalo: '0347527093'
})

// Mảng lưu các hàm hủy lắng nghe realtime từ Firestore
const unsubscribers = []

// Hàm lắng nghe realtime document settings/website
const listenToWebsiteSettings = () => {
  const unsub = onSnapshot(doc(db, 'settings', 'website'), (docSnap) => {
    if (docSnap.exists()) {
      websiteSettings.value = { ...websiteSettings.value, ...docSnap.data() }
    }
  }, (e) => console.error("Lỗi realtime settings/website:", e))
  unsubscribers.push(unsub)
}

const { locale, t } = useI18n()
const searchStore = useSearchStore()

// Biến lưu thương hiệu đang được chọn tạm thời trong Mega Menu
const activeFlyoutBrand = ref(null)

const products = ref([])
const promotions = ref([]) 
const categoryDocs = ref([])
const mainBanners = ref([])
const isLoading = ref(true)
// ⚡ UPDATE MỚI: Biến loading RIÊNG cho khối Danh mục — dùng để hiện khung skeleton
// (khung xám giả lập) khi danh mục chưa tải xong, thay vì để trống hoàn toàn như trước
const isCategoriesLoading = ref(true)
const currentTime = ref(new Date()) 

const dynamicHotSaleBanner = ref(PLACEHOLDER_IMG)

// Lắng nghe cấu hình trang chủ realtime
const listenToSettings = () => {
  const unsub = onSnapshot(doc(db, 'settings', 'home_config'), (docSnap) => {
    if (docSnap.exists() && docSnap.data().hotSaleBanner) {
      dynamicHotSaleBanner.value = docSnap.data().hotSaleBanner
    }
  }, (e) => {
    console.error("Lỗi lấy config trang chủ realtime:", e)
  })
  unsubscribers.push(unsub)
}

const filteredHomeProducts = ref([])

const handleFilteredProducts = (newProducts) => {
  filteredHomeProducts.value = newProducts;
};

const isFiltering = ref(false);

const handleFilterState = (state) => {
  isFiltering.value = state
}

// ==========================================
// --- TRẠNG THÁI ĐÓNG/MỞ BỘ LỌC DRAWER MOBILE ---
// ==========================================
const isMobileFilterOpen = ref(false)

const swiperModules = [Autoplay, Pagination, Navigation, EffectFade]

const activeHoverCategory = ref(null)

// ==========================================
// --- LOGIC MEGA MENU FILTER & SMOOTH SCROLL ---
// ==========================================
const selectedCategory = ref('') // Danh mục được chọn từ Mega Menu
const selectedBrand = ref('')    // Thương hiệu được chọn từ Mega Menu
const featuredSectionRef = ref(null) // Ref gắn vào thẻ <section> Sản phẩm nổi bật

// Hàm kích hoạt khi người dùng click vào một Hãng trong Mega Menu Popover
const handleSelectBrand = (catName, brandName) => {
  selectedCategory.value = catName
  selectedBrand.value = brandName

  // Cuộn mượt màn hình xuống Bảng Sản Phẩm Nổi Bật
  if (featuredSectionRef.value) {
    featuredSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Xóa bộ lọc thương hiệu quay về xem tất cả
const clearBrandFilter = () => {
  selectedBrand.value = ''
}

// Danh sách sản phẩm nổi bật tự động lọc theo Category & Brand
const featuredProductsFiltered = computed(() => {
  let result = products.value

  // Lọc theo Category nếu có chọn
  if (selectedCategory.value) {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    result = result.filter(p => {
      const pCat = p[catField] || p.category || p.category_name
      return pCat === selectedCategory.value
    })
  }

  // Lọc theo Thương hiệu nếu có chọn
  if (selectedBrand.value) {
    result = result.filter(p => p.brand === selectedBrand.value)
  }

  return result
})
// ==========================================

const getSubCategoriesOrBrands = (catName) => {
  const prods = getProductsByCategory(catName)
  const brands = [...new Set(prods.map(p => p.brand).filter(Boolean))]
  return brands
}

const categoryBanners = ref({
  'Dụng cụ cắt gọt': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
  'Thiết bị đo lường': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800',
  'Phụ kiện máy': 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=800',
})

const fallbackMainBanners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070',
    useI18n: true 
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070',
    title: 'GIẢI PHÁP GIA CÔNG CHÍNH XÁC',
    subtitle: 'CHƯƠNG TRÌNH ĐỒNG HÀNH CÙNG DOANH NGHIỆP',
    desc: 'Tặng cán dao tiện khi đặt hàng số lượng lớn các dòng mảnh cắt insert trong tháng này.',
    useI18n: false
  }
]

let timer

// Lắng nghe dữ liệu các collection thời gian thực (Realtime)
const listenToData = () => {
  let loadedCollections = 0
  const checkLoading = () => {
    loadedCollections++
    if (loadedCollections >= 4) {
      isLoading.value = false
    }
  }

  // 1. Sản phẩm (Realtime)
  // =========================================================================
  // ⚡ UPDATE MỚI: LỌC BỎ SẢN PHẨM BỊ ẨN + SẮP XẾP THEO "SỐ THỨ TỰ HIỂN THỊ" (order)
  // -------------------------------------------------------------------------
  // Đồng bộ với 2 trường mới "order" và "isActive" vừa thêm ở AdminView.vue. Đây là điểm
  // fetch dữ liệu sản phẩm DUY NHẤT của trang chủ — mọi khối khác (Top bán chạy, HOT SALE,
  // từng Danh mục, kết quả tìm kiếm...) đều tự động dùng lại "products.value" này, nên chỉ
  // cần lọc + sắp xếp đúng 1 chỗ này là toàn bộ trang chủ tự động hiển thị đúng thứ tự Admin
  // đã cấu hình, và không còn hiện sản phẩm đã bị ẩn nữa — không cần sửa từng khối riêng lẻ.
  // Sản phẩm CŨ chưa từng có field "isActive" mặc định coi là VẪN HIỆN (isActive !== false,
  // không phải === true) để không vô tình ẩn nhầm hàng loạt sản phẩm cũ. Sản phẩm chưa có
  // "order" thì xếp cuối cùng (coi như 999999).
  // =========================================================================
  const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    products.value = allProducts
      .filter(p => p.isActive !== false)
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999))
    checkLoading()
  }, (e) => console.error("Lỗi realtime products:", e))

  // 2. Khuyến mãi (Realtime)
  const unsubPromos = onSnapshot(collection(db, "promotions"), (snapshot) => {
    promotions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    checkLoading()
  }, (e) => console.error("Lỗi realtime promotions:", e))

  // 3. Danh mục
  // =========================================================================
  // ⚡ UPDATE MỚI: ĐỔI "DANH MỤC" TỪ LẮNG NGHE REAL-TIME (onSnapshot) SANG GỌI 1 LẦN (getDocs)
  // -------------------------------------------------------------------------
  // NGUYÊN NHÂN GÂY CHẬM/TRỐNG KHUNG "DANH MỤC" LÚC MỚI VÀO TRANG: onSnapshot phải giữ 1
  // kết nối "sống" liên tục với Firestore để chờ dữ liệu, nặng hơn nhiều so với gọi 1 lần
  // rồi thôi. Trong khi đó, Danh mục là dữ liệu HIẾM KHI THAY ĐỔI (chỉ đổi khi Admin vào
  // "Quản lý danh mục" sửa tay) -> không cần thiết phải lắng nghe real-time. Đổi sang
  // getDocs giúp giảm số kết nối đồng thời mở tới Firestore lúc mới vào trang, tải nhanh
  // hơn đáng kể. isCategoriesLoading dùng để tắt khung skeleton (xem phần template).
  // =========================================================================
  getDocs(collection(db, "categories")).then((snapshot) => {
    categoryDocs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    isCategoriesLoading.value = false
    checkLoading()
  }).catch((e) => {
    console.error("Lỗi lấy dữ liệu categories:", e)
    isCategoriesLoading.value = false
    checkLoading()
  })

  // 4. Banners
  // ⚡ UPDATE MỚI: ĐỔI "BANNERS" TỪ LẮNG NGHE REAL-TIME (onSnapshot) SANG GỌI 1 LẦN (getDocs)
  // Cùng lý do như Danh mục ở trên: Banner trang chủ cũng hiếm khi đổi (chỉ đổi khi Admin
  // tự tay cập nhật), không cần giữ kết nối real-time liên tục.
  getDocs(collection(db, "banners")).then((snapshot) => {
    const fetchedBanners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    if (fetchedBanners.length > 0) {
      fetchedBanners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      const main = fetchedBanners.filter(b => b.position === 'main' || !b.position)
      mainBanners.value = main.length > 0 ? main : fallbackMainBanners
    } else {
      mainBanners.value = fallbackMainBanners
    }
    checkLoading()
  }).catch((e) => {
    console.error("Lỗi lấy dữ liệu banners:", e)
    mainBanners.value = fallbackMainBanners
    checkLoading()
  })

  // ⚡ UPDATE MỚI: Chỉ còn products & promotions dùng onSnapshot (cần real-time thật sự vì
  // giá/tồn kho/khuyến mãi có thể đổi liên tục) -> chỉ 2 unsubscribe function này cần lưu lại
  unsubscribers.push(unsubProducts, unsubPromos)
}

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  listenToData()
  listenToSettings()
  listenToWebsiteSettings()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  unsubscribers.forEach(unsub => unsub())
})

const getActivePromo = (product) => {
  if (!product) return null
  return promotions.value.find(p => {
    const start = p.start_date ? new Date(p.start_date) : null
    const end = p.end_date ? new Date(p.end_date) : null
    const isTimeValid = (!start || currentTime.value >= start) && (!end || currentTime.value <= end)
    return p.is_active && isTimeValid && (p.apply_to === 'all' || p.applied_ids?.includes(product.id))
  })
}

// ==========================================
// HÀM XỬ LÝ GIÁ ÁO NIÊM YẾT & GIẢM GIÁ KHUYẾN MÃI
// ==========================================

// 1. Hàm lấy Giá gạch đi (Ưu tiên Giá ảo niêm yết -> Giá niêm yết gốc)
const getDisplayOriginalPrice = (product, isBox = false) => {
  if (!product) return 0
  const basePrice = Number(isBox ? product.price_box : product.price) || 0
  
  // Kiểm tra tất cả các key giá ảo
  const virtualPrice = Number(
    isBox 
      ? (product.virtual_original_price_box || product.original_price_box || 0)
      : (product.virtual_original_price || product.displayOriginalPrice || product.original_price || product.virtual_price || 0)
  )

  const salePrice = isBox ? getSalePriceBox(product) : getSalePrice(product)
  const currentSellingPrice = salePrice !== null ? salePrice : basePrice

  // Nếu có giá ảo và lớn hơn giá bán thực tế -> Ưu tiên dùng giá ảo làm giá gạch
  if (virtualPrice > currentSellingPrice) {
    return virtualPrice
  }
  
  // Nếu không có giá ảo nhưng có giảm giá KM -> Dùng giá gốc làm giá gạch
  if (basePrice > currentSellingPrice) {
    return basePrice
  }

  return 0 // Không có giá gạch đi
}

// 2. Tính giá HỘP sau khi giảm chiết khấu
const getSalePriceBox = (p) => {
  if (!p || !p.price_box) return null;
  const basePrice = Number(p.price_box) || 0;
  
  const activePromo = getActivePromo(p);
  let promoDiscount = 0;

  if (activePromo && Array.isArray(activePromo.tiers) && activePromo.tiers.length > 0) {
    const firstTier = activePromo.tiers[0];
    if (firstTier.discount_type === 'percentage') {
      promoDiscount = basePrice * (Number(firstTier.discount_value || 0) / 100);
    } else if (['fixed_amount', 'amount', 'fixed_discount'].includes(firstTier.discount_type)) {
      promoDiscount = Number(firstTier.discount_value || 0);
    }
  } else if (p.discount_percent) {
    promoDiscount = basePrice * (Number(p.discount_percent) / 100);
  }

  if (promoDiscount > 0) {
    return Math.max(0, basePrice - promoDiscount);
  }

  return null;
};

// 3. Tính giá MẢNH/LẺ sau khi giảm chiết khấu
const getSalePrice = (p) => {
  if (!p || !p.price) return null;
  const basePrice = Number(p.price) || 0;

  const activePromo = getActivePromo(p);
  let promoDiscount = 0;

  if (activePromo && Array.isArray(activePromo.tiers) && activePromo.tiers.length > 0) {
    const firstTier = activePromo.tiers[0];
    if (firstTier.discount_type === 'percentage') {
      promoDiscount = basePrice * (Number(firstTier.discount_value || 0) / 100);
    } else if (['fixed_amount', 'amount', 'fixed_discount'].includes(firstTier.discount_type)) {
      promoDiscount = Number(firstTier.discount_value || 0);
    }
  } else if (p.discount_percent) {
    promoDiscount = basePrice * (Number(p.discount_percent) / 100);
  }

  if (promoDiscount > 0) {
    return Math.max(0, basePrice - promoDiscount);
  }

  return null;
};

// 4. Tính % Giảm giá thực tế dựa trên Giá gạch đi & Giá bán hiện tại
const getDiscountPercent = (product, isBox = false) => {
  if (!product) return 0;
  
  const origPrice = getDisplayOriginalPrice(product, isBox);
  const basePrice = Number(isBox ? product.price_box : product.price) || 0;
  const salePrice = isBox ? getSalePriceBox(product) : getSalePrice(product);
  const finalPrice = salePrice !== null ? salePrice : basePrice;

  if (origPrice > finalPrice && origPrice > 0) {
    return Math.round(((origPrice - finalPrice) / origPrice) * 100);
  }

  return 0;
};

// ==========================================
// ⚡ UPDATE QUAN TRỌNG: TÁCH BIỆT GIÁ ÁO RA KHỎI KHỐI HOT SALE GIÁ SỐC
// ==========================================
// Lọc CHỈ các sản phẩm có Chương trình khuyến mãi thật (giảm giá thật từ Admin campaign hoặc discount_percent).
// Các sản phẩm CHỈ có giá ảo niêm yết (virtual price) sẽ KHÔNG bị lọt vào đây.
const allPromoProducts = computed(() => {
  return products.value.filter(p => {
    // 1. Kiểm tra sản phẩm có KM bán lẻ/mảnh không
    const hasPromoSale = getSalePrice(p) !== null;
    
    // 2. Kiểm tra sản phẩm có KM bán hộp không
    const hasPromoSaleBox = getSalePriceBox(p) !== null;

    // Chỉ lấy sản phẩm có chiến dịch giảm giá thật
    return hasPromoSale || hasPromoSaleBox;
  });
});

const activeBannerPromo = computed(() => {
  return promotions.value
    .filter(p => {
      const end = p.end_date ? new Date(p.end_date) : null
      return p.is_active && (!end || end > currentTime.value)
    })
    .sort((a, b) => (b.apply_to === 'all' ? 1 : -1))[0] 
})

const getCountdown = (endDate) => {
  if (!endDate) return '';
  
  const target = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) return 'Đã hết hạn';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) {
    return `${days} ngày ${hh}:${mm}:${ss}`; 
  }
  
  return `${hh}:${mm}:${ss}`;
};

// =========================================================================
// ⚡ UPDATE MỚI: "categories" GIỜ CHỈ LẤY DANH MỤC CHA (không lấy phẳng tất cả như trước)
// -------------------------------------------------------------------------
// Từ khi "Quản lý danh mục" hỗ trợ Danh mục cha/con, collection "categories" chứa cả
// danh mục cha lẫn con lẫn lộn (phân biệt qua parentId). Sidebar trang chủ giờ chỉ nên
// hiển thị các NHÓM CHA (VD: "DỤNG CỤ CẮT GỌT"), còn danh mục con (VD: "Dao Phay") sẽ
// hiện ra trong Mega Menu khi hover vào nhóm cha — đúng kiểu bố cục 2 cấp đã thống nhất.
// =========================================================================
const categories = computed(() => {
  const activeCats = categoryDocs.value
    .filter(c => c.isActive === true && !c.parentId) // ⚡ chỉ lấy danh mục KHÔNG có parentId (danh mục cha)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => {
      const catField = locale.value === 'vi' ? 'name_vi' : 'name_en'
      return c[catField] || c.name || c.category || c.id
    })
  return [...new Set(activeCats)]
})

const filteredProducts = computed(() => {
  let result = products.value
  if (searchStore.searchQuery && searchStore.searchQuery.trim() !== '') {
    const query = searchStore.searchQuery.toLowerCase().trim()
    result = result.filter(p => {
      const name = (p[`name_${locale.value}`] || p.name || '').toLowerCase()
      const brand = (p.brand || '').toLowerCase()
      return name.includes(query) || brand.includes(query)
    })
  }
  return result
})

// ==========================================
// --- LOGIC BỘ LỌC 2 TẦNG (HOT SALE CELLPHONES) ---
// ==========================================
const activePromoCategory = ref('all') 
const activePromoBrand = ref('all')    
const promoScrollContainer = ref(null) 

const promoCategories = computed(() => {
  const cats = [...new Set(allPromoProducts.value.map(p => {
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    return p[catField] || p.category || p.category_name || 'Khác'
  }).filter(Boolean))]

  return [
    { id: 'all', name: locale.value === 'vi' ? 'Tất cả' : 'All' },
    ...cats.map(c => ({ id: c, name: c }))
  ]
})

const promoBrands = computed(() => {
  let prods = allPromoProducts.value

  if (activePromoCategory.value !== 'all') {
    prods = prods.filter(p => {
      const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
      const pCat = p[catField] || p.category || p.category_name || 'Khác'
      return pCat === activePromoCategory.value
    })
  }

  const brands = [...new Set(prods.map(p => p.brand).filter(Boolean))]
  return [
    { id: 'all', name: locale.value === 'vi' ? 'Tất cả' : 'All' },
    ...brands.map(b => ({ id: b, name: b }))
  ]
})

const selectPromoCategory = (catId) => {
  activePromoCategory.value = catId
  activePromoBrand.value = 'all'
}

const promoProducts = computed(() => {
  let hots = allPromoProducts.value

  if (activePromoCategory.value !== 'all') {
    hots = hots.filter(p => {
      const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
      const pCat = p[catField] || p.category || p.category_name || 'Khác'
      return pCat === activePromoCategory.value
    })
  }

  if (activePromoBrand.value !== 'all') {
    hots = hots.filter(p => p.brand === activePromoBrand.value)
  }

  return hots
})

const scrollPromoLeft = () => {
  if (promoScrollContainer.value) {
    promoScrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollPromoRight = () => {
  if (promoScrollContainer.value) {
    promoScrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}
// ==========================================

const topFlashSaleProducts = computed(() => {
  let hots = [...allPromoProducts.value] 
  hots.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
  return hots.slice(0, 5)
})

const hotProducts = computed(() => {
  let hots = [...allPromoProducts.value]
  if (hots.length < 4) {
    const additional = products.value.filter(p => !hots.some(hp => hp.id === p.id)) 
    hots = [...hots, ...additional]
  }
  return hots.slice(0, 4)
})

// =========================================================================
// ⚡ UPDATE MỚI: getProductsByCategory GIỜ HIỂU ĐƯỢC QUAN HỆ CHA-CON
// -------------------------------------------------------------------------
// Sản phẩm KHÔNG BAO GIỜ được gán trực tiếp cho 1 Danh mục CHA (VD "DỤNG CỤ CẮT GỌT"),
// mà luôn gán cho Danh mục CON cụ thể nhất (VD "Dao Phay"). Nếu hàm này nhận vào tên 1
// Danh mục cha mà không tự "gom" thêm sản phẩm của toàn bộ con nó, kết quả trả về sẽ
// LUÔN RỖNG (vì không sản phẩm nào có category_vi = "DỤNG CỤ CẮT GỌT" cả) -> hỏng cả
// Mega Menu lẫn Khối tổng hợp theo danh mục ở cuối trang. Hàm dưới đây tự phát hiện: nếu
// catName truyền vào là 1 Danh mục cha -> gom sản phẩm của MỌI danh mục con thuộc về nó.
// Vẫn giữ nguyên khả năng hoạt động bình thường nếu truyền vào tên 1 Danh mục con (hoặc
// 1 danh mục "mồ côi" cũ chưa từng được phân cấp cha/con) — không phá vỡ gì đã có.
// =========================================================================
const getProductsByCategory = (catName) => {
  const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
  const nameField = locale.value === 'vi' ? 'name_vi' : 'name_en'

  const catDoc = categoryDocs.value.find(c => {
    return (c[nameField] || c.name || c.category || c.id) === catName
  })

  // Nếu catDoc là 1 Danh mục CHA (không có parentId), lấy thêm toàn bộ danh mục CON của nó
  const childCatDocs = (catDoc && !catDoc.parentId)
    ? categoryDocs.value.filter(c => c.parentId === catDoc.id)
    : []
  const childCatNames = childCatDocs.map(c => c[nameField] || c.name_vi)

  return products.value.filter(p => {
    const pCat = p[catField] || p.category || p.category_name
    if (pCat === catName) return true
    if (childCatNames.includes(pCat)) return true
    if (catDoc && (p.categoryId === catDoc.id || p.category_id === catDoc.id)) return true
    if (childCatDocs.some(cd => p.categoryId === cd.id || p.category_id === cd.id)) return true
    return false
  })
}

// ⚡ UPDATE MỚI: Hàm lấy danh sách TÊN các Danh mục CON thuộc về 1 Danh mục CHA — dùng để
// hiển thị nhóm "Danh mục con" trong Mega Menu (sidebar) và ở đầu mỗi khối sản phẩm cuối trang
const getSubCategories = (parentName) => {
  const nameField = locale.value === 'vi' ? 'name_vi' : 'name_en'
  const parentDoc = categoryDocs.value.find(c => (c[nameField] || c.name || c.category || c.id) === parentName)
  if (!parentDoc) return []
  return categoryDocs.value
    .filter(c => c.parentId === parentDoc.id && c.isActive === true)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => c[nameField] || c.name_vi)
}

// ⚡ UPDATE MỚI: Hàm tạo đường dẫn tới trang chi tiết sản phẩm — ưu tiên dùng Slug SEO thân thiện
// (VD: /product/may-phay-cnc-korloy-6mm), nếu sản phẩm chưa khai báo Slug thì dùng lại ID Firestore
// như cũ (VD: /product/04bZvFEPryme2IHGYwMu) để không phá vỡ các link cũ
const getProductLink = (p) => '/product/' + (p?.slug || p?.id)

const getCategoryBanner = (catName) => {
  const catDoc = categoryDocs.value.find(c => {
    const nameField = locale.value === 'vi' ? 'name_vi' : 'name_en'
    return (c[nameField] || c.name || c.category || c.id) === catName
  })

  if (catDoc && (catDoc.banner || catDoc.image || catDoc.bannerUrl)) {
    return catDoc.banner || catDoc.image || catDoc.bannerUrl
  }

  return categoryBanners.value[catName] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800'
}
</script>

<template>
  <div class="bg-slate-50 font-sans antialiased text-slate-900 pb-12">
    
    <!-- 1. Thanh Campaign Khuyến Mãi Đầu Trang -->
    <Transition name="slide-down">
      <div v-if="activeBannerPromo" 
           class="relative overflow-hidden bg-linear-to-r from-red-700 via-red-600 to-red-700 text-white py-2.5 shadow-md z-50">
        <div class="flex items-center justify-center gap-8 whitespace-nowrap">
          <div class="flex animate-marquee space-x-12 items-center">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <span class="bg-yellow-400 text-red-950 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shadow-sm">🔥 HOT SALE</span>
              <span class="text-xs font-bold uppercase tracking-wide">
  {{ activeBannerPromo.title }}: ƯU ĐÃI ĐẾN 
  {{ activeBannerPromo.tiers?.[0]?.discount_value?.toLocaleString('vi-VN') }}
  {{ activeBannerPromo.tiers?.[0]?.discount_type === 'percentage' ? '%' : ' VNĐ' }}
</span>
              <span 
  v-if="activeBannerPromo.end_date" 
  class="inline-flex items-center gap-1.5 text-[11px] font-medium text-yellow-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-400/40 shadow-inner"
>
  <!-- Icon đồng hồ chạy nhẹ nhàng -->
  <svg class="w-3.5 h-3.5 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>

  <span class="text-white/90">Kết thúc sau:</span>
  <span class="font-mono font-black text-yellow-300 tracking-wider">
    {{ getCountdown(activeBannerPromo.end_date) }}
  </span>
</span>
              <span class="text-white/40 text-xs"></span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. Khối Hero Slider & Sidebar Danh Mục (CellphoneS Style) -->
    <section class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        <!-- Sidebar Danh mục sản phẩm (Bên trái) -->
<!-- Sidebar Danh mục sản phẩm (Bên trái) -->
<aside 
  class="hidden lg:flex flex-col lg:col-span-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 p-2.5 relative z-40"
  @mouseleave="activeHoverCategory = null; activeFlyoutBrand = null"
>
  <div class="text-xs font-black uppercase text-slate-400 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      Danh mục
    </span>
  </div>

  <!-- Danh sách các danh mục chính -->
  <ul class="divide-y divide-slate-50 my-1 grow">
    <!-- ⚡ UPDATE MỚI: Hiện khung skeleton (giả lập nội dung đang tải) khi danh mục CHƯA
         tải xong, thay vì để trống hoàn toàn như trước -> cảm giác "mượt" hơn nhiều dù
         thời gian tải thực tế không đổi -->
    <template v-if="isCategoriesLoading">
      <li v-for="n in 7" :key="'skeleton-cat-' + n" class="px-3 py-2.5">
        <div class="h-3.5 bg-slate-100 rounded-full animate-pulse" :style="{ width: (50 + (n % 4) * 10) + '%' }"></div>
      </li>
    </template>
    <template v-else>
    <li 
      v-for="cat in categories" 
      :key="cat"
      @mouseenter="activeHoverCategory = cat; activeFlyoutBrand = null"
      class="group"
    >
      <!-- 
        ⚡ UPDATE MỚI: Sửa lỗi mất chữ khi tên danh mục chứa ký tự đặc biệt (VD: "&" trong
        "Mũi khoan & Mũi taro"). Trước đây link được ghép bằng nối chuỗi thủ công
        ('/products?category=' + cat) -> Vue Router KHÔNG tự encode ký tự đặc biệt trong
        kiểu ghép chuỗi này, khiến "&" bị trình duyệt hiểu nhầm là dấu ngăn cách query string
        khác -> mất phần tên đứng sau "&". Đổi sang dùng object { path, query } để Vue Router
        tự động encode an toàn mọi ký tự đặc biệt (bao gồm "&", khoảng trắng, dấu tiếng Việt...).
      -->
      <router-link 
        :to="{ path: '/products', query: { category: cat } }" 
        class="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold"
        :class="activeHoverCategory === cat ? 'bg-red-50 text-red-600 shadow-inner' : 'text-slate-700 hover:bg-slate-50 hover:text-red-600'"
      >
        <span class="truncate">{{ cat }}</span>
        <span class="text-slate-300 group-hover:text-red-600 transition-transform duration-300 group-hover:translate-x-1">&rsaquo;</span>
      </router-link>
    </li>
    </template>
  </ul>

  <!-- MEGA MENU FLYOUT -->
  <Transition name="fade-fast">
    <div 
      v-if="activeHoverCategory" 
      class="absolute top-0 left-[102%] w-150 min-h-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 grid grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="col-span-2 space-y-5">
        <div>
          <h3 class="text-sm font-black uppercase text-red-600 tracking-wider mb-3 border-b border-red-100 pb-2 flex items-center gap-2">
            {{ activeHoverCategory }}
          </h3>

          <!-- 
            ⚡ UPDATE MỚI: KHỐI "DANH MỤC CON" TRONG MEGA MENU
            Hiển thị các Danh mục con thuộc về Danh mục cha đang hover (VD hover
            "DỤNG CỤ CẮT GỌT" -> hiện "Dao Phay", "Dao Tiện", "Mũi Khoan", "Mũi Taro"...).
            Bấm vào 1 danh mục con sẽ điều hướng thẳng tới trang sản phẩm đã lọc đúng
            danh mục con đó — dùng lại đúng cú pháp { path, query } (Vue Router tự encode
            an toàn ký tự đặc biệt) giống hệt cách sidebar chính đang làm.
          -->
          <div v-if="getSubCategories(activeHoverCategory).length > 0" class="mb-4">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Danh mục con</p>
            <div class="flex flex-wrap gap-2">
              <router-link
                v-for="sub in getSubCategories(activeHoverCategory)"
                :key="sub"
                :to="{ path: '/products', query: { category: sub } }"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
              >
                {{ sub }}
              </router-link>
            </div>
          </div>
          
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Thương hiệu hàng đầu</p>
            <!-- Nút hủy chọn thương hiệu khi đang lọc -->
          </div>

          <!-- NÚT LỌC THƯƠNG HIỆU -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button 
              v-for="brand in getSubCategoriesOrBrands(activeHoverCategory)" 
              :key="brand"
              @click="activeFlyoutBrand = (activeFlyoutBrand === brand ? null : brand)"
              class="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer border"
              :class="activeFlyoutBrand === brand 
                ? 'bg-red-600 text-white border-red-600 shadow-md font-bold' 
                : 'bg-slate-50 hover:bg-red-600 hover:text-white border-slate-100 hover:border-red-600 text-slate-600'"
            >
              {{ brand }}
            </button>

            <span v-if="getSubCategoriesOrBrands(activeHoverCategory).length === 0" class="text-xs text-slate-400 italic py-1">
              Đang cập nhật thương hiệu...
            </span>
          </div>
        </div>

        <!-- KHUNG SẢN PHẨM NỔI BẬT NẰM TRONG KHUNG LỌC -->
        <div>
          <p class="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wide flex items-center justify-between">
            <span>Sản phẩm nổi bật</span>
            <span v-if="activeFlyoutBrand" class="text-red-600 font-extrabold lowercase">
              ({{ activeFlyoutBrand }})
            </span>
          </p>

          <div class="grid grid-cols-2 gap-3">
            <router-link 
              v-for="p in getProductsByCategory(activeHoverCategory)
                .filter(p => !activeFlyoutBrand || (p.brand && p.brand.toLowerCase() === activeFlyoutBrand.toLowerCase()))
                .slice(0, 4)" 
              :key="p.id"
              :to="getProductLink(p)"
              class="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50/80 border border-slate-100 transition-all duration-200 group shadow-sm hover:shadow"
            >
              <div class="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                <img :src="p.image" :alt="p.name" class="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div class="overflow-hidden flex-1">
                <p class="text-[11px] font-bold text-slate-700 truncate group-hover:text-red-600 mb-0.5">{{ p[`name_${locale}`] || p.name }}</p>
                <p class="text-[11px] font-black text-red-600">{{ (getSalePrice(p) || p.price)?.toLocaleString() }}đ</p>
              </div>
            </router-link>

            <!-- Trường hợp thương hiệu được chọn không có sản phẩm nào -->
            <div 
              v-if="getProductsByCategory(activeHoverCategory).filter(p => !activeFlyoutBrand || (p.brand && p.brand.toLowerCase() === activeFlyoutBrand.toLowerCase())).length === 0" 
              class="col-span-2 text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
            >
              Chưa có sản phẩm nổi bật cho thương hiệu <strong>{{ activeFlyoutBrand }}</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- Banner phải trong Mega Menu -->
      <div class="col-span-1 border-l border-slate-100 pl-5 flex flex-col h-full">
        <!-- 
          ⚡ UPDATE MỚI: Gắn link cho Banner Mega Menu — bấm vào sẽ dẫn thẳng tới trang sản
          phẩm của đúng Danh mục đang hover, dùng cú pháp { path, query } (Vue Router tự
          encode an toàn ký tự đặc biệt) giống hệt các link danh mục khác trong file này.
        -->
        <router-link 
          :to="{ path: '/products', query: { category: activeHoverCategory } }"
          class="relative rounded-xl overflow-hidden h-full min-h-55 bg-slate-900 group/banner shadow-inner block"
        >
          <img :src="getCategoryBanner(activeHoverCategory)" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/banner:scale-110 group-hover/banner:opacity-70 transition-all duration-500 ease-out" />
          <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div class="relative z-10 h-full p-4 flex flex-col justify-end text-white">
            <span class="inline-block bg-yellow-400 text-slate-900 text-[9px] font-black uppercase px-2 py-0.5 rounded w-max mb-1.5">Nổi bật</span>
            <p class="text-sm font-black leading-snug mb-3 line-clamp-2 drop-shadow-md">{{ activeHoverCategory }}</p>
          </div>
        </router-link>
      </div>
    </div>
  </Transition>

<a 
  :href="'https://zalo.me/' + (websiteSettings?.zalo || websiteSettings?.zaloPhone || '0347527093')"
  target="_blank"
  class="block bg-linear-to-br from-red-50 to-red-100/50 border border-red-100 rounded-xl p-3 text-center mt-2 group cursor-pointer hover:border-red-300 transition-colors"
>
  <p class="text-[10px] text-primary font-bold uppercase tracking-wide">Hotline MUA HÀNG GIAO GẤP</p>
  <p class="text-sm font-black text-primary mt-1 flex items-center justify-center gap-1.5 group-hover:scale-105 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
    {{ websiteSettings?.zalo || websiteSettings?.zaloPhone || '0347527093' }}
  </p>
</a>
</aside>

        <!-- Banner Swiper chính -->
        <div class="lg:col-span-9 h-70 sm:h-87.5 lg:h-105 rounded-2xl overflow-hidden shadow-md group relative">
          <swiper
            v-if="mainBanners.length > 0"
            :modules="swiperModules"
            :slides-per-view="1"
            :loop="mainBanners.length > 1"
            :effect="'fade'"
            :autoplay="mainBanners.length > 1 ? { delay: 5000, disableOnInteraction: false } : false"
            :pagination="{ clickable: true, dynamicBullets: true }"
            :navigation="true"
            class="h-full w-full custom-swiper bg-slate-900"
          >
            <swiper-slide v-for="banner in mainBanners" :key="banner.id" class="overflow-hidden">
              <div class="relative h-full w-full flex items-center md:items-end p-6 md:p-12 lg:p-16">
                <!-- Ảnh nền -->
                <img :src="banner.image" class="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-10000 ease-linear scale-100 hover:scale-110" />
                
                <!-- Lớp phủ gradient -->
                <div class="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-slate-950/90 via-slate-900/60 to-transparent z-1"></div>
                
                <!-- Content text -->
                <div class="relative z-10 w-full max-w-2xl space-y-3 md:space-y-4 text-white transform translate-y-4 md:translate-y-0">
                  <template v-if="banner.useI18n">
                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-lg leading-tight" v-html="$t('home.hero_title')"></h1>
                    <p class="text-slate-200 text-sm md:text-base line-clamp-3 md:max-w-xl font-medium drop-shadow">{{ $t('home.hero_subtitle') }}</p>
                  </template>
                  <template v-else>
                    <span v-if="banner.subtitle" class="bg-red-600/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold uppercase px-3 py-1 rounded-md inline-block shadow-md tracking-wider">
                      {{ banner.subtitle }}
                    </span>
                    <h1 v-if="banner.title" class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-lg leading-tight" v-html="banner.title"></h1>
                    <p v-if="banner.desc" class="text-slate-200 text-sm md:text-base line-clamp-3 md:max-w-xl font-medium opacity-95 drop-shadow">{{ banner.desc }}</p>
                  </template>

                  <div class="pt-4 md:pt-6">
                  </div>
                </div>
              </div>
            </swiper-slide>
          </swiper>
          
          <!-- Fallback khi đang load banner -->
          <div v-else class="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
            <svg class="w-10 h-10 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>
        </div>
      </div>
    </section>

<!-- === SECTION SẢN PHẨM HOT / BÁN CHẠY NẰM NGANG === -->
<section class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-4">
  <div class="w-full bg-linear-to-r from-red-50 via-white to-orange-50 rounded-2xl border border-red-200 p-3 shadow-sm flex flex-col md:flex-row gap-4 items-stretch overflow-hidden relative">
    <!-- Hiệu ứng viền sáng -->
    <div class="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 to-orange-400"></div>

    <!-- CỘT TRÁI: BANNER NỔI BẬT (ĐÃ UPDATE ĐỒNG BỘ ẢNH DYNAMIC) -->
    <div class="w-full md:w-1/5 shrink-0 rounded-xl overflow-hidden relative group cursor-pointer shadow-sm min-h-50">
      <img :src="dynamicHotSaleBanner" alt="Hot Sale Banner" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
        <h3 class="text-primary font-black text-lg uppercase leading-tight">Top<br>Bán Chạy</h3>
        <!--<p class="text-white/80 text-[10px] mt-1">Sản phẩm được mua nhiều nhất</p>-->
      </div>
    </div>

    <!-- CỘT PHẢI: 4 SẢN PHẨM HOT -->
    <div class="w-full md:w-4/5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div 
        v-for="product in hotProducts" 
        :key="'hot-' + product.id"
        class="bg-white rounded-xl p-3 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-red-400 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
      >
        <!-- UPDATE GIÁ ẢO & CHIẾT KHẤU: Badge HOT + Tag % Giảm giá -->
        <div class="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
          <div class="bg-linear-to-r from-red-600 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
            🔥 HOT
          </div>
          <div v-if="getDiscountPercent(product, product.sales_type === 'box') > 0" class="bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black shadow">
            Giảm {{ getDiscountPercent(product, product.sales_type === 'box') }}%
          </div>
        </div>
        
        <div>
          <div class="aspect-square bg-white rounded-lg overflow-hidden mb-2 p-1 flex items-center justify-center">
            <img :src="product.image" :alt="product[`name_${locale}`] || product.name" class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <!-- Tag quy cách bán hàng + Thương hiệu -->
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <span class="text-[9px] font-bold text-slate-400 uppercase block truncate">{{ product.brand || 'Khác' }}</span>
            <span v-if="product.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
            <span v-else-if="product.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
            <!-- ⚡ UPDATE MỚI: Bổ sung nhãn "Chỉ bán Viên" đồng bộ với AdminView (sales_type === 'vien') -->
            <span v-else-if="product.sales_type === 'vien'" class="bg-violet-50 text-violet-600 text-[8px] font-bold px-1.5 py-px rounded border border-violet-200 whitespace-nowrap">VIÊN</span>
            <!-- ⚡ UPDATE MỚI (2): Bổ sung nhãn "Chỉ bán Cái" đồng bộ với AdminView (sales_type === 'cai') -->
            <span v-else-if="product.sales_type === 'cai'" class="bg-cyan-50 text-cyan-600 text-[8px] font-bold px-1.5 py-px rounded border border-cyan-200 whitespace-nowrap">CÁI</span>
            <span v-else-if="product.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
          </div>

          <h4 class="text-xs font-bold text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors leading-tight">
            {{ product[`name_${locale}`] || product.name }}
          </h4>
        </div>
        
        <!-- UPDATE GIÁ ẢO & CHIẾT KHẤU: ĐỒNG BỘ GIÁ BÁN, GIÁ ẢO / GIÁ NIÊM YẾT VÀ NÚT CATALOG -->
        <div class="mt-3 pt-2 border-t border-slate-100">

          <!-- ================= TRƯỜNG HỢP 1: BÁN THEO HỘP (sales_type === 'box') ================= -->
          <template v-if="product?.sales_type === 'box'">
            <div v-if="getSalePriceBox(product) || product?.price_box" class="flex items-baseline gap-1 flex-wrap">
              <!-- Giá Hộp thực tế bán -->
              <span class="text-base sm:text-lg font-black text-red-600">
                {{ Math.round(getSalePriceBox(product) || product.price_box).toLocaleString('vi-VN') }}đ
              </span>
              <span class="text-[10px] font-bold text-slate-500 uppercase">/ HỘP</span>
              
              <!-- Hiển thị Giá Ảo / Giá Niêm Yết gạch đi cho Hộp -->
              <span v-if="getDisplayOriginalPrice(product, true)" class="text-[10px] text-slate-400 line-through font-medium ml-1">
                {{ Math.round(getDisplayOriginalPrice(product, true)).toLocaleString('vi-VN') }}đ
              </span>
            </div>

            <div v-else class="text-base sm:text-lg font-black text-red-600">
              Liên hệ giá
            </div>
          </template>

          <!-- ================= TRƯỜNG HỢP 2: BÁN THEO MẢNH / VIÊN / CÁI (KHÔNG BÁN HỘP) ================= -->
          <template v-else>
            <div v-if="getSalePrice(product) || product?.price" class="flex items-baseline gap-1 flex-wrap">
              <!-- Giá Mảnh / Viên / Cái thực tế bán -->
              <span class="text-sm sm:text-base font-black text-red-600">
                {{ Math.round(getSalePrice(product) || product.price).toLocaleString('vi-VN') }}đ
              </span>
              <!-- ⚡ UPDATE MỚI: Hiển thị đơn vị "Viên" / "Cái" thay vì luôn cứng "Mảnh" -->
              <!-- ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (sales_type = piece) vẫn giữ nguyên "Mảnh" -->
              <span class="text-[10px] font-bold text-slate-500 uppercase">/ {{ product.sales_type === 'vien' ? 'Viên' : (product.sales_type === 'cai' ? 'Cái' : (product.sales_type === 'piece' ? 'Mảnh' : 'Cái')) }}</span>

              <!-- Hiển thị Giá Ảo / Giá Niêm Yết gạch đi cho Mảnh -->
              <span v-if="getDisplayOriginalPrice(product, false)" class="text-[10px] text-slate-400 line-through font-medium ml-1">
                {{ Math.round(getDisplayOriginalPrice(product, false)).toLocaleString('vi-VN') }}đ
              </span>
            </div>

            <div v-else class="text-sm sm:text-base font-black text-red-600">
              Liên hệ giá
            </div>
          </template>

          <!-- Nút Xem Catalog -->
          <a 
            v-if="product?.catalog_link || product?.catalog || product?.catalog_url || product?.pdf"
            :href="product.catalog_link || product.catalog || product.catalog_url || product.pdf" 
            target="_blank"
            @click.stop
            class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
          </a>
        </div>

        <!-- Layer click nhảy sang trang chi tiết -->
        <router-link :to="getProductLink(product)" class="absolute inset-0 z-10"></router-link>
      </div>
    </div>
  </div>
</section>

<!-- 4. MAIN CONTENT AREA -->
  <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-6">
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <div class="inline-block animate-spin text-3xl mb-2 text-red-600">🌀</div>
      <p class="font-bold text-slate-400 uppercase tracking-widest text-xs">{{ $t('product.processing') }}</p>
    </div>

    <div v-else>
      <!-- KẾT QUẢ TÌM KIẾM TỪ SEARCH BAR -->
      <div id="search-results" v-if="searchStore.searchQuery && searchStore.searchQuery.trim() !== ''" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm scroll-mt-24">
        <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          🔍 Kết quả tìm kiếm cho: <span class="text-red-600">"{{ searchStore.searchQuery }}"</span>
        </h2>
        
        <div v-if="filteredProducts.length === 0" class="text-center py-12">
          <p class="text-slate-400 font-semibold uppercase tracking-wider text-xs">Không tìm thấy sản phẩm nào phù hợp</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <div v-for="p in filteredProducts" :key="p.id" 
               class="group bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
            
            <div>
              <!-- UPDATE GIÁ & CHIẾT KHẤU: Tính % Giảm theo loại bán -->
              <div v-if="getDiscountPercent(p, p.sales_type === 'box') > 0" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
                Giảm {{ getDiscountPercent(p, p.sales_type === 'box') }}%
              </div>

              <div class="h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/30 transition-colors">
                <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
              </div>

              <div>
                <!-- Tag quy cách bán hàng -->
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase block">{{ p.brand }}</span>
                  <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
                  <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
                  <!-- ⚡ UPDATE MỚI: Bổ sung nhãn "Chỉ bán Viên" đồng bộ với AdminView -->
                  <span v-else-if="p.sales_type === 'vien'" class="bg-violet-50 text-violet-600 text-[8px] font-bold px-1.5 py-px rounded border border-violet-200 whitespace-nowrap">VIÊN</span>
                  <!-- ⚡ UPDATE MỚI (2): Bổ sung nhãn "Chỉ bán Cái" đồng bộ với AdminView -->
                  <span v-else-if="p.sales_type === 'cai'" class="bg-cyan-50 text-cyan-600 text-[8px] font-bold px-1.5 py-px rounded border border-cyan-200 whitespace-nowrap">CÁI</span>
                  <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
                </div>
                <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                  {{ p[`name_${locale}`] || p.name }}
                </h3>
              </div>
            </div>

            <!-- UPDATE GIÁ & CHIẾT KHẤU: Thêm hiển thị giá đồng bộ cho thẻ tìm kiếm -->
            <div class="mt-3 pt-2 border-t border-slate-100">
              <template v-if="p?.sales_type === 'box'">
                <div v-if="getSalePriceBox(p) || p?.price_box" class="flex items-baseline gap-1 flex-wrap">
                  <span class="text-xs sm:text-base font-black text-red-600">
                    {{ Math.round(getSalePriceBox(p) || p.price_box).toLocaleString('vi-VN') }}đ
                  </span>
                  <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
                  <span v-if="getDisplayOriginalPrice(p, true)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-1">
                    {{ Math.round(getDisplayOriginalPrice(p, true)).toLocaleString('vi-VN') }}đ
                  </span>
                </div>
                <div v-else class="text-xs sm:text-base font-black text-red-600">Liên hệ giá</div>
              </template>

              <template v-else>
                <div v-if="getSalePrice(p) || p?.price" class="flex items-baseline gap-1 flex-wrap">
                  <span class="text-xs sm:text-base font-black text-red-600">
                    {{ Math.round(getSalePrice(p) || p.price).toLocaleString('vi-VN') }}đ
                  </span>
                  <!-- ⚡ UPDATE MỚI: Đơn vị "Viên" / "Cái" thay vì luôn cứng "Mảnh" -->
                  <!-- ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (sales_type = piece) vẫn giữ nguyên "Mảnh" -->
                  <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ {{ p.sales_type === 'vien' ? 'Viên' : (p.sales_type === 'cai' ? 'Cái' : (p.sales_type === 'piece' ? 'Mảnh' : 'Cái')) }}</span>
                  <span v-if="getDisplayOriginalPrice(p, false)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-1">
                    {{ Math.round(getDisplayOriginalPrice(p, false)).toLocaleString('vi-VN') }}đ
                  </span>
                </div>
                <div v-else class="text-xs sm:text-base font-black text-red-600">Liên hệ giá</div>
              </template>
            </div>

            <router-link :to="getProductLink(p)" class="absolute inset-0 z-10"></router-link>
          </div>
        </div>
      </div>

      <!-- MÀN HÌNH CHÍNH (Cột Filter Trái và Cột Content Phải) -->
      <div v-else class="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">

        <!-- CỘT TRÁI: BỘ LỌC ĐA TIÊU CHÍ (STICKY) -->
        <HomeProductFilter 
          :products="products" 
          :categories="categories" 
          :category-docs="categoryDocs"
          @update:filteredProducts="handleFilteredProducts"
          @update:isFiltering="isFiltering = $event" 
        />
        <!-- ⚡ UPDATE MỚI: Truyền thêm prop "category-docs" (dữ liệu thô danh mục có parentId)
             để HomeProductFilter.vue tự dựng được cây Cha/Con — không đụng gì tới prop
             "categories" cũ, chỉ bổ sung thêm -->

        <!-- CỘT PHẢI: KẾT QUẢ VÀ CÁC KHỐI DANH MỤC -->
        <div class="flex-1 w-full min-w-0 space-y-6">
          
          <!-- Lưới Kết Quả từ Bộ Lọc -->
          <div v-if="isFiltering" class="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
                <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Kết Quả Lọc Sản Phẩm
                </h2>
              </div>
            </div>

            <!-- Trạng thái: Có kết quả -->
            <div v-if="filteredHomeProducts && filteredHomeProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <div v-for="p in filteredHomeProducts" :key="p.id" 
                   class="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative">
                
                <div>
                  <!-- UPDATE GIÁ & CHIẾT KHẤU: Tính % Giảm theo loại bán -->
                  <div v-if="getDiscountPercent(p, p.sales_type === 'box') > 0" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
                    Giảm {{ getDiscountPercent(p, p.sales_type === 'box') }}%
                  </div>

                  <div class="h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
                    <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>

                  <div>
                    <!-- Tag quy cách bán hàng -->
                    <div class="flex items-center justify-between gap-1 mb-0.5">
                      <span class="text-[9px] font-bold text-slate-400 uppercase block">{{ p.brand }}</span>
                      <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
                      <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
                      <!-- ⚡ UPDATE MỚI: Bổ sung nhãn "Chỉ bán Viên" đồng bộ với AdminView -->
                      <span v-else-if="p.sales_type === 'vien'" class="bg-violet-50 text-violet-600 text-[8px] font-bold px-1.5 py-px rounded border border-violet-200 whitespace-nowrap">VIÊN</span>
                      <!-- ⚡ UPDATE MỚI (2): Bổ sung nhãn "Chỉ bán Cái" đồng bộ với AdminView -->
                      <span v-else-if="p.sales_type === 'cai'" class="bg-cyan-50 text-cyan-600 text-[8px] font-bold px-1.5 py-px rounded border border-cyan-200 whitespace-nowrap">CÁI</span>
                      <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
                    </div>
                    <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
                      {{ p[`name_${locale}`] || p.name }}
                    </h3>
                  </div>
                </div>

                <!-- UPDATE GIÁ & CHIẾT KHẤU: Hiển thị giá trong kết quả lọc -->
                <div class="mt-3 pt-2 border-t border-slate-100">
                  <template v-if="p?.sales_type === 'box'">
                    <div v-if="getSalePriceBox(p) || p?.price_box" class="flex items-baseline gap-1 flex-wrap">
                      <span class="text-xs sm:text-base font-black text-red-600">
                        {{ Math.round(getSalePriceBox(p) || p.price_box).toLocaleString('vi-VN') }}đ
                      </span>
                      <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
                      <span v-if="getDisplayOriginalPrice(p, true)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-1">
                        {{ Math.round(getDisplayOriginalPrice(p, true)).toLocaleString('vi-VN') }}đ
                      </span>
                    </div>
                    <div v-else class="text-xs sm:text-base font-black text-red-600">Liên hệ giá</div>
                  </template>

                  <template v-else>
                    <div v-if="getSalePrice(p) || p?.price" class="flex items-baseline gap-1 flex-wrap">
                      <span class="text-xs sm:text-base font-black text-red-600">
                        {{ Math.round(getSalePrice(p) || p.price).toLocaleString('vi-VN') }}đ
                      </span>
                      <!-- ⚡ UPDATE MỚI: Đơn vị "Viên" / "Cái" thay vì luôn cứng "Mảnh" -->
                      <!-- ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (sales_type = piece) vẫn giữ nguyên "Mảnh" -->
                      <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ {{ p.sales_type === 'vien' ? 'Viên' : (p.sales_type === 'cai' ? 'Cái' : (p.sales_type === 'piece' ? 'Mảnh' : 'Cái')) }}</span>
                      <span v-if="getDisplayOriginalPrice(p, false)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-1">
                        {{ Math.round(getDisplayOriginalPrice(p, false)).toLocaleString('vi-VN') }}đ
                      </span>
                    </div>
                    <div v-else class="text-xs sm:text-base font-black text-red-600">Liên hệ giá</div>
                  </template>
                </div>

                <router-link :to="getProductLink(p)" class="absolute inset-0 z-10"></router-link>
              </div>
            </div>

            <!-- Trạng thái: Không có kết quả -->
            <div v-else class="text-center py-10">
              <p class="text-slate-400 font-semibold uppercase tracking-wider text-xs">Không tìm thấy sản phẩm nào phù hợp với bộ lọc</p>
            </div>
          </div>
          
          <!-- BỌC CÁC KHỐI CÒN LẠI ĐỂ ẨN ĐI KHI ĐANG LỌC -->
          <div v-show="!isFiltering" class="space-y-6">
            
<!-- 5. Khối HOT SALE GIÁ SỐC -->
<!-- 
  ⚡ LƯU Ý: Khung này sẽ CHỈ HIỂN THỊ khi mảng `promoProducts` có sản phẩm.
  Sau khi đồng bộ đoạn <script setup>, mảng `promoProducts` chỉ còn chứa sản phẩm thuộc Chiến dịch khuyến mãi thật (Admin chạy campaign), 
  giá ảo sẽ KHÔNG làm cho mảng này có dữ liệu nữa.
-->
<div v-if="promoProducts.length > 0" class="bg-white border-2 border-red-500 rounded-3xl overflow-hidden shadow-sm flex flex-col relative">
  
  <!-- Header Nền Đỏ -->
  <div class="bg-linear-to-r from-red-700 via-red-600 to-red-700 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <h2 class="text-xl sm:text-2xl font-black uppercase italic tracking-wider flex items-center gap-1.5 text-yellow-300 drop-shadow-md">
        HOT SALE GIÁ SỐC
      </h2>
    </div>
    <div v-if="activeBannerPromo?.end_date" class="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-400/40 shadow-inner">
      <span class="text-xs font-semibold text-slate-200">Kết thúc sau:</span>
      <span class="font-mono text-sm font-black text-yellow-300">{{ getCountdown(activeBannerPromo.end_date) }}</span>
    </div>
  </div>

  <!-- Khu vực Nội dung (Nền sáng chứa Slider & Filter) -->
  <div class="p-4 sm:p-6 bg-red-50/20 relative group/promo">
    
    <!-- Bộ lọc 2 Tầng riêng cho Deal Sốc -->
    <div class="space-y-2.5 mb-5">
      <!-- Tầng 1: Lọc Danh Mục -->
      <div class="flex overflow-x-auto gap-2 sm:gap-3 pb-1 scrollbar-hide">
        <button
          v-for="cat in promoCategories" 
          :key="cat.id"
          @click="selectPromoCategory(cat.id)"
          :class="[
            'px-4 py-1.5 rounded-full border whitespace-nowrap text-xs sm:text-sm font-bold transition-all',
            activePromoCategory === cat.id 
              ? 'border-red-500 bg-red-500 text-white shadow-md' 
              : 'border-red-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Tầng 2: Lọc Thương Hiệu -->
      <div v-if="promoBrands.length > 1" class="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
        <button
          v-for="brand in promoBrands" 
          :key="brand.id"
          @click="activePromoBrand = brand.id"
          :class="[
            'px-3 py-1 rounded-full border whitespace-nowrap text-[11px] sm:text-xs font-bold transition-all',
            activePromoBrand === brand.id 
              ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          ]"
        >
          {{ brand.name }}
        </button>
      </div>
    </div>

    <!-- Nút cuộn Trái -->
    <button 
      @click="scrollPromoLeft"
      class="absolute left-2 top-1/2 mt-4 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 transition-all opacity-0 group-hover/promo:opacity-100 disabled:opacity-0"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
    </button>

    <!-- Slider Cuộn Ngang -->
    <div 
      ref="promoScrollContainer"
      class="flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory scroll-smooth scrollbar-hide pb-4 pt-1"
    >
      <!-- Card Sản Phẩm HOT SALE -->
      <div v-for="p in promoProducts" :key="p.id" 
           class="snap-start min-w-40 sm:min-w-50 shrink-0 group bg-white border border-slate-200/60 rounded-2xl p-3 flex flex-col justify-between text-slate-900 hover:shadow-xl hover:border-red-400 transition-all duration-300 relative overflow-hidden">
        
        <div>
          <!-- Tag % Giảm giá của Chiến dịch -->
          <div v-if="getDiscountPercent(p, p.sales_type === 'box') > 0" class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow">
            Giảm {{ getDiscountPercent(p, p.sales_type === 'box') }}%
          </div>
          
          <div class="h-32 sm:h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
            <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>
          
          <div>
            <!-- Tag quy cách bán hàng -->
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="text-[9px] font-bold text-slate-400 uppercase block">{{ p.brand }}</span>
              <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
              <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
              <span v-else-if="p.sales_type === 'vien'" class="bg-violet-50 text-violet-600 text-[8px] font-bold px-1.5 py-px rounded border border-violet-200 whitespace-nowrap">VIÊN</span>
              <!-- ⚡ UPDATE MỚI (2): Bổ sung nhãn "Chỉ bán Cái" đồng bộ với AdminView -->
              <span v-else-if="p.sales_type === 'cai'" class="bg-cyan-50 text-cyan-600 text-[8px] font-bold px-1.5 py-px rounded border border-cyan-200 whitespace-nowrap">CÁI</span>
              <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
            </div>
            <h3 class="font-bold text-xs text-slate-800 line-clamp-2 h-8 group-hover:text-red-600 transition-colors">
              {{ p[`name_${locale}`] || p.name }}
            </h3>
          </div>
        </div>

        <!-- Khối hiển thị Giá thật & Giá ảo niêm yết -->
        <div class="mt-3 pt-2 border-t border-slate-100">

          <!-- TRƯỜNG HỢP 1: BÁN THEO HỘP -->
          <template v-if="p?.sales_type === 'box'">
            <div v-if="getSalePriceBox(p) || p?.price_box" class="flex items-baseline gap-1 flex-wrap">
              <span class="text-sm sm:text-base font-black text-red-600">
                {{ Math.round(getSalePriceBox(p) || p.price_box).toLocaleString('vi-VN') }}đ
              </span>
              <span class="text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
              
              <!-- Vẫn giữ nguyên hiển thị Giá ảo niêm yết gạch đi nếu sản phẩm có tạo giá ảo -->
              <span v-if="getDisplayOriginalPrice(p, true)" class="text-[10px] text-slate-400 line-through font-medium ml-1">
                {{ Math.round(getDisplayOriginalPrice(p, true)).toLocaleString('vi-VN') }}đ
              </span>
            </div>

            <div v-else class="text-sm sm:text-base font-black text-red-600">
              Liên hệ giá
            </div>
          </template>

          <!-- TRƯỜNG HỢP 2: BÁN THEO MẢNH / VIÊN / CÁI -->
          <template v-else>
            <div v-if="getSalePrice(p) || p?.price" class="flex items-baseline gap-1 flex-wrap">
              <span class="text-sm sm:text-base font-black text-red-600">
                {{ Math.round(getSalePrice(p) || p.price).toLocaleString('vi-VN') }}đ
              </span>
              <!-- ⚡ UPDATE MỚI (2): Đơn vị "Cái" bên cạnh "Viên" / "Mảnh" -->
              <!-- ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (sales_type = piece) vẫn giữ nguyên "Mảnh" -->
              <span class="text-[10px] font-bold text-slate-500 uppercase">/ {{ p.sales_type === 'vien' ? 'Viên' : (p.sales_type === 'cai' ? 'Cái' : (p.sales_type === 'piece' ? 'Mảnh' : 'Cái')) }}</span>

              <!-- Vẫn giữ nguyên hiển thị Giá ảo niêm yết gạch đi cho Mảnh / Viên / Cái -->
              <span v-if="getDisplayOriginalPrice(p, false)" class="text-[10px] text-slate-400 line-through font-medium ml-1">
                {{ Math.round(getDisplayOriginalPrice(p, false)).toLocaleString('vi-VN') }}đ
              </span>
            </div>

            <div v-else class="text-sm sm:text-base font-black text-red-600">
              Liên hệ giá
            </div>
          </template>

          <!-- Nút Xem Catalog -->
          <a 
            v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
            :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
            target="_blank"
            @click.stop
            class="relative z-20 mt-2 w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
          </a>
        </div>

        <router-link :to="getProductLink(p)" class="absolute inset-0 z-20"></router-link>
      </div>
    </div>

    <!-- Nút cuộn Phải -->
    <button 
      @click="scrollPromoRight"
      class="absolute right-2 top-1/2 mt-4 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 transition-all opacity-0 group-hover/promo:opacity-100 disabled:opacity-0"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
    </button>

  </div>
</div>

            <!-- 6. KHỐI TỔNG HỢP THEO TỪNG DANH MỤC -->
            <div v-for="cat in categories" :key="cat" class="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              
              <!-- Header Danh Mục -->
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
                  <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                    {{ cat }}
                  </h2>
                </div>
              </div>

              <!-- 
                ⚡ UPDATE MỚI: Hàng "Danh mục con" ngay dưới tiêu đề mỗi khối — giúp khách
                (đặc biệt trên di động, nơi không hover được sidebar) vẫn thấy và bấm thẳng
                vào đúng danh mục con mình cần mà không phải cuộn tìm/mở bộ lọc riêng.
              -->
              <div v-if="getSubCategories(cat).length > 0" class="flex flex-wrap gap-2 -mt-1">
                <router-link
                  v-for="sub in getSubCategories(cat)"
                  :key="sub"
                  :to="{ path: '/products', query: { category: sub } }"
                  class="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                >
                  {{ sub }}
                </router-link>
              </div>

              <!-- Bố cục Khối: Banner Đại Diện bên trái + Lưới Sản Phẩm bên phải -->
              <div class="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
                
                <!-- Banner nhỏ bên trái của danh mục (Ẩn trên Mobile) -->
                <!-- 
                  ⚡ UPDATE MỚI: Gắn link cho Banner từng Danh mục — bấm vào sẽ dẫn thẳng tới
                  trang sản phẩm của đúng Danh mục "cat" đó, đồng bộ cách làm với Banner Mega
                  Menu ở trên.
                -->
                <router-link 
                  :to="{ path: '/products', query: { category: cat } }"
                  class="hidden lg:block lg:col-span-1 relative rounded-2xl overflow-hidden border border-slate-200/60 group bg-slate-900 min-h-80"
                >
                  <img :src="getCategoryBanner(cat)" :alt="cat" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  <div class="relative z-10 h-full p-4 flex flex-col justify-end text-white">
                    <h3 class="font-black text-base uppercase text-white mb-1">{{ cat }}</h3>
                    <p class="text-[10px] text-slate-300 mb-3">Giải pháp công nghệ chính xác hàng đầu</p>
                  </div>
                </router-link>

                <!-- Lưới Sản phẩm thuộc Danh mục (Mobile: 2 cột - PC: 4 cột) -->
                <div class="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  <div 
                    v-for="p in getProductsByCategory(cat).slice(0, 8)" 
                    :key="p.id" 
                    class="group bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative"
                  >
                    <div>
                      <!-- UPDATE GIÁ & CHIẾT KHẤU: Tem Giảm Giá dựa trên getDiscountPercent -->
                      <div 
                        v-if="getDiscountPercent(p, p?.sales_type === 'box') > 0" 
                        class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-600 text-white px-1.5 py-0.5 sm:px-2 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black z-10 shadow"
                      >
                        Giảm {{ getDiscountPercent(p, p?.sales_type === 'box') }}%
                      </div>

                      <!-- Khung Ảnh Sản Phẩm -->
                      <div class="h-28 sm:h-36 w-full flex items-center justify-center p-1.5 sm:p-2 mb-1.5 sm:mb-2 bg-slate-50 rounded-lg sm:rounded-xl group-hover:bg-red-50/20 transition-colors">
                        <img :src="p.image" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>

                      <div>
                        <!-- Tag Thương hiệu + Quy cách bán -->
                        <div class="flex items-center justify-between gap-1 mb-1">
                          <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block truncate max-w-[60%]">{{ p.brand }}</span>
                          <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
                          <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
                          <!-- ⚡ UPDATE MỚI: Bổ sung nhãn "Chỉ bán Viên" đồng bộ với AdminView -->
                          <span v-else-if="p.sales_type === 'vien'" class="bg-violet-50 text-violet-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-violet-200 whitespace-nowrap">VIÊN</span>
                          <!-- ⚡ UPDATE MỚI (2): Bổ sung nhãn "Chỉ bán Cái" đồng bộ với AdminView -->
                          <span v-else-if="p.sales_type === 'cai'" class="bg-cyan-50 text-cyan-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-cyan-200 whitespace-nowrap">CÁI</span>
                          <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
                        </div>

                        <!-- Tên sản phẩm -->
                        <h3 class="font-bold text-[11px] sm:text-xs text-slate-800 line-clamp-2 min-h-8 sm:min-h-9 leading-snug group-hover:text-red-600 transition-colors">
                          {{ p[`name_${locale}`] || p.name }}
                        </h3>
                      </div>
                    </div>

                    <!-- UPDATE GIÁ & CHIẾT KHẤU: Đồng bộ logic hiển thị Giá bán và Giá gạch đi -->
                    <div class="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100">

                      <!-- TRƯỜNG HỢP 1: BÁN THEO HỘP -->
                      <template v-if="p?.sales_type === 'box'">
                        <div v-if="getSalePriceBox(p) || p?.price_box" class="flex items-baseline gap-1 flex-wrap">
                          <span class="text-xs sm:text-base font-black text-red-600">
                            {{ Math.round(getSalePriceBox(p) || p.price_box).toLocaleString('vi-VN') }}đ
                          </span>
                          <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
                          
                          <!-- Giá Hộp Niêm Yết / Giá Ảo Gạch Đi -->
                          <span v-if="getDisplayOriginalPrice(p, true)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-0.5">
                            {{ Math.round(getDisplayOriginalPrice(p, true)).toLocaleString('vi-VN') }}đ
                          </span>
                        </div>

                        <div v-else class="text-xs sm:text-base font-black text-red-600">
                          Liên hệ giá
                        </div>
                      </template>

                      <!-- TRƯỜNG HỢP 2: BÁN THEO MẢNH / VIÊN / CÁI (KHÔNG BÁN HỘP) -->
                      <template v-else>
                        <div v-if="getSalePrice(p) || p?.price" class="flex items-baseline gap-1 flex-wrap">
                          <span class="text-xs sm:text-base font-black text-red-600">
                            {{ Math.round(getSalePrice(p) || p.price).toLocaleString('vi-VN') }}đ
                          </span>
                          <!-- ⚡ UPDATE MỚI (2): Đơn vị "Cái" bên cạnh "Viên" / "Mảnh" -->
                          <!-- ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (sales_type = piece) vẫn giữ nguyên "Mảnh" -->
                          <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ {{ p.sales_type === 'vien' ? 'Viên' : (p.sales_type === 'cai' ? 'Cái' : (p.sales_type === 'piece' ? 'Mảnh' : 'Cái')) }}</span>

                          <!-- Giá Mảnh Niêm Yết / Giá Ảo Gạch Đi -->
                          <span v-if="getDisplayOriginalPrice(p, false)" class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-0.5">
                            {{ Math.round(getDisplayOriginalPrice(p, false)).toLocaleString('vi-VN') }}đ
                          </span>
                        </div>

                        <div v-else class="text-xs sm:text-base font-black text-red-600">
                          Liên hệ giá
                        </div>
                      </template>

                      <!-- Nút Xem Catalog -->
                      <a 
                        v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
                        :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
                        target="_blank"
                        @click.stop
                        class="relative z-20 mt-1.5 sm:mt-2 w-full flex items-center justify-center gap-1 py-1.5 sm:py-1 px-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{{ locale === 'vi' ? 'Xem Catalog' : 'View Catalog' }}</span>
                      </a>
                    </div>

                    <!-- Router Link -->
                    <router-link :to="getProductLink(p)" class="absolute inset-0 z-10"></router-link>
                  </div>

                  <!-- Trống danh mục -->
                  <div v-if="getProductsByCategory(cat).length === 0" class="col-span-full text-center py-8 text-xs text-slate-400 font-semibold">
                    Đang cập nhật sản phẩm cho danh mục này...
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

    <!-- Tin tức & Thương hiệu hợp tác -->
    <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-8 space-y-8">
      <NewsSection />
      <BrandMarquee />
    </div>

  </div>
</template>

<style scoped>
:deep(.custom-swiper) {
  --swiper-theme-color: #ef4444; /* red-500 */
  --swiper-navigation-size: 18px;
}
/* Nút Next / Prev */
:deep(.custom-swiper .swiper-button-next),
:deep(.custom-swiper .swiper-button-prev) {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  color: #1e293b;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
:deep(.custom-swiper:hover .swiper-button-next),
:deep(.custom-swiper:hover .swiper-button-prev) {
  opacity: 1;
  transform: scale(1);
}
:deep(.custom-swiper .swiper-button-next:hover),
:deep(.custom-swiper .swiper-button-prev:hover) {
  background-color: #ef4444;
  color: #fff;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}
:deep(.custom-swiper .swiper-button-prev) { left: 16px; }
:deep(.custom-swiper .swiper-button-next) { right: 16px; }
/* Dấu chấm Pagination dưới đáy */
:deep(.custom-swiper .swiper-pagination-bullets) {
  bottom: 16px !important;
}
:deep(.custom-swiper .swiper-pagination-bullet) {
  background-color: rgba(255, 255, 255, 0.5);
  width: 8px;
  height: 8px;
  border-radius: 4px;
  opacity: 1;
  transition: all 0.3s ease;
}
:deep(.custom-swiper .swiper-pagination-bullet-active) {
  background-color: #ef4444;
  width: 24px;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}
/* Swiper Custom Navigation & Pagination */
:deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.5;
}
:deep(.swiper-pagination-bullet-active) {
  background: #dc2626 !important; 
  opacity: 1;
  width: 22px;
  border-radius: 6px;
}
:deep(.swiper-button-next), :deep(.swiper-button-prev) {
  color: white;
  transform: scale(0.45);
  background: rgba(0, 0, 0, 0.4);
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
:deep(.swiper-button-next:hover), :deep(.swiper-button-prev:hover) {
  background: #dc2626;
}

/* Animations */
.slide-down-enter-active, .slide-down-leave-active { 
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
}
.slide-down-enter-from, .slide-down-leave-to { 
  transform: translateY(-100%); 
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-25%); }
}
.animate-marquee { 
  display: flex; 
  width: 400%; 
  animation: marquee 35s linear infinite; 
}
.animate-marquee:hover { 
  animation-play-state: paused; 
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>