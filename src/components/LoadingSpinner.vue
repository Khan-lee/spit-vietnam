<template>
  <div class="flex flex-col items-center justify-center p-12">
    <div class="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p class="mt-4 text-[10px] font-black uppercase italic text-slate-400 tracking-widest animate-pulse">
      Đang tải dữ liệu...
    </p>
  </div>
</template>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>