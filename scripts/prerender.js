// =========================================================================
// ⚡ FILE MỚI: scripts/prerender.js
// -------------------------------------------------------------------------
// Script này KHÔNG chạy trong trình duyệt. Nó chạy 1 lần bằng Node.js,
// NGAY SAU khi "vite build" xong (xem package.json), với nhiệm vụ:
//
//   1. Đọc file dist/index.html (bản SPA gốc vừa build ra)
//   2. Lấy dữ liệu thật từ Firestore (sản phẩm, bài viết, trang giới thiệu)
//      bằng quyền Admin (firebase-admin), KHÔNG qua trình duyệt
//   3. Với mỗi trang quan trọng (/, /about, /products, /product/:id,
//      /tin-tuc, /post/:id) -> tạo ra 1 bản HTML tĩnh riêng, có sẵn
//      <title>, <meta description>, Open Graph, canonical... ĐÚNG nội dung
//      -> ghi ra thư mục dist/ tương ứng
//
// Nhờ vậy khi Googlebot (hoặc người dùng) request các URL này, Vercel trả
// về ngay bản HTML đã có đủ SEO, không cần đợi JavaScript chạy xong rồi
// gọi Firestore mới có -> vừa nhanh hơn, vừa Google đọc đúng ngay từ đầu.
// =========================================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

// ⚡ UPDATE MỚI: In ra 1 dòng CHẮC CHẮN hiển thị được (không dấu, không emoji)
// NGAY DÒNG ĐẦU TIÊN của toàn bộ script, để xác nhận Node có thực sự chạy
// được file này hay không, trước khi làm bất kỳ việc gì khác (kể cả đọc key).
console.log('[prerender] Script started.')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const SITE_DOMAIN = 'https://www.vattuvocuc.com.vn' // ⚡ Đồng bộ với SITE_DOMAIN trong AdminView.vue / ProductDetail.vue

// -------------------------------------------------------------------------
// 1. KHỞI TẠO KẾT NỐI FIREBASE ADMIN
// -------------------------------------------------------------------------
// Ưu tiên đọc key từ biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY (dùng khi
// build trên Vercel). Nếu không có, thử đọc file serviceAccountKey.json ở
// thư mục gốc dự án (dùng khi build thử ở máy cá nhân).
function loadServiceAccount() {
  console.log('[prerender] Dang tim Service Account Key...')
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('[prerender] Tim thay bien moi truong FIREBASE_SERVICE_ACCOUNT_KEY.')
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  }
  const localKeyPath = path.resolve(__dirname, '../serviceAccountKey.json')
  console.log('[prerender] Khong co bien moi truong, thu tim file tai:', localKeyPath)
  if (fs.existsSync(localKeyPath)) {
    console.log('[prerender] Tim thay file serviceAccountKey.json.')
    return JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'))
  }
  throw new Error(
    'Khong tim thay Firebase Service Account Key. Hay set bien moi truong ' +
    'FIREBASE_SERVICE_ACCOUNT_KEY (tren Vercel) hoac tao file serviceAccountKey.json ' +
    'o thu muc goc du an (chi dung de test o may ca nhan, KHONG duoc commit len Git).'
  )
}

// ⚡ UPDATE MỚI: Chuyển việc khởi tạo Firebase Admin vào BÊN TRONG hàm main()
// (thay vì chạy ở cấp top-level của file như bản trước). Lý do: nếu bước này
// lỗi mà nằm NGOÀI main(), lỗi sẽ KHÔNG bị "main().catch(...)" ở cuối file
// bắt được -> có thể khiến terminal không hiển thị được gì rõ ràng trên 1 số
// máy Windows. Đưa vào trong main() đảm bảo MỌI lỗi đều được bắt và in ra.
let db = null
function initFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount())
  })
  db = admin.firestore()
  console.log('[prerender] Ket noi Firebase Admin thanh cong.')
}

// -------------------------------------------------------------------------
// 2. HÀM TIỆN ÍCH: Escape ký tự đặc biệt để nhét an toàn vào thuộc tính HTML
// -------------------------------------------------------------------------
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Bóc chữ thô từ nội dung HTML (dùng cho mô tả nếu trang chưa có sẵn seo_description)
const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

// -------------------------------------------------------------------------
// 3. HÀM CHÍNH: Chèn thẻ SEO + nội dung tĩnh vào bản index.html gốc
// -------------------------------------------------------------------------
function renderPage(templateHtml, { title, description, keywords, ogImage, canonicalPath, bodyHtml }) {
  let html = templateHtml

  // Xóa các thẻ SEO cũ (được set tĩnh trong index.html gốc) để thay bằng bản đúng cho từng trang
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  html = html.replace(/<meta name="description"[^>]*>\s*/gi, '')
  html = html.replace(/<meta name="keywords"[^>]*>\s*/gi, '')
  html = html.replace(/<meta property="og:[^"]*"[^>]*>\s*/gi, '')
  html = html.replace(/<link rel="canonical"[^>]*>\s*/gi, '')

  const canonicalUrl = `${SITE_DOMAIN}${canonicalPath}`
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)

  const seoBlock = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
    <meta property="og:url" content="${canonicalUrl}" />
    <link rel="canonical" href="${canonicalUrl}" />
  </head>`

  html = html.replace('</head>', seoBlock)

  // Nhét thêm 1 khối nội dung tĩnh đơn giản vào #app để Google/mạng xã hội
  // đọc được nội dung ngay cả khi chưa chạy JS. Vue sẽ TỰ ĐỘNG THAY THẾ
  // toàn bộ nội dung này bằng giao diện thật ngay khi JS load xong (an
  // toàn 100%, không lỗi, không xung đột — vì app KHÔNG dùng hydration SSR,
  // chỉ là mount CSR bình thường sẽ ghi đè innerHTML của #app).
  if (bodyHtml) {
    html = html.replace('<div id="app"></div>', `<div id="app">${bodyHtml}</div>`)
  }

  return html
}

// -------------------------------------------------------------------------
// 4. GHI FILE HTML TĨNH RA ĐÚNG VỊ TRÍ TRONG dist/
// -------------------------------------------------------------------------
function writeStaticFile(relativePath, html) {
  const fullPath = path.join(DIST_DIR, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, html, 'utf-8')
  console.log(`  ✓ ${relativePath}`)
}

// -------------------------------------------------------------------------
// 5. HÀM MAIN: Chạy tuần tự từng loại trang
// -------------------------------------------------------------------------
async function main() {
  console.log('[prerender] main() started.')
  // ⚡ UPDATE MỚI: Gọi khởi tạo Firebase ở ĐÂY (bên trong main, được catch() bảo vệ)
  initFirebase()

  console.log('🚀 Bắt đầu Prerender SEO cho các trang tĩnh...\n')

  const indexHtmlPath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('❌ Không tìm thấy dist/index.html — hãy chạy "vite build" trước khi chạy script này.')
  }
  const template = fs.readFileSync(indexHtmlPath, 'utf-8')

  // ---- 5.1. TRANG GIỚI THIỆU (/about) ----
  console.log('📄 Đang tạo trang /about ...')
  const aboutSnap = await db.collection('settings').doc('about').get()
  if (aboutSnap.exists) {
    const about = aboutSnap.data()
    const html = renderPage(template, {
      title: about.metaTitle || about.title || 'Giới thiệu - Cửa Hàng Vật Tư Vô Cực',
      description: about.metaDescription || 'Nhà cung cấp giải pháp toàn diện dụng cụ cắt gọt, thiết bị cơ khí chính xác.',
      keywords: about.seoKeywords || '',
      ogImage: about.imageUrl || '',
      canonicalPath: '/about',
      bodyHtml: `<h1>${escapeHtml(about.title || '')}</h1><p>${escapeHtml(stripHtml(about.content || '').slice(0, 300))}</p>`
    })
    writeStaticFile('about.html', html)
  } else {
    console.log('  ⚠️ Chưa có dữ liệu settings/about, bỏ qua.')
  }

  // ---- 5.2. DANH SÁCH SẢN PHẨM (/products) + TỪNG SẢN PHẨM (/product/:id) ----
  console.log('\n📦 Đang tạo trang /products và từng /product/:id ...')
  const productsSnap = await db.collection('products').get()
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Trang danh sách chung
  const productsListHtml = renderPage(template, {
    title: 'Tất Cả Sản Phẩm - Cửa Hàng Vật Tư Vô Cực',
    description: 'Danh sách đầy đủ mảnh phay, dao tiện, dụng cụ cắt gọt CNC và thiết bị cơ khí chính xác đang có tại Vật Tư Vô Cực.',
    keywords: '',
    ogImage: '',
    canonicalPath: '/products',
    bodyHtml: `<h1>Tất cả sản phẩm</h1><ul>${products
      .map(p => `<li><a href="/product/${escapeHtml(p.slug || p.id)}">${escapeHtml(p.name_vi || p.name || '')}</a></li>`)
      .join('')}</ul>`
  })
  writeStaticFile('products.html', productsListHtml)

  // Từng trang chi tiết sản phẩm
  let productCount = 0
  for (const p of products) {
    // ⚡ Ưu tiên slug (đúng logic đã làm ở ProductDetail.vue), nếu chưa có slug thì dùng ID Firestore
    const urlSegment = p.slug || p.id
    const productName = p.name_vi || p.name || 'Sản phẩm'
    const description = p.seo_description_vi || stripHtml(p.description_vi || '').slice(0, 160) || `${productName} chính hãng, giá tốt tại Vật Tư Vô Cực.`
    const price = Number(p.price_piece) || Number(p.price) || 0

    const html = renderPage(template, {
      title: p.seo_title_vi || productName,
      description,
      keywords: p.seo_keywords_vi || '',
      ogImage: p.image || '',
      canonicalPath: `/product/${urlSegment}`,
      bodyHtml: `
        <h1>${escapeHtml(productName)}</h1>
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(productName)}" />` : ''}
        <p>${escapeHtml(description)}</p>
        ${price > 0 ? `<p>Giá: ${price.toLocaleString('vi-VN')}đ</p>` : ''}
      `
    })
    writeStaticFile(`product/${urlSegment}.html`, html)
    productCount++
  }
  console.log(`  → Đã tạo ${productCount} trang chi tiết sản phẩm.`)

  // ---- 5.3. DANH SÁCH BÀI VIẾT (/tin-tuc) + TỪNG BÀI (/post/:id) ----
  console.log('\n📰 Đang tạo trang /tin-tuc và từng /post/:id ...')
  const postsSnap = await db.collection('posts').get()
  const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const postsListHtml = renderPage(template, {
    title: 'Tin Tức & Kiến Thức Kỹ Thuật - Cửa Hàng Vật Tư Vô Cực',
    description: 'Cập nhật tin tức, kiến thức kỹ thuật gia công CNC, dụng cụ cắt gọt từ Vật Tư Vô Cực.',
    keywords: '',
    ogImage: '',
    canonicalPath: '/tin-tuc',
    bodyHtml: `<h1>Tin tức & Kiến thức kỹ thuật</h1><ul>${posts
      .map(p => `<li><a href="/post/${escapeHtml(p.id)}">${escapeHtml(p.title || '')}</a></li>`)
      .join('')}</ul>`
  })
  writeStaticFile('tin-tuc.html', postsListHtml)

  // Từng trang chi tiết bài viết
  // ⚡ Lưu ý: doc ID của collection "posts" CHÍNH LÀ slug (xem AdminPostsView.vue:
  // setDoc(doc(db, "posts", currentSlug), postData)) -> khớp đúng route /post/:id
  let postCount = 0
  for (const p of posts) {
    const postTitle = p.title || 'Bài viết'
    const description = p.metaDescription || stripHtml(p.content || '').slice(0, 160) || postTitle

    const html = renderPage(template, {
      title: p.seoTitle || postTitle,
      description,
      keywords: p.metaKeywords || '',
      ogImage: p.image || '',
      canonicalPath: `/post/${p.id}`,
      bodyHtml: `
        <h1>${escapeHtml(postTitle)}</h1>
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt || postTitle)}" />` : ''}
        <p>${escapeHtml(description)}</p>
      `
    })
    writeStaticFile(`post/${p.id}.html`, html)
    postCount++
  }
  console.log(`  → Đã tạo ${postCount} trang chi tiết bài viết.`)

  console.log('\n✅ Prerender hoàn tất!')
}

main().catch(err => {
  // ⚡ UPDATE MỚI: In lỗi ra bằng cả console.error VÀ ghi thô ra process.stderr
  // (không qua console formatting) để đảm bảo hiển thị được trên mọi terminal,
  // kể cả khi có vấn đề encoding ký tự đặc biệt/emoji trên Windows.
  process.stderr.write('\n[prerender] FAILED. Error detail below:\n')
  process.stderr.write(String(err && err.stack ? err.stack : err) + '\n')
  console.error('\n❌ Prerender THẤT BẠI:', err)
  // Thoát với mã lỗi khác 0 để Vercel biết build có vấn đề (không âm thầm bỏ qua)
  process.exit(1)
})