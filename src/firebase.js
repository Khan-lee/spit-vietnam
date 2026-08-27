import { initializeApp } from "firebase/app";
// ⚡ UPDATE MỚI: Thêm persistentLocalCache và persistentMultipleTabManager để bật Cache Cục Bộ
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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
//
// =========================================================================
// ⚡ UPDATE MỚI: BẬT CACHE CỤC BỘ (localCache) CHO FIRESTORE
// -------------------------------------------------------------------------
// TÁC DỤNG: Toàn bộ dữ liệu Firestore mà trình duyệt từng tải về (sản phẩm, danh mục,
// bài viết...) sẽ được LƯU LẠI trong bộ nhớ IndexedDB của trình duyệt (giống 1 kho lưu
// trữ nhỏ ngay trên máy khách hàng). Lợi ích thấy rõ nhất:
//   - LẦN VÀO SAU của cùng 1 khách (F5 lại trang, hoặc quay lại web sau đó): dữ liệu hiện
//     GẦN NHƯ TỨC THÌ từ cache có sẵn trên máy, KHÔNG cần đợi gọi mạng tới Firestore nữa
//     -> cảm giác web nhanh hẳn cho khách quay lại nhiều lần.
//   - Firestore vẫn tự đồng bộ ngầm phía sau với server thật để cập nhật nếu có gì mới
//     (giá đổi, sản phẩm mới...) -> không lo hiện dữ liệu cũ sai lệch lâu dài.
//   - Với các trang dùng onSnapshot (products, promotions) vẫn nhận cập nhật real-time
//     bình thường như cũ, cache chỉ giúp lần hiển thị ĐẦU TIÊN nhanh hơn.
//
// persistentMultipleTabManager(): cho phép cache này hoạt động ĐÚNG khi khách mở NHIỀU TAB
// cùng lúc của web (VD vừa mở trang chủ vừa mở 1 sản phẩm ở tab khác) — nếu không khai báo
// tab manager này, Firestore mặc định chỉ cho phép 1 tab dùng cache tại 1 thời điểm, các
// tab còn lại sẽ tự động tắt cache (không lỗi gì, chỉ là không được hưởng lợi ích tốc độ).
//
// LƯU Ý: Cách khai báo "localCache" ngay trong initializeFirestore (thay vì gọi hàm
// enableIndexedDbPersistence() riêng như các hướng dẫn cũ trên mạng) là cách làm MỚI, được
// chính Firebase khuyến nghị — không cần code xử lý lỗi phức tạp, và tự động graceful
// fallback (bỏ qua cache, chạy bình thường) trên các trình duyệt/chế độ không hỗ trợ
// IndexedDB (VD 1 số chế độ ẩn danh nghiêm ngặt), không làm sập ứng dụng.
// =========================================================================
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider(); // Khởi tạo Provider cho Google

// Export thêm googleProvider
export { db, auth, storage, googleProvider };