<template>
  <div class="fixed left-0 top-0 h-screen w-20 md:w-64 bg-slate-900 text-white p-4 md:p-6 flex flex-col z-50">
    <!-- Thêm shrink-0 để phần logo không bị bóp méo khi cuộn -->
    <div class="mb-10 text-center md:text-left shrink-0">
      <div class="h-8 flex items-center justify-center md:justify-start">
        <img src="../assets/noBG_logo.png" alt="SPIT" class="h-full w-auto brightness-0 invert object-contain" />
      </div>
      <h2 class="hidden md:block text-[10px] font-black italic uppercase text-blue-500 tracking-tighter mt-2">ADMIN SYSTEM</h2>
    </div>

    <!-- Thêm overflow-y-auto và class no-scrollbar để cuộn mượt mà -->
    <nav class="space-y-2 grow overflow-y-auto no-scrollbar pb-2">
      <!--  UPDATE MỚI: BẢNG THỐNG KÊ (NẰM TRÊN BẢNG ĐIỀU KHIỂN) -->
      <router-link to="/spit-system-manager/stats" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Bảng thống kê</span>
      </router-link>

      <router-link to="/spit-system-manager/dashboard" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Bảng điều khiển</span>
      </router-link>

      <router-link to="/spit-system-manager" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý sản phẩm</span>
      </router-link>

      <router-link to="/spit-system-manager/posts" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý bài viết</span>
      </router-link>

      <!-- Mục Quản lý chính sách mới được thêm vào -->
      <router-link to="/spit-system-manager/policies" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý chính sách</span>
      </router-link>

      <router-link to="/spit-system-manager/promotions" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý khuyến mãi</span>
      </router-link>

      <router-link to="/spit-system-manager/brands" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý nhãn hàng</span>
      </router-link>

      <router-link to="/spit-system-manager/banners" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý banner</span>
      </router-link>

      <!-- Trường Quản lý logo mới được thêm vào -->
      <router-link to="/spit-system-manager/logos" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý logo</span>
      </router-link>

      <router-link to="/spit-system-manager/categories" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý danh mục</span>
      </router-link>

      <router-link to="/spit-system-manager/about" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Trang giới thiệu</span>
      </router-link>

      <router-link to="/spit-system-manager/settings" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Thiết lập hệ thống</span>
      </router-link>
    </nav>

    <!-- Thêm shrink-0 để phần nút quay về không bị đẩy mất khi cuộn -->
    <div class="pt-6 border-t border-slate-800 shrink-0">
      <router-link to="/" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all">
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Về trang chủ</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.router-link-exact-active {
  background-color: #2563eb !important;
}

/* Ẩn thanh cuộn mặc định để giữ thiết kế sạch sẽ */
.no-scrollbar::-webkit-scrollbar { 
  display: none; 
}
.no-scrollbar { 
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}
</style>