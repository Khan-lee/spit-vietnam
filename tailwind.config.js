/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cập nhật màu chủ đạo từ Đỏ sang Xám #888888
        primary: {
          DEFAULT: '#888888', // Màu xám chủ đạo mới của bạn
          dark: '#888888',    // GIỮ NGUYÊN: Màu đen Slate cho thanh thông báo
          light: '#f4f4f4',   // Cập nhật nhẹ: Màu nền sáng hợp với tông xám
          accent: '#1e293b',  // GIỮ NGUYÊN: Màu nhấn đậm
        }
      }
    },
  },
  plugins: [],
}