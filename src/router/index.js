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
    
    // --- CẬP NHẬT: ROUTE DANH SÁCH BÀI VIẾT (TẤT CẢ BÀI VIẾT) ---
    { 
      path: '/tin-tuc', 
      name: 'posts-list', 
      component: () => import('../views/PostsView.vue') 
    },

    // ROUTE CHI TIẾT BÀI VIẾT
    { 
      path: '/post/:id', 
      name: 'post-detail', 
      component: () => import('../views/PostDetailView.vue') 
    },

    // --- HỆ THỐNG QUẢN TRỊ (SPIT SYSTEM MANAGER) ---
    { 
      path: '/spit-system-manager', 
      name: 'admin', 
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true } 
    },
    { 
      path: '/spit-system-manager/dashboard', 
      name: 'AdminDashboard', 
      component: () => import('../views/AdminDashboard.vue'),
      meta: { requiresAuth: true } 
    },
    { 
      path: '/spit-system-manager/posts', 
      name: 'AdminPosts', 
      component: () => import('../views/AdminPostsView.vue'),
      meta: { requiresAuth: true } 
    },
    // ROUTE MỚI: QUẢN LÝ KHUYẾN MÃI
    { 
      path: '/spit-system-manager/promotions', 
      name: 'AdminPromotions', 
      component: () => import('../views/admin/PromotionsAdmin.vue'),
      meta: { requiresAuth: true } 
    },
    { 
      path: '/spit-system-manager/settings', 
      name: 'AdminSettings', 
      component: () => import('../views/AdminSettingsView.vue'),
      meta: { requiresAuth: true } 
    }
  ],
  scrollBehavior() { return { top: 0 } }
})

// Guard bảo vệ các trang Admin
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