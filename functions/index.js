const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const axios = require("axios");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer-core");

// Khắc phục triệt để lỗi interop giữa CommonJS và ESM của gói @sparticuz/chromium
const chromiumModule = require("@sparticuz/chromium");
const chromium = chromiumModule.default || chromiumModule;

initializeApp();

// Cấu hình Email gửi đi của công ty SPIT
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: "adminspit@gmail.com",
        pass: "zqlg ecfq nnnj khmg"
    }
});

// Cấu hình hàm chạy với 2GB RAM để gánh được Puppeteer render PDF
exports.syncOrderToLark = onDocumentCreated({
    document: "orders/{orderId}",
    memory: "2GiB"
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const orderData = snapshot.data();
    const orderId = event.params.orderId;
    
    // Config Lark
    const APP_ID = 'cli_aaadcb1242b8de15';
    const APP_SECRET = '8Q8x69CNvdvPusNRfHiB5fhGpkjfDIpl'; 
    const APP_TOKEN = 'SqIMbhBRcayfowsxOZ1jGddppKe';
    const TABLE_ID = 'tbl9MnuanDRg5mU3';

    // --- LUỒNG 1: ĐỒNG BỘ SANG LARK BASE ---
    try {
        const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: APP_ID,
            app_secret: APP_SECRET
        });
        const token = authRes.data.tenant_access_token;

        let orderItemsStr = "";
        if (orderData.items && Array.isArray(orderData.items)) {
            orderItemsStr = orderData.items.map(item => `- ${item.quantity || 1} x ${item.name || 'Sản phẩm'}`).join('\n');
        }

        let rawPrice = orderData.totalPrice;
        let finalPrice = 0;
        if (rawPrice !== undefined && rawPrice !== null) {
            if (typeof rawPrice === 'string') rawPrice = rawPrice.replace(/\D/g, '');
            finalPrice = parseInt(rawPrice, 10);
        }

        const payloadFields = {};
        payloadFields["Khách hàng"] = orderData.customerName || "Ẩn danh";
        if (orderData.phone) payloadFields["Số điện thoại"] = String(orderData.phone);
        if (orderData.contractEmail) payloadFields["Email"] = String(orderData.contractEmail);
        if (orderData.companyName) payloadFields["Tên công ty"] = String(orderData.companyName);
        if (orderData.taxCode) payloadFields["Mã số thuế"] = String(orderData.taxCode);
        if (orderItemsStr) payloadFields["Chi tiết sản phẩm"] = orderItemsStr;
        if (!isNaN(finalPrice)) payloadFields["Tổng tiền"] = finalPrice;

        if (token) {
            await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?field_key_type=name`, 
            { fields: payloadFields },
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
            console.log(`✅ Luồng 1: Đã đồng bộ đơn ${orderId} lên Lark.`);
        }
    } catch (larkError) {
        console.error("🚨 Lỗi đồng bộ Lark:", larkError.message);
    }

    // --- LUỒNG 2: TỰ ĐỘNG XUẤT BÁO GIÁ PDF & GỬI EMAIL ---
    if (orderData.requestQuote === true) {
        console.log(`🚀 Luồng 2: Phát hiện yêu cầu báo giá cho đơn ${orderId}. Tiến hành xử lý...`);
        
        const targetEmail = orderData.contractEmail;
        if (!targetEmail) {
            console.error("❌ Không tìm thấy email khách hàng (`contractEmail`) để gửi báo giá.");
            return;
        }

        try {
            // 1. Tạo giao diện HTML cho Template Báo Giá
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 30px; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0056b3; padding-bottom: 15px; margin-bottom: 20px; }
                    .company-info h2 { color: #0056b3; margin: 0; font-size: 22px; }
                    .company-info p { margin: 3px 0; font-size: 12px; }
                    .quote-title { text-align: center; margin: 20px 0; }
                    .quote-title h1 { margin: 0; color: #111; font-size: 26px; letter-spacing: 1px; }
                    .quote-title p { margin: 5px 0; color: #666; font-size: 13px; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
                    .info-box { width: 48%; }
                    .info-box h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 8px; color: #555; font-size: 14px; }
                    .info-box p { margin: 4px 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                    th { background-color: #0056b3; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #eee; }
                    .text-right { text-align: right; }
                    .total-section { float: right; width: 40%; font-size: 14px; margin-bottom: 4px; }
                    .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
                    .grand-total { font-weight: bold; color: #d9534f; border-top: 1px solid #333; padding-top: 8px; font-size: 16px; }
                    .footer-signature { margin-top: 150px; display: flex; justify-content: flex-end; position: relative; }
                    .signature-box { text-align: center; width: 250px; font-size: 13px; position: relative; }
                    .stamp-img { position: absolute; top: -60px; left: 40px; width: 140px; opacity: 0.85; pointer-events: none; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h2>CÔNG TY TNHH DỤNG CỤ CÔNG NGHIỆP CHÍNH XÁC SÀI GÒN (SPIT)</h2>
                        <p>Địa chỉ: 361 Lê Trọng Tấn, Phường Tân Sơn Nhì, TP Hồ Chí Minh</p>
                        <p>Hotline: 0906 826 959 | Email: info@spit.com.vn | Website: spit.com.vn</p>
                    </div>
                </div>

                <div class="quote-title">
                    <h1>BẢNG BÁO GIÁ THƯƠNG MẠI</h1>
                    <p>Số: BG-${orderId.substring(0, 8).toUpperCase()} | Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
                </div>

                <div class="info-section">
                    <div class="info-box">
                        <h3>ĐƠN VỊ BÁO GIÁ</h3>
                        <p><strong>CÔNG TY TNHH DỤNG CỤ CÔNG NGHIỆP CHÍNH XÁC SÀI GÒN (SPIT) VIỆT NAM</strong></p>
                        <p>Người lập: Phòng Kinh Doanh</p>
                        <p>Email: adminspit@gmail.com</p>
                    </div>
                    <div class="info-box">
                        <h3>KHÁCH HÀNG NHẬN TIN</h3>
                        <p><strong>Khách hàng:</strong> ${orderData.customerName || "Quý khách hàng"}</p>
                        <p><strong>Công ty:</strong> ${orderData.companyName || "N/A"}</p>
                        <p><strong>Mã số thuế:</strong> ${orderData.taxCode || "N/A"}</p>
                        <p><strong>Số điện thoại:</strong> ${orderData.phone || "N/A"}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">STT</th>
                            <th style="width: 50%;">Tên Sản Phẩm / Quy Cách B2B</th>
                            <th style="width: 10%; text-align: center;">SL</th>
                            <th style="width: 15%; text-align: right;">Đơn Giá (đ)</th>
                            <th style="width: 20%; text-align: right;">Thành Tiền (đ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(orderData.items || []).map((item, index) => {
                            const price = parseInt(item.price, 10) || 0;
                            const qty = parseInt(item.quantity, 10) || 1;
                            return `
                            <tr>
                                <td>${index + 1}</td>
                                <td><strong>${item.name || 'Sản phẩm công nghiệp'}</strong></td>
                                <td style="text-align: center;">${qty}</td>
                                <td class="text-right">${price.toLocaleString('vi-VN')}</td>
                                <td class="text-right">${(price * qty).toLocaleString('vi-VN')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Giá trị hàng hóa:</span>
                        <span>${(parseInt(orderData.subtotal, 10) || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div class="total-row">
                        <span>Phí vận chuyển:</span>
                        <span>${(parseInt(orderData.shippingFee, 10) || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>TỔNG TIỀN (VAT):</span>
                        <span>${(parseInt(orderData.totalPrice, 10) || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>

                <div style="clear: both;"></div>

                <div class="footer-signature">
                    <div class="signature-box">
                        <p><strong>ĐẠI DIỆN KINH DOANH SPIT</strong></p>
                        <p style="margin-top: 60px; color: #666;">(Đã ký điện tử)</p>
                        <img class="stamp-img" src="https://fact-link.com.vn/home/saigon-tools/00051942-00005313-P.jpg?v=1779570945" alt="Mộc đỏ SPIT" />
                    </div>
                </div>
            </body>
            </html>`;

            // 2. Kích hoạt Puppeteer headless render PDF với cơ chế check type an toàn
            console.log("⏳ Thần cơ Puppeteer đang sinh file PDF...");
            
            // Xử lý động cho executablePath tùy thuộc vào phiên bản cài đặt (hàm hay getter)
            const chosenExecutablePath = typeof chromium.executablePath === "function" 
                ? await chromium.executablePath() 
                : await chromium.executablePath;

            const browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: chosenExecutablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
            
            // CHỖ SỬA QUAN TRỌNG: Đổi từ browser.page() thành browser.newPage() đúng chuẩn thư viện
            const page = await browser.newPage(); 
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
                printBackground: true
            });
            await browser.close();
            console.log("🚀 Xuất file PDF thành công.");

            // 3. Đính kèm file PDF và gửi Mail đi
            const mailOptions = {
                from: '"SPIT Vietnam Sales" <adminspit@gmail.com>',
                to: targetEmail,
                subject: `[SPIT VIET-NAM] Báo giá đơn hàng thương mại #${orderId.substring(0, 8).toUpperCase()}`,
                html: `
                    <p>Kính gửi quý khách hàng <strong>${orderData.customerName || ""}</strong>,</p>
                    <p>Lời đầu tiên, Sài Gòn Precision Industrial Tool Co. (SPIT) xin chân thành cảm ơn quý công ty đã quan tâm đến hệ thống sản phẩm thiết bị công nghiệp phụ trợ chính xác của chúng tôi.</p>
                    <p>Hệ thống tự động đã ghi nhận yêu cầu lập báo giá từ tài khoản của quý khách cho đơn hàng mã <strong>#${orderId}</strong>.</p>
                    <p>Chi tiết bảng báo giá thương mại chính thức (có đóng dấu mộc công ty) đã được đính kèm dưới dạng file <strong>PDF</strong> trong email này. Quý khách vui lòng tải về để kiểm tra quy cách kỹ thuật và làm thủ tục duyệt mua hàng.</p>
                    <br/>
                    <p>Trân trọng cảm ơn,</p>
                    <p>--------------------------------------------------</p>
                    <p><strong>Phòng Kinh Doanh Công Nghiệp B2B</strong></p>
                    <p>Sài Gòn Precision Industrial Tool Co. (SPIT)</p>
                    <p>Website: <a href="https://spit.com.vn">spit.com.vn</a></p>
                `,
                attachments: [
                    {
                        filename: `Bao_Gia_SPIT_${orderId.substring(0, 8).toUpperCase()}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Luồng 2: Đã gửi email kèm báo giá PDF đến địa chỉ: ${targetEmail} thành công mỹ mãn!`);

        } catch (pdfEmailError) {
            console.error("🚨 Gặp lỗi nghiêm trọng ở Luồng 2 (PDF/Email):", pdfEmailError.message);
        }
    }
});