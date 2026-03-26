<template>
  <footer class="bg-[#0f172a] text-white py-16 px-6 md:px-12 border-t border-slate-800">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      
      <div class="space-y-6">
        <div class="flex items-center gap-2">
          <span class="text-red-600 font-black text-xl italic uppercase">SPIT</span>
          <span class="font-bold text-lg uppercase tracking-tight">Vietnam</span>
        </div>
        <p class="text-slate-400 text-sm leading-relaxed max-w-xs">
          Nhà cung cấp giải pháp công nghiệp và dụng cụ cơ khí chính xác hàng đầu tại Việt Nam. Uy tín tạo nên thương hiệu.
        </p>

        <div class="flex items-center gap-4 pt-2">
          <a href="#" target="_blank" class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-all duration-300 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 group-hover:text-white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#" target="_blank" class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 transition-all duration-300 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 group-hover:text-white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.42-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
          </a>
          <a href="#" target="_blank" class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-white transition-all duration-300 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 group-hover:text-slate-900"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </a>
        </div>
      </div>

      <div class="space-y-6">
        <h3 class="text-red-600 font-black text-[10px] uppercase tracking-[0.3em]">Chính sách</h3>
        <ul class="space-y-4 text-sm font-bold text-slate-400">
          <li class="hover:text-white cursor-pointer transition">Hỗ trợ kỹ thuật</li>
          <li class="hover:text-white cursor-pointer transition">Chính sách đổi trả</li>
          <li>
            <RouterLink 
              to="/admin" 
              class="hover:text-red-500 transition italic opacity-50 hover:opacity-100 flex items-center gap-2 group"
            >
              Cổng Admin
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="space-y-6">
        <h3 class="text-red-600 font-black text-[10px] uppercase tracking-[0.3em]">Liên hệ</h3>
        <ul class="space-y-4 text-sm text-slate-400">
          <li class="flex items-start gap-3">
            <span class="text-red-600">📍</span>
            <span>361 Lê Trọng Tấn, Sơn Kỳ, Tân Phú, TP. HCM</span>
          </li>
          <li class="flex items-center gap-3 font-bold text-white">
            <span class="text-red-600">📞</span>
            <span>Hotline: 1900 xxxx</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
      <p class="italic">© 2026 SPIT VIETNAM. All rights reserved.</p>
      <div class="flex gap-6">
        <span class="hover:text-white cursor-pointer transition">Privacy</span>
        <span class="hover:text-white cursor-pointer transition">Terms</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>