// =========================================================================
// ⚡ FILE MỚI: Tiện ích đăng nhập bằng SỐ ĐIỆN THOẠI hoặc EMAIL
// -------------------------------------------------------------------------
// Firebase Auth (Email/Password) yêu cầu định danh là 1 email. Để khách đăng
// nhập bằng SĐT mà KHÔNG tốn phí SMS / không cần bật Phone Auth, ta quy ước:
//   SĐT  ->  email "ảo"  <sdt_chuẩn_hoá>@sdt.vattuvocuc.vn  (chỉ để định danh)
// Đăng ký bằng SĐT sẽ tạo tài khoản với email ảo này; đăng nhập gõ SĐT sẽ tự
// dựng lại đúng email ảo đó. Khách vẫn có thể nhập email thật (tài khoản cũ /
// Google có đặt mật khẩu) — hệ thống nhận diện theo dấu "@".
// =========================================================================

// Domain "ảo" — KHÔNG phải email nhận thư, chỉ là chuỗi định danh cho Auth
export const PHONE_AUTH_DOMAIN = 'sdt.vattuvocuc.vn'

// Chuẩn hoá SĐT Việt Nam về dạng 84xxxxxxxxx (bỏ khoảng trắng, dấu chấm, +...)
export const normalizePhone = (raw) => {
  let s = String(raw || '').replace(/[^\d]/g, '')
  if (s.startsWith('840')) s = '84' + s.slice(3)
  else if (s.startsWith('0')) s = '84' + s.slice(1)
  else if (s.startsWith('84')) { /* giữ nguyên */ }
  else if (s.length === 9) s = '84' + s // dạng 906826959
  return s
}

// SĐT hợp lệ: 84 + 9 chữ số
export const isValidPhone = (raw) => /^84\d{9}$/.test(normalizePhone(raw))

// Hiển thị lại SĐT cho người xem: 84906826959 -> 0906826959
export const prettyPhone = (raw) => {
  const n = normalizePhone(raw)
  return n.startsWith('84') ? '0' + n.slice(2) : n
}

// Có phải chuỗi email không
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim())

// SĐT -> email "ảo" để đăng ký / đăng nhập với Firebase Auth
export const phoneToAuthEmail = (raw) => `${normalizePhone(raw)}@${PHONE_AUTH_DOMAIN}`

// Từ chuỗi khách gõ (SĐT HOẶC email) -> email dùng để signIn
export const resolveLoginEmail = (identifier) => {
  const id = String(identifier || '').trim()
  return isEmail(id) ? id.toLowerCase() : phoneToAuthEmail(id)
}

// Nhận biết email "ảo" (do đăng nhập bằng SĐT sinh ra)
export const isSyntheticEmail = (email) =>
  String(email || '').toLowerCase().endsWith('@' + PHONE_AUTH_DOMAIN)

// Chuỗi liên hệ hiển thị (ưu tiên email thật, sau đó SĐT)
export const displayContact = (u) => {
  if (!u) return ''
  const email = u.email || ''
  if (email && !isSyntheticEmail(email)) return email
  if (u.phone) return prettyPhone(u.phone)
  if (isSyntheticEmail(email)) return prettyPhone(email.split('@')[0])
  return ''
}
