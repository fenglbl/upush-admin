<template>
  <div class="records-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div>
          <div class="brand-title">UPUSH</div>
          <div class="brand-subtitle">Admin</div>
        </div>
      </div>

      <el-menu :default-active="'/push-records'" class="sidebar-menu" router>
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/push-records">推送记录</el-menu-item>
        <el-menu-item index="/push-create">新建推送</el-menu-item>
        <el-menu-item index="/logs">日志中心</el-menu-item>
      </el-menu>
    </aside>

    <div class="main-panel">
      <header class="topbar">
        <div>
          <h1>推送记录</h1>
          <p>基于 admin-push-batches 的批次数据（真实来源）</p>
        </div>
        <div class="topbar-actions">
          <el-tag type="info" effect="plain">MongoDB</el-tag>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchBatches">刷新</el-button>
        </div>
      </header>

      <main class="content-area">
        <section class="card filters-card">
          <el-form :inline="true" class="filters-form" @submit.prevent>
            <el-form-item label="时间范围">
              <el-select v-model="query.range" style="width: 130px" @change="handleSearch">
                <el-option label="7天" value="7d" />
                <el-option label="30天" value="30d" />
                <el-option label="24小时" value="24h" />
              </el-select>
            </el-form-item>

            <el-form-item label="状态">
              <el-select v-model="query.status" style="width: 140px" @change="handleSearch">
                <el-option label="全部" value="all" />
                <el-option label="成功" value="success" />
                <el-option label="部分失败" value="partial" />
                <el-option label="失败" value="failed" />
                <el-option label="无设备" value="no_device" />
              </el-select>
            </el-form-item>

            <el-form-item label="关键词">
              <el-input
                v-model.trim="query.keyword"
                placeholder="标题/内容/result msg"
                clearable
                style="width: 260px"
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
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

          <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无推送批次">
            <el-table-column prop="createdAt" label="时间" min-width="170" />
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalDevices" label="设备数" width="90" />
            <el-table-column prop="successCount" label="成功" width="90" />
            <el-table-column prop="failureCount" label="失败" width="90" />
            <el-table-column prop="resultCode" label="Code" width="90" />
            <el-table-column prop="summary" label="摘要" min-width="220" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text @click="openDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :current-page="query.page"
              :page-size="query.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPushBatches } from '../api'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const rows = ref([])
const total = ref(0)
const lastRefreshText = ref('--')

const query = reactive({
  page: 1,
  pageSize: 20,
  range: '7d',
  status: 'all',
  keyword: ''
})

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function statusTagType(status) {
  if (status === 'success') return 'success'
  if (status === 'partial') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

function statusText(status) {
  if (status === 'success') return '成功'
  if (status === 'partial') return '部分失败'
  if (status === 'failed') return '失败'
  if (status === 'no_device') return '无设备'
  return status || '未知'
}

async function fetchBatches() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getPushBatches({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    console.error('fetch push batches failed', error)
    errorMessage.value = '推送记录加载失败，请检查 upushServer 是否运行在 127.0.0.1:3000。'
    ElMessage.error('推送记录加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchBatches()
}

function resetFilters() {
  query.page = 1
  query.pageSize = 20
  query.range = '7d'
  query.status = 'all'
  query.keyword = ''
  fetchBatches()
}

function handlePageChange(page) {
  query.page = page
  fetchBatches()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchBatches()
}

function openDetail(row) {
  if (!row?.id) return
  router.push(`/push-records/${row.id}`)
}

onMounted(() => {
  fetchBatches()
})
</script>

<style scoped>
.records-shell {
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
  padding: 18px 18px 2px;
  margin-bottom: 16px;
}

.filters-form {
  display: flex;
  flex-wrap: wrap;
}

.table-card {
  padding: 18px;
}

.table-alert {
  margin-bottom: 14px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
