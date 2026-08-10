// src/utils/cloudinary.js

const CLOUD_NAME = 'hwwcmq1i' // Thay bằng Cloud Name của mày
const UPLOAD_PRESET = 'pvcoi7no' // Thay bằng Upload Preset Unsigned của mày

/**
 * Hàm upload 1 file ảnh lên Cloudinary
 * @param {File} file - File ảnh lấy từ input event hoặc drag-drop
 * @returns {Promise<string>} - URL ảnh đã upload
 */
export const uploadToCloudinary = async (file) => {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('Upload ảnh lên Cloudinary thất bại')
    }

    const data = await response.json()
    return data.secure_url // Trả về đường dẫn HTTPS của ảnh
  } catch (error) {
    console.error('❌ Lỗi upload Cloudinary:', error)
    throw error
  }
}