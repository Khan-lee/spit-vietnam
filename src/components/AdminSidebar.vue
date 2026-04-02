<template>
  <div class="fixed left-0 top-0 h-screen w-20 md:w-64 bg-slate-900 text-white p-4 md:p-6 flex flex-col z-50">
    <div class="mb-10 text-center md:text-left">
      <div class="h-8 flex items-center justify-center md:justify-start">
        <img src="../assets/noBG_logo.png" alt="SPIT" class="h-full w-auto brightness-0 invert object-contain" />
      </div>
      <h2 class="hidden md:block text-[10px] font-black italic uppercase text-blue-500 tracking-tighter mt-2">ADMIN SYSTEM</h2>
    </div>

    <nav class="space-y-2 grow">
      <router-link to="/spit-system-manager/dashboard" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="text-xl">📊</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Bảng điều khiển</span>
      </router-link>

      <router-link to="/spit-system-manager" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="text-xl">📦</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý sản phẩm</span>
      </router-link>

      <router-link to="/spit-system-manager/posts" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="text-xl">📝</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý bài viết</span>
      </router-link>

      <router-link to="/spit-system-manager/settings" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600">
        <span class="text-xl">⚙️</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Thiết lập hệ thống</span>
      </router-link>
    </nav>

    <div class="pt-6 border-t border-slate-800">
      <router-link to="/" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all">
        <span class="text-xl">🏠</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Về trang chủ</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.router-link-exact-active {
  background-color: #2563eb !important;
}
</style>