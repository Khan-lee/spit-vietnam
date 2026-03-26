<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-100 transition-all duration-300">
    <div class="container mx-auto px-4 h-20 flex items-center justify-between">
      
      <router-link to="/" class="flex items-center space-x-2 group">
        <div class="bg-red-600 px-3 py-1 rounded-lg group-hover:bg-gray-900 transition-colors duration-300">
          <span class="text-xl font-black text-white tracking-tighter">SPIT</span>
        </div>
        <span class="text-lg font-black text-gray-900 uppercase tracking-widest hidden lg:block">Vietnam</span>
      </router-link>

      <nav class="hidden md:flex items-center space-x-10">
        <router-link to="/" class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 transition-colors pb-1 border-b-2 border-transparent hover:border-red-600">
          Trang chủ
        </router-link>
        <router-link to="/" class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 transition-colors pb-1 border-b-2 border-transparent hover:border-red-600">
          Sản phẩm
        </router-link>
        <router-link to="/contact" class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 transition-colors pb-1 border-b-2 border-transparent hover:border-red-600">
          Liên hệ
        </router-link>
        <router-link to="/admin" class="text-[9px] font-black bg-gray-100 text-gray-400 px-2.5 py-1 rounded-md hover:bg-red-600 hover:text-white transition uppercase">
          Quản trị
        </router-link>
      </nav>

      <div class="flex items-center space-x-6">
        <div class="relative group hidden sm:block">
          <input 
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            type="text" 
            placeholder="Tìm sản phẩm..." 
            class="w-48 lg:w-64 bg-gray-50 border-none rounded-2xl px-5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-600 transition-all focus:bg-white focus:shadow-lg focus:w-80 outline-none"
          />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">🔍</span>
        </div>
        
        <router-link to="/cart" class="relative p-2.5 bg-gray-50 rounded-2xl hover:bg-red-50 transition-all group">
          <span class="text-xl group-hover:scale-110 block transition-transform">🛒</span>
          <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-md">
            {{ cartCount }}
          </span>
        </router-link>
      </div>

    </div>
  </header>
</template>

<script setup>
defineProps(['cartCount', 'search']);
defineEmits(['update:search']);
</script>