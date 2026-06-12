const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Khởi tạo Firebase Admin
initializeApp();
const db = getFirestore();

require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let pipeline;

// =====================================================================
// 1. HÀM DÙNG CHUNG: BĂM VECTOR (ĐÃ FIX LỖI 512/549)
// =====================================================================
async function getEmbedding(text) {
  try {
    if (!pipeline) {
      console.log("⏳ Đang khởi tạo pipeline băm vector...");
      const { pipeline: transformerPipeline } = await import('@xenova/transformers');
      pipeline = await transformerPipeline('feature-extraction', 'Xenova/bert-base-nli-mean-tokens');
    }

    const cleanText = (text || "")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000); 

    if (!cleanText) return null;

    const output = await pipeline(cleanText, { 
        pooling: 'mean', 
        normalize: true,
        truncation: true,
        max_length: 512 
    });
    
    return Array.from(output.data);
  } catch (error) {
    console.error("⚠️ [SPIT_DEBUG] Lỗi tạo embedding:", error.message);
    return null;
  }
}

// =====================================================================
// 2. CHATBOT: HỎI ĐÁP DỰA TRÊN COLLECTION "PRODUCTS" + QUẢN LÝ SESSION
// =====================================================================
exports.askSPITAssistant = onRequest({ cors: true, memory: "2GiB", timeoutSeconds: 120, maxInstances: 10 }, async (req, res) => {
  try {
    // Bổ sung sessionId nhận từ Frontend để quản lý chuỗi hội thoại bền vững
    const { message, query, history, sessionId } = req.body;
    const userMessage = (message || query || "").toString().trim(); 

    console.log(`\n=== [SPIT_DEBUG START] ===`);
    console.log(`[SPIT_DEBUG] Nhận câu hỏi từ khách: "${userMessage}" | SessionId: ${sessionId || "N/A"}`);

    if (!userMessage) {
      return res.status(200).json({ text: "Xin chào! Tôi là Trợ lý kỹ thuật của SPIT. Bạn cần tìm dòng dao cụ, đá mài đáp ứng thông số kỹ thuật nào?" });
    }

    // 2.1. Nạp lịch sử hội thoại (Ưu tiên đọc từ DB bằng sessionId, fallback về history dạng mảng của client nếu có)
    let chatHistory = history || [];
    let sessionRef = null;

    if (sessionId) {
      sessionRef = db.collection("chat_sessions").doc(sessionId);
      const sessionDoc = await sessionRef.get();
      if (sessionDoc.exists) {
        chatHistory = sessionDoc.data().messages || [];
        console.log(`[SPIT_DEBUG] Đã nạp thành công ${chatHistory.length} tin nhắn lịch sử từ Firestore.`);
      } else {
        console.log(`[SPIT_DEBUG] Khởi tạo session mới trên Firestore cho id: ${sessionId}`);
      }
    }

    // 2.2. Tìm kiếm ngữ cảnh sản phẩm bằng Vector Search
    const queryVector = await getEmbedding(userMessage);
    let matchedContext = "";

    if (queryVector && queryVector.length === 768) {
      try {
        const collectionRef = db.collection("products");
        const snapshot = await collectionRef.findNearest({
          vectorField: "embedding",
          queryVector: queryVector,
          distanceMeasure: "COSINE",
          limit: 10
        }).get();

        const matchedDocs = [];
        snapshot.forEach(doc => {
          const docData = doc.data();
          const { embedding, ...cleanData } = docData; 
          matchedDocs.push(cleanData);
        });

        if (matchedDocs.length > 0) {
          matchedContext = matchedDocs.map((prod, index) => {
            const name = prod.name_vi || prod.name || 'Sản phẩm SPIT';
            const brand = prod.brand || 'Chưa rõ';
            const category = prod.category_vi || 'N/A';
            const desc = prod.description_vi || prod.description || 'Không có mô tả';
            const price = prod.price ? `${prod.price.toLocaleString('vi-VN')} VND` : 'Liên hệ';
            const slug = prod.custom_url || (prod.slug ? `https://spit.com.vn/san-pham/${prod.slug}` : 'Liên hệ nhân viên');

            return `[SẢN PHẨM ${index + 1}]:
- Tên: ${name}
- Thương hiệu: ${brand}
- Danh mục: ${category}
- Giá: ${price}
- Mô tả: ${desc}
- Link mua hàng: ${slug}
-----------------------`;
          }).join("\n");
        }
      } catch (firestoreError) {
        console.error("❌ [SPIT_DEBUG ERR] Lỗi tại findNearest Firestore:", firestoreError);
      }
    }

    // 2.3. Cấu hình Prompt hệ thống cho Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const systemPrompt = `Bạn là Chuyên gia tư vấn kỹ thuật cơ khí, dao cụ và đá mài của công ty SPIT. 

DỮ LIỆU SẢN PHẨM TÌM ĐƯỢC TỪ KHO (CỰC KỲ QUAN TRỌNG):
${matchedContext || "Hiện không tìm thấy sản phẩm cụ thể khớp với từ khóa trong kho."}

NHIỆM VỤ CỦA BẠN:
1. Đóng vai trò chuyên gia: Luôn trả lời các câu hỏi kỹ thuật một cách sâu sắc, tự nhiên, và cung cấp giải pháp thực tế. Không bao giờ nói "Tôi chỉ là AI" hay "Tôi không có quyền truy cập".
2. Khéo léo bán hàng: NẾU người dùng hỏi về sản phẩm cụ thể, hỏi mua, hỏi giá HOẶC nếu Dữ liệu Sản Phẩm phía trên CÓ CHỨA thông tin giải quyết được vấn đề của khách -> Bạn BẮT BUỘC phải tư vấn kèm theo Tên sản phẩm, Giá cả và Link mua hàng chính xác từ trường "Link mua hàng" của dữ liệu được cung cấp (hiển thị đầy đủ link dưới dạng clickable markdown nếu có).
3. Linh hoạt: Nếu kho không có sản phẩm khớp, hãy cứ tư vấn kỹ thuật bằng kiến thức chuyên gia của bạn một cách bình thường nhất. Đừng xin lỗi vì không có hàng.`;

    // 2.4. Khớp lịch sử hội thoại chuẩn cấu trúc Gemini
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: (msg.content || msg.text || "").trim() }]
    })).filter(m => m.parts[0].text);
    
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    console.log(`[SPIT_DEBUG] Đang gọi API Gemini...`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3 }
      })
    });

    const data = await response.json();
    console.log(`[SPIT_DEBUG END] Phản hồi từ Gemini nhận được.`);

    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const botResponse = data.candidates[0].content.parts[0].text;

      // 2.5. LƯU LẠI TIN NHẮN VÀO FIRESTORE (Nếu có sessionId)
      if (sessionId && sessionRef) {
        await sessionRef.set({
          messages: FieldValue.arrayUnion(
            { role: "user", text: userMessage },
            { role: "model", text: botResponse }
          ),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[SPIT_DEBUG] Đã cập nhật cặp tin nhắn mới vào Session DB.`);
      }

      return res.status(200).json({ text: botResponse });
    } else {
      console.error("❌ [SPIT_DEBUG ERR] Cấu trúc phản hồi Gemini không hợp lệ:", JSON.stringify(data));
      return res.status(200).json({ text: "Tôi đã tìm thấy sản phẩm phù hợp nhưng bộ lọc hệ thống đang bận. Bạn vui lòng thử lại câu hỏi nhé!" });
    }

  } catch (error) {
    console.error("❌ [SPIT_DEBUG ERR] Lỗi Server Tổng:", error);
    return res.status(200).json({ text: "Hệ thống đang bảo trì một chút, bạn vui lòng tải lại trang hoặc thử lại sau vài giây nhé!" });
  }
});

// =====================================================================
// 3. AUTO TRIGGER: TỰ ĐỘNG BĂM VECTOR 
// =====================================================================
exports.syncProductEmbeddings = onDocumentWritten({
    document: "products/{productId}",
    memory: "2GiB", 
    timeoutSeconds: 60
}, async (event) => {
    if (!event.data.after.exists) return null;

    const newData = event.data.after.data();
    const oldData = event.data.before ? event.data.before.data() : null;

    const title = newData.name_vi || newData.name || 'Sản phẩm SPIT';
    const brand = newData.brand || 'SPIT';
    const category = newData.category_vi || 'Danh mục chung';
    const description = newData.description_vi || newData.description || '';
    const customUrl = newData.custom_url || '';

    const text_context = `Tên sản phẩm: ${title}. Thương hiệu: ${brand}. Danh mục: ${category}. Thông số và mô tả: ${description}. Link sản phẩm: ${customUrl}`.trim();
    if (oldData && oldData.text_context === text_context) return null;

    try {
        const queryVector = await getEmbedding(text_context);
        if (queryVector) {
            return event.data.after.ref.update({
                text_context: text_context,
                embedding: FieldValue.vector(queryVector)
            });
        }
    } catch (error) {
        console.error("❌ [SPIT_DEBUG] Lỗi băm vector tự động:", error);
    }
    return null;
});