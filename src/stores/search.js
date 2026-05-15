import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchQuery: ''
  }),
  actions: {
    // Hàm này dùng để cập nhật từ khóa từ bất kỳ đâu (Header hoặc App)
    setSearchQuery(val) {
      this.searchQuery = val
    }
  }
})