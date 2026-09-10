import { ref } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const user = ref(null)

// Theo dõi trạng thái đăng nhập xuyên suốt ứng dụng
onAuthStateChanged(auth, async (currentUser) => {
  // ⚡ UPDATE MỚI: nếu admin đã KHOÁ tài khoản (users/{uid}.disabled === true)
  // thì tự đăng xuất ngay, không cho dùng tiếp.
  if (currentUser) {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists() && snap.data().disabled === true) {
        await signOut(auth)
        user.value = null
        return
      }
    } catch (e) {
      // Đọc lỗi (mạng / rules) -> vẫn cho vào bình thường, không chặn nhầm
      console.warn('Không kiểm tra được trạng thái khoá tài khoản:', e?.code || e)
    }
  }
  user.value = currentUser
})

export const logout = async () => {
  await signOut(auth)
}
