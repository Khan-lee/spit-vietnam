import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Cấu hình NProgress
NProgress.configure({ showSpinner: false, speed: 500 });

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
    
    { path: '/tin-tuc', name: 'posts-list', component: () => import('../views/PostsView.vue') },
    { path: '/post/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue') },

    // --- ADMIN ROUTES ---
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
    { 
      path: '/spit-system-manager/promotions', 
      name: 'AdminPromotions', 
      component: () => import('../views/admin/PromotionsAdmin.vue'),
      meta: { requiresAuth: true } 
    },
    // MỤC MỚI CẬP NHẬT: QUẢN LÝ NHÃN HÀNG
    { 
      path: '/spit-system-manager/brands', 
      name: 'AdminBrands', 
      component: () => import('../views/admin/BrandManager.vue'),
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

// Helper check auth
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

// Guard bảo vệ các trang Admin và Hiệu ứng Loading
router.beforeEach(async (to, from, next) => {
  NProgress.start();

  if (to.meta.requiresAuth) {
    const user = await getCurrentUser();
    if (user) {
      next();
    } else {
      next({ name: 'login' });
    }
  } else {
    next();
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router