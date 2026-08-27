<template>
  <div v-if="loading" class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải chi tiết sản phẩm...</p>
    </div>
  </div>

  <!-- 
    ⚡ UPDATE MỚI: Trạng thái "Không tìm thấy sản phẩm" — trước đây file này KHÔNG có khối
    này, nếu product.value là null (sản phẩm không tồn tại HOẶC đã bị Admin ẨN) thì trang
    sẽ hiện TRẮNG TRƠN không có gì cả. Giờ hiện thông báo rõ ràng + nút quay về trang chủ.
  -->
  <div v-else-if="!product" class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="flex flex-col items-center gap-4 text-center max-w-md">
      <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">🔍</div>
      <h1 class="text-lg font-black text-slate-800 uppercase">Không tìm thấy sản phẩm</h1>
      <p class="text-sm text-slate-500">Sản phẩm này hiện không khả dụng — có thể đã ngừng kinh doanh hoặc đường dẫn không còn chính xác.</p>
      <router-link to="/products" class="mt-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-colors">
        Xem tất cả sản phẩm
      </router-link>
    </div>
  </div>

  <div class="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-900 selection:bg-red-100" v-else-if="product">
    
    <!-- TOAST NOTIFICATION -->
    <transition name="slide-fade">
      <div v-if="showToast" class="fixed top-24 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800">
        <div class="shrink-0 w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-md shadow-red-900/30">✓</div>
        <p class="text-xs font-bold grow tracking-wide">{{ toastMessage }}</p>
      </div>
    </transition>

    <!-- MODAL PHÓNG TO ẢNH -->
    <transition name="fade">
      <div v-if="isZoomed" class="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 sm:p-8" @click.self="isZoomed = false">
        <button @click="isZoomed = false" class="absolute top-6 right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl transition-colors backdrop-blur-lg">✕</button>
        <img :src="activeImage" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl pointer-events-none select-none" alt="Product Image Zoomed" />
      </div>
    </transition>

<!-- MODAL SO SÁNH SẢN PHẨM -->
<Teleport to="body">
  <transition name="fade">
    <div v-if="isCompareOpen" class="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md" @click.self="isCompareOpen = false">
      <div class="bg-white rounded-4xl sm:rounded-[2.5rem] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div class="flex items-center gap-3">
            <span class="w-3 h-8 bg-red-600 rounded-full"></span>
            <div>
              <h3 class="font-black text-white text-base sm:text-xl uppercase tracking-wider">
                BẢNG SO SÁNH THÔNG SỐ KỸ THUẬT
              </h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                So sánh chi tiết đặc tính kỹ thuật sản phẩm cơ khí
              </p>
            </div>
          </div>
          <button @click="isCompareOpen = false" class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors">✕</button>
        </div>

        <div class="p-4 sm:p-6 overflow-y-auto space-y-6 grow">
          <div class="grid grid-cols-2 gap-3 sm:gap-6">
            <!-- Sản phẩm hiện tại -->
            <div class="bg-slate-50/80 p-4 rounded-3xl border border-slate-200 flex flex-col items-center text-center relative">
              <span class="text-[9px] font-black uppercase bg-red-600 text-white px-3 py-1 rounded-full mb-3 tracking-widest">
                ĐANG XEM
              </span>
              <img :src="product.image" class="w-24 h-24 sm:w-32 sm:h-32 object-contain mix-blend-multiply mb-3" :alt="product.name" />
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ product.brand || 'SPIT' }}</p>
              <h4 class="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug wrap-break-word">{{ product[`name_${locale}`] || product.name }}</h4>
              <p class="text-red-600 font-black text-sm sm:text-lg mt-2">
                {{ currentUnitPrice.toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ / {{ displayUnitLabel }}</span>
              </p>
            </div>

            <!-- Sản phẩm đối chiếu -->
            <div class="bg-slate-50/80 p-4 rounded-3xl border border-slate-200 flex flex-col items-center text-center relative">
              <span class="text-[9px] font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-full mb-3 tracking-widest">
                SẢN PHẨM ĐỐI CHIẾU
              </span>

              <!-- [UPDATE 1]: Thêm ô tìm kiếm sản phẩm nhanh -->
              <div class="w-full mb-2">
                <input 
                  v-model="compareSearchQuery" 
                  type="text" 
                  placeholder="🔍 Nhập mã / tên sản phẩm..." 
                  class="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2 bg-white text-slate-800 focus:border-red-600 focus:outline-none transition-colors"
                />
              </div>

              <!-- [UPDATE 2]: Render danh sách sản phẩm theo danh mục và lọc theo search query -->
              <select v-model="selectedCompareId" class="w-full text-xs font-bold border-2 border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 mb-3 cursor-pointer focus:border-red-600 focus:outline-none transition-colors truncate">
                <option value="" disabled>-- Chọn sản phẩm cùng danh mục --</option>
                <option v-for="item in filteredCompareProducts" :key="item.id" :value="item.id">
                  {{ item.brand ? `[${item.brand}] ` : '' }}{{ item[`name_${locale}`] || item.name }}
                </option>
              </select>

              <!-- [UPDATE 3]: Thông báo nếu không tìm thấy sản phẩm phù hợp -->
              <p v-if="filteredCompareProducts.length === 0" class="text-[10px] text-amber-600 font-semibold mb-2">
                Không có sản phẩm nào phù hợp trong danh mục này.
              </p>

              <template v-if="compareProduct">
                <img :src="compareProduct.image" class="w-24 h-24 sm:w-32 sm:h-32 object-contain mix-blend-multiply mb-3" :alt="compareProduct.name" />
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ compareProduct.brand || 'SPIT' }}</p>
                <h4 class="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug wrap-break-word">{{ compareProduct[`name_${locale}`] || compareProduct.name }}</h4>
                <p class="text-red-600 font-black text-sm sm:text-lg mt-2">
                  {{ cleanNumber(compareProduct.price).toLocaleString('vi-VN') }} <span class="text-[10px]">VNĐ</span>
                </p>
              </template>

              <template v-else>
                <div class="h-40 flex items-center justify-center text-slate-400 text-xs font-medium italic">
                  Chọn sản phẩm ở menu trên để bắt đầu so sánh
                </div>
              </template>
            </div>
          </div>

          <!-- BẢNG SO SÁNH -->
          <div v-if="compareProduct" class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="bg-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th scope="col" class="p-3.5 w-1/3 bg-slate-200/60">Thông số kỹ thuật</th>
                  <th scope="col" class="p-3.5 w-1/3 border-l border-slate-200">{{ product.brand || 'SPIT' }}</th>
                  <th scope="col" class="p-3.5 w-1/3 border-l border-slate-200">{{ compareProduct.brand || 'SPIT' }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-if="allSpecKeys.length > 0">
                  <tr v-for="key in allSpecKeys" :key="key" class="hover:bg-slate-50/80 transition-colors">
                    <td class="p-3 font-extrabold text-slate-700 bg-slate-50/60 uppercase text-[10px] tracking-wider">{{ key }}</td>
                    <td class="p-3 font-bold text-slate-900 border-l border-slate-200">
                      {{ getSpecValue(getParsedSpecs(product), key) }}
                    </td>
                    <td class="p-3 font-bold text-slate-900 border-l border-slate-200">
                      {{ getSpecValue(getParsedSpecs(compareProduct), key) }}
                    </td>
                  </tr>
                </template>

                <tr v-else>
                  <td class="p-3.5 font-black text-red-600 uppercase tracking-wider bg-slate-50/60 align-top">
                    Đặc tính & Thông số
                  </td>
                  <td class="p-3.5 align-top border-l border-slate-200">
                    <div class="raw-html-content text-slate-800 font-medium leading-relaxed"
                         v-html="product[`specifications_${locale}`] || product.specifications || product[`features_${locale}`] || product.features || 'Chưa có thông số chi tiết.'">
                    </div>
                  </td>
                  <td class="p-3.5 align-top border-l border-slate-200">
                    <div class="raw-html-content text-slate-800 font-medium leading-relaxed"
                         v-html="compareProduct[`specifications_${locale}`] || compareProduct.specifications || compareProduct[`features_${locale}`] || compareProduct.features || 'Chưa có thông số chi tiết.'">
                    </div>
                  </td>
                </tr>

                <tr class="bg-slate-50/30">
                  <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60 align-top">Mô tả sản phẩm</td>
                  <td class="p-3.5 align-top border-l border-slate-200 text-slate-600">
                    <div class="raw-html-content max-h-36 overflow-y-auto" v-html="product[`description_${locale}`] || product.description || 'Chưa có thông tin.'"></div>
                  </td>
                  <td class="p-3.5 align-top border-l border-slate-200 text-slate-600">
                    <div class="raw-html-content max-h-36 overflow-y-auto" v-html="compareProduct[`description_${locale}`] || compareProduct.description || 'Chưa có thông tin.'"></div>
                  </td>
                </tr>

                <tr>
                  <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Thương hiệu</td>
                  <td class="p-3.5 font-black text-slate-900 border-l border-slate-200">{{ product.brand || 'SPIT' }}</td>
                  <td class="p-3.5 font-black text-slate-900 border-l border-slate-200">{{ compareProduct.brand || 'SPIT' }}</td>
                </tr>
                <tr>
                  <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Mã sản phẩm / SKU</td>
                  <td class="p-3.5 font-mono font-bold text-slate-800 border-l border-slate-200">{{ product.sku || product.id?.substring(0,8).toUpperCase() }}</td>
                  <td class="p-3.5 font-mono font-bold text-slate-800 border-l border-slate-200">{{ compareProduct.sku || compareProduct.id?.substring(0,8).toUpperCase() }}</td>
                </tr>
                <tr>
                  <td class="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/60">Tình trạng kho</td>
                  <td class="p-3.5 border-l border-slate-200">
                    <span :class="product.stock > 0 ? 'text-green-600 font-extrabold' : 'text-red-500 font-extrabold'">
                      {{ product.stock > 0 ? `Còn ${product.stock} sp` : 'Hết hàng' }}
                    </span>
                  </td>
                  <td class="p-3.5 border-l border-slate-200">
                    <span :class="compareProduct.stock > 0 ? 'text-green-600 font-extrabold' : 'text-red-500 font-extrabold'">
                      {{ compareProduct.stock > 0 ? `Còn ${compareProduct.stock} sp` : 'Hết hàng' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </transition>
</Teleport>

    <!-- CONTAINER TRANG CHI TIẾT SẢN PHẨM -->
    <div class="container mx-auto max-w-6xl py-10 md:py-16 px-4 sm:px-6">

      <!-- 
        ⚡ UPDATE MỚI: THANH ĐIỀU HƯỚNG BREADCRUMB
        -----------------------------------------------------------------
        Giúp khách bấm NGƯỢC về đúng Danh mục (hoặc Trang chủ / trang Sản phẩm) mà không
        phải tự quay về Trang chủ rồi tìm lại danh mục từ đầu như trước đây. Link Danh mục
        dùng đúng cách { path, query } (giống HomeView.vue/ProductsView.vue) để Vue Router
        tự encode an toàn tên danh mục (kể cả tên có ký tự đặc biệt như "&", khoảng trắng...).
        Chỉ hiển thị link Danh mục nếu sản phẩm có khai báo danh mục; nếu không có, breadcrumb
        vẫn hoạt động bình thường, chỉ bớt đi 1 mắt xích.
      -->
      <nav class="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs font-semibold text-slate-500 mb-6">
        <router-link to="/" class="hover:text-red-600 transition-colors shrink-0">Trang chủ</router-link>
        <span class="text-slate-300 shrink-0">›</span>
        <router-link to="/products" class="hover:text-red-600 transition-colors shrink-0">Sản phẩm</router-link>
        <template v-if="product[`category_${locale}`] || product.category">
          <span class="text-slate-300 shrink-0">›</span>
          <router-link
            :to="{ path: '/products', query: { category: product[`category_${locale}`] || product.category } }"
            class="hover:text-red-600 transition-colors shrink-0"
          >
            {{ product[`category_${locale}`] || product.category }}
          </router-link>
        </template>
        <span class="text-slate-300 shrink-0">›</span>
        <span class="text-slate-800 truncate max-w-40 sm:max-w-none">{{ product[`name_${locale}`] || product.name }}</span>
      </nav>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 mb-10">
        
        <!-- Cột hình ảnh -->
        <div class="lg:sticky lg:top-24 space-y-5 w-full">
          <div class="relative rounded-4xl flex items-center justify-center aspect-square overflow-hidden group">
            <img 
              :src="activeImage" 
              @click="isZoomed = true" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out cursor-zoom-in" 
              title="Bấm để phóng to ảnh"
              :alt="product.name" 
            />
          </div>

          <div v-if="product.sub_images && product.sub_images.length > 0" class="flex flex-wrap gap-3 px-1 justify-center lg:justify-start">
            <div @click="activeImage = product.image" :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === product.image ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="product.image" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" :alt="product.name" />
            </div>
            <div v-for="(subImg, index) in product.sub_images" :key="index" @click="activeImage = subImg" :class="['w-16 h-16 p-1.5 rounded-xl bg-white border-2 cursor-pointer transition-all flex items-center justify-center', activeImage === subImg ? 'border-red-600 shadow-md shadow-red-500/5 bg-slate-50' : 'border-slate-100 hover:border-slate-300']">
              <img :src="subImg" class="max-h-full max-w-full object-contain mix-blend-multiply rounded-lg" :alt="`Sub image ${index + 1}`" />
            </div>
          </div>
        </div>
        
        <!-- Cột thông tin sản phẩm -->
        <div class="space-y-6 min-w-0">
          <div>
            <div class="flex flex-wrap gap-2 items-center mb-4">
              <span class="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{{ product.brand || 'SPIT' }}</span>
              <span class="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">MÃ SP: {{ product.sku || product.id?.substring(0,7).toUpperCase() }}</span>
              <span v-if="product.stock > 0" class="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {{ locale === 'vi' ? `CÒN HÀNG: ${product.stock}` : `IN STOCK: ${product.stock}` }}
              </span>
              <span v-else class="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {{ locale === 'vi' ? 'TẠM HẾT HÀNG' : 'OUT OF STOCK' }}
              </span>
            </div>

            <!-- Tên sản phẩm -->
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 uppercase leading-tight tracking-tight mb-2 wrap-break-word">
              {{ product[`name_${locale}`] || product.name }}
            </h1>
            <p class="text-red-600 font-extrabold uppercase text-[10px] tracking-widest border-b border-slate-100 pb-4">
              {{ product[`category_${locale}`] || product.category }}
            </p>
          </div>
          
<!-- HIỂN THỊ CHỌN QUY CÁCH (CHỈ ÁP DỤNG MUA LẺ MẢNH + MUA HỘP) -->
<div v-if="isFlexibleMode" class="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200/80">
  <label class="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
    Chọn quy cách mua:
  </label>
  
  <!-- ⚡ UPDATE: Đã đưa về grid-cols-2 chuyên biệt cho chọn Mảnh (Lẻ) & Hộp (Sỉ), loại bỏ nút Mua Viên -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <!-- Mua Lẻ (Mảnh) -->
    <button 
      type="button"
      @click="selectedUnit = 'piece'"
      class="relative p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex flex-col justify-between cursor-pointer"
      :class="selectedUnit === 'piece' ? 'border-red-600 bg-white shadow-md text-slate-900' : 'border-slate-200 bg-slate-100/70 text-slate-500 hover:border-slate-300'"
    >
      <div class="flex items-center justify-between w-full mb-1">
        <span class="text-xs uppercase font-black">Mua lẻ ({{ unitPieceName }})</span>
        <span v-if="selectedUnit === 'piece'" class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
      </div>
      <span class="text-[10px] text-slate-400 font-semibold">Theo từng mảnh</span>
    </button>

    <!-- Mua Hộp (Sỉ) -->
    <button 
      type="button"
      @click="selectedUnit = 'box'"
      class="relative p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex flex-col justify-between cursor-pointer"
      :class="selectedUnit === 'box' ? 'border-red-600 bg-white shadow-md text-slate-900' : 'border-slate-200 bg-slate-100/70 text-slate-500 hover:border-slate-300'"
    >
      <div class="flex items-center justify-between w-full mb-1">
        <span class="text-xs uppercase font-black">Mua {{ unitBoxName }}</span>
        <span v-if="boxDiscountPercent > 0 && directBoxPrice === 0" class="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-md uppercase">
          -{{ boxDiscountPercent }}%
        </span>
      </div>
      <!-- ⚡ UPDATE MỚI: Quy cách đóng gói theo Hộp giờ hiển thị cố định là "Cái" thay vì unitPieceName (Mảnh/Viên...) theo yêu cầu sếp -->
      <span class="text-[10px] text-slate-500 font-bold">
        Quy cách: {{ boxSize }} {{ locale === 'vi' ? 'Cái' : 'Pc' }}/{{ unitBoxName }}
      </span>
    </button>
  </div>
</div>

          <!-- 🆕 [CẬP NHẬT MỚI] CHẾ ĐỘ "CHỈ BÁN VIÊN", "CHỈ BÁN CÁI", "CHỈ BÁN HỘP" HOẶC "CHỈ BÁN MẢNH" TỪ ADMIN -->
          <div v-else class="inline-flex items-center gap-2 bg-slate-100/90 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200/80 shadow-sm">
            <span class="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">QUY CÁCH BÁN:</span>
            <!-- ⚡ UPDATE MỚI: Bổ sung nhánh hiển thị "CÁI" khi isCaiOnlyMode -->
            <span class="text-slate-900 font-black uppercase tracking-wide text-xs">
              {{ isVienOnlyMode ? 'VIÊN' : (isCaiOnlyMode ? 'CÁI' : (isBoxOnlyMode ? 'CHỈ BÁN HỘP' : (isPieceOnlyMode ? 'CHỈ BÁN MẢNH' : displayUnitLabel))) }}
            </span>
          </div>

          <!-- BANNER ĐẾM NGƯỢC FLASH SALE (CHỈ HIỂN THỊ KHI MUA HỘP VÀ CÓ KM) -->
          <div v-if="hasPromo() && countdown" class="bg-linear-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl sm:text-3xl animate-bounce">🔥</span>
              <div>
                <div class="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>{{ effectivePromo?.title || 'FLASH SALE HOT' }}</span>
                  <span class="bg-white text-red-600 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                    {{ effectivePromo?.type === 'percentage' ? `-${effectivePromo?.value}%` : 'GIẢM GIÁ SỐC' }}
                  </span>
                </div>
                <p class="text-[10px] text-red-100 font-medium">Số lượng ưu đãi có hạn, nhanh tay sở hữu!</p>
              </div>
            </div>

            <!-- BỘ ĐẾM NGƯỢC REAL-TIME -->
            <div class="flex items-center gap-1.5 font-mono text-xs font-black shrink-0">
              <div v-if="countdown.days > 0" class="flex items-center gap-1">
                <div class="bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-center min-w-9 border border-white/10">
                  <span class="block text-sm leading-none">{{ String(countdown.days).padStart(2, '0') }}</span>
                  <span class="text-[8px] font-sans text-red-200 block mt-0.5">NGÀY</span>
                </div>
                <span class="text-white/80 font-bold">:</span>
              </div>

              <div class="bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-center min-w-9 border border-white/10">
                <span class="block text-sm leading-none">{{ String(countdown.hours || 0).padStart(2, '0') }}</span>
                <span class="text-[8px] font-sans text-red-200 block mt-0.5">GIỜ</span>
              </div>
              <span class="text-white/80 font-bold">:</span>

              <div class="bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-center min-w-9 border border-white/10">
                <span class="block text-sm leading-none">{{ String(countdown.minutes || 0).padStart(2, '0') }}</span>
                <span class="text-[8px] font-sans text-red-200 block mt-0.5">PHÚT</span>
              </div>
              <span class="text-white/80 font-bold">:</span>

              <div class="bg-white/20 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-center min-w-9 border border-white/40 shadow-inner">
                <span class="block text-sm leading-none text-yellow-300 animate-pulse">{{ String(countdown.seconds || 0).padStart(2, '0') }}</span>
                <span class="text-[8px] font-sans text-yellow-100 block mt-0.5">GIÂY</span>
              </div>
            </div>
          </div>

          <!-- KHỐI GIÁ SẢN PHẨM -->
          <div class="p-6 sm:p-8 rounded-4xl border transition-all duration-500 bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                ĐƠN GIÁ THEO {{ displayUnitLabel }}:
              </span>
              <span v-if="hasVirtualDiscount" class="text-[10px] bg-red-600 text-white font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center gap-1">
                <span></span> TIẾT KIỆM {{ savingsAmount.toLocaleString('vi-VN') }} VNĐ
              </span>
            </div>

            <!-- Giá hiển thị nổi bật -->
            <div class="flex flex-wrap items-baseline gap-3">
              <div class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-baseline gap-1.5 text-white">
                {{ currentUnitPrice.toLocaleString('vi-VN') }} 
                <span class="text-xs sm:text-sm font-extrabold opacity-50 uppercase shrink-0">
                  VNĐ / {{ displayUnitLabel }}
                </span>
              </div>
              
              <div v-if="hasVirtualDiscount" class="text-slate-400 font-extrabold text-base sm:text-lg line-through opacity-60">
                {{ displayOriginalPrice.toLocaleString('vi-VN') }} VNĐ
              </div>

              <span v-if="hasVirtualDiscount && displayOriginalPrice > 0" class="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                -{{ Math.round(((displayOriginalPrice - currentUnitPrice) / displayOriginalPrice) * 100) }}%
              </span>
            </div>

            <!-- Tổng tiền Real-time -->
            <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">TỔNG THÀNH TIỀN:</span>
              <span class="text-xl sm:text-2xl font-black text-red-500">
                {{ totalPrice.toLocaleString('vi-VN') }} <span class="text-xs font-bold text-slate-300">VNĐ</span>
              </span>
            </div>
          </div>

          <!-- BOX "ƯU ĐÃI ĐẶC BIỆT" & THANH TIẾN ĐỘ THÔNG MINH -->
          <div v-if="activeGiftInfo" class="p-5 sm:p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-200/80 shadow-sm space-y-3.5 relative overflow-hidden">
            <div class="absolute -right-3 -bottom-3 text-5xl opacity-10 pointer-events-none select-none">🎁</div>

            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-md shadow-amber-500/20">
                🎁
              </div>
              <div>
                <h4 class="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                  Ưu Đãi Tặng {{ activeGiftInfo.name }}
                </h4>
                <p class="text-xs font-bold text-amber-900 mt-0.5">
                  Mua <span class="text-red-600 font-black">{{ giftTarget }} {{ displayUnitLabel }}</span> bất kỳ ➔ Tặng ngay <span class="text-red-600 font-black">1 {{ activeGiftInfo.name }}</span>.
                </p>
              </div>
            </div>

            <!-- THANH TIẾN ĐỘ THÔNG MINH -->
            <div class="space-y-2 bg-white p-3 rounded-2xl border border-amber-200/60 shadow-inner">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span :class="comboRemaining <= 0 ? 'text-green-600 font-black' : 'text-slate-700'">
                  <template v-if="comboRemaining > 0">
                    ⚡ Mua thêm <span class="text-red-600 font-black text-xs">{{ comboRemaining }}</span> {{ displayUnitLabel }} nữa để nhận <b>1 {{ activeGiftInfo.name }} miễn phí!</b>
                  </template>
                  <template v-else>
                    🎉 <b>ĐÃ ĐẠT ĐIỀU KIỆN!</b> Tặng kèm 1 {{ activeGiftInfo.name }}.
                  </template>
                </span>
                <span class="text-slate-400 font-mono text-[10px]">{{ quantity }}/{{ giftTarget }} {{ displayUnitLabel }}</span>
              </div>

              <!-- Track Tiến Độ -->
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  class="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
                  :class="comboRemaining <= 0 ? 'bg-linear-to-r from-emerald-500 to-green-500' : 'bg-linear-to-r from-amber-500 to-red-600 animate-pulse'"
                  :style="{ width: `${comboProgress}%` }"
                >
                </div>
              </div>
            </div>
          </div>

          <!-- BỘ CHỌN SỐ LƯỢNG & NÚT THÊM VÀO GIỎ -->
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">SỐ LƯỢNG:</span>
              <div class="flex items-center border-2 border-slate-200 rounded-2xl bg-white overflow-hidden shrink-0">
                <button @click="changeQuantity(-1)" class="w-10 h-10 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 transition-colors active:bg-slate-200 cursor-pointer">-</button>
                <input type="number" v-model.number="quantity" min="1" class="w-14 text-center font-black text-sm text-slate-900 focus:outline-none" />
                <button @click="changeQuantity(1)" class="w-10 h-10 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 transition-colors active:bg-slate-200 cursor-pointer">+</button>
              </div>
              
              <!-- 🆕 [CẬP NHẬT MỚI] Đồng bộ hiển thị đơn vị bên cạnh bộ chọn số lượng -->
              <span class="text-xs font-extrabold text-slate-500 uppercase">
                ({{ isVienOnlyMode || selectedUnit === 'vien' ? unitPieceName : (isBoxOnlyMode || selectedUnit === 'box' ? unitBoxName : unitPieceName) }})
              </span>
            </div>

            <!-- 🆕 [CẬP NHẬT MỚI] Đồng bộ tên đơn vị trên nút Thêm vào giỏ hàng -->
            <button @click="addToCart(product)" :disabled="isAdding || product.stock <= 0" class="group w-full relative overflow-hidden py-5 rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-[0.98] cursor-pointer" :class="product.stock > 0 ? 'bg-slate-950 text-white shadow-slate-950/10 hover:bg-red-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'">
              <span class="relative z-10 tracking-[0.2em] flex items-center justify-center gap-2">
                {{ isAdding ? '...' : (product.stock > 0 ? (locale === 'vi' ? `Thêm ${quantity} ${isVienOnlyMode || selectedUnit === 'vien' ? unitPieceName : (isBoxOnlyMode || selectedUnit === 'box' ? unitBoxName : unitPieceName)} vào giỏ` : 'Add to cart') : 'Hết hàng tạm thời') }}
              </span>
            </button>

            <a v-if="product.catalog_link" :href="product.catalog_link" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950">
              <span class="tracking-[0.2em]">{{ locale === 'vi' ? 'Xem Catalog / Tài liệu' : 'View Catalog / Specs' }}</span>
            </a>

            <!-- NÚT SO SÁNH -->
            <button @click="openCompareModal" class="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 border-slate-900 bg-slate-900 text-white hover:bg-red-600 hover:border-red-600 active:scale-[0.98] shadow-md shadow-slate-900/10 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              <span class="tracking-[0.2em]">{{ locale === 'vi' ? 'So sánh thông số kỹ thuật' : 'Compare Specifications' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- TABS MÔ TẢ & ĐẶC TÍNH -->
      <div class="bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 min-h-100">
        <div class="flex flex-wrap gap-3 mb-8 border-b border-slate-100 pb-5">
          <button @click="activeTab = 'description'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer" :class="activeTab === 'description' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'">
            {{ locale === 'vi' ? 'Mô tả chi tiết' : 'Description' }}
          </button>
          <button @click="activeTab = 'features'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer" :class="activeTab === 'features' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'">
            {{ locale === 'vi' ? 'Đặc tính & Thông số' : 'Features & Specs' }}
          </button>
        </div>

        <div class="w-full">
          <div v-if="activeTab === 'description'" class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium raw-html-content" v-html="product[`description_${locale}`] || product.description || 'Chưa có thông tin.'"></div>
          <div v-else-if="activeTab === 'features'" class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium raw-html-content" v-html="product[`specifications_${locale}`] || product.specifications || product[`features_${locale}`] || product.features || 'Chưa có thông số.'"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { doc, getDoc, getDocs, collection, query, where, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
// ⚡ UPDATE MỚI: Import useHead để đẩy SEO Title/Description/Canonical/Schema JSON lên thẻ <head>
import { useHead } from '@unhead/vue'

const { locale } = useI18n()
const route = useRoute()
const product = ref(null)
const loading = ref(true)
const isAdding = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// =========================================================================
// ⚡ UPDATE MỚI: CẤU HÌNH SEO HEAD (Title / Description / Canonical / Schema JSON-LD)
// Lấy dữ liệu từ các trường SEO đã cấu hình bên AdminView (seo_title_vi, seo_description_vi, schema_json_vi, slug)
// =========================================================================
const SITE_DOMAIN = 'https://www.vattuvocuc.com.vn/product/' // Domain gốc, đồng bộ với AdminView

// Đường dẫn Canonical ưu tiên Slug SEO, nếu chưa có Slug thì tạm dùng ID Firestore
const canonicalUrl = computed(() => {
  if (!product.value) return ''
  const pathPart = product.value.slug || product.value.id || ''
  return SITE_DOMAIN + pathPart
})

useHead({
  title: computed(() => {
    if (!product.value) return 'Đang tải sản phẩm...'
    return product.value.seo_title_vi || product.value[`name_${locale.value}`] || product.value.name || 'Sản phẩm'
  }),
  meta: [
    { 
      name: 'description', 
      content: computed(() => product.value?.seo_description_vi || '') 
    },
    { 
      name: 'keywords', 
      content: computed(() => product.value?.seo_keywords_vi || '') 
    },
    { property: 'og:type', content: 'product' },
    { property: 'og:title', content: computed(() => product.value?.seo_title_vi || product.value?.name_vi || product.value?.name || '') },
    { property: 'og:description', content: computed(() => product.value?.seo_description_vi || '') },
    { property: 'og:image', content: computed(() => product.value?.image || '') },
    { property: 'og:url', content: canonicalUrl }
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      // Nhúng trực tiếp Schema JSON-LD đã cấu hình (hoặc tự sinh) từ AdminView
      children: computed(() => product.value?.schema_json_vi || '{}')
    }
  ]
})

// --- LỰA CHỌN QUY CÁCH BÁN & SỐ LƯỢNG ---
// ⚡ UPDATE MỚI: Bổ sung thêm giá trị 'cai' (Chỉ bán Cái), đồng bộ với AdminView
const selectedUnit = ref('piece') // 'piece', 'box', 'vien', hoặc 'cai'
const quantity = ref(1)

// --- TAB MÔ TẢ VÀ ĐẶC TÍNH ---
const activeTab = ref('description')

// --- CHIẾN DỊCH KHUYẾN MÃI & HÌNH ẢNH ---
const activePromotions = ref([])
let unsubscribePromo = null
const activeImage = ref('')
const isZoomed = ref(false)
const relatedProducts = ref([])

// --- LẮNG NGHE KHUYẾN MÃI REALTIME TỪ ADMIN ---
const listenActivePromotions = () => {
  const q = query(collection(db, "promotions"), where("is_active", "==", true))
  
  unsubscribePromo = onSnapshot(q, (snap) => {
    activePromotions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }, (e) => {
    console.error("Lỗi lắng nghe khuyến mãi:", e)
  })
}

// --- XÁC ĐỊNH SẢN PHẨM CÓ ĐANG MUA THEO HỘP HAY KHÔNG ---
const isBuyingBox = computed(() => {
  if (isBoxOnlyMode.value) return true
  // ⚡ UPDATE MỚI: Bổ sung isCaiOnlyMode vào điều kiện KHÔNG mua theo Hộp
  if (isPieceOnlyMode.value || isVienOnlyMode.value || isCaiOnlyMode.value) return false
  return selectedUnit.value === 'box'
})

// --- 1. LỌC CHIẾN DỊCH HỢP LỆ (CHỈ ÁP DỤNG KHI MUA HỘP) ---
const matchedCampaign = computed(() => {
  if (!isBuyingBox.value) return null
  if (!product.value || activePromotions.value.length === 0) return null
  // ⚡ UPDATE MỚI: Dùng product.value.id (ID Firestore đã được xác định qua Slug/ID) thay vì route.params.id,
  // vì route.params.id giờ có thể là Slug SEO chứ không còn chắc chắn là ID Firestore nữa
  const productId = product.value.id
  const now = new Date()

  return activePromotions.value.find(p => {
    if (!p.is_active) return false

    if (p.start_date && now < new Date(p.start_date)) return false
    if (p.end_date && now > new Date(p.end_date)) return false

    if (p.apply_to === 'all') return true
    if (p.apply_to === 'specific_products' && p.applied_ids?.includes(productId)) return true

    return false
  }) || null
})

// --- 2. QUÀ TẶNG KÈM (CHỈ ÁP DỤNG KHI MUA HỘP) ---
const activeGiftInfo = computed(() => {
  if (!isBuyingBox.value) return null
  if (!matchedCampaign.value || !matchedCampaign.value.gift_enabled) return null

  const target = Number(matchedCampaign.value.gift_target) || 10
  const name = matchedCampaign.value.gift_name || 'quà tặng'
  const remaining = Math.max(0, target - quantity.value)
  const progress = Math.min(100, Math.round((quantity.value / target) * 100))

  return {
    enabled: true,
    target,
    name,
    remaining,
    progress,
    isReached: quantity.value >= target
  }
})

// --- BỔ SUNG CÁC BIẾN HELPER CHO TEMPLATE ---
const giftTarget = computed(() => activeGiftInfo.value?.target || 10)
const comboRemaining = computed(() => activeGiftInfo.value ? activeGiftInfo.value.remaining : 0)
const comboProgress = computed(() => activeGiftInfo.value ? activeGiftInfo.value.progress : 0)

// --- 3. TÍNH TOÁN CHIẾN DỊCH HỢP LỆ VÀ MỐC GIẢM GIÁ (TIER) ---
const effectivePromo = computed(() => {
  if (!isBuyingBox.value) return null
  if (!product.value) return null

  if (matchedCampaign.value) {
    const campaign = matchedCampaign.value
    let matchedTier = null

    if (campaign.tiers && Array.isArray(campaign.tiers) && campaign.tiers.length > 0) {
      const sortedTiers = [...campaign.tiers].sort((a, b) => b.quantity - a.quantity)
      matchedTier = sortedTiers.find(t => quantity.value >= t.quantity)
    }

    if (matchedTier) {
      return {
        id: campaign.id,
        title: campaign.title,
        type: matchedTier.discount_type,
        value: cleanNumber(matchedTier.discount_value),
        min_qty: matchedTier.quantity,
        label: 'CAMPAIGN',
        end_date: campaign.end_date,
        all_tiers: campaign.tiers,
        hasReachedTier: true
      }
    }

    if (campaign.tiers && campaign.tiers.length > 0) {
      return {
        id: campaign.id,
        title: campaign.title,
        type: campaign.tiers[0].discount_type,
        value: 0,
        min_qty: campaign.tiers[0].quantity,
        label: 'CAMPAIGN',
        end_date: campaign.end_date,
        all_tiers: campaign.tiers,
        hasReachedTier: false
      }
    }

    if (campaign.discount_value) {
      return {
        id: campaign.id,
        title: campaign.title,
        type: campaign.discount_type || 'percentage',
        value: cleanNumber(campaign.discount_value),
        min_qty: 1,
        label: 'SALE',
        end_date: campaign.end_date,
        all_tiers: [],
        hasReachedTier: true
      }
    }
  }

  const val = cleanNumber(product.value.promotionValue)
  const type = product.value.promotionType
  if (val > 0 && (type === 'percentage' || type === 'fixed' || type === 'fixed_amount')) {
    return {
      id: 'product-local',
      title: 'Khuyến mãi sản phẩm',
      type: type,
      value: val,
      min_qty: 1,
      label: 'SALE',
      end_date: null,
      all_tiers: [],
      hasReachedTier: true
    }
  }

  return null
})

const hasPromo = () => isBuyingBox.value && !!effectivePromo.value

// --- BỘ ĐẾM NGƯỢC FLASH SALE ---
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let countdownTimer = null

const updateCountdown = () => {
  const now = new Date()
  let targetDate = new Date()

  if (effectivePromo.value && effectivePromo.value.end_date) {
    targetDate = new Date(effectivePromo.value.end_date)
  } else {
    targetDate.setHours(23, 59, 59, 999)
  }

  const diff = targetDate - now

  if (diff <= 0) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  countdown.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  }
}

// --- SO SÁNH SẢN PHẨM ---
const isCompareOpen = ref(false)
const selectedCompareId = ref('')

// 🆕 [UPDATE MỚI]: Thêm biến từ khóa tìm kiếm cho Modal so sánh
const compareSearchQuery = ref('')

// 🆕 [UPDATE MỚI]: Lọc danh sách sản phẩm cùng danh mục dựa theo từ khóa tìm kiếm
const filteredCompareProducts = computed(() => {
  if (!relatedProducts.value) return []
  if (!compareSearchQuery.value.trim()) return relatedProducts.value

  const queryStr = compareSearchQuery.value.toLowerCase().trim()
  return relatedProducts.value.filter(p => {
    const pName = (p[`name_${locale.value}`] || p.name || '').toLowerCase()
    const pBrand = (p.brand || '').toLowerCase()
    const pSku = (p.sku || p.id || '').toLowerCase()
    return pName.includes(queryStr) || pBrand.includes(queryStr) || pSku.includes(queryStr)
  })
})

const compareProduct = computed(() => {
  if (!selectedCompareId.value) return null
  return relatedProducts.value.find(p => p.id === selectedCompareId.value) || null
})

const openCompareModal = () => {
  isCompareOpen.value = true
  // Reset từ khóa tìm kiếm khi mở Modal
  compareSearchQuery.value = ''
  if (filteredCompareProducts.value.length > 0 && !selectedCompareId.value) {
    selectedCompareId.value = filteredCompareProducts.value[0].id
  }
}

// --- HÀM BÓC TÁCH THÔNG SỐ KỸ THUẬT ---
const getParsedSpecs = (item) => {
  if (!item) return {}
  if (item.specs && typeof item.specs === 'object' && !Array.isArray(item.specs)) {
    return item.specs
  }

  const rawText = item[`specifications_${locale.value}`] || item.specifications || item[`features_${locale.value}`] || item.features || ''
  if (!rawText) return {}

  let cleaned = rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)
  const result = {}
  lines.forEach(line => {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const val = line.substring(colonIndex + 1).trim()
      if (key && val && key.length < 40) {
        result[key] = val
      }
    }
  })
  return result
}

const getSpecValue = (specs, targetKey) => {
  if (!specs) return '-'
  if (specs[targetKey]) return specs[targetKey]
  const normalizedTarget = targetKey.toLowerCase().trim()
  const foundKey = Object.keys(specs).find(k => k.toLowerCase().trim() === normalizedTarget)
  return foundKey ? specs[foundKey] : '-'
}

const allSpecKeys = computed(() => {
  if (!product.value || !compareProduct.value) return []
  const specs1 = getParsedSpecs(product.value)
  const specs2 = getParsedSpecs(compareProduct.value)
  const rawKeys = [...Object.keys(specs1), ...Object.keys(specs2)]
  const uniqueKeys = []
  rawKeys.forEach(k => {
    const trimmed = k.trim()
    if (trimmed && !uniqueKeys.some(uk => uk.toLowerCase() === trimmed.toLowerCase())) {
      uniqueKeys.push(trimmed)
    }
  })
  return uniqueKeys
})

const cleanNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0
  const cleaned = String(val).replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

// --- LOGIC BẮT DỮ LIỆU TỪ ADMIN ---
const boxSize = computed(() => {
  return cleanNumber(product.value?.box_qty || product.value?.box_size || product.value?.items_per_box) || 1
})

const normalizedSellingMode = computed(() => {
  const mode = String(
    product.value?.sales_type || 
    product.value?.selling_mode || 
    product.value?.sale_type || 
    product.value?.sale_mode || 
    ''
  ).toLowerCase().trim()

  if (mode === 'vien' || mode === 'chi_ban_vien' || mode.includes('viên') || mode.includes('vien')) return 'vien_only'
  // ⚡ UPDATE MỚI: Nhận diện chế độ "Chỉ bán Cái" (sales_type === 'cai' từ AdminView)
  if (mode === 'cai' || mode === 'chi_ban_cai' || mode.includes('cái') || mode.includes('cai')) return 'cai_only'
  if (mode === 'box' || mode.includes('hộp') || mode.includes('hop')) return 'box_only'
  if (mode === 'piece' || mode.includes('mảnh') || mode.includes('manh') || mode.includes('lẻ')) return 'piece_only'
  if (mode === 'flexible' || mode.includes('sỉ') || mode.includes('sile')) return 'flexible'

  const unitVi = String(product.value?.unit_vi || '').toLowerCase()
  if (unitVi === 'viên' || unitVi === 'vien') return 'vien_only'
  // ⚡ UPDATE MỚI: Nhận diện qua unit_vi = "Cái"
  if (unitVi === 'cái' || unitVi === 'cai') return 'cai_only'
  if (unitVi === 'hộp' || unitVi === 'box') return 'box_only'

  if (boxSize.value > 1) return 'flexible'
  return 'piece_only'
})

const isVienOnlyMode = computed(() => normalizedSellingMode.value === 'vien_only')
// ⚡ UPDATE MỚI: Cờ nhận biết chế độ "Chỉ bán Cái", dùng tương tự isVienOnlyMode
const isCaiOnlyMode = computed(() => normalizedSellingMode.value === 'cai_only')
const isBoxOnlyMode = computed(() => normalizedSellingMode.value === 'box_only')
const isPieceOnlyMode = computed(() => normalizedSellingMode.value === 'piece_only')
const isFlexibleMode = computed(() => normalizedSellingMode.value === 'flexible')

const unitPieceName = computed(() => {
  if (isVienOnlyMode.value) return locale.value === 'vi' ? 'Viên' : 'Pill'
  // ⚡ UPDATE MỚI: Trả về nhãn "Cái" khi ở chế độ Chỉ bán Cái
  if (isCaiOnlyMode.value) return locale.value === 'vi' ? 'Cái' : 'Piece'
  if (product.value?.unit_piece) return product.value.unit_piece
  // ⚡ UPDATE MỚI: Quy cách "Sỉ + Lẻ" (flexible) mặc định đổi đơn vị bán lẻ thành "Cái" thay vì
  // "Mảnh" theo thống nhất mới; riêng sản phẩm Admin CỐ Ý chọn "Chỉ bán Mảnh" (piece_only) vẫn
  // giữ nguyên "Mảnh" như cũ.
  if (isPieceOnlyMode.value) return locale.value === 'vi' ? 'Mảnh' : 'Pc'
  return locale.value === 'vi' ? 'Cái' : 'Pc'
})

const unitBoxName = computed(() => {
  if (product.value?.unit_box) return product.value.unit_box
  if (locale.value === 'vi' && product.value?.unit_vi) return product.value.unit_vi
  if (locale.value === 'en' && product.value?.unit_en) return product.value.unit_en
  return locale.value === 'vi' ? 'Hộp' : 'Box'
})

const displayUnitLabel = computed(() => {
  if (isVienOnlyMode.value) {
    return product.value?.unit_vi || (locale.value === 'vi' ? 'Viên' : 'Pill')
  }
  // ⚡ UPDATE MỚI: Nhãn hiển thị đơn vị khi ở chế độ "Chỉ bán Cái"
  if (isCaiOnlyMode.value) {
    return product.value?.unit_vi || (locale.value === 'vi' ? 'Cái' : 'Piece')
  }
  if (isBoxOnlyMode.value) {
    const mainUnit = locale.value === 'vi' ? (product.value?.unit_vi || 'Hộp') : (product.value?.unit_en || 'Box')
    // ⚡ UPDATE MỚI: Theo yêu cầu sếp, quy cách đóng gói theo Hộp giờ hiển thị cố định là "Cái" thay vì unitPieceName (Mảnh/Viên...)
    return boxSize.value > 1 ? `${mainUnit} (${boxSize.value} ${locale.value === 'vi' ? 'Cái' : 'Pc'})` : mainUnit
  }
  if (isPieceOnlyMode.value) {
    return unitPieceName.value
  }
  if (selectedUnit.value === 'box') {
    // ⚡ UPDATE MỚI: Tương tự, quy cách Hộp ở chế độ Linh hoạt (Sỉ+Lẻ) cũng hiển thị cố định là "Cái"
    return `${unitBoxName.value} (${boxSize.value} ${locale.value === 'vi' ? 'Cái' : 'Pc'})`
  }
  return unitPieceName.value
})

const boxDiscountPercent = computed(() => cleanNumber(product.value?.box_discount || product.value?.box_discount_percent) || 0)

// --- TÍNH GIÁ DỰA TRÊN ĐƠN VỊ VÀ KHUYẾN MÃI CHIẾN DỊCH ---
const basePrice = computed(() => cleanNumber(product.value?.price))
const directBoxPrice = computed(() => cleanNumber(product.value?.price_box))
const directPiecePrice = computed(() => cleanNumber(product.value?.price_piece || product.value?.price))

const originalUnitPrice = computed(() => {
  if (isBoxOnlyMode.value || selectedUnit.value === 'box') {
    return directBoxPrice.value > 0 ? directBoxPrice.value : (basePrice.value * boxSize.value)
  }
  return directPiecePrice.value
})

const displayOriginalPrice = computed(() => {
  if (!product.value) return 0
  if (isBuyingBox.value) {
    const virtualBox = cleanNumber(product.value.original_price_box)
    if (virtualBox > 0) return virtualBox
    return cleanNumber(product.value.original_price) || originalUnitPrice.value
  } else {
    const virtualPiece = cleanNumber(product.value.original_price_piece || product.value.original_price || product.value.originalPrice)
    return virtualPiece > 0 ? virtualPiece : 0
  }
})

const currentUnitPrice = computed(() => {
  if (!product.value) return 0
  let price = originalUnitPrice.value

  if (!isBuyingBox.value) {
    return Math.round(price)
  }

  if (isFlexibleMode.value && directBoxPrice.value === 0 && boxDiscountPercent.value > 0) {
    price = price * (1 - boxDiscountPercent.value / 100)
  }

  const promo = effectivePromo.value
  if (promo && promo.hasReachedTier && promo.value > 0) {
    if (promo.type === 'percentage') {
      price = price * (1 - promo.value / 100)
    } else if (promo.type === 'fixed_amount' || promo.type === 'fixed') {
      price = Math.max(0, price - promo.value)
    }
  }

  return Math.round(price)
})

const hasVirtualDiscount = computed(() => {
  return displayOriginalPrice.value > currentUnitPrice.value
})

const totalPrice = computed(() => currentUnitPrice.value * quantity.value)

const savingsAmount = computed(() => {
  const refPrice = displayOriginalPrice.value > 0 ? displayOriginalPrice.value : originalUnitPrice.value
  return Math.max(0, refPrice - currentUnitPrice.value)
})

const changeQuantity = (delta) => {
  const newQty = quantity.value + delta
  if (newQty >= 1) quantity.value = newQty
}

// --- THÊM VÀO GIỎ HÀNG ---
const addToCart = (item) => {
  if (item.stock <= 0) return
  isAdding.value = true

  setTimeout(() => {
    const cart = JSON.parse(localStorage.getItem('spit_cart')) || []
    const pName = item[`name_${locale.value}`] || item.name
    
    // ⚡ UPDATE MỚI: Bổ sung nhánh 'cai' vào key và nhãn đơn vị khi thêm vào giỏ hàng
    const currentUnitKey = isVienOnlyMode.value ? 'vien' : (isCaiOnlyMode.value ? 'cai' : (isBoxOnlyMode.value ? 'box' : selectedUnit.value))
    const currentUnitLabel = isVienOnlyMode.value 
      ? (product.value?.unit_vi || (locale.value === 'vi' ? 'Viên' : 'Pill')) 
      : (isCaiOnlyMode.value 
          ? (product.value?.unit_vi || (locale.value === 'vi' ? 'Cái' : 'Piece'))
          : (isBoxOnlyMode.value ? unitBoxName.value : (selectedUnit.value === 'box' ? unitBoxName.value : unitPieceName.value)))
    
    // ⚡ UPDATE MỚI: Dùng product.value.id (ID Firestore thật) thay vì route.params.id để lưu vào giỏ hàng,
    // đảm bảo giỏ hàng vẫn hoạt động đúng dù URL đang hiển thị Slug SEO thay vì ID
    const existingIndex = cart.findIndex(i => i.id === product.value.id && i.unit === currentUnitKey)

    const giftData = (activeGiftInfo.value && activeGiftInfo.value.isReached) ? {
      name: activeGiftInfo.value.name,
      target: activeGiftInfo.value.target
    } : null

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity.value
      cart[existingIndex].price = currentUnitPrice.value
      if (giftData) cart[existingIndex].applied_gift = giftData
    } else {
      cart.push({
        // ⚡ UPDATE MỚI: Lưu ID Firestore thật vào giỏ hàng (không lưu Slug) để các trang khác (giỏ hàng, đơn hàng...) hoạt động đúng
        id: product.value.id,
        name: pName,
        price: currentUnitPrice.value,
        original_price: displayOriginalPrice.value > 0 ? displayOriginalPrice.value : originalUnitPrice.value,
        image: item.image,
        quantity: quantity.value,
        unit: currentUnitKey,
        unit_name: currentUnitLabel,
        box_size: boxSize.value,
        sku: item.sku || '',
        applied_gift: giftData
      })
    }
    
    localStorage.setItem('spit_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    
    isAdding.value = false
    toastMessage.value = locale.value === 'vi' 
      ? `Đã thêm ${quantity.value} ${currentUnitLabel} vào giỏ hàng!` 
      : `Added ${quantity.value} ${currentUnitLabel} to cart!`
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3000)
  }, 200)
}

// 🆕 [UPDATE MỚI]: Tăng limit lên 50 để lấy được toàn bộ sản phẩm trong cùng danh mục
const fetchRelatedProducts = async (categoryStr) => {
  if (!categoryStr) return
  try {
    let q = query(collection(db, "products"), where("category", "==", categoryStr), limit(10000))
    let snap = await getDocs(q)
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (items.length <= 1) { 
      q = query(collection(db, "products"), where("category_vi", "==", categoryStr), limit(10000))
      snap = await getDocs(q)
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    // Lọc bỏ sản phẩm đang xem và lưu toàn bộ mảng sản phẩm cùng danh mục
    // ⚡ UPDATE MỚI: So sánh bằng product.value.id (ID Firestore thật đã được xác định qua Slug/ID)
    // thay vì route.params.id, vì route.params.id giờ có thể là Slug SEO chứ không phải ID
    relatedProducts.value = items.filter(item => item.id !== product.value?.id)
  } catch (e) {
    console.error("Lỗi lấy sp liên quan:", e)
  }
}

onMounted(async () => {
  try {
    listenActivePromotions()

    updateCountdown()
    countdownTimer = setInterval(updateCountdown, 1000)

    // =========================================================================
    // ⚡ UPDATE MỚI: TỐI ƯU TỐC ĐỘ TẢI TRANG — CHẠY SONG SONG THAY VÌ TUẦN TỰ
    // -------------------------------------------------------------------------
    // NGUYÊN NHÂN CŨ GÂY CHẬM: code cũ chạy TUẦN TỰ 3 lượt gọi Firestore, lượt sau
    // luôn phải ĐỢI lượt trước xong mới bắt đầu (dạng "thác nước" - waterfall):
    //   1) await tìm sản phẩm theo Slug
    //   2) NẾU không thấy -> await tìm lại theo ID (chạy SAU bước 1, không song song)
    //   3) await tải "sản phẩm liên quan" -> chỉ SAU KHI xong cả bước 3 mới tắt loading
    // Mỗi bước là 1 lượt round-trip riêng tới Firestore, cộng dồn lại gây cảm giác chậm,
    // đặc biệt rõ khi mạng không nhanh (khác hẳn cảm giác "tức thì" của site dùng server
    // tự render HTML sẵn như thietbi247.vn).
    //
    // CÁCH SỬA:
    //   - Bước 1 và 2 giờ CHẠY SONG SONG (Promise.allSettled) thay vì đợi nhau -> gộp 2
    //     lượt round-trip tuần tự thành 1 lượt "chờ đồng thời" duy nhất, nhanh hơn đáng kể.
    //   - Bước 3 (sản phẩm liên quan) được tách ra chạy NGẦM PHÍA SAU (không await, không
    //     chặn trang hiện ra). Dữ liệu này CHỈ dùng cho Modal "So sánh sản phẩm" (xem biến
    //     relatedProducts) — modal này chỉ hiện khi khách CHỦ ĐỘNG bấm nút "So sánh", nên
    //     hoàn toàn an toàn để tải ngầm phía sau mà không ảnh hưởng gì tới trải nghiệm xem
    //     sản phẩm chính. -> Trang chi tiết sản phẩm hiện ra NGAY KHI có dữ liệu sản phẩm,
    //     không cần đợi thêm bước 3 nữa.
    // =========================================================================
    let docSnap = null
    let resolvedDocId = route.params.id

    const [slugResult, idResult] = await Promise.allSettled([
      getDocs(query(collection(db, "products"), where("slug", "==", route.params.id), limit(1))),
      getDoc(doc(db, "products", route.params.id))
    ])

    // Ưu tiên kết quả tìm theo Slug (đúng nghiệp vụ cũ: Slug SEO được ưu tiên trước ID)
    if (slugResult.status === 'fulfilled' && !slugResult.value.empty) {
      docSnap = slugResult.value.docs[0]
      resolvedDocId = docSnap.id
    } else if (idResult.status === 'fulfilled' && idResult.value.exists()) {
      // Chỉ dùng kết quả tra theo ID nếu tra theo Slug thất bại/rỗng
      docSnap = idResult.value
      resolvedDocId = idResult.value.id
    }

    if (docSnap && docSnap.exists()) {
      const productData = { id: resolvedDocId, ...docSnap.data() }

      // =========================================================================
      // ⚡ UPDATE MỚI: ĐỒNG BỘ TRƯỜNG "isActive" (ADMIN DÙNG ĐỂ ẨN/HIỆN SẢN PHẨM)
      // -------------------------------------------------------------------------
      // Nếu sản phẩm đã bị Admin ẨN (isActive === false), coi như KHÔNG TÌM THẤY — không
      // gán vào product.value — để tránh trường hợp khách vẫn xem được sản phẩm đã ẩn chỉ
      // vì còn giữ link cũ (VD: đã lưu link, chia sẻ từ trước, hay tìm thấy qua Google chưa
      // kịp cập nhật). Sản phẩm CŨ chưa từng có trường "isActive" mặc định coi là VẪN HIỆN
      // (isActive !== false, không phải === true) để không vô tình ẩn nhầm sản phẩm cũ.
      // =========================================================================
      if (productData.isActive === false) {
        product.value = null
      } else {
        product.value = productData

        if (isVienOnlyMode.value) {
          selectedUnit.value = 'vien'
        } else if (isCaiOnlyMode.value) {
          // ⚡ UPDATE MỚI: Gán selectedUnit = 'cai' khi sản phẩm ở chế độ "Chỉ bán Cái"
          selectedUnit.value = 'cai'
        } else if (isBoxOnlyMode.value) {
          selectedUnit.value = 'box'
        } else {
          selectedUnit.value = 'piece'
        }

        if (product.value.image) activeImage.value = product.value.image

        // ⚡ UPDATE MỚI: KHÔNG await ở đây nữa — cho fetchRelatedProducts chạy ngầm phía sau,
        // không chặn việc hiện trang chi tiết sản phẩm chính (xem giải thích chi tiết ở trên)
        const targetCategory = product.value.category || product.value.category_vi || product.value.category_en
        if (targetCategory) fetchRelatedProducts(targetCategory)
      }
    }
  } catch (error) {
    console.error("Lỗi kết nối:", error)
  } finally {
    // ⚡ UPDATE MỚI: loading tắt ngay sau khi có dữ liệu sản phẩm chính, không còn phải
    // đợi fetchRelatedProducts (đã chạy ngầm ở trên) nữa -> trang hiện ra nhanh hơn
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribePromo) unsubscribePromo()
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>