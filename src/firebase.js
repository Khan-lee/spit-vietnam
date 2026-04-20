import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore"; // Cập nhật hàm này để cấu hình sâu hơn
import { getAuth } from "firebase/auth";
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

// Cập nhật: Ép Firebase dùng Long Polling để fix lỗi "Failed to load response data" trên trình duyệt
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };