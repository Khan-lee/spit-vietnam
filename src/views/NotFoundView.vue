<!--
  ⚡ FILE MỚI: Trang 404 "Không tìm thấy".
  Trước đây router KHÔNG có route bắt-tất-cả (catch-all) -> mọi URL sai (gõ nhầm,
  bookmark cũ, link chết như /ho-tro/... , kết quả Google cũ) đều cho ra trang
  TRẮNG (chỉ còn Header + Footer, khúc giữa rỗng) và Vue Router chửi trong console.
  Route "/:pathMatch(.*)*" ở cuối router/index.js sẽ trỏ tới trang này.
-->
<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-20">
    <div class="max-w-md w-full text-center">
      <p class="text-[110px] leading-none font-black text-slate-900 tracking-tighter select-none">404</p>
      <h1 class="mt-2 text-lg font-black uppercase tracking-wide text-slate-800">
        {{ locale === 'vi' ? 'Không tìm thấy trang' : 'Page not found' }}
      </h1>
      <p class="mt-3 text-sm text-slate-500 font-medium">
        {{ locale === 'vi'
          ? 'Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.'
          : 'The page you are looking for does not exist or has been moved.' }}
      </p>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <RouterLink
          to="/"
          class="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-red-600 transition-colors"
        >
          {{ locale === 'vi' ? 'Về trang chủ' : 'Back to home' }}
        </RouterLink>
        <RouterLink
          to="/products"
          class="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black uppercase tracking-[0.15em] hover:border-slate-950 hover:text-slate-950 transition-colors"
        >
          {{ locale === 'vi' ? 'Xem sản phẩm' : 'Browse products' }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
</script>
