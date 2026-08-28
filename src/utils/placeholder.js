// =========================================================================
// Ảnh thay thế khi sản phẩm / bài viết / banner chưa có hình.
//
// Trước đây code dùng "https://via.placeholder.com/..." — dịch vụ này ĐÃ NGỪNG
// HOẠT ĐỘNG, nên mọi ảnh fallback đều hiển thị vỡ. Ở đây dùng data-URI SVG:
// nhúng thẳng vào bundle, không gọi mạng, không bao giờ hỏng.
// =========================================================================
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<rect width="400" height="300" fill="#f1f5f9"/>
<rect x="150" y="112" width="100" height="66" fill="none" stroke="#cbd5e1" stroke-width="4"/>
<circle cx="174" cy="134" r="9" fill="#cbd5e1"/>
<path d="M156 176l26-28 16 16 24-30 28 42z" fill="#cbd5e1"/>
<text x="200" y="216" font-family="system-ui,Arial,sans-serif" font-size="15" fill="#94a3b8" text-anchor="middle">Chưa có hình ảnh</text>
</svg>`

export const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent(svg)}`

export default PLACEHOLDER_IMG
