<template>
  <div class="dashboard-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div>
          <div class="brand-title">UPUSH</div>
          <div class="brand-subtitle">Admin</div>
        </div>
      </div>

      <el-menu :default-active="route.path" class="sidebar-menu" router>
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/push-records">推送记录</el-menu-item>
        <el-menu-item index="/push-create">新建推送</el-menu-item>
        <el-menu-item index="/logs">日志中心</el-menu-item>
      </el-menu>
    </aside>

    <div class="main-panel">
      <header class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>
        <div class="topbar-actions">
          <el-tag type="info" effect="plain">Production</el-tag>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchDashboardData">刷新</el-button>
          <el-button type="primary" @click="goTo('/push-create')">新建推送</el-button>
        </div>
      </header>

      <main class="content-area">
        <el-alert
          v-if="errorMessage"
          class="dashboard-alert"
          type="error"
          :closable="false"
          show-icon
          :title="errorMessage"
        />

        <section class="kpi-grid">
          <div class="kpi-card dashboard-card">
            <span class="kpi-label">今日推送总数</span>
            <strong class="kpi-value">{{ summary.total }}</strong>
          </div>
          <div class="kpi-card dashboard-card kpi-card--success">
            <span class="kpi-label">成功数</span>
            <strong class="kpi-value">{{ summary.success }}</strong>
          </div>
          <div class="kpi-card dashboard-card kpi-card--warning">
            <span class="kpi-label">部分失败数</span>
            <strong class="kpi-value">{{ summary.partial }}</strong>
          </div>
          <div class="kpi-card dashboard-card kpi-card--danger">
            <span class="kpi-label">失败数</span>
            <strong class="kpi-value">{{ summary.failed }}</strong>
          </div>
          <div class="kpi-card dashboard-card">
            <span class="kpi-label">成功率</span>
            <strong class="kpi-value">{{ summary.successRate }}%</strong>
          </div>
        </section>

        <section class="dashboard-card chart-card">
          <div class="section-head">
            <div>
              <h2>推送趋势</h2>
              <p>查看总推送、成功和失败的变化趋势。</p>
            </div>
            <el-segmented v-model="range" :options="rangeOptions" @change="handleRangeChange" />
          </div>
          <div v-if="trend.points.length" ref="chartRef" class="chart-canvas"></div>
          <div v-else class="empty-block empty-block--chart">暂无趋势数据</div>
        </section>

        <section class="quick-actions-grid">
          <div class="dashboard-card quick-card" @click="goTo('/push-create')">
            <div class="quick-card-icon quick-card-icon--primary">✉</div>
            <div>
              <div class="quick-card-title">新建推送</div>
              <div class="quick-card-desc">快速进入推送创建流程</div>
            </div>
          </div>
          <div class="dashboard-card quick-card" @click="goTo('/push-records')">
            <div class="quick-card-icon quick-card-icon--success">✓</div>
            <div>
              <div class="quick-card-title">查看推送记录</div>
              <div class="quick-card-desc">回看最近推送任务与结果</div>
            </div>
          </div>
          <div class="dashboard-card quick-card" @click="goTo('/logs')">
            <div class="quick-card-icon quick-card-icon--warning">!</div>
            <div>
              <div class="quick-card-title">查看日志</div>
              <div class="quick-card-desc">进入日志中心查看完整异常与检索</div>
            </div>
          </div>
        </section>

        <section class="detail-grid">
          <div class="dashboard-card detail-card">
            <div class="section-head section-head--compact">
              <div>
                <h2>最近推送结果</h2>
                <p>最近 10 条推送任务状态</p>
              </div>
              <el-button text @click="goTo('/push-records')">查看推送记录</el-button>
            </div>

            <el-skeleton v-if="loading && !recentPushes.length" :rows="4" animated />

            <div v-else-if="recentPushes.length" class="list-block">
              <div
                v-for="(item, index) in recentPushes"
                :key="`${item.createdAt}-${index}`"
                class="list-item list-item--push list-item--clickable"
                @click="openBatchDetail(item)"
              >
                <div class="list-main">
                  <div class="list-title-row">
                    <div class="list-title">{{ item.title }}</div>
                    <el-tag :type="pushTagType(item.status)" effect="light">{{ pushStatusText(item.status) }}</el-tag>
                  </div>
                  <div class="list-subtitle">{{ item.createdAt }}</div>
                  <div class="push-metrics">
                    <span>设备数 {{ item.totalDevices || 0 }}</span>
                    <span>成功 {{ item.successCount || 0 }}</span>
                    <span>失败 {{ item.failureCount || 0 }}</span>
                  </div>
                </div>
                <div class="list-side">
                  <div class="list-summary">{{ item.summary }}</div>
                  <div class="list-code">Code {{ item.resultCode }}</div>
                </div>
              </div>
            </div>

            <div v-else class="empty-block">暂无推送记录</div>
          </div>

          <div class="dashboard-card detail-card">
            <div class="section-head section-head--compact">
              <div>
                <h2>最近异常日志</h2>
                <p>仅展示 error / warn 摘要</p>
              </div>
              <el-button text @click="goTo('/logs')">查看全部日志</el-button>
            </div>

            <el-skeleton v-if="loading && !recentErrors.length" :rows="4" animated />

            <div v-else-if="recentErrors.length" class="list-block">
              <div v-for="(item, index) in recentErrors" :key="`${item.time}-${index}`" class="list-item list-item--log">
                <div class="list-main">
                  <div class="list-title-row">
                    <el-tag :type="item.level === 'ERROR' ? 'danger' : 'warning'" effect="light">{{ item.level }}</el-tag>
                    <div class="list-time-inline">{{ item.time }}</div>
                  </div>
                  <div class="list-log-message">{{ item.message }}</div>
                </div>
              </div>
            </div>

            <div v-else class="empty-block">最近暂无异常</div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDashboard } from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const range = ref('7d')
const rangeOptions = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '24小时', value: '24h' }
]
const lastRefreshText = ref('--')
const errorMessage = ref('')
const summary = ref({ total: 0, success: 0, partial: 0, failed: 0, successRate: 0 })
const trend = ref({ points: [] })
const recentPushes = ref([])
const recentErrors = ref([])
const chartRef = ref(null)
let chartInstance = null

const pageTitle = computed(() => route.meta?.title || 'Dashboard')
const pageSubtitle = computed(() => route.meta?.subtitle || '推送数据看板')

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function pushTagType(status) {
  if (status === 'success') return 'success'
  if (status === 'partial') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

function pushStatusText(status) {
  if (status === 'success') return '成功'
  if (status === 'partial') return '部分失败'
  if (status === 'failed') return '失败'
  if (status === 'no_device') return '无设备'
  return status || '未知'
}

function ensureChart() {
  if (!chartRef.value) return null
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  return chartInstance
}

function renderChart() {
  const instance = ensureChart()
  if (!instance) return

  const points = Array.isArray(trend.value?.points) ? trend.value.points : []
  const labels = points.map((item) => item.label)
  const totalData = points.map((item) => item.total || 0)
  const successData = points.map((item) => item.success || 0)
  const failedData = points.map((item) => item.failed || 0)

  instance.setOption({
    backgroundColor: 'transparent',
    color: ['#3b82f6', '#22c55e', '#ef4444'],
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: {
        color: '#6b7280'
      }
    },
    grid: {
      left: 24,
      right: 24,
      top: 56,
      bottom: 24,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: {
        lineStyle: {
          color: '#d7dfeb'
        }
      },
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#edf2f7'
        }
      },
      axisLabel: {
        color: '#6b7280'
      }
    },
    series: [
      {
        name: '总推送数',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: totalData,
        areaStyle: {
          color: 'rgba(59, 130, 246, 0.08)'
        }
      },
      {
        name: '成功数',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: successData
      },
      {
        name: '失败数',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: failedData
      }
    ]
  })
}

function resizeChart() {
  chartInstance?.resize()
}

function goTo(path) {
  router.push(path)
}

function openBatchDetail(item) {
  if (!item?.id) return
  router.push(`/push-records/${item.id}`)
}

async function fetchDashboardData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getDashboard(range.value)
    const data = res?.data?.data || {}
    summary.value = data.summary || { total: 0, success: 0, partial: 0, failed: 0, successRate: 0 }
    trend.value = data.trend || { points: [] }
    recentPushes.value = data.recentPushes || []
    recentErrors.value = data.recentErrors || []
    lastRefreshText.value = formatNow()
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('fetch dashboard failed', error)
    errorMessage.value = 'Dashboard 数据加载失败，请检查 upushServer 是否运行在 127.0.0.1:3000。'
    ElMessage.error('Dashboard 数据加载失败')
  } finally {
    loading.value = false
  }
}

function handleRangeChange() {
  fetchDashboardData()
}

watch(
  () => trend.value.points,
  async () => {
    await nextTick()
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.dashboard-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  background: #ffffff;
  border-right: 1px solid var(--border-color);
  padding: 20px 16px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 20px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-title {
  font-weight: 700;
}

.brand-subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.sidebar-menu {
  border-right: none;
}

.main-panel {
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-time {
  color: var(--text-secondary);
  font-size: 13px;
}

.content-area {
  padding: 24px;
}

.dashboard-alert {
  margin-bottom: 16px;
}

.dashboard-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 20px;
}

.kpi-card--success {
  background: #f0fdf4;
}

.kpi-card--warning {
  background: #fffbeb;
}

.kpi-card--danger {
  background: #fef2f2;
}

.kpi-label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 14px;
}

.kpi-value {
  font-size: 34px;
  line-height: 1;
}

.chart-card,
.detail-card,
.quick-card {
  padding: 24px;
}

.chart-card {
  margin-bottom: 24px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.quick-card-icon--primary {
  background: #dbeafe;
  color: #2563eb;
}

.quick-card-icon--success {
  background: #dcfce7;
  color: #16a34a;
}

.quick-card-icon--warning {
  background: #fef3c7;
  color: #d97706;
}

.quick-card-title {
  font-weight: 600;
}

.quick-card-desc {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.section-head--compact {
  align-items: flex-start;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
}

.section-head p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.chart-canvas {
  height: 340px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.list-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  min-height: 88px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: #fafcff;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.list-item--push {
  align-items: center;
}

.list-item--clickable {
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.list-item--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.list-item--log {
  min-height: 78px;
}

.list-main {
  flex: 1;
  min-width: 0;
}

.list-side {
  min-width: 148px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
}

.list-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.list-title {
  font-weight: 600;
}

.list-subtitle,
.list-time-inline,
.list-code {
  color: var(--text-secondary);
  font-size: 13px;
}

.list-subtitle {
  margin-top: 8px;
}

.push-metrics {
  margin-top: 10px;
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.list-summary {
  text-align: right;
  color: var(--text-primary);
  font-size: 13px;
}

.list-log-message {
  margin-top: 10px;
  color: var(--text-primary);
  line-height: 1.55;
  word-break: break-word;
}

.empty-block {
  min-height: 220px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.empty-block--chart {
  min-height: 340px;
}
</style>
