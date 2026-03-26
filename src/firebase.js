import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. Thêm dòng này để dùng tính năng đăng nhập

const firebaseConfig = {
  apiKey: "AIzaSyAQNZXb65TocfqZRGrqa4Kt7evvg1q3qOE",
  authDomain: "spit-vietnam.firebaseapp.com",
  projectId: "spit-vietnam",
  storageBucket: "spit-vietnam.firebasestorage.app",
  messagingSenderId: "358814834189",
  appId: "1:358814834189:web:048860e8d8cfe6e3fe3f44",
  measurementId: "G-SQK56QGXYS"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// 2. Khởi tạo các dịch vụ
const db = getFirestore(app);
const auth = getAuth(app); // 3. Thêm dòng này để quản lý tài khoản spitsaigon@gmail.com

// 4. Xuất (export) cả db và auth để dùng trong trang Admin
export { db, auth };