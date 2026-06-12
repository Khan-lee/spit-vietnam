const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Kết nối Firebase Admin bằng file chìa khóa bảo mật
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();
const INPUT_PATH = path.join(__dirname, 'data-raw', 'catalog-clean.json');

let pipeline;

// Hàm khởi tạo model băm vector ngay tại máy local (768 chiều)
async function initEmbeddingModel() {
  const { pipeline: transformerPipeline } = await import('@xenova/transformers');
  pipeline = await transformerPipeline('feature-extraction', 'Xenova/bert-base-nli-mean-tokens');
}

async function getVectorEmbedding(textToEmbed) {
  try {
    if (!pipeline) await initEmbeddingModel();
    const output = await pipeline(textToEmbed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("⚠️ Lỗi băm vector Local:", error.message);
    return null;
  }
}

// 3. Tiến trình đọc file và đẩy lên Cloud Firestore
async function startUploading() {
  try {
    console.log("⏳ Đang khởi tạo model băm Vector cục bộ...");
    await initEmbeddingModel();
    console.log("✅ Model Local đã sẵn sàng!");

    console.log("⏳ Đang đọc tệp catalog-clean.json...");
    const rawData = fs.readFileSync(INPUT_PATH, 'utf8');
    const products = JSON.parse(rawData);
    
    console.log(`✅ Tìm thấy ${products.length} sản phẩm.`);
    const collectionRef = db.collection('spit_catalog');

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      
      // TỐI ƯU CHÍ MẠNG: Chuyển các object thông số kỹ thuật và chế độ cắt thành chuỗi chữ để băm Vector không bị sót
      const thongSoStr = prod.thong_so_ky_thuat ? Object.entries(prod.thong_so_ky_thuat).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      const cheDoCatStr = prod.che_do_cat_khuyen_nghi ? Object.entries(prod.che_do_cat_khuyen_nghi).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      
      // Ghép toàn bộ vào chuỗi ngữ cảnh đầy đủ 100% dữ liệu
      const textContext = `Mã sản phẩm: ${prod.ma_san_pham}. Tên: ${prod.ten_san_pham}. Danh mục: ${prod.danh_muc}. Thương hiệu: ${prod.nhan_hang}. Mô tả: ${prod.mo_ta_chi_tiet}. Thông số kỹ thuật: ${thongSoStr}. Vật liệu nền: ${prod.dac_tinh_vat_lieu?.vat_lieu_nen || ''}. Lớp phủ: ${prod.dac_tinh_vat_lieu?.lop_phu || ''}. Độ cứng phôi: ${prod.dac_tinh_vat_lieu?.do_cung_phoi_phu_hop || ''}. Ứng dụng: ${Array.isArray(prod.ung_dung_gia_cong) ? prod.ung_dung_gia_cong.join(', ') : ''}. Chế độ cắt: ${cheDoCatStr}`;

      console.log(`⏳ [${i + 1}/${products.length}] Đang xử lý băm Vector toàn diện: ${prod.ma_san_pham}...`);
      
      // ... Toàn bộ logic docId.replace và admin.firestore.FieldValue.vector phía dưới GIỮ NGUYÊN HOÀN TOÀN ...
      
      // TỐI ƯU CHÍ MẠNG: Làm sạch hoàn toàn docId để không bao giờ bị dính lỗi đường dẫn Firestore
      // Thay thế tất cả các ký tự /, \, *, ., [, ], space thành dấu gạch dưới (_)
      const docId = prod.ma_san_pham.replace(/[\/\s\\\.\[\]\*]/g, "_");

      try {
        const vectorValues = await getVectorEmbedding(textContext);

        if (vectorValues && vectorValues.length === 768) {
          const firestoreDoc = {
            ...prod,
            text_context: textContext,
            embedding: admin.firestore.FieldValue.vector(vectorValues), 
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          // Đẩy lên Firestore kèm khối catch lỗi riêng cho từng sản phẩm để nếu lỗi 1 con không bị sập cả cụm
          await collectionRef.doc(docId).set(firestoreDoc);
          console.log(`   👉 Đã đẩy thành công lên Cloud!`);
        } else {
          console.error(`   ❌ Bỏ qua mã ${prod.ma_san_pham} (Không khớp chiều Vector)`);
        }
      } catch (docError) {
        console.error(`   ❌ Lỗi khi xử lý tài liệu ${prod.ma_san_pham}:`, docError.message);
      }
      
      // Nghỉ nhẹ 50ms giữa các sản phẩm để máy không bị quá tải nhiệt
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log("\n🎉 HOÀN THÀNH ĐẨY DỮ LIỆU LÊN FIRESTORE THÀNH CÔNG RỰC RỠ!");
  } catch (error) {
    console.error("❌ Lỗi hệ thống tổng:", error.message);
  }
}

startUploading();