// src/data/aiProducts.js
export const aiCatalog = [
  {
    id: "spit-em-001",
    ma_san_pham: "SPIT-EM-HRC50-D6",
    loai_san_pham: "Dao phay ngón (End Mill)",
    nhan_hang: "SPIT",
    vat_lieu_phoi: ["Thép carbon", "Thép hợp kim", "Thép công cụ"],
    do_cung_phu_hop: "Tối đa 50 HRC",
    thong_so_ky_thuat: {
      duong_kinh_dao_D: "6mm",
      duong_kinh_can_d: "6mm",
      chieu_dai_luoi_l: "15mm",
      chieu_dai_tong_L: "50mm",
      so_luoi_cat_F: 4,
      lop_phu: "AlTiN (Chịu nhiệt tốt, chuyên trị thép cứng)"
    },
    che_do_cat_khuyen_nghi: {
      toc_do_cat_Vc: "80 - 120 m/min",
      toc_do_vong_quay_N: "4200 - 6300 rpm",
      luong_an_dao_Fz: "0.03 - 0.05 mm/tooth"
    }
  },
  {
    id: "spit-wg-002",
    ma_san_pham: "SPIT-SG-WA60I",
    loai_san_pham: "Đá mài phẳng",
    nhan_hang: "SPIT",
    vat_lieu_phoi: ["Thép sau nhiệt luyện", "Thép cứng HRC45 - HRC60"],
    thong_so_ky_thuat: {
      kich_thuoc: "180x13x31.75mm",
      hat_mai: "WA (Hạt nhôm oxit trắng - chuyên mài thép cứng)",
      do_min_hat: "60",
      do_cung_da: "I (Độ cứng trung bình mềm, thoát phoi nhanh, tránh cháy phôi)"
    }
  }
  // Bạn có thể bổ sung thêm các dòng sản phẩm chiến lược khác vào đây...
]