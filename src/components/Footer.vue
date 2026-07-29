<template>
  <footer class="bg-primary text-black py-16 px-6 md:px-12 border-t border-slate-800/50">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="h-8 flex items-center">
            <img src="../assets/noBG_logo.png" alt="SPIT" class="h-full w-auto brightness-0 invert object-contain" />
          </div>
          <span class="font-bold text-lg uppercase tracking-tight">Vietnam</span>
        </div>
        <p class="text-black text-sm leading-relaxed max-w-xs">
          {{ $t('footer.about_text') }}
        </p>

        <!-- SỬA MÀU ICON MẠNG XÃ HỘI CHO BẮT MẮT -->
        <div class="flex items-center gap-4 pt-2">
          <!-- Facebook Icon -->
          <a :href="config.facebook || 'https://www.facebook.com/vnspit'" target="_blank" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <!-- YouTube Icon -->
          <a href="https://www.youtube.com/channel/UCevP--LZsdjHn3EQwgesoFA" target="_blank" class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" stroke="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.42-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FFFFFF"/></svg>
          </a>
        </div>
      </div>

      <div class="space-y-6">
        <h3 class="text-black font-black text-[10px] uppercase tracking-[0.3em]">{{ $t('footer.policies') }}</h3>
        <ul class="space-y-4 text-sm font-bold text-black">
          <li>
            <RouterLink to="/contact?reason=support" class="hover:text-slate-700 transition-colors duration-200">{{ $t('footer.tech_support') }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/contact?reason=policy" class="hover:text-slate-700 transition-colors duration-200">{{ $t('footer.return_policy') }}</RouterLink>
          </li>
          <li v-if="config.shippingFee" class="text-[11px] text-black italic">
            {{ $t('footer.shipping_fee') }}: {{ Number(config.shippingFee).toLocaleString() }} VNĐ
          </li>
        </ul>
      </div>

      <div class="space-y-6">
        <h3 class="text-black font-black text-[10px] uppercase tracking-[0.3em]">{{ $t('nav.contact') }}</h3>
        <ul class="space-y-4 text-sm text-black">
          <li class="flex items-start gap-3 group">
            <span class="text-black">📍</span>
            <span class="hover:text-slate-700 transition-colors leading-relaxed whitespace-pre-line">
              {{ config[`address_${locale}`] || config.address || '361 Le Trong Tan, Tan Phu, Ho Chi Minh City' }}
            </span>
          </li>
          <li class="flex items-center gap-3 font-bold text-black">
            <span class="text-black">📞</span>
            <a :href="'tel:' + config.hotline" class="hover:text-slate-700 transition-colors">
              Hotline/Zalo: {{ config.hotline || '1900 xxxx' }}
            </a>
          </li>
          <li v-if="config.email" class="flex items-center gap-3 text-black">
            <span class="text-black">✉️</span>
            <a :href="'mailto:' + config.email" class="hover:text-slate-700 transition-colors text-xs">{{ config.email }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-black">
      <p class="italic">© 2026 SPIT VIETNAM. All rights reserved.</p>
      <p>Designed by Khang Le</p>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})
</script>