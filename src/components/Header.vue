<script setup>

import { useI18n } from 'vue-i18n'

import { RouterLink } from 'vue-router'



// GIỮ NGUYÊN: Logo từ assets

import logoImg from '../assets/noBG_logo.png'



defineProps(['cartCount', 'searchQuery'])

const emit = defineEmits(['update:searchQuery', 'openCart'])



const { locale } = useI18n()



// Hàm xử lý mở giỏ hàng để đảm bảo emit hoạt động đúng

const handleOpenCart = () => {

  console.log("Cart button clicked") // Dòng này để bạn kiểm tra trong F12

  emit('openCart')

}



const changeLanguage = (event) => {

  const newLang = event.target.value

  locale.value = newLang

  localStorage.setItem('user-lang', newLang)

}

</script>



<template>

  <header class="flex justify-between items-center px-6 md:px-12 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">

   

    <RouterLink to="/" class="flex items-center group cursor-pointer h-20">

      <img :src="logoImg" alt="SPIT Vietnam Logo" class="max-h-full w-auto block transition-transform group-hover:-skew-x-6" />

    </RouterLink>



    <nav class="hidden xl:flex items-center gap-10">

      <RouterLink to="/" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">

        {{ $t('nav.home') }}

      </RouterLink>

      <RouterLink to="/products" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">

        {{ $t('nav.products') }}

      </RouterLink>

      <RouterLink to="/contact" class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition" active-class="text-red-600">

        {{ $t('nav.contact') }}

      </RouterLink>

    </nav>



    <div class="flex items-center gap-4 md:gap-8">

      <div class="relative hidden md:block group">

        <input

          :value="searchQuery"

          @input="emit('update:searchQuery', $event.target.value)"

          type="text"

          :placeholder="$t('nav.search')"

          class="bg-slate-100 py-2.5 px-6 pr-12 rounded-full text-[11px] font-bold outline-none w-48 lg:w-64 focus:w-80 transition-all border border-transparent focus:border-red-100 shadow-inner"

        />

      </div>



      <select

        :value="locale"

        @change="changeLanguage"

        class="bg-slate-50 border-none rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-wider focus:ring-1 focus:ring-red-600 outline-none cursor-pointer hover:bg-slate-200 transition-all shadow-sm"

      >

        <option value="vi">VN</option>

        <option value="en">EN</option>

      </select>

     

      <button

        @click="handleOpenCart"

        class="relative group p-2 hover:bg-slate-50 rounded-full transition-colors z-60"

      >

        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>

        <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">

          {{ cartCount }}

        </span>

      </button>

    </div>

  </header>

</template>