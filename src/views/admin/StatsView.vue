<template>
  <div class="p-4 md:p-8 bg-slate-50 min-h-screen">
    <!-- HEADER & ACTION BAR -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          📊 Thống kê & Phân tích Truy cập
        </h1>
        <p class="text-xs font-semibold text-slate-400 mt-1">
          Báo cáo chi tiết lượng khách hàng ghé thăm website theo Ngày, Tuần & Tháng
        </p>
      </div>

      <!-- THANH CÔNG CỤ (TẢI LẠI & XUẤT EXCEL) -->
      <div class="flex items-center gap-3">
        <button
          @click="fetchAnalyticsData"
          class="px-4 py-2 bg-white text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95"
        >
          🔄 Làm mới
        </button>
        <button
          @click="exportToCSV"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95"
        >
          📥 Xuất file CSV (Excel)
        </button>
      </div>
    </div>

    <!-- TỔNG QUAN TÓM TẮT THỐNG KÊ (6 METRICS CARDS) -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <!-- 1. HÔM NAY -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div class="absolute -right-2 -bottom-2 opacity-5 text-4xl font-black">TODAY</div>
        <span class="text-[10px] font-black uppercase text-slate-400">Hôm nay</span>
        <div class="text-2xl font-black text-indigo-600 mt-1">
          {{ todayVisits.toLocaleString('vi-VN') }}
          <span class="text-xs text-slate-400 font-normal">lượt</span>
        </div>
      </div>

      <!-- 2. TỔNG THEO TUẦN (7 NGÀY) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-[10px] font-black uppercase text-slate-400">Tổng 7 ngày (Tuần)</span>
        <div class="text-2xl font-black text-blue-600 mt-1">
          {{ weekVisits.toLocaleString('vi-VN') }}
          <span class="text-xs text-slate-400 font-normal">lượt</span>
        </div>
      </div>

      <!-- 3. TỔNG THEO THÁNG (30 NGÀY) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-[10px] font-black uppercase text-slate-400">Tổng 30 ngày (Tháng)</span>
        <div class="text-2xl font-black text-sky-600 mt-1">
          {{ monthVisits.toLocaleString('vi-VN') }}
          <span class="text-xs text-slate-400 font-normal">lượt</span>
        </div>
      </div>

      <!-- 4. TRUNG BÌNH/NGÀY (THEO BỘ LỌC) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-[10px] font-black uppercase text-slate-400">Trung bình / Ngày</span>
        <div class="text-2xl font-black text-emerald-600 mt-1">
          {{ avgVisits.toLocaleString('vi-VN') }}
          <span class="text-xs text-slate-400 font-normal">lượt</span>
        </div>
      </div>

      <!-- 5. NGÀY CAO NHẤT -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-[10px] font-black uppercase text-slate-400">Đỉnh điểm (Max)</span>
        <div class="text-2xl font-black text-purple-600 mt-1">
          {{ maxVisits.toLocaleString('vi-VN') }}
          <span class="text-xs text-slate-400 font-normal">lượt</span>
        </div>
        <p class="text-[10px] text-slate-400 font-semibold mt-0.5" v-if="maxVisitsDate">({{ maxVisitsDate }})</p>
      </div>

      <!-- 6. TỶ LỆ TĂNG TRƯỞNG SO VỚI KỲ TRƯỚC -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-[10px] font-black uppercase text-slate-400">So với kỳ trước</span>
        <div class="flex items-center gap-1 mt-1">
          <span
            :class="[
              'text-xl font-black',
              growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
            ]"
          >
            {{ growthRate >= 0 ? '+' : '' }}{{ growthRate }}%
          </span>
          <span class="text-xs" v-if="growthRate >= 0">📈</span>
          <span class="text-xs" v-else>📉</span>
        </div>
      </div>
    </div>

    <!-- BỘ LỌC & BIỂU ĐỒ TRUY CẬP -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-sm font-black text-slate-700 uppercase tracking-wide">
            Biểu đồ truy cập {{ filterType === 'week' ? '7 ngày gần nhất' : filterType === 'month' ? '30 ngày gần nhất' : '90 ngày gần nhất' }}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Tổng lượt trong khoảng thời gian đã chọn: <b class="text-slate-700">{{ totalVisitsInFilter.toLocaleString('vi-VN') }} lượt</b></p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- CHỌN LOẠI BIỂU ĐỒ (ĐƯỜNG / CỘT) -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              @click="toggleChartType('line')"
              :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500']"
            >
              📈 Đường
            </button>
            <button
              type="button"
              @click="toggleChartType('bar')"
              :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500']"
            >
              📊 Cột
            </button>
          </div>

          <!-- CHỌN KHOẢNG THỜI GIAN -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              @click="changeFilter('week')"
              :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', filterType === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              7 ngày (Tuần)
            </button>
            <button
              type="button"
              @click="changeFilter('month')"
              :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', filterType === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              30 ngày (Tháng)
            </button>
            <button
              type="button"
              @click="changeFilter('quarter')"
              :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', filterType === 'quarter' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              90 ngày (Quý)
            </button>
          </div>
        </div>
      </div>

      <!-- CANVAS BIỂU ĐỒ -->
      <div class="relative w-full h-80 md:h-96">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- BẢNG CHI TIẾT SỐ LIỆU THEO NGÀY -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">Chi tiết lượt truy cập theo từng ngày</h3>
        <span class="text-xs text-slate-400 font-semibold">{{ rawData.length }} ngày ghi nhận</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th class="py-3 px-5">Ngày</th>
              <th class="py-3 px-5">Lượt truy cập</th>
              <th class="py-3 px-5">Tỷ lệ trong kỳ</th>
              <th class="py-3 px-5 text-right">Đánh giá</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
            <tr v-for="item in reversedRawData" :key="item.date" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3 px-5 font-bold text-slate-800">{{ item.dateFormatted }}</td>
              <td class="py-3 px-5 font-black text-blue-600">{{ item.count.toLocaleString('vi-VN') }} lượt</td>
              <td class="py-3 px-5">
                <div class="flex items-center gap-2">
                  <div class="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-blue-600 h-full rounded-full transition-all duration-500"
                      :style="{ width: `${totalVisitsInFilter ? ((item.count / totalVisitsInFilter) * 100).toFixed(1) : 0}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400 font-bold">
                    {{ totalVisitsInFilter ? ((item.count / totalVisitsInFilter) * 100).toFixed(1) : 0 }}%
                  </span>
                </div>
              </td>
              <td class="py-3 px-5 text-right">
                <span
                  v-if="item.count === maxVisits && item.count > 0"
                  class="px-2.5 py-1 bg-purple-100 text-purple-700 font-black text-[10px] rounded-full"
                >
                  🔥 Đỉnh điểm
                </span>
                <span
                  v-else-if="item.count >= avgVisits && item.count > 0"
                  class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-full"
                >
                  🟢 Trên trung bình
                </span>
                <span
                  v-else
                  class="px-2.5 py-1 bg-slate-100 text-slate-500 font-semibold text-[10px] rounded-full"
                >
                  ⚪ Bình thường
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { db } from '../../firebase' // ⚡ Đường dẫn tới file firebase.js của dự án
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import Chart from 'chart.js/auto'

// STATE QUẢN LÝ BỘ LỌC VÀ BIỂU ĐỒ
const filterType = ref('week') // 'week' (7 ngày), 'month' (30 ngày), 'quarter' (90 ngày)
const chartType = ref('line')  // 'line' (đường) hoặc 'bar' (cột)
const chartCanvas = ref(null)
let chartInstance = null

const rawData = ref([])            // Dữ liệu trong kỳ chọn
const previousPeriodTotal = ref(0) // Dữ liệu kỳ trước (để tính % tăng trưởng)
const todayVisits = ref(0)         // Lượt truy cập hôm nay
const weekVisits = ref(0)          // Tổng lượt truy cập 7 ngày
const monthVisits = ref(0)         // Tổng lượt truy cập 30 ngày

// Định dạng YYYY-MM-DD
const formatDate = (dateObj) => {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Định dạng DD/MM/YYYY cho bảng
const formatDateVN = (dateStr) => {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// LẤY DỮ LIỆU TỪ FIREBASE (GỒM CẢ KỲ HIỆN TẠI VÀ KỲ TRƯỚC ĐỂ SO SÁNH)
const fetchAnalyticsData = async () => {
  const daysToFetch = filterType.value === 'week' ? 7 : filterType.value === 'month' ? 30 : 90

  const today = new Date()
  const endDate = new Date(today)
  
  // Ngày bắt đầu của kỳ hiện tại
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (daysToFetch - 1))

  // Ngày bắt đầu của kỳ TRƯỚC ĐÓ (để so sánh tăng trưởng)
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(startDate.getDate() - daysToFetch)
  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(startDate.getDate() - 1)

  const startStr = formatDate(startDate)
  const endStr = formatDate(endDate)
  const prevStartStr = formatDate(prevStartDate)
  const prevEndStr = formatDate(prevEndDate)

  try {
    // Query lấy dữ liệu bao gồm cả kỳ trước và kỳ hiện tại
    const q = query(
      collection(db, 'daily_visits'),
      where('date', '>=', prevStartStr),
      where('date', '<=', endStr),
      orderBy('date', 'asc')
    )
    const snap = await getDocs(q)
    const dbMap = {}
    snap.docs.forEach(doc => {
      dbMap[doc.id] = doc.data().count || 0
    })

    // 1. Tính số liệu HÔM NAY, 7 NGÀY (TUẦN) & 30 NGÀY (THÁNG) CỐ ĐỊNH
    const todayStr = formatDate(today)
    todayVisits.value = dbMap[todayStr] || 0

    // Tính tổng 7 ngày qua
    let sum7 = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      sum7 += (dbMap[formatDate(d)] || 0)
    }
    weekVisits.value = sum7

    // Tính tổng 30 ngày qua
    let sum30 = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      sum30 += (dbMap[formatDate(d)] || 0)
    }
    monthVisits.value = sum30

    // 2. TẠO MẢNG DỮ LIỆU BÁO CÁO CHO KỲ ĐƯỢC CHỌN (FILTER)
    const result = []
    let curr = new Date(startDate)
    while (curr <= endDate) {
      const dateStr = formatDate(curr)
      const labelStr = `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth() + 1).toString().padStart(2, '0')}`
      
      result.push({
        date: dateStr,
        dateFormatted: formatDateVN(dateStr),
        label: labelStr,
        count: dbMap[dateStr] || 0
      })
      curr.setDate(curr.getDate() + 1)
    }
    rawData.value = result

    // 3. TÍNH TỔNG KỲ TRƯỚC ĐỂ ĐO % TĂNG TRƯỞNG
    let prevSum = 0
    let prevCurr = new Date(prevStartDate)
    while (prevCurr <= prevEndDate) {
      const pStr = formatDate(prevCurr)
      prevSum += (dbMap[pStr] || 0)
      prevCurr.setDate(prevCurr.getDate() + 1)
    }
    previousPeriodTotal.value = prevSum

    renderChart()
  } catch (error) {
    console.error('Lỗi tải dữ liệu thống kê:', error)
  }
}

// CÁC CHỈ SỐ TÍNH TOÁN (COMPUTED)
const totalVisitsInFilter = computed(() => rawData.value.reduce((acc, cur) => acc + cur.count, 0))

const avgVisits = computed(() => {
  return rawData.value.length ? Math.round(totalVisitsInFilter.value / rawData.value.length) : 0
})

const maxVisitsObj = computed(() => {
  if (!rawData.value.length) return { count: 0, label: '' }
  return rawData.value.reduce((max, item) => item.count > max.count ? item : max, { count: 0, label: '' })
})

const maxVisits = computed(() => maxVisitsObj.value.count)
const maxVisitsDate = computed(() => maxVisitsObj.value.dateFormatted || '')

// Tỷ lệ tăng trưởng (%) so với kỳ trước
const growthRate = computed(() => {
  if (previousPeriodTotal.value === 0) {
    return totalVisitsInFilter.value > 0 ? 100 : 0
  }
  const diff = totalVisitsInFilter.value - previousPeriodTotal.value
  const percent = (diff / previousPeriodTotal.value) * 100
  return Number(percent.toFixed(1))
})

// Mảng đảo ngược để hiển thị bảng từ ngày mới nhất -> cũ nhất
const reversedRawData = computed(() => [...rawData.value].reverse())

// ĐỔI BỘ LỌC KHOẢNG THỜI GIAN
const changeFilter = (type) => {
  filterType.value = type
  fetchAnalyticsData()
}

// ĐỔI LOẠI BIỂU ĐỒ (LINE / BAR)
const toggleChartType = (type) => {
  chartType.value = type
  renderChart()
}

// XUẤT BÁO CÁO FILE CSV (EXCEL)
const exportToCSV = () => {
  if (!rawData.value.length) return

  let csvContent = '\uFEFF' // Đảm bảo tiếng Việt hiển thị UTF-8 không lỗi font trong Excel
  csvContent += 'Ngày,Số lượt truy cập\n'

  rawData.value.forEach(row => {
    csvContent += `"${row.dateFormatted}",${row.count}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Bao_Cao_Truy_Cap_${filterType.value}_${formatDate(new Date())}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// VẼ BIỂU ĐỒ CHART.JS
const renderChart = async () => {
  await nextTick()
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy() // Hủy biểu đồ cũ trước khi render lại
  }

  const labels = rawData.value.map(item => item.label)
  const dataValues = rawData.value.map(item => item.count)
  const ctx = chartCanvas.value.getContext('2d')

  // Tạo hiệu ứng Gradient chuyển màu dưới đường/cột
  const gradient = ctx.createLinearGradient(0, 0, 0, 320)
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)')
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)')

  chartInstance = new Chart(ctx, {
    type: chartType.value,
    data: {
      labels: labels,
      datasets: [{
        label: 'Lượt truy cập',
        data: dataValues,
        borderColor: '#2563eb',
        borderWidth: 3,
        backgroundColor: chartType.value === 'line' ? gradient : '#3b82f6',
        borderRadius: chartType.value === 'bar' ? 6 : 0,
        fill: chartType.value === 'line',
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: filterType.value === 'quarter' ? 2 : 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            label: (context) => ` 👁️ Lượt truy cập: ${context.parsed.y} lượt`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '600' }, color: '#64748b' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 11 }, color: '#64748b', precision: 0 }
        }
      }
    }
  })
}

onMounted(() => {
  fetchAnalyticsData()
})
</script>