import BrandAdminView from '../views/BrandAdminView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import PolicyDetail from '../views/PolicyDetail.vue'

// Cấu hình NProgress
NProgress.configure({ showSpinner: false, speed: 500 });

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/admin/brands',
      name: 'BrandAdmin',
      component: BrandAdminView,
    },
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
    { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
    { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
    {
  path: '/spit-system-manager/policies',
  name: 'AdminPolicies',
  component: () => import('../views/admin/AdminPolicies.vue') // Trỏ tới file view quản lý chính sách
},
// THÊM ROUTE NÀY VÀO:
  {
    path: '/chinh-sach/:slug',
    name: 'PolicyDetail',
    component: PolicyDetail
  },
    // --- KHU VỰC ĐĂNG NHẬP (ĐÃ TÁCH BIỆT) ---
    // 1. Đăng nhập dành cho Khách hàng / Người dùng
    { 
      path: '/login', 
      name: 'login', 
      component: () => import('../views/UserLoginView.vue') 
    },
    // 2. Đăng nhập dành riêng cho Admin
    { 
      path: '/admin/login', 
      name: 'admin-login', 
      component: () => import('../views/AdminLoginView.vue') 
    },

    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/product/:id', name: 'product-detail', component: () => import('../views/ProductDetail.vue'), props: true },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue')
    },
    { path: '/tin-tuc', name: 'posts-list', component: () => import('../views/PostsView.vue') },
    { path: '/post/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue') },

    // ROUTE GIỚI THIỆU (ABOUT) CHO NGƯỜI DÙNG
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },

    // ROUTE CHI TIẾT NHÃN HÀNG
    { path: '/brand/:id', name: 'brand-detail', component: () => import('../views/BrandDetailView.vue'), props: true },

    // ROUTE TRỢ LÝ AI TƯ VẤN KỸ THUẬT SẢN PHẨM
    { 
      path: '/ai-consultant', 
      name: 'AIConsultant', 
      component: () => import('../views/AIConsultantView.vue') 
    },

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
    // QUẢN LÝ NHÃN HÀNG
    { 
      path: '/spit-system-manager/brands', 
      name: 'AdminBrands', 
      component: () => import('../views/admin/BrandManager.vue'),
      meta: { requiresAuth: true } 
    },
    {
      path: '/spit-system-manager/logos',
      name: 'AdminLogos',
      component: () => import('../views/admin/LogoManager.vue')
    },
    { 
      path: '/spit-system-manager/settings', 
      name: 'AdminSettings', 
      component: () => import('../views/AdminSettingsView.vue'),
      meta: { requiresAuth: true } 
    },
    // QUẢN LÝ SLIDESHOW BANNER TRANG CHỦ
    {
      path: '/spit-system-manager/banners',
      name: 'AdminBanners',
      component: () => import('../views/AdminBannerView.vue'),
      meta: { requiresAuth: true }
    },
    // QUẢN LÝ DANH MỤC
    {
      path: '/spit-system-manager/categories',
      name: 'AdminCategories',
      component: () => import('../views/admin/AdminCategoriesView.vue'),
      meta: { requiresAuth: true }
    },
    // QUẢN LÝ GIỚI THIỆU (ABOUT) CHO ADMIN
    { 
      path: '/spit-system-manager/about', 
      name: 'AdminAbout',
      component: () => import('../views/admin/AdminAboutView.vue'),
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

// 1. Khai báo danh sách Email có quyền Admin ở đây (Thay bằng email admin thực tế của bạn)
const ADMIN_EMAILS = [
  'spitsaigon@gmail.com',
  'p.tri@spit.vn', // Thêm các email admin khác nếu có
];

// Guard bảo vệ các trang Admin và Hiệu ứng Loading
router.beforeEach(async (to, from, next) => {
  NProgress.start();

  // Kiểm tra nếu route yêu cầu quyền Auth (Các trang Admin)
  if (to.meta.requiresAuth) {
    const user = await getCurrentUser();
    
    // ĐIỀU KIỆN MỚI: Phải ĐÃ ĐĂNG NHẬP + Email phải thuộc DANH SÁCH ADMIN
    if (user && ADMIN_EMAILS.includes(user.email)) {
      next(); // Cho phép vào trang Admin
    } else {
      // Nếu là User thường hoặc Chưa đăng nhập -> Đá về trang Login Admin
      next({ name: 'admin-login' });
    }
  } else {
    next();
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;