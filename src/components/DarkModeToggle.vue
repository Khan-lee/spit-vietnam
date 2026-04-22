<template>
  <button 
    @click="$emit('toggle')" 
    class="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 transition-all duration-300 hover:ring-2 ring-primary group"
  >
    <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 transform group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z" />
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-700 transform group-hover:-rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  </button>
</template>

<script setup>
defineProps(['isDark'])
defineEmits(['toggle'])
</script>