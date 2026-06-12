<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">
      Hệ Thống Tư Vấn Sản Phẩm SPIT
    </h1>
    
    <AIConsultant />
  </div>
</template>

<script setup>
// Nhớ import đúng đường dẫn đến component chat đã tạo ở bước trước
import AIConsultant from '../components/AIConsultant.vue'
</script>