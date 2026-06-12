const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const WORD_FILE_NAME = 'IndexableToolsA2.2_High Feed_2024.docx'; 
const INPUT_PATH = path.join(__dirname, 'data-raw', WORD_FILE_NAME);
const OUTPUT_PATH = path.join(__dirname, 'data-raw', 'catalog-clean.json');

// SỬ DỤNG API KEY MỚI CỦA BẠN
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// =========================================================================
// TỐI ƯU LẠI HÀM PHÂN MẢNH: Chặt theo thẻ đóng hàng </tr> của bảng HTML
// =========================================================================
function splitTextIntoChunks(text, maxLength = 15000) {
  // Thay vì split('\n'), ta split theo thẻ đóng hàng của bảng </tr>
  const rows = text.split('</tr>'); 
  const chunks = [];
  let currentChunk = "";

  for (let i = 0; i < rows.length; i++) {
    // Bù lại thẻ </tr> đã bị mất do hàm split
    let rowWithTag = rows[i] + '</tr>'; 
    
    if ((currentChunk + rowWithTag).length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk);
      }
      currentChunk = rowWithTag;
    } else {
      currentChunk += rowWithTag;
    }
  }
  
  if (currentChunk.trim() && currentChunk !== '</tr>') {
    chunks.push(currentChunk);
  }
  return chunks;
}

// Hàm gửi từng đoạn nhỏ sang AI xử lý
async function processChunkWithAI(model, chunkText, index, total) {
  const prompt = `Bạn là một chuyên gia xử lý dữ liệu hệ thống thông tin cơ khí chính xác.
Nhiệm vụ của bạn là đọc đoạn văn bản thô (trích xuất từ catalog sản phẩm mảnh chíp, dao phay cao tốc) dưới đây và cấu trúc hóa các mã sản phẩm tìm thấy thành một mảng JSON (JSON Array).

Mỗi phần tử sản phẩm trong mảng JSON bắt buộc phải tuân theo cấu trúc sau:
{
  "nguon_du_lieu": "IndexableToolsA2.2_HighFeed_2024.docx",
  "danh_muc": "Tên danh mục chung của nhóm sản phẩm (ví dụ: Dao phay cao tốc, Mảnh chip cắt gọt...)",
  "ten_san_pham": "Tên đầy đủ của sản phẩm",
  "ma_san_pham": "Mã sản phẩm chính xác tuyệt đối",
  "nhan_hang": "Thương hiệu sản phẩm",
  "mo_ta_chi_tiet": "Mô tả ngắn gọn về đặc tính hoặc công năng ứng dụng",
  "thong_so_ky_thuat": {
    // Các trường thông số tìm thấy (duong_kinh, kich_thuoc, so_luoi...) dạng key-value
  },
  "dac_tinh_vat_lieu": {
    "vat_lieu_nen": "Vật liệu nền",
    "lop_phu": "Lớp phủ nếu có",
    "do_cung_phoi_phu_hop": "Độ cứng phôi gia công phù hợp"
  },
  "ung_dung_gia_cong": [
    "Danh sách các ứng dụng thực tế"
  ],
  "che_do_cat_khuyen_nghi": {
    // Chế độ cắt khuyên dùng từ hãng nếu có
  }
}

QUY TẮC:
1. Giữ nguyên gốc toàn bộ mã sản phẩm, ký hiệu kỹ thuật. Tuyệt đối không tự bịa thông số.
2. Chỉ trả về một mảng JSON Array duy nhất [ ... ]. Không viết thêm bất kỳ từ ngữ nào ngoài cấu trúc JSON này. Nếu đoạn văn bản không chứa sản phẩm nào, hãy trả về một mảng rỗng [].

ĐOẠN VĂN BẢN TÀI LIỆU SỐ P${index + 1}/${total} CẦN XỬ LÝ:
${chunkText}`;

  try {
    const aiResult = await model.generateContent(prompt);
    let cleanJsonText = aiResult.response.text();
    cleanJsonText = cleanJsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJsonText);
  } catch (e) {
    console.error(`⚠️ Lỗi khi xử lý đoạn ${index + 1}:`, e.message);
    return []; // Trả về mảng rỗng nếu đoạn này bị lỗi để tiếp tục chạy đoạn sau
  }
}

async function runDataStandardization() {
  try {
    console.log("⏳ Bước 1: Đang đọc và trích xuất dữ liệu dạng HTML từ file Word...");
    const result = await mammoth.convertToHtml({ path: INPUT_PATH });
    const rawText = result.value; 
    
    if (!rawText || rawText.trim() === "") {
      throw new Error("File Word trống.");
    }
    
    console.log(`✅ Trích xuất văn bản thành công! Độ dài chuỗi HTML: ${rawText.length} ký tự.`);
    
    // Tiến hành chia nhỏ chuỗi ký tự theo thẻ hàng bảng (Giới hạn khoảng 15,000 ký tự HTML ~ 2,000 - 3,000 tokens)
    const chunks = splitTextIntoChunks(rawText, 15000);
    console.log(`📦 Đã phân mảnh tài liệu thành ${chunks.length} đoạn nhỏ để xử lý cuốn chiếu an toàn...`);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        temperature: 0.1, 
        responseMimeType: "application/json" 
      } 
    });

    let allProducts = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`⏳ [${i + 1}/${chunks.length}] Đang gửi dữ liệu phân mảnh sang Gemini xử lý...`);
      const chunkProducts = await processChunkWithAI(model, chunks[i], i, chunks.length);
      
      if (Array.isArray(chunkProducts)) {
        allProducts = allProducts.concat(chunkProducts);
        console.log(`   👉 Đã bóc tách thêm được ${chunkProducts.length} sản phẩm từ đoạn này.`);
      }

      // TĂNG THỜI GIAN NGHỈ LÊN 5 GIÂY: Để đảm bảo an toàn tuyệt đối, không dính lỗi RPM/TPM của Free Tier
      console.log("⏸️ Nghỉ 5 giây dưỡng sức để né Rate Limit của Google...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allProducts, null, 2), 'utf8');
    
    console.log("\n🎉 XỬ LÝ HOÀN THÀNH RỰC RỠ XUẤT SẮC!");
    console.log(`📂 Tổng số lượng sản phẩm bóc tách thành công: ${allProducts.length}`);
    console.log(`📂 File dữ liệu sạch lưu tại: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error("❌ Gặp lỗi hệ thống:", error.message);
  }
}

runDataStandardization();