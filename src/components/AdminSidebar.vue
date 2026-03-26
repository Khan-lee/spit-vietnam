<template>
  <div class="fixed left-0 top-0 h-screen w-20 md:w-64 bg-slate-900 text-white p-4 md:p-6 flex flex-col z-50">
    <div class="mb-10 text-center md:text-left">
      <h2 class="hidden md:block text-xl font-black italic uppercase text-blue-500 tracking-tighter">SPIT ADMIN</h2>
      <span class="md:hidden font-black text-blue-500 text-xl">S</span>
    </div>

    <nav class="space-y-2 grow">
      <router-link to="/admin/dashboard" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600 shadow-lg shadow-blue-600/20">
        <span class="text-xl">📊</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Báo cáo tổng quan</span>
      </router-link>

      <router-link to="/admin" class="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-800 group" active-class="bg-blue-600 shadow-lg shadow-blue-600/20">
        <span class="text-xl">📦</span>
        <span class="hidden md:block text-[10px] font-black uppercase tracking-widest">Quản lý hàng hóa</span>
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
  background-color: #2563eb !important; /* Blue-600 */
}
</style>