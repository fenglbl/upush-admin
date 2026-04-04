<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="设备管理" subtitle="基于 `uni-id-device` 的第一版设备列表与详情">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchDevices">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>
        <section class="card filters-card">
          <el-form :inline="true" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model.trim="query.keyword" clearable placeholder="device_id / platform" style="width: 240px" />
            </el-form-item>
            <el-form-item label="用户 ID">
              <el-input v-model.trim="query.userId" clearable placeholder="按 userId 筛选" style="width: 240px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
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

          <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无设备数据">
            <el-table-column prop="deviceId" label="设备 ID" min-width="250" show-overflow-tooltip />
            <el-table-column prop="platform" label="平台" width="100" />
            <el-table-column label="所属用户" min-width="220">
              <template #default="{ row }">
                <div v-if="row.user">
                  <div>{{ row.user.nickname || row.user.username || '-' }}</div>
                  <div class="sub-text">{{ row.user.id }}</div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createDateText" label="创建设备时间" min-width="180" />
            <el-table-column prop="lastActiveDateText" label="最近活跃" min-width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" @click="openDetail(row)">详情</el-button>
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
    <el-drawer v-model="detailVisible" title="设备详情" size="560px">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-grid">
            <div><span class="label">ID</span><div class="mono">{{ detail.id }}</div></div>
            <div><span class="label">设备 ID</span><div class="mono">{{ detail.deviceId || '-' }}</div></div>
            <div><span class="label">平台</span><div>{{ detail.platform || '-' }}</div></div>
            <div><span class="label">tokenExpired</span><div>{{ detail.tokenExpired === null ? '-' : String(detail.tokenExpired) }}</div></div>
            <div><span class="label">创建设备时间</span><div>{{ detail.createDateText || '-' }}</div></div>
            <div><span class="label">最近活跃</span><div>{{ detail.lastActiveDateText || '-' }}</div></div>
            <div><span class="label">用户 ID</span><div class="mono">{{ detail.userId || '-' }}</div></div>
            <div><span class="label">所属用户</span><div>{{ detail.user?.nickname || detail.user?.username || '-' }}</div></div>
            <div><span class="label">用户邮箱</span><div>{{ detail.user?.email || '-' }}</div></div>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>
  </AdminPageLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeviceDetail, getDevices } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const detail = ref(null)
const rows = ref([])
const total = ref(0)
const errorMessage = ref('')
const lastRefreshText = ref('--')

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  userId: ''
})

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function fetchDevices() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getDevices({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '设备列表加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  if (!row?.id) return
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getDeviceDetail(row.id)
    detail.value = res?.data?.data || null
  } catch (error) {
    detail.value = null
    ElMessage.error(error?.response?.data?.msg || '设备详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchDevices()
}

function reset() {
  query.page = 1
  query.pageSize = 20
  query.keyword = ''
  query.userId = ''
  fetchDevices()
}

function handlePageChange(page) {
  query.page = page
  fetchDevices()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchDevices()
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.devices-shell {
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
.brand-title { font-weight: 700; }
.brand-subtitle, .refresh-time, .sub-text { color: var(--text-secondary); font-size: 13px; }
.sidebar-menu { border-right: none; }
.main-panel { display: flex; flex-direction: column; }
.topbar {
  height: 72px; background: #ffffff; border-bottom: 1px solid var(--border-color);
  padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.topbar h1 { margin: 0; font-size: 24px; }
.topbar p { margin: 6px 0 0; color: var(--text-secondary); font-size: 13px; }
.topbar-actions { display: flex; align-items: center; gap: 12px; }
.content-area { padding: 24px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; box-shadow: var(--shadow-card); }
.filters-card, .table-card { padding: 18px; }
.filters-card { margin-bottom: 16px; }
.table-alert { margin-bottom: 14px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.detail-grid { display: grid; gap: 16px; }
.label { display: block; color: var(--text-secondary); font-size: 13px; margin-bottom: 4px; }
.mono { font-family: Consolas, Monaco, 'Courier New', monospace; word-break: break-all; }
</style>
