<template>
  <div class="logs-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div>
          <div class="brand-title">UPUSH</div>
          <div class="brand-subtitle">Admin</div>
        </div>
      </div>

      <el-menu :default-active="'/logs'" class="sidebar-menu" router>
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/push-records">推送记录</el-menu-item>
        <el-menu-item index="/push-create">新建推送</el-menu-item>
        <el-menu-item index="/logs">日志中心</el-menu-item>
      </el-menu>
    </aside>

    <div class="main-panel">
      <header class="topbar">
        <div>
          <h1>日志中心</h1>
          <p>支持按日期、级别、关键词筛选日志</p>
        </div>
        <div class="topbar-actions">
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchLogs">刷新</el-button>
        </div>
      </header>

      <main class="content-area">
        <section class="card filters-card">
          <el-form :inline="true" @submit.prevent>
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
              <el-input v-model.trim="query.keyword" clearable placeholder="keyword" style="width: 200px" />
            </el-form-item>

            <el-form-item label="message">
              <el-input v-model.trim="query.message" clearable placeholder="message contains" style="width: 220px" />
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

        <section class="card table-card">
          <el-alert
            v-if="errorMessage"
            type="error"
            :closable="false"
            show-icon
            :title="errorMessage"
            class="table-alert"
          />

          <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无日志">
            <el-table-column prop="index" label="#" width="72" />
            <el-table-column prop="time" label="时间" min-width="170" />
            <el-table-column label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.level)">{{ row.level || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="message" min-width="360">
              <template #default="{ row }">
                <div class="message-cell">
                  <span class="message-text" :title="row.message || '-'">{{ row.message || '-' }}</span>
                  <el-button v-if="row.message" text type="primary" @click="applyMessageFilter(row.message)">按此筛选</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="raw" label="raw" min-width="420" show-overflow-tooltip />
          </el-table>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLogs } from '../api'

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
.logs-shell {
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

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.filters-card {
  padding: 18px;
  margin-bottom: 16px;
}

.table-card {
  padding: 18px;
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
</style>
