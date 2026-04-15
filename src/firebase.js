import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 1. THÊM DÒNG NÀY

const firebaseConfig = {
  apiKey: "AIzaSyAQNZXb65TocfqZRGrqa4Kt7evvg1q3qOE",
  authDomain: "spit-vietnam.firebaseapp.com",
  projectId: "spit-vietnam",
  storageBucket: "spit-vietnam.firebasestorage.app", // Storage nằm ở đây nè
  messagingSenderId: "358814834189",
  appId: "1:358814834189:web:048860e8d8cfe6e3fe3f44",
  measurementId: "G-SQK56QGXYS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // 2. KHỞI TẠO STORAGE

// 3. XUẤT (EXPORT) THÊM STORAGE RA NGOÀI
export { db, auth, storage };