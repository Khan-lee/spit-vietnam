<script setup>

import { ref, onMounted, computed, onUnmounted } from 'vue' // Thêm onUnmounted để dọn dẹp

import { RouterView, useRoute } from 'vue-router'

import { useI18n } from 'vue-i18n'

import Header from './components/Header.vue'

import Footer from './components/Footer.vue'

import CartView from './views/CartView.vue'

import { db } from './firebase'

import { doc, onSnapshot } from 'firebase/firestore'



const route = useRoute()

const { locale } = useI18n()



const webConfig = ref({

  hotline: '',

  email: ''

})

const cartItems = ref([])

const isCartOpen = ref(false)

const searchQuery = ref('')



// Biến quản lý ngắt kết nối Firebase cho App.vue

let unsubConfig = null



const displayAnnouncement = computed(() => {

  const currentAnnouncement = webConfig.value.announcement || webConfig.value.announcement_vi

 

  if (locale.value === 'vi') {

    return currentAnnouncement

  } else {

    return webConfig.value.announcement_en || 'Professional Technology Solutions'

  }

})



const isHideLayout = computed(() => {

  return route.path.startsWith('/spit-system-manager') || route.path.startsWith('/admin') || route.path === '/login'

})



const updateCart = () => {

  const data = localStorage.getItem('spit_cart')

  cartItems.value = data ? JSON.parse(data) : []

}



const cartCount = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))



const changeQuantity = (productId, delta) => {

  const item = cartItems.value.find(i => i.id === productId)

  if (item) {

    item.quantity += delta

    if (item.quantity <= 0) {

      removeFromCart(productId)

    } else {

      saveCart()

    }

  }

}



const removeFromCart = (productId) => {

  cartItems.value = cartItems.value.filter(item => item.id !== productId)

  saveCart()

}



const saveCart = () => {

  localStorage.setItem('spit_cart', JSON.stringify(cartItems.value))

  window.dispatchEvent(new Event('cart-updated'))

}



onMounted(() => {

  updateCart()

  window.addEventListener('storage', updateCart)

  window.addEventListener('cart-updated', updateCart)

 

  // Cập nhật: Lưu vào unsubConfig để có thể ngắt kết nối khi chuyển trang

  unsubConfig = onSnapshot(doc(db, "settings", "website"), (docSnap) => {

    if (docSnap.exists()) webConfig.value = { ...webConfig.value, ...docSnap.data() }

  })

})



// CẬP NHẬT: Dọn dẹp listener để không bị nghẽn Network

onUnmounted(() => {

  window.removeEventListener('storage', updateCart)

  window.removeEventListener('cart-updated', updateCart)

  if (unsubConfig) unsubConfig()

})

</script>



<template>

  <div class="min-h-screen bg-white font-sans text-slate-900 flex flex-col">

    <div v-if="!isHideLayout" class="bg-[#0f172a] text-white py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] relative z-60">

      <div class="container mx-auto px-4 overflow-hidden whitespace-nowrap">

        <span class="inline-block animate-marquee">

          {{ displayAnnouncement }} — {{ displayAnnouncement }} — {{ displayAnnouncement }}

        </span>

      </div>

    </div>



    <Header

      v-if="!isHideLayout"

      :cartCount="cartCount"

      v-model:searchQuery="searchQuery"

      @openCart="isCartOpen = true"

    />



    <transition name="cart-slide">

      <CartView

        v-if="isCartOpen"

        :cart="cartItems"

        @close="isCartOpen = false"

        @change-qty="changeQuantity"

        @remove-item="removeFromCart"

      />

    </transition>



    <main class="grow">

      <RouterView v-slot="{ Component }">

        <transition name="fade" mode="out-in">

          <component :is="Component" :key="route.fullPath" :search-query="searchQuery" />

        </transition>

      </RouterView>

    </main>



    <Footer v-if="!isHideLayout" :config="webConfig" />

  </div>

</template>



<style scoped>

@keyframes marquee {

  0% { transform: translateX(100%); }

  100% { transform: translateX(-100%); }

}

.animate-marquee {

  display: inline-block;

  animation: marquee 30s linear infinite;

}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }

.fade-enter-from, .fade-leave-to { opacity: 0; }

.cart-slide-enter-active, .cart-slide-leave-active {

  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

}

.cart-slide-enter-from, .cart-slide-leave-to {

  transform: translateX(100%);

  opacity: 0;

}

</style>