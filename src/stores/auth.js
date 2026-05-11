import { ref } from 'vue'
import { auth } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export const user = ref(null)

// Theo dõi trạng thái đăng nhập xuyên suốt ứng dụng
onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
})

export const logout = async () => {
  await signOut(auth)
}