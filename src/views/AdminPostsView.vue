<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { db, storage } from '../firebase' 
import { collection, setDoc, doc, getDocs, query, orderBy, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage' 
import Editor from '@tinymce/tinymce-vue'
import slugify from 'slugify'

// --- TRẠNG THÁI FORM ---
const newPost = ref({
  title: '',
  slug: '',
  category: 'Tin tức',
  image: '', 
  content: '',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: ''
})

const posts = ref([])
const isSubmitting = ref(false)
const imageFile = ref(null) 
const isEditingSlug = ref(false)
const isEditing = ref(false) // Trạng thái: Đang sửa bài hay đăng mới

// --- LOGIC SEO REAL-TIME ---
const seoAnalysis = computed(() => {
  const contentLower = (newPost.value.content || '').toLowerCase()
  const keywordLower = (newPost.value.focusKeyword || '').toLowerCase()
  
  const checks = {
    titleLength: newPost.value.title.length >= 30 && newPost.value.title.length <= 60,
    metaLength: newPost.value.metaDescription.length >= 120 && newPost.value.metaDescription.length <= 160,
    hasKeyword: keywordLower !== '' && contentLower.includes(keywordLower)
  }
  
  let score = 0
  if (checks.titleLength) score += 35
  if (checks.metaLength) score += 35
  if (checks.hasKeyword) score += 30
  
  return { score, checks }
})

const handleTitleInput = () => {
  if (!isEditingSlug.value && !isEditing.value) {
    newPost.value.slug = slugify(newPost.value.title, { lower: true, locale: 'vi' })
  }
}

const editorConfig = {
  height: 400,
  menubar: false,
  plugins: 'lists link image table code wordcount',
  toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat'
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageFile.value = file
    newPost.value.image = URL.createObjectURL(file)
  }
}

const uploadImageToStorage = async () => {
  if (imageFile.value) {
    const fileRef = storageRef(storage, `posts/${Date.now()}_${imageFile.value.name}`)
    await uploadBytes(fileRef, imageFile.value)
    return await getDownloadURL(fileRef)
  }
  return newPost.value.image // Trả về ảnh cũ nếu không thay đổi
}

const fetchPosts = async () => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
  const querySnapshot = await getDocs(q)
  posts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Hàm đổ dữ liệu vào form để chỉnh sửa
const loadPostToEdit = (post) => {
  isEditing.value = true
  newPost.value = { ...post }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Hàm reset form về trạng thái ban đầu
const resetForm = () => {
  newPost.value = { title: '', slug: '', category: 'Tin tức', image: '', content: '', seoTitle: '', metaDescription: '', focusKeyword: '' }
  imageFile.value = null
  isEditingSlug.value = false
  isEditing.value = false
}

const handleSavePost = async () => {
  if (!newPost.value.title || !newPost.value.content) {
    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
    return
  }

  isSubmitting.value = true
  try {
    const finalImageUrl = await uploadImageToStorage()
    const slug = newPost.value.slug || slugify(newPost.value.title, { lower: true, locale: 'vi' })
    
    const postData = {
      ...newPost.value,
      image: finalImageUrl, 
      slug: slug,
      seoScore: seoAnalysis.value.score,
      updatedAt: serverTimestamp()
    }

    if (isEditing.value) {
      // Cập nhật bài viết cũ
      const postRef = doc(db, "posts", slug)
      await updateDoc(postRef, postData)
      alert("Cập nhật bài viết thành công!")
    } else {
      // Đăng bài viết mới
      postData.createdAt = serverTimestamp()
      await setDoc(doc(db, "posts", slug), postData)
      alert("Đăng bài viết mới thành công!")
    }
    
    resetForm()
    fetchPosts()
  } catch (error) {
    console.error("Lỗi:", error)
    alert("Có lỗi xảy ra khi lưu bài viết.")
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async (id) => {
  if (confirm("Xác nhận xóa bài viết này?")) {
    await deleteDoc(doc(db, "posts", id))
    fetchPosts()
  }
}

onMounted(fetchPosts)
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
    <div class="flex justify-between items-center mb-10">
      <div>
        <h2 class="text-3xl font-black text-slate-900 uppercase italic leading-none">
          Quản lý <span class="text-blue-600">Nội dung SEO</span>
        </h2>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Hệ thống biên tập spit.com.vn</p>
      </div>
      <div class="flex gap-3">
        <button v-if="isEditing" @click="resetForm" class="bg-slate-200 hover:bg-slate-300 text-slate-600 font-black uppercase text-[11px] px-6 py-4 rounded-2xl transition-all">
          Hủy sửa
        </button>
        <button @click="handleSavePost" :disabled="isSubmitting"
          class="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
          {{ isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật bài viết' : 'Đăng bài viết') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8 items-start">
      <div class="col-span-12 lg:col-span-8 space-y-8">
        <div class="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div class="mb-8">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-2">Tiêu đề chính</label>
            <input v-model="newPost.title" @input="handleTitleInput" type="text" placeholder="Nhập tiêu đề thu hút..." 
              class="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-200" />
            
            <div class="flex flex-col gap-1 mt-3 ml-2">
              <label class="text-[9px] font-black text-slate-400 uppercase">Đường dẫn URL</label>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-all focus-within:border-blue-200">
                  <span class="text-[10px] text-slate-400 font-medium italic">spit.com.vn/</span>
                  <input 
                    v-model="newPost.slug" 
                    :readonly="!isEditingSlug || isEditing"
                    class="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-blue-600 p-0 min-w-[200px]"
                    :class="{'cursor-not-allowed text-slate-400': !isEditingSlug || isEditing}"
                  />
                </div>
                <button v-if="!isEditing" @click="isEditingSlug = !isEditingSlug" type="button" class="bg-blue-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all active:scale-95">
                  {{ isEditingSlug ? 'Xong' : 'Sửa' }}
                </button>
              </div>
            </div>
          </div>

          <div class="mb-6">
             <label class="text-[10px] font-black uppercase text-slate-400 mb-4 block ml-2">Nội dung bài viết</label>
             <Editor v-model="newPost.content" api-key="k9iop30y1nl0rr9uh9dwjh552dqdmd85w0j3227x1btbcxlg" :init="editorConfig" />
          </div>
        </div>

        <div class="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 class="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
            <span class="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🔍</span> Xem trước trên Google
          </h3>
          <div class="max-w-150 border-l-4 border-blue-500 pl-6 py-2">
            <div class="text-[#1a0dab] text-xl font-medium mb-1 line-clamp-1 hover:underline cursor-pointer">
              {{ newPost.seoTitle || newPost.title || 'Tiêu đề hiển thị trên Google' }}
            </div>
            <div class="text-[#006621] text-sm mb-1">spit.com.vn › blog › {{ newPost.slug || 'duong-dan' }}</div>
            <div class="text-[#4d5156] text-sm leading-relaxed line-clamp-2">
              {{ newPost.metaDescription || 'Mô tả ngắn xuất hiện ở đây để thu hút người dùng nhấp vào bài viết...' }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 space-y-8">
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-50">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-black uppercase tracking-widest italic">Công cụ SEO</h3>
            <div :class="seoAnalysis.score >= 70 ? 'bg-green-500' : 'bg-red-500'" 
              class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg transition-colors">
              <span class="text-[14px] font-black">{{ seoAnalysis.score }}</span>
              <span class="text-[7px] font-bold uppercase">Điểm</span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">SEO Title</label>
              <input v-model="newPost.seoTitle" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Meta Description</label>
              <textarea v-model="newPost.metaDescription" rows="3" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all"></textarea>
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Từ khóa mục tiêu</label>
              <input v-model="newPost.focusKeyword" placeholder="VD: máy mài cnc" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
          </div>

          <ul class="mt-6 space-y-3 pt-6 border-t border-slate-50">
            <li v-for="(val, key) in seoAnalysis.checks" :key="key" class="flex items-center gap-3">
              <span :class="val ? 'bg-green-500' : 'bg-slate-200'" class="w-2 h-2 rounded-full"></span>
              <span class="text-[10px] font-black uppercase tracking-tight" :class="val ? 'text-slate-700' : 'text-slate-300'">
                {{ key === 'titleLength' ? 'Độ dài tiêu đề (30-60)' : key === 'metaLength' ? 'Độ dài Meta (120-160)' : 'Chứa từ khóa chính' }}
              </span>
            </li>
          </ul>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
          <h3 class="text-[10px] font-black uppercase text-slate-400 mb-4 ml-2">Ảnh đại diện</h3>
          <div class="relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-slate-100 hover:border-blue-400 transition-all">
            <input type="file" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
            <div v-if="!newPost.image" class="py-12 flex flex-col items-center justify-center text-slate-400">
               <span class="text-2xl mb-2">📸</span>
               <span class="text-[9px] font-black uppercase italic">Chọn file ảnh</span>
            </div>
            <img v-else :src="newPost.image" class="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
          <h3 class="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Đã đăng gần đây</h3>
          <div class="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="post in posts" :key="post.id" class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
              <img :src="post.image || 'https://via.placeholder.com/80'" class="w-12 h-12 rounded-xl object-cover shadow-sm" />
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-xs truncate">{{ post.title }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-500 rounded">{{ post.category }}</span>
                  <span class="text-[7px] font-bold text-green-500">{{ post.seoScore || 0 }} pts</span>
                </div>
              </div>
              <div class="flex gap-1">
                <button @click="loadPostToEdit(post)" class="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button @click="deletePost(post.id)" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>