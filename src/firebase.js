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

// Giữ nguyên cấu hình Long Polling của bạn
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider(); // Khởi tạo Provider cho Google

// Export thêm googleProvider
export { db, auth, storage, googleProvider };