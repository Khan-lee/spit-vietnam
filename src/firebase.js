import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Thêm GoogleAuthProvider
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQNZXb65TocfqZRGrqa4Kt7evvg1q3qOE",
  authDomain: "spit-vietnam.firebaseapp.com",
  projectId: "spit-vietnam",
  storageBucket: "spit-vietnam.firebasestorage.app",
  messagingSenderId: "358814834189",
  appId: "1:358814834189:web:048860e8d8cfe6e3fe3f44",
  measurementId: "G-SQK56QGXYS"
};

const app = initializeApp(firebaseConfig);

// ⚡ UPDATE MỚI: Đổi experimentalForceLongPolling -> experimentalAutoDetectLongPolling
// NGUYÊN NHÂN GÂY CHẬM: "experimentalForceLongPolling: true" ÉP BUỘC tất cả kết nối
// Firestore của MỌI người dùng (không phân biệt mạng tốt hay xấu) phải dùng kiểu
// truyền tải HTTP Long-Polling (liên tục gửi request "hỏi thăm" server) thay vì
// WebSocket (kết nối trực tiếp, tức thời, nhẹ hơn nhiều). Long-Polling vốn chỉ nên
// dùng làm giải pháp dự phòng cho các mạng bị chặn WebSocket (mạng công ty, proxy
// công cộng...), chứ không nên ép cứng cho tất cả -> đây là lý do trang tải chậm.
//
// "experimentalAutoDetectLongPolling: true" khắc phục đúng vấn đề trên: Firestore sẽ
// TỰ ĐỘNG kiểm tra môi trường mạng của từng người dùng — dùng WebSocket (nhanh) khi
// có thể, và CHỈ fallback sang Long-Polling khi phát hiện mạng thực sự chặn WebSocket.
// Đây là cấu hình được Google khuyến nghị thay thế cho experimentalForceLongPolling.
//
// Lưu ý: Nếu sau khi đổi mà một số người dùng ở mạng đặc biệt (mạng công ty có tường
// lửa chặn WebSocket) gặp lỗi kết nối Firestore, có thể đổi lại thành
// experimentalForceLongPolling: true như cũ. Nhưng với đa số người dùng thông thường,
// bản autoDetect này sẽ nhanh hơn đáng kể.
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider(); // Khởi tạo Provider cho Google

// Export thêm googleProvider
export { db, auth, storage, googleProvider };