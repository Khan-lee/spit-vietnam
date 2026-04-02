<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { 
  collection, 
  setDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'

// Trạng thái Form
const newPost = ref({
  title: '',
  category: 'Tin tức',
  image: '',
  content: ''
})

const posts = ref([])
const isSubmitting = ref(false)

// --- CHIÊU SEO: HÀM TẠO SLUG TỰ ĐỘNG ---
const generateSlug = (title) => {
  return title.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
    .replace(/[^\w ]+/g, '')        // Xóa ký tự đặc biệt
    .replace(/ +/g, '-')           // Thay khoảng trắng bằng gạch ngang
    .trim();
}

// Hàm tải danh sách bài viết để hiển thị bên phải
const fetchPosts = async () => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
  const querySnapshot = await getDocs(q)
  posts.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// --- HÀM LƯU BÀI VIẾT SẠCH ---
const handleAddPost = async () => {
  if (!newPost.value.title || !newPost.value.content) {
    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
    return
  }

  isSubmitting.value = true
  try {
    // 1. Tạo slug từ tiêu đề để làm ID và URL
    const slug = generateSlug(newPost.value.title)
    
    // 2. Chuẩn bị dữ liệu sạch
    const postData = {
      title: newPost.value.title,
      slug: slug,
      category: newPost.value.category,
      image: newPost.value.image || 'https://via.placeholder.com/800x450',
      content: newPost.value.content,
      createdAt: serverTimestamp() // Dùng thời gian của server để chính xác SEO
    }

    // 3. Lưu vào Firestore với ID là slug
    // Sử dụng setDoc để ID của Document chính là slug URL
    await setDoc(doc(db, "posts", slug), postData)

    alert("Đăng bài viết thành công!")
    
    // 4. Reset form
    newPost.value = { title: '', category: 'Tin tức', image: '', content: '' }
    fetchPosts()
  } catch (error) {
    console.error("Lỗi khi đăng bài:", error)
    alert("Lỗi: " + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async (id) => {
  if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
    await deleteDoc(doc(db, "posts", id))
    fetchPosts()
  }
}

onMounted(fetchPosts)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <div class="p-8 w-full">
      <h2 class="text-3xl font-black text-slate-900 uppercase italic mb-8">
        Quản lý <span class="text-red-600">Nội dung bài viết</span>
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div class="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">
          <h3 class="text-blue-600 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span> Viết bài mới
          </h3>
          
          <div class="space-y-5">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Tiêu đề bài viết</label>
              <input v-model="newPost.title" type="text" placeholder="Nhập tiêu đề..." 
                class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700" />
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Chuyên mục</label>
              <select v-model="newPost.category" class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700">
                <option>Tin tức</option>
                <option>Kỹ thuật</option>
                <option>Sự kiện</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Link ảnh minh họa</label>
              <input v-model="newPost.image" type="text" placeholder="https://..." 
                class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" />
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Nội dung bài viết</label>
              <textarea v-model="newPost.content" rows="8" placeholder="Nội dung bài viết..." 
                class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"></textarea>
            </div>

            <button @click="handleAddPost" :disabled="isSubmitting"
              class="w-full bg-[#1e293b] hover:bg-red-600 text-white font-black uppercase py-5 rounded-2xl transition-all duration-500 tracking-widest shadow-lg shadow-slate-200">
              {{ isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG BÀI NGAY' }}
            </button>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">
          <h3 class="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-6">Các bài viết gần đây</h3>
          
          <div v-if="posts.length === 0" class="text-center py-20 text-slate-300 italic">
            Chưa có bài viết nào được đăng.
          </div>

          <div class="space-y-4 max-h-150 overflow-y-auto pr-2">
            <div v-for="post in posts" :key="post.id" class="flex items-center gap-4 p-4 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all group">
              <img :src="post.image" class="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div class="flex-1">
                <span class="text-[8px] font-black uppercase px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{{ post.category }}</span>
                <h4 class="font-bold text-slate-800 line-clamp-1 mt-1">{{ post.title }}</h4>
                <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">ID: {{ post.id }}</p>
              </div>
              <button @click="deletePost(post.id)" class="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tùy chỉnh thanh cuộn cho danh sách bài viết */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>