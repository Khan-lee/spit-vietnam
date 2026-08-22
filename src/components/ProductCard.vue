<template>
  <div class="bg-white p-4 rounded-xl border border-gray-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-50 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
    <span class="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-10 tracking-wider">
      {{ product[`category_${locale}`] || product.category }}
    </span>

    <div class="aspect-square rounded-lg overflow-hidden mb-4 relative">
      <img :src="product.image" :alt="product[`name_${locale}`] || product.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span class="text-xs text-white font-bold bg-gray-900/80 px-3 py-1.5 rounded-full">
          {{ $t('product.view_detail') }}
        </span>
      </div>
    </div>

    <div class="grow flex flex-col">
      <h3 class="text-sm font-bold text-gray-900 mb-2 leading-snug group-hover:text-red-600 transition truncate-2-lines h-10">
        {{ product[`name_${locale}`] || product.name }}
      </h3>
      
      <div class="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
        <div>
          <!-- 🆕 [CẬP NHẬT MỚI] Giá niêm yết ảo gạch đi (Chỉ hiện khi Giá ảo > Giá bán thực) -->
          <span v-if="hasDiscount" class="text-xs text-gray-400 line-through mr-2">
            {{ formatPrice(displayOriginalPrice) }}
          </span>

          <!-- 🆕 [CẬP NHẬT MỚI] Giá bán thực tế khách trả -->
          <span class="text-lg font-black text-red-600">
            {{ formatPrice(displayRealPrice) }}
          </span>
        </div>
        
        <button 
          @click.stop="$emit('add-to-cart', product)" 
          class="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600 transition-all transform group-hover:scale-105 active:scale-95 uppercase"
        >
          {{ $t('product.add') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const props = defineProps({
  product: Object,
  formatPrice: Function
});

defineEmits(['add-to-cart']);

//  1. Tính toán Giá bán thực tế dựa theo loại hình bán (Hộp hay Mảnh)
const displayRealPrice = computed(() => {
  if (props.product?.sales_type === 'box') {
    return props.product.price_box || props.product.price || 0
  }
  return props.product?.price_piece || props.product?.price || 0
})

//  2. Tính toán Giá gạch đi ảo tương ứng
const displayOriginalPrice = computed(() => {
  if (props.product?.sales_type === 'box') {
    return props.product.original_price_box || 0
  }
  return props.product?.original_price_piece || props.product?.original_price || 0
})

// 3. Kiểm tra xem có điều kiện để hiển thị giá gạch đi không
const hasDiscount = computed(() => {
  return Number(displayOriginalPrice.value) > Number(displayRealPrice.value)
})
</script>

<style scoped>
.truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>