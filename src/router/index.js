import BrandAdminView from '../views/BrandAdminView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import PolicyDetail from '../views/PolicyDetail.vue'
import StatsView from '../views/admin/StatsView.vue' // Import trang Thống kê

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
      component: () => import('../views/admin/AdminPolicies.vue')
    },
    {
      path: '/chinh-sach/:slug',
      name: 'PolicyDetail',
      component: PolicyDetail
    },
    // --- KHU VỰC ĐĂNG NHẬP ---
    { 
      path: '/login', 
      name: 'login', 
      component: () => import('../views/UserLoginView.vue') 
    },
    { 
      path: '/admin/login', 
      name: 'admin-login', 
      component: () => import('../views/AdminLoginView.vue') 
    },

    // ⚡ UPDATE: BẢO VỆ ROUTE CHECKOUT CHO NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
    { 
      path: '/checkout', 
      name: 'checkout', 
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresUserAuth: true }
    },
    
    // ⚡ UPDATE MỚI: HỖ TRỢ ĐƯỜNG DẪN SEO CHO TRANG CHI TIẾT SẢN PHẨM
    // Giữ nguyên tên tham số ":id" như cũ để KHÔNG phá vỡ bất kỳ code nào đang dùng route.params.id,
    // nhưng giờ đây giá trị của "id" trên URL có thể là:
    //   - Slug SEO thân thiện (VD: /product/may-phay-cnc-korloy-6mm) — sản phẩm đã cấu hình Slug ở Admin
    //   - Hoặc ID Firestore ngẫu nhiên như cũ (VD: /product/04bZvFEPryme2IHGYwMu) — với sản phẩm chưa có Slug
    // Việc phân giải Slug -> ID Firestore thật được xử lý bên trong ProductDetail.vue (khi tải dữ liệu sản phẩm),
    // nên bản thân route này không cần đổi path pattern, chỉ cần comment ghi chú lại cho rõ ràng.
    { path: '/product/:id', name: 'product-detail', component: () => import('../views/ProductDetail.vue'), props: true },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue')
    },
    { path: '/tin-tuc', name: 'posts-list', component: () => import('../views/PostsView.vue') },
    { path: '/post/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue') },

    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    { path: '/brand/:id', name: 'brand-detail', component: () => import('../views/BrandDetailView.vue'), props: true },
    { 
      path: '/ai-consultant', 
      name: 'AIConsultant', 
      component: () => import('../views/AIConsultantView.vue') 
    },

    // --- ADMIN ROUTES ---
    { 
      path: '/spit-system-manager/stats', 
      name: 'AdminStats', 
      component: StatsView,
      meta: { requiresAuth: true } 
    },
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
    {
      path: '/spit-system-manager/banners',
      name: 'AdminBanners',
      component: () => import('../views/AdminBannerView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/spit-system-manager/categories',
      name: 'AdminCategories',
      component: () => import('../views/admin/AdminCategoriesView.vue'),
      meta: { requiresAuth: true }
    },
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

const ADMIN_EMAILS = [
  'spitsaigon@gmail.com',
  'p.tri@spit.vn',
];

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  // 1. Kiểm tra Route yêu cầu quyền ADMIN
  if (to.meta.requiresAuth) {
    const user = await getCurrentUser();
    
    if (user && ADMIN_EMAILS.includes(user.email)) {
      next();
    } else {
      next({ name: 'admin-login' });
    }
  } 
  // 2. UPDATE: Kiểm tra Route yêu cầu đăng nhập KHÁCH HÀNG (Checkout)
  else if (to.meta.requiresUserAuth) {
    const user = await getCurrentUser();

    if (user) {
      next(); // Đã đăng nhập -> cho phép vào Checkout
    } else {
      // Chưa đăng nhập -> Chuyển hướng sang Login và lưu tham số query redirect
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  } 
  // 3. Các route public thông thường
  else {
    next();
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;