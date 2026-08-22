// src/utils/trackVisit.js
import { db } from '../firebase' // Đường dẫn file firebase của mày
import { doc, setDoc, increment } from 'firebase/firestore'

export const trackDailyVisit = async () => {
  // Chỉ đếm 1 lần mỗi phiên duyệt web của khách (tránh spam F5)
  const hasVisitedToday = sessionStorage.getItem('visited_today')
  if (hasVisitedToday) return

  // Lấy ngày hiện tại dạng YYYY-MM-DD (Ví dụ: 2026-03-30)
  const today = new Date().toISOString().split('T')[0]
  const visitRef = doc(db, 'daily_visits', today)

  try {
    // Nếu ngày hôm đó chưa có doc thì tạo mới, có rồi thì tăng count lên 1
    await setDoc(visitRef, {
      date: today,
      count: increment(1)
    }, { merge: true })

    sessionStorage.setItem('visited_today', 'true')
  } catch (error) {
    console.error('Lỗi ghi nhận lượt truy cập:', error)
  }
}