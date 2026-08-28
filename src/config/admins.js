// =========================================================================
// NGUỒN DUY NHẤT cho danh sách email quản trị khu vực /spit-system-manager.
// Trước đây danh sách này bị lặp ở router/index.js và AdminLoginView.vue,
// dễ lệch nhau. Từ nay chỉ sửa ở file này.
// =========================================================================
export const ADMIN_EMAILS = [
  'spitsaigon@gmail.com',
  'p.tri@spit.vn',
]

export const isAdminEmail = (email) =>
  !!email && ADMIN_EMAILS.includes(String(email).trim().toLowerCase())
