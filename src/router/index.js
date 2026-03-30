import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getAuth, onAuthStateChanged } from "firebase/auth"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
    { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
    { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/product/:id', name: 'product-detail', component: () => import('../views/ProductDetail.vue'), props: true },
    
    // ĐỔI ĐƯỜNG DẪN TẠI ĐÂY (Lối đi bí mật cho Khang)
    { 
      path: '/spit-system-manager', 
      name: 'admin', 
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true } 
    },

    { 
      path: '/admin/dashboard', 
      name: 'AdminDashboard', 
      component: () => import('../views/AdminDashboard.vue'),
      meta: { requiresAuth: true } 
    }
  ],
  scrollBehavior() { return { top: 0 } }
})

// Navigation Guard giữ nguyên để bảo vệ trang quản trị
router.beforeEach((to, from, next) => {
  const auth = getAuth()
  if (to.meta.requiresAuth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        next()
      } else {
        next({ name: 'login' }) 
      }
    })
  } else {
    next() 
  }
})

export default router