/** @type {import('tailwindcss').Config} */

export default {

  content: [

    "./index.html",

    "./src/**/*.{vue,js,ts,jsx,tsx}",

  ],

  theme: {

    extend: {

      colors: {

        // Khai báo chính xác các biến màu đang dùng trong App.vue và CartView.vue

        primary: {

          DEFAULT: '#e11d48', // Màu đỏ chủ đạo

          dark: '#0f172a',    // Màu đen Slate cho thanh thông báo

          light: '#fff1f2',

          accent: '#1e293b',

        }

      }

    },

  },

  plugins: [],

}