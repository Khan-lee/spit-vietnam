<template>
  <div class="bg-slate-50 min-h-screen pb-16">
    
    <!-- 1. BREADCRUMB & PAGE HEADER -->
    <div class="bg-white border-b border-slate-200/80 shadow-2xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <!-- Breadcrumb -->
        <nav class="flex text-xs font-medium text-slate-500 mb-2 gap-2 items-center">
          <router-link to="/" class="hover:text-red-600 transition-colors">Trang chủ</router-link>
          <span>/</span>
          <span class="text-slate-900 font-bold">Danh sách sản phẩm</span>
          <span v-if="route.query.category" class="text-red-600 font-bold">/ {{ route.query.category }}</span>
        </nav>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span class="w-2 h-7 bg-red-600 rounded-full inline-block"></span>
              {{ route.query.category ? `Danh Mục: ${route.query.category}` : 'Tất Cả Sản Phẩm' }}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Hiển thị <span class="font-bold text-slate-800">{{ paginatedProducts.length }}</span> / <span class="font-bold text-slate-800">{{ filteredProducts.length }}</span> sản phẩm phù hợp
            </p>
          </div>

          <!-- Nút Mở Filter trên Mobile -->
          <button 
            @click="isMobileFilterOpen = true" 
            class="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Bộ Lọc Sản Phẩm
            <span v-if="activeFilterCount > 0" class="bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {{ activeFilterCount }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. MAIN CONTENT AREA -->
    <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-6">

      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
        <div class="inline-block animate-spin text-4xl mb-3 text-red-600">🌀</div>
        <p class="font-bold text-slate-400 uppercase tracking-widest text-xs">Đang tải danh sách sản phẩm từ hệ thống...</p>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-6 items-start">

        <!-- CỘT TRÁI: BỘ LỌC SIDEBAR (DESKTOP) -->
<aside class="hidden lg:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 custom-sidebar-scroll">
  <HomeProductFilter 
    :products="products" 
    :categories="categories" 
    @update:filteredProducts="handleFilteredProducts"
    @update:isFiltering="handleFilterState" 
  />
</aside>

        <!-- MODAL BỘ LỌC MOBILE (DRAWER) -->
        <div v-if="isMobileFilterOpen" class="fixed inset-0 z-50 lg:hidden flex">
          <!-- Backdrop -->
          <div @click="isMobileFilterOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"></div>
          
          <!-- Content Drawer -->
          <div class="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto p-4 ml-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                <span class="w-1.5 h-5 bg-red-600 rounded-full"></span>
                Bộ Lọc Sản Phẩm
              </h3>
              <button @click="isMobileFilterOpen = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-800 bg-slate-100">
                ✕
              </button>
            </div>
            
            <HomeProductFilter 
              :products="products" 
              :categories="categories" 
              @update:filteredProducts="handleFilteredProducts"
              @update:isFiltering="handleFilterState" 
            />

            <button 
              @click="isMobileFilterOpen = false" 
              class="mt-6 w-full py-3 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-500/30"
            >
              Xem kết quả
            </button>
          </div>
        </div>

        <!-- CỘT PHẢI: TOOLBAR & LƯỚI SẢN PHẨM -->
        <div class="flex-1 w-full min-w-0 space-y-4">

          <!-- TOOLBAR TÙY CHỌN & SẮP XẾP -->
          <div class="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            
            <!-- Quick Filter theo Quy cách (Sales Type) -->
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              <span class="text-xs font-bold text-slate-400 uppercase mr-1 hidden sm:inline">Quy cách:</span>
              <button 
                @click="selectedSalesType = 'all'"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                  selectedSalesType === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                ]"
              >
                Tất cả
              </button>
              <button 
                @click="selectedSalesType = 'box'"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                  selectedSalesType === 'box' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-blue-50/60 text-blue-600 border-blue-200 hover:bg-blue-100'
                ]"
              >
                HỘP
              </button>
              <button 
                @click="selectedSalesType = 'piece'"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                  selectedSalesType === 'piece' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-amber-50/60 text-amber-600 border-amber-200 hover:bg-amber-100'
                ]"
              >
                MẢNH
              </button>
              <button 
                @click="selectedSalesType = 'flexible'"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                  selectedSalesType === 'flexible' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50/60 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                ]"
              >
                SỈ + LẺ
              </button>
            </div>

            <!-- Sort Dropdown & Views Toggle -->
            <div class="flex items-center gap-2 ml-auto">
              <label class="text-xs font-bold text-slate-400 hidden sm:inline">Sắp xếp:</label>
              <select 
                v-model="sortBy" 
                class="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="name-asc">Tên: A - Z</option>
                <option value="discount">Khuyến mãi HOT nhất</option>
              </select>

              <!-- View Mode Toggle -->
              <div class="hidden sm:flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
                <button 
                  @click="viewMode = 'grid'" 
                  :class="['p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700']"
                  title="Chế độ lưới"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button 
                  @click="viewMode = 'list'" 
                  :class="['p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700']"
                  title="Chế độ danh sách"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- KẾT QUẢ SẢN PHẨM (GRID VIEW) -->
          <div v-if="paginatedProducts.length > 0 && viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
            
            <div 
              v-for="p in paginatedProducts" 
              :key="p.id" 
              class="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-red-500 transition-all duration-300 relative"
            >
              <div>
                <!-- Tem Giảm Giá: BÁN HỘP và CÓ GIẢM GIÁ -->
                <div 
                  v-if="p?.sales_type === 'box' && getDiscountPercent(p) > 0" 
                  class="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black z-10 shadow"
                >
                  Giảm {{ getDiscountPercent(p) }}%
                </div>

                <!-- Khung Ảnh Sản Phẩm -->
                <div class="h-32 sm:h-36 w-full flex items-center justify-center p-2 mb-2 bg-slate-50 rounded-xl group-hover:bg-red-50/20 transition-colors">
                  <img :src="p.image || p.imageUrl || 'https://via.placeholder.com/150'" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>

                <div>
                  <!-- Tag Thương hiệu + Quy cách bán -->
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block truncate max-w-[60%]">{{ p.brand || 'Khác' }}</span>
                    <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-blue-200 whitespace-nowrap">HỘP</span>
                    <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-amber-200 whitespace-nowrap">MẢNH</span>
                    <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] sm:text-[9px] font-bold px-1.5 py-px rounded border border-emerald-200 whitespace-nowrap">SỈ + LẺ</span>
                  </div>

                  <!-- Tên sản phẩm cố định 2 dòng -->
                  <h3 class="font-bold text-[11px] sm:text-xs text-slate-800 line-clamp-2 min-h-8 sm:min-h-9 leading-snug group-hover:text-red-600 transition-colors">
                    {{ p[`name_${locale}`] || p.name }}
                  </h3>
                </div>
              </div>

              <!-- PHẦN GIÁ TO + NÚT CATALOG -->
              <div class="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100">

                <!-- TRƯỜNG HỢP 1: BÁN THEO HỘP -->
                <template v-if="p?.sales_type === 'box'">
                  <div v-if="getSalePriceBox(p)" class="flex items-baseline gap-1 flex-wrap">
                    <span class="text-xs sm:text-base font-black text-red-600">
                      {{ Math.round(getSalePriceBox(p)).toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
                    <span class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-0.5">
                      {{ p.price_box?.toLocaleString('vi-VN') }}đ
                    </span>
                  </div>

                  <div v-else-if="p?.price_box" class="flex items-baseline gap-1 flex-wrap">
                    <span class="text-xs sm:text-base font-black text-red-600">
                      {{ p.price_box.toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Hộp</span>
                  </div>

                  <div v-else class="text-xs sm:text-base font-black text-red-600">
                    Liên hệ giá
                  </div>
                </template>

                <!-- TRƯỜNG HỢP 2: BÁN THEO MẢNH HOẶC KHÁC -->
                <template v-else>
                  <div v-if="getSalePrice(p)" class="flex items-baseline gap-1 flex-wrap">
                    <span class="text-xs sm:text-base font-black text-red-600">
                      {{ Math.round(getSalePrice(p)).toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Mảnh</span>
                    <span class="text-[9px] sm:text-[10px] text-slate-400 line-through font-medium ml-0.5">
                      {{ p.price?.toLocaleString('vi-VN') }}đ
                    </span>
                  </div>

                  <div v-else-if="p?.price" class="flex items-baseline gap-1 flex-wrap">
                    <span class="text-xs sm:text-base font-black text-red-600">
                      {{ p.price.toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">/ Mảnh</span>
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
                  <span>Xem Catalog</span>
                </a>
              </div>

              <!-- Router Link tới chi tiết -->
              <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
            </div>

          </div>

          <!-- KẾT QUẢ SẢN PHẨM (LIST VIEW) -->
          <div v-else-if="paginatedProducts.length > 0 && viewMode === 'list'" class="space-y-3">
            <div 
              v-for="p in paginatedProducts" 
              :key="p.id" 
              class="group bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-lg hover:border-red-500 transition-all relative"
            >
              <div class="flex items-center gap-4 w-full sm:w-auto">
                <div class="h-24 w-24 shrink-0 p-2 bg-slate-50 rounded-xl flex items-center justify-center relative">
                  <span v-if="getDiscountPercent(p) > 0" class="absolute top-1 left-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black z-10">
                    -{{ getDiscountPercent(p) }}%
                  </span>
                  <img :src="p.image || p.imageUrl || 'https://via.placeholder.com/150'" :alt="p.name" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                </div>

                <div class="space-y-1 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">{{ p.brand || 'Khác' }}</span>
                    <span v-if="p.sales_type === 'box'" class="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-px rounded border border-blue-200">HỘP</span>
                    <span v-else-if="p.sales_type === 'piece'" class="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-px rounded border border-amber-200">MẢNH</span>
                    <span v-else-if="p.sales_type === 'flexible'" class="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-px rounded border border-emerald-200">SỈ + LẺ</span>
                  </div>
                  <h3 class="font-bold text-sm text-slate-800 group-hover:text-red-600 transition-colors">
                    {{ p[`name_${locale}`] || p.name }}
                  </h3>
                  <p class="text-xs text-slate-400 line-clamp-1 hidden sm:block">{{ p.category_vi || p.category }}</p>
                </div>
              </div>

              <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-3">
                <div class="text-right">
                  <template v-if="p?.sales_type === 'box'">
                    <div v-if="getSalePriceBox(p)" class="flex items-baseline gap-1">
                      <span class="text-base font-black text-red-600">{{ Math.round(getSalePriceBox(p)).toLocaleString('vi-VN') }}đ</span>
                      <span class="text-[10px] text-slate-400 line-through">{{ p.price_box?.toLocaleString('vi-VN') }}đ</span>
                    </div>
                    <div v-else-if="p?.price_box" class="text-base font-black text-red-600">{{ p.price_box.toLocaleString('vi-VN') }}đ</div>
                    <div v-else class="text-sm font-bold text-red-600">Liên hệ giá</div>
                  </template>
                  <template v-else>
                    <div v-if="getSalePrice(p)" class="flex items-baseline gap-1">
                      <span class="text-base font-black text-red-600">{{ Math.round(getSalePrice(p)).toLocaleString('vi-VN') }}đ</span>
                      <span class="text-[10px] text-slate-400 line-through">{{ p.price?.toLocaleString('vi-VN') }}đ</span>
                    </div>
                    <div v-else-if="p?.price" class="text-base font-black text-red-600">{{ p.price.toLocaleString('vi-VN') }}đ</div>
                    <div v-else class="text-sm font-bold text-red-600">Liên hệ giá</div>
                  </template>
                </div>

                <a 
                  v-if="p.catalog_link || p.catalog || p.catalog_url || p.pdf"
                  :href="p.catalog_link || p.catalog || p.catalog_url || p.pdf" 
                  target="_blank"
                  @click.stop
                  class="relative z-20 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                >
                  <span>Catalog</span>
                </a>
              </div>

              <router-link :to="'/product/' + p.id" class="absolute inset-0 z-10"></router-link>
            </div>
          </div>

          <!-- TRẠNG THÁI TRỐNG: KHÔNG TÌM THẤY SẢN PHẨM -->
          <div v-else class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-1">Không tìm thấy sản phẩm phù hợp</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Rất tiếc, không có sản phẩm nào thỏa mãn tiêu chí bộ lọc của bạn. Vui lòng thử bỏ bớt điều kiện lọc hoặc tìm từ khóa khác.
            </p>
            <button 
              @click="resetFilters" 
              class="px-5 py-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors uppercase tracking-wider shadow-sm"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          <!-- PHÂN TRANG (PAGINATION) -->
          <div v-if="totalPages > 1" class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <span class="text-xs font-semibold text-slate-500">
              Trang <span class="font-bold text-slate-800">{{ currentPage }}</span> / <span class="font-bold text-slate-800">{{ totalPages }}</span>
            </span>

            <div class="flex items-center gap-1.5">
              <button 
                @click="currentPage--" 
                :disabled="currentPage === 1"
                class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ‹ Trái
              </button>

              <button 
                v-for="page in visiblePages" 
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center',
                  currentPage === page 
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/30' 
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                ]"
              >
                {{ page }}
              </button>

              <button 
                @click="currentPage++" 
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Phải ›
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import HomeProductFilter from '../components/HomeProductFilter.vue'
import { useSearchStore } from '../stores/search'

const { locale } = useI18n()
const route = useRoute()
const searchStore = useSearchStore()

// State
const products = ref([])
const promotions = ref([])
const categoryDocs = ref([])
const isLoading = ref(true)
const currentTime = ref(new Date())

const filteredHomeProducts = ref([])
const isFiltering = ref(false)

const isMobileFilterOpen = ref(false)
const viewMode = ref('grid') // 'grid' | 'list'

// Toolbar state
const selectedSalesType = ref('all') // 'all', 'box', 'piece', 'flexible'
const sortBy = ref('default')

// Phân trang
const currentPage = ref(1)
const itemsPerPage = ref(12)

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  fetchData()
})

onUnmounted(() => clearInterval(timer))

// LẤY DỮ LIỆU TỪ FIRESTORE (GIỐNG 100% HOMEVIEW)
const fetchData = async () => {
  isLoading.value = true
  try {
    const [prodSnap, promoSnap, catSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "promotions")),
      getDocs(collection(db, "categories"))
    ])

    products.value = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    promotions.value = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    categoryDocs.value = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Áp dụng bộ lọc ban đầu nếu trên URL có tham số (ví dụ ?category=DAO%20PHAY)
    applyInitialUrlFilter()

  } catch (e) {
    console.error("Lỗi đồng bộ Firestore tại ProductsView:", e)
  } finally {
    isLoading.value = false
  }
}

// Danh mục lấy động từ Firestore
const categories = computed(() => {
  const activeCats = categoryDocs.value
    .filter(c => c.isActive === true)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => {
      const catField = locale.value === 'vi' ? 'name_vi' : 'name_en'
      return c[catField] || c.name || c.category || c.id
    })
  return [...new Set(activeCats)]
})

// LOGIC GIẢM GIÁ & TÍNH GIÁ (CHUẨN 100% HOMEVIEW)
const getActivePromo = (product) => {
  return promotions.value.find(p => {
    const start = p.start_date ? new Date(p.start_date) : null
    const end = p.end_date ? new Date(p.end_date) : null
    const isTimeValid = (!start || currentTime.value >= start) && (!end || currentTime.value <= end)
    return p.is_active && isTimeValid && (p.apply_to === 'all' || p.applied_ids?.includes(product.id))
  })
}

const getDiscountPercent = (product) => {
  if (!product) return 0
  if (product.discount_percent) return product.discount_percent
  const activePromo = getActivePromo(product)
  if (!activePromo || !activePromo.tiers || activePromo.tiers.length === 0) return 0
  const firstTier = activePromo.tiers[0]
  if (firstTier.discount_type === 'percentage') {
    return Math.round(firstTier.discount_value)
  }
  if (product.price) {
    return Math.round((firstTier.discount_value / product.price) * 100)
  }
  return 0
}

const getSalePriceBox = (p) => {
  if (!p || !p.price_box) return null
  const discount = getDiscountPercent(p)
  if (discount > 0) {
    return p.price_box * (1 - discount / 100)
  }
  return null
}

const getSalePrice = (p) => {
  if (!p || !p.price) return null
  const discount = getDiscountPercent(p)
  if (discount > 0) {
    return p.price * (1 - discount / 100)
  }
  return null
}

// Lắng nghe kết quả từ HomeProductFilter
const handleFilteredProducts = (newProducts) => {
  filteredHomeProducts.value = newProducts
  currentPage.value = 1
}

const handleFilterState = (state) => {
  isFiltering.value = state
}

// ĐỌC VÀ LỌC THEO THAM SỐ TRÊN URL (Đặc biệt xử lý ?category=DAO%20PHAY)
const applyInitialUrlFilter = () => {
  let result = [...products.value]
  let hasFilter = false

  const urlCategory = route.query.category
  const urlBrand = route.query.brand
  const urlSearch = route.query.search || searchStore.searchQuery

  if (urlCategory) {
    hasFilter = true
    const catField = locale.value === 'vi' ? 'category_vi' : 'category_en'
    result = result.filter(p => {
      const pCat = p[catField] || p.category || p.category_name
      return pCat === urlCategory || p.category_vi === urlCategory || p.category_en === urlCategory || p.category === urlCategory
    })
  }

  if (urlBrand) {
    hasFilter = true
    result = result.filter(p => p.brand === urlBrand)
  }

  if (urlSearch && urlSearch.trim() !== '') {
    hasFilter = true
    const query = urlSearch.toLowerCase().trim()
    result = result.filter(p => {
      const name = (p[`name_${locale.value}`] || p.name || '').toLowerCase()
      const brand = (p.brand || '').toLowerCase()
      return name.includes(query) || brand.includes(query)
    })
  }

  if (hasFilter) {
    filteredHomeProducts.value = result
    isFiltering.value = true
  } else {
    filteredHomeProducts.value = products.value
    isFiltering.value = false
  }
}

// Watch khi đổi URL param hoặc từ khóa tìm kiếm
watch(() => route.query, () => {
  if (products.value.length > 0) {
    applyInitialUrlFilter()
  }
}, { deep: true })

watch(() => searchStore.searchQuery, () => {
  if (products.value.length > 0) {
    applyInitialUrlFilter()
  }
})

// DANH SÁCH SẢN PHẨM HOÀN CHỈNH (Sau lọc + Sắp xếp + Quy cách)
const filteredProducts = computed(() => {
  // 1. Khởi tạo danh sách: Nếu Sidebar có lọc thì lấy từ Sidebar, không thì lấy toàn bộ
  let list = isFiltering.value ? [...filteredHomeProducts.value] : [...products.value]

  // 2. LỌC BẮT BUỘC THEO CATEGORY TRÊN URL (Nếu URL có ?category=...)
  const urlCategory = route.query.category
  if (urlCategory) {
    const targetCat = urlCategory.toString().trim().toLowerCase()
    
    list = list.filter(p => {
      const catVi = (p.category_vi || '').toString().trim().toLowerCase()
      const catEn = (p.category_en || '').toString().trim().toLowerCase()
      const catRaw = (p.category || p.category_name || '').toString().trim().toLowerCase()

      // So sánh chính xác không phân biệt hoa thường
      return catVi === targetCat || catEn === targetCat || catRaw === targetCat
    })
  }

  // 3. Lọc theo Quy cách (Sales Type: Tất cả / Hộp / Mảnh / Sỉ+Lẻ)
  if (selectedSalesType.value !== 'all') {
    list = list.filter(p => p.sales_type === selectedSalesType.value)
  }

  // 4. Sắp xếp (Sort)
  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => {
      const priceA = getSalePriceBox(a) || a.price_box || getSalePrice(a) || a.price || 0
      const priceB = getSalePriceBox(b) || b.price_box || getSalePrice(b) || b.price || 0
      return priceA - priceB
    })
  } else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => {
      const priceA = getSalePriceBox(a) || a.price_box || getSalePrice(a) || a.price || 0
      const priceB = getSalePriceBox(b) || b.price_box || getSalePrice(b) || b.price || 0
      return priceB - priceA
    })
  } else if (sortBy.value === 'name-asc') {
    list.sort((a, b) => {
      const nameA = a[`name_${locale.value}`] || a.name || ''
      const nameB = b[`name_${locale.value}`] || b.name || ''
      return nameA.localeCompare(nameB)
    })
  } else if (sortBy.value === 'discount') {
    list.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
  }

  return list
})

// Cắt trang (Pagination)
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredProducts.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value) || 1)

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedSalesType.value !== 'all') count++
  if (isFiltering.value) count++
  return count
})

const resetFilters = () => {
  selectedSalesType.value = 'all'
  sortBy.value = 'default'
  isFiltering.value = false
  filteredHomeProducts.value = [...products.value]
  currentPage.value = 1
}

watch([selectedSalesType, sortBy], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>