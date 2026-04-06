<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="日志中心" subtitle="支持按日期、级别、关键词筛选日志">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchLogs">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="logs-page admin-ui-page">
      <AdminPageHero
        kicker="Logs"
        title="把异常与上下文放到同一个视野里"
        description="用更清晰的筛选、层级和表格样式查看日志内容，先快速定位异常，再逐步收窄到关键词与 message。"
        :side-note="`默认日期：${query.date || '今日'}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--warning"></span>
              支持按级别筛选
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              保留原始日志
            </span>
          </div>
        </template>
      </AdminPageHero>

      <AdminInsightStrip :items="insightItems" />

      <section class="section-anchor admin-ui-section-anchor">
        <div>
          <div class="section-anchor__eyebrow admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>日志概览</h3>
        </div>
        <p>先看数量与级别分布，再进入表格查看具体 message 和 raw 内容。</p>
      </section>

      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" class="summary-card page-card admin-ui-card" :class="[`summary-card--${card.tone}`]">
          <div class="summary-card__head">
            <span>{{ card.label }}</span>
            <span class="summary-card__icon">{{ card.icon }}</span>
          </div>
          <strong>{{ card.value }}</strong>
          <div class="summary-card__meta">{{ card.meta }}</div>
        </article>
      </section>

      <section class="filter-shell page-card admin-ui-card admin-ui-panel">
        <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
          <div>
            <div class="section-kicker admin-ui-kicker">Filter</div>
            <h3>筛选条件</h3>
            <p>按日期、级别、关键词和 message 聚焦需要排查的日志。</p>
          </div>
        </div>

        <el-form :inline="true" class="filters-form admin-ui-form-inline" @submit.prevent>
          <el-form-item label="日期">
            <el-date-picker
              v-model="query.date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              style="width: 160px"
            />
          </el-form-item>

          <el-form-item label="级别">
            <el-select v-model="query.level" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="INFO" value="INFO" />
              <el-option label="WARN" value="WARN" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
          </el-form-item>

          <el-form-item label="关键词">
            <el-input v-model.trim="query.keyword" clearable placeholder="keyword" style="width: 220px" />
          </el-form-item>

          <el-form-item label="message">
            <el-input v-model.trim="query.message" clearable placeholder="message contains" style="width: 240px" />
          </el-form-item>

          <el-form-item label="条数">
            <el-input-number v-model="query.limit" :min="1" :max="500" />
          </el-form-item>

          <el-form-item label="排序">
            <el-select v-model="query.order" style="width: 110px">
              <el-option label="倒序" value="desc" />
              <el-option label="正序" value="asc" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="fetchLogs">查询</el-button>
            <el-button @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="table-shell page-card admin-ui-card admin-ui-panel">
        <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
          <div>
            <div class="section-kicker admin-ui-kicker">Table</div>
            <h3>日志列表</h3>
            <p>结合级别、message 与 raw 内容快速找到问题上下文。</p>
          </div>
        </div>

        <el-alert
          v-if="errorMessage"
          type="error"
          :closable="false"
          show-icon
          :title="errorMessage"
          class="table-alert admin-ui-table-alert"
        />

        <el-table :data="rows" v-loading="loading" empty-text="暂无日志" class="refined-table admin-ui-refined-table">
          <el-table-column prop="index" label="#" width="72" />
          <el-table-column prop="time" label="时间" min-width="170" />
          <el-table-column label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="levelTagType(row.level)" effect="light" round>{{ row.level || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="message" min-width="360">
            <template #default="{ row }">
              <div class="message-cell admin-ui-message-cell">
                <span class="message-text admin-ui-message-text" :title="row.message || '-'">{{ row.message || '-' }}</span>
                <el-button v-if="row.message" text type="primary" @click="applyMessageFilter(row.message)">按此筛选</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="raw" label="raw" min-width="420" show-overflow-tooltip />
        </el-table>
      </section>
    </div>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLogs } from '../api'
import AdminInsightStrip from '../components/AdminInsightStrip.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import AdminSectionHeader from '../components/AdminSectionHeader.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const rows = ref([])
const errorMessage = ref('')
const lastRefreshText = ref('--')

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

const query = reactive({
  date: String(route.query.date || todayDate()),
  level: String(route.query.level || ''),
  keyword: String(route.query.keyword || ''),
  message: String(route.query.message || ''),
  limit: Number(route.query.limit || 100) || 100,
  order: String(route.query.order || 'desc')
})

const summaryCards = computed(() => {
  const infoCount = rows.value.filter((item) => item.level === 'INFO').length
  const warnCount = rows.value.filter((item) => item.level === 'WARN').length
  const errorCount = rows.value.filter((item) => item.level === 'ERROR').length

  return [
    {
      key: 'all',
      label: '当前结果',
      value: rows.value.length,
      meta: `当前上限 ${query.limit}`,
      icon: '◌',
      tone: 'default'
    },
    {
      key: 'info',
      label: 'INFO',
      value: infoCount,
      meta: '常规运行日志',
      icon: '·',
      tone: 'default'
    },
    {
      key: 'warn',
      label: 'WARN',
      value: warnCount,
      meta: '建议关注波动',
      icon: '△',
      tone: 'warning'
    },
    {
      key: 'error',
      label: 'ERROR',
      value: errorCount,
      meta: '优先排查异常',
      icon: '!',
      tone: 'danger'
    }
  ]
})

const insightItems = computed(() => [
  { key: 'rows', label: '当前日志数', value: rows.value.length },
  { key: 'level', label: '当前级别', value: query.level || '全部级别' },
  { key: 'message', label: 'message 筛选', value: query.message || '未设置 message 筛选' }
])

function syncRouteQuery() {
  router.replace({
    path: '/logs',
    query: {
      date: query.date,
      level: query.level || undefined,
      keyword: query.keyword || undefined,
      message: query.message || undefined,
      limit: String(query.limit || 100),
      order: query.order || 'desc'
    }
  })
}

function levelTagType(level) {
  if (level === 'ERROR') return 'danger'
  if (level === 'WARN') return 'warning'
  return 'info'
}

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function fetchLogs() {
  loading.value = true
  errorMessage.value = ''
  syncRouteQuery()

  try {
    const res = await getLogs({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.entries || []
    lastRefreshText.value = formatNow()
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '日志加载失败'
    rows.value = []
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function applyMessageFilter(messageText) {
  query.message = String(messageText || '').trim()
  fetchLogs()
}

function reset() {
  query.date = todayDate()
  query.level = ''
  query.keyword = ''
  query.message = ''
  query.limit = 100
  query.order = 'desc'
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.refresh-time {
  color: var(--text-secondary);
  font-size: 13px;
}

.page-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #ffffff);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.hero-card {
  padding: 28px 30px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.hero-card__main {
  max-width: 760px;
}

.hero-card h2 {
  margin: 10px 0 12px;
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.hero-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-card__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.hero-pill-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.hero-pill {
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

.hero-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

.hero-pill__dot--primary {
  background: #4f46e5;
}

.hero-pill__dot--warning {
  background: #d97706;
}

.hero-side-note,
.section-kicker,
.section-anchor__eyebrow,
.insight-strip__label {
  color: #94a3b8;
}

.hero-side-note,
.section-kicker,
.section-anchor__eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
}

.insight-strip__label {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.section-anchor h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #0f172a;
}

.section-anchor p {
  margin: 0;
  max-width: 520px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.75;
  text-align: right;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
}

.summary-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card span {
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  font-size: 30px;
  line-height: 1;
  color: #0f172a;
}

.summary-card__meta {
  margin-top: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.summary-card__icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 13px;
}

.summary-card--warning {
  background: linear-gradient(180deg, #ffffff 0%, #fffaf2 100%);
}

.summary-card--danger {
  background: linear-gradient(180deg, #ffffff 0%, #fff8f7 100%);
}

.summary-card--danger strong {
  color: #b42318;
}

.filter-shell,
.table-shell {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
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

.filters-form {
  display: flex;
  flex-wrap: wrap;
}

.table-alert {
  margin-bottom: 14px;
}

.message-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.message-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.refined-table) {
  --el-table-border-color: #edf2f7;
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f8fbff;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.refined-table th.el-table__cell) {
  color: #64748b;
  font-weight: 600;
}

@media (max-width: 1280px) {
  .insight-strip,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .hero-card {
    flex-direction: column;
  }

  .hero-card__side,
  .hero-pill-group {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .insight-strip,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
