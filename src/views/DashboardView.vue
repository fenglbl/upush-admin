<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader :title="pageTitle" :subtitle="pageSubtitle">
        <template #actions>
          <el-tag type="info" effect="plain" class="env-tag admin-ui-header-chip">Production</el-tag>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchDashboardData">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="dashboard-page admin-ui-page">
      <el-alert
        v-if="errorMessage"
        class="dashboard-alert"
        type="error"
        :closable="false"
        show-icon
        :title="errorMessage"
      />

      <section class="dashboard-hero dashboard-card admin-ui-card admin-ui-hero">
        <div class="dashboard-hero__main">
          <div class="eyebrow admin-ui-kicker">运营总览</div>
          <h2>把最近推送状态一眼看清</h2>
          <p>
            聚焦最近一段时间的发送表现、异常波动与关键批次，优先帮助你判断系统是否稳定。
          </p>
        </div>
        <div class="dashboard-hero__actions admin-ui-hero__side">
          <el-segmented v-model="range" :options="rangeOptions" @change="handleRangeChange" />
          <div class="hero-note admin-ui-hero-side-note">当前维度：{{ rangeLabel }}</div>
          <div class="hero-status-pills admin-ui-pill-group">
            <span class="hero-status-pill admin-ui-pill">
              <span class="hero-status-pill__dot hero-status-pill__dot--success admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              服务端在线
            </span>
            <span class="hero-status-pill admin-ui-pill">
              <span class="hero-status-pill__dot hero-status-pill__dot--primary admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              数据实时刷新
            </span>
          </div>
        </div>
      </section>

      <section class="insight-strip admin-ui-insight-strip">
        <div class="insight-strip__item admin-ui-insight-strip__item">
          <span class="insight-strip__label admin-ui-insight-strip__label">当前结论</span>
          <strong>{{ statusSummaryHeadline }}</strong>
        </div>
        <div class="insight-strip__item admin-ui-insight-strip__item">
          <span class="insight-strip__label admin-ui-insight-strip__label">高频异常</span>
          <strong>{{ topErrorReasons[0] || '暂无明显高频异常' }}</strong>
        </div>
        <div class="insight-strip__item admin-ui-insight-strip__item">
          <span class="insight-strip__label admin-ui-insight-strip__label">当前成功率</span>
          <strong>{{ summary.successRate || 0 }}%</strong>
        </div>
      </section>

      <section class="section-anchor admin-ui-section-anchor">
        <div>
          <div class="section-anchor__eyebrow admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>核心指标</h3>
        </div>
        <p>用更少的颜色和更清晰的层级，快速理解当前周期的整体表现。</p>
      </section>

      <section class="kpi-grid">
        <article
          v-for="card in kpiCards"
          :key="card.key"
          class="kpi-card dashboard-card"
          :class="[`kpi-card--${card.tone || 'default'}`]"
        >
          <div class="kpi-card__head">
            <span class="kpi-card__label">{{ card.label }}</span>
            <span class="kpi-card__icon">{{ card.icon }}</span>
          </div>
          <div class="kpi-card__value">{{ card.value }}</div>
          <div class="kpi-card__meta">
            <span class="kpi-card__trend" :class="[`is-${card.trendTone || 'neutral'}`]">
              {{ card.trend }}
            </span>
            <span class="kpi-card__desc">{{ card.desc }}</span>
          </div>
        </article>
      </section>

      <section class="insight-grid">
        <article class="dashboard-card chart-card admin-ui-card admin-ui-panel">
          <div class="section-head admin-ui-section-head">
            <div>
              <div class="section-kicker admin-ui-kicker">趋势</div>
              <h3>推送趋势</h3>
              <p>查看总推送、成功和失败在当前周期内的变化。</p>
            </div>
            <div class="section-head__side">
              <div class="chart-legend-note">总推送 / 成功 / 失败</div>
            </div>
          </div>

          <div v-if="trend.points.length" ref="chartRef" class="chart-canvas"></div>
          <div v-else class="empty-block empty-block--chart admin-ui-empty-block admin-ui-empty-block--chart">暂无趋势数据</div>
        </article>

        <article class="dashboard-card summary-card admin-ui-card admin-ui-panel">
          <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
            <div>
              <div class="section-kicker admin-ui-kicker">摘要</div>
              <h3>状态摘要</h3>
              <p>快速浏览当前周期内最值得关注的信息。</p>
            </div>
          </div>

          <div class="summary-block summary-block--highlight">
            <span class="summary-block__label">当前状态</span>
            <p class="summary-block__text">{{ statusSummaryText }}</p>
          </div>

          <div class="summary-block">
            <span class="summary-block__label">异常摘要</span>
            <ul class="summary-list">
              <li>最近异常 {{ recentErrors.length }} 条</li>
              <li>失败批次 {{ summary.failed || 0 }} 条，部分失败 {{ summary.partial || 0 }} 条</li>
              <li>整体成功率 {{ summary.successRate || 0 }}%</li>
            </ul>
          </div>

          <div class="summary-block">
            <span class="summary-block__label">Top 失败原因</span>
            <ol v-if="topErrorReasons.length" class="rank-list">
              <li v-for="(reason, index) in topErrorReasons" :key="`${reason}-${index}`">{{ reason }}</li>
            </ol>
            <div v-else class="summary-empty">最近暂无高频失败原因</div>
          </div>
        </article>
      </section>

      <section class="detail-grid">
        <article class="dashboard-card detail-card admin-ui-card admin-ui-panel">
          <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
            <div>
              <div class="section-kicker admin-ui-kicker">明细</div>
              <h3>最近推送</h3>
              <p>最近 10 条推送批次及发送结果。</p>
            </div>
            <el-button text @click="goTo('/push-records')">查看全部</el-button>
          </div>

          <el-skeleton v-if="loading && !recentPushes.length" :rows="4" animated />

          <div v-else-if="recentPushes.length" class="list-block">
            <div
              v-for="(item, index) in recentPushes"
              :key="`${item.createdAt}-${index}`"
              class="list-row list-row--clickable"
              @click="openBatchDetail(item)"
            >
              <div class="list-row__main">
                <div class="list-row__title">{{ item.title }}</div>
                <div class="list-row__sub">{{ item.createdAt }}</div>
                <div class="metric-inline">
                  <span>设备 {{ item.totalDevices || 0 }}</span>
                  <span>成功 {{ item.successCount || 0 }}</span>
                  <span>失败 {{ item.failureCount || 0 }}</span>
                </div>
              </div>
              <div class="list-row__side">
                <el-tag :type="pushTagType(item.status)" effect="light" round>
                  {{ pushStatusText(item.status) }}
                </el-tag>
                <div class="list-row__summary">{{ item.summary }}</div>
                <div class="list-row__code">Code {{ item.resultCode }}</div>
              </div>
            </div>
          </div>

          <div v-else class="empty-block admin-ui-empty-block">暂无推送记录</div>
        </article>

        <article class="dashboard-card detail-card admin-ui-card admin-ui-panel">
          <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
            <div>
              <div class="section-kicker admin-ui-kicker">异常</div>
              <h3>最近异常</h3>
              <p>仅保留 error / warn 的摘要信息。</p>
            </div>
            <el-button text @click="goTo('/logs')">查看全部</el-button>
          </div>

          <el-skeleton v-if="loading && !recentErrors.length" :rows="4" animated />

          <div v-else-if="recentErrors.length" class="list-block">
            <div v-for="(item, index) in recentErrors" :key="`${item.time}-${index}`" class="list-row">
              <div class="list-row__main">
                <div class="list-row__topline">
                  <el-tag :type="item.level === 'ERROR' ? 'danger' : 'warning'" effect="light" round>
                    {{ item.level }}
                  </el-tag>
                  <span class="list-row__time">{{ item.time }}</span>
                </div>
                <div class="list-row__title list-row__title--log">{{ item.message }}</div>
              </div>
            </div>
          </div>

          <div v-else class="empty-block admin-ui-empty-block">最近暂无异常</div>
        </article>
      </section>
    </div>
  </AdminPageLayout>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDashboard } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const range = ref('7d')
const rangeOptions = [
  { label: '24小时', value: '24h' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' }
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
const rangeLabel = computed(() => rangeOptions.find((item) => item.value === range.value)?.label || range.value)

const kpiCards = computed(() => {
  const successRate = Number(summary.value.successRate || 0)
  return [
    {
      key: 'total',
      label: '推送批次',
      value: summary.value.total || 0,
      trend: rangeLabel.value,
      trendTone: 'neutral',
      desc: '当前统计周期',
      icon: '◌',
      tone: 'default'
    },
    {
      key: 'success',
      label: '成功数',
      value: summary.value.success || 0,
      trend: `${successRate}%`,
      trendTone: 'success',
      desc: '整体成功率',
      icon: '↗',
      tone: 'default'
    },
    {
      key: 'partial',
      label: '部分失败',
      value: summary.value.partial || 0,
      trend: (summary.value.partial || 0) > 0 ? '需关注' : '稳定',
      trendTone: (summary.value.partial || 0) > 0 ? 'warning' : 'success',
      desc: '存在部分投递异常',
      icon: '△',
      tone: 'default'
    },
    {
      key: 'failed',
      label: '失败数',
      value: summary.value.failed || 0,
      trend: (summary.value.failed || 0) > 0 ? '存在失败批次' : '表现稳定',
      trendTone: (summary.value.failed || 0) > 0 ? 'danger' : 'success',
      desc: '需要优先排查',
      icon: '!',
      tone: (summary.value.failed || 0) > 0 ? 'danger' : 'default'
    }
  ]
})

const statusSummaryText = computed(() => {
  const successRate = Number(summary.value.successRate || 0)
  const failed = Number(summary.value.failed || 0)
  const partial = Number(summary.value.partial || 0)

  if (failed === 0 && partial === 0) {
    return `当前周期整体发送稳定，成功率保持在 ${successRate}% 左右。`
  }

  if (failed > 0) {
    return `当前周期出现 ${failed} 条失败批次，建议优先查看最近异常与 provider 返回信息。`
  }

  return `当前周期存在 ${partial} 条部分失败批次，整体可用但仍建议关注波动来源。`
})

const statusSummaryHeadline = computed(() => {
  const failed = Number(summary.value.failed || 0)
  const partial = Number(summary.value.partial || 0)

  if (failed > 0) return '存在失败批次，建议优先排查'
  if (partial > 0) return '存在轻微波动，但整体可控'
  return '整体发送稳定'
})

const topErrorReasons = computed(() => {
  const source = Array.isArray(recentErrors.value) ? recentErrors.value : []
  const counts = new Map()

  source.forEach((item) => {
    const text = String(item?.message || '').trim()
    if (!text) return
    const normalized = text.length > 48 ? `${text.slice(0, 48)}...` : text
    counts.set(normalized, (counts.get(normalized) || 0) + 1)
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([text]) => text)
})

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
    color: ['#4f46e5', '#3b82f6', '#dc2626'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e8edf3',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937'
      },
      extraCssText: 'box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10); border-radius: 12px;'
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#6b7280'
      }
    },
    grid: {
      left: 16,
      right: 16,
      top: 52,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: {
        lineStyle: {
          color: '#dbe4ef'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#94a3b8'
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
        color: '#94a3b8'
      }
    },
    series: [
      {
        name: '总推送',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: 'rgba(79, 70, 229, 0.08)'
        },
        data: totalData
      },
      {
        name: '成功',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2
        },
        data: successData
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2
        },
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
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-alert {
  margin-bottom: 0;
}

.dashboard-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #ffffff);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.dashboard-hero {
  padding: 28px 30px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.dashboard-hero__main {
  max-width: 760px;
}

.eyebrow,
.section-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.dashboard-hero h2 {
  margin: 10px 0 12px;
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.dashboard-hero p {
  margin: 0;
  max-width: 680px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.dashboard-hero__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.hero-note,
.refresh-time {
  color: #94a3b8;
  font-size: 13px;
}

.hero-status-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.hero-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
}

.hero-status-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

.hero-status-pill__dot--success {
  background: #16a34a;
}

.hero-status-pill__dot--primary {
  background: #4f46e5;
}

.env-tag {
  margin-right: 4px;
}

.insight-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.insight-strip__item {
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid #e8edf3;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(8px);
}

.insight-strip__label {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.insight-strip__item strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.6;
}

.section-anchor {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.section-anchor__eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 700;
}

.section-anchor h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #0f172a;
}

.section-anchor p {
  margin: 0;
  max-width: 540px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.75;
  text-align: right;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.kpi-card {
  padding: 22px;
}

.kpi-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.kpi-card__label {
  font-size: 13px;
  color: #64748b;
}

.kpi-card__icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 13px;
}

.kpi-card__value {
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.kpi-card__meta {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.kpi-card__trend {
  font-size: 13px;
  font-weight: 600;
}

.kpi-card__trend.is-success {
  color: #15803d;
}

.kpi-card__trend.is-warning {
  color: #b45309;
}

.kpi-card__trend.is-danger {
  color: #b42318;
}

.kpi-card__trend.is-neutral {
  color: #475569;
}

.kpi-card__desc {
  font-size: 13px;
  color: #94a3b8;
}

.kpi-card--danger {
  background: linear-gradient(180deg, #ffffff 0%, #fff8f7 100%);
}

.kpi-card--danger .kpi-card__value {
  color: #b42318;
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.chart-card,
.summary-card,
.detail-card {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.section-head--compact {
  margin-bottom: 18px;
}

.section-head h3 {
  margin: 8px 0 0;
  font-size: 20px;
  color: #0f172a;
}

.section-head p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.section-head__side,
.chart-legend-note {
  color: #94a3b8;
  font-size: 13px;
}

.chart-canvas {
  height: 360px;
}

.summary-card {
  display: flex;
  flex-direction: column;
}

.summary-block {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #eef2f7;
}

.summary-block:first-of-type {
  margin-top: 0;
}

.summary-block--highlight {
  padding: 18px;
  margin-top: 0;
  border-top: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #f5f8ff 100%);
}

.summary-block__label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.summary-block__text,
.summary-list,
.rank-list,
.summary-empty {
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.8;
}

.summary-list,
.rank-list {
  padding-left: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 20px;
}

.list-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  background: #fbfdff;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.list-row--clickable {
  cursor: pointer;
}

.list-row--clickable:hover {
  transform: translateY(-1px);
  border-color: #dbe4ef;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
}

.list-row__main {
  min-width: 0;
  flex: 1;
}

.list-row__topline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.list-row__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
}

.list-row__title--log {
  font-size: 14px;
  font-weight: 500;
}

.list-row__sub,
.list-row__time,
.list-row__code,
.list-row__summary,
.metric-inline {
  color: #94a3b8;
  font-size: 13px;
}

.list-row__sub {
  margin-top: 6px;
}

.metric-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
}

.list-row__side {
  min-width: 152px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.list-row__summary {
  text-align: right;
  color: #475569;
}

.empty-block {
  min-height: 220px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px dashed #dbe4ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.empty-block--chart {
  min-height: 360px;
}

@media (max-width: 1280px) {
  .insight-strip,
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .insight-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .section-anchor {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-anchor p {
    text-align: left;
  }
}

@media (max-width: 900px) {
  .dashboard-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-hero__actions {
    align-items: flex-start;
  }

  .hero-status-pills {
    justify-content: flex-start;
  }

  .insight-strip,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .list-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-row__side {
    width: 100%;
    min-width: 0;
    align-items: flex-start;
  }

  .list-row__summary {
    text-align: left;
  }
}
</style>
