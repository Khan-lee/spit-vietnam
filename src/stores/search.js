import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchQuery: '',
    products: [] // Bổ sung mảng lưu danh sách sản phẩm
  }),
  actions: {
    setSearchQuery(val) {
      this.searchQuery = val
    },
    // Hàm tự động tải sản phẩm từ Firestore
    async fetchProducts() {
      if (this.products.length > 0) return // Nếu đã có dữ liệu thì không tải lại để tiết kiệm
      try {
        const snap = await getDocs(collection(db, "products"))
        this.products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm cho Search:", error)
      }
    }
  }
})