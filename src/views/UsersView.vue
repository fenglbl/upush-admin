<template>
  <div class="users-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div>
          <div class="brand-title">UPUSH</div>
          <div class="brand-subtitle">Admin</div>
        </div>
      </div>

      <el-menu :default-active="'/users'" class="sidebar-menu" router>
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/push-create">新建推送</el-menu-item>
        <el-menu-item index="/push-records">推送记录</el-menu-item>
        <el-menu-item index="/logs">日志中心</el-menu-item>
        <el-menu-item index="/users">用户管理</el-menu-item>
        <el-menu-item index="/devices">设备管理</el-menu-item>
        <el-menu-item index="/settings">系统设置</el-menu-item>
      </el-menu>
    </aside>

    <div class="main-panel">
      <header class="topbar">
        <div>
          <h1>用户管理</h1>
          <p>基于 `uni-id-users` 的第一版用户列表与详情</p>
        </div>
        <div class="topbar-actions">
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchUsers">刷新</el-button>
        </div>
      </header>

      <main class="content-area">
        <section class="card filters-card">
          <el-form :inline="true" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model.trim="query.keyword" clearable placeholder="username / nickname / email" style="width: 260px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="query.status" style="width: 120px">
                <el-option label="全部" value="all" />
                <el-option label="正常(0)" value="0" />
                <el-option label="其他(1)" value="1" />
              </el-select>
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

          <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无用户数据">
            <el-table-column prop="username" label="用户名" min-width="160" />
            <el-table-column prop="nickname" label="昵称" min-width="160" />
            <el-table-column prop="email" label="邮箱" min-width="220" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 0 ? 'success' : 'warning'">{{ row.status === 0 ? '正常' : row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="registerDateText" label="注册时间" min-width="180" />
            <el-table-column prop="lastLoginDateText" label="最近登录" min-width="180" />
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
      </main>
    </div>

    <el-drawer v-model="detailVisible" title="用户详情" size="520px">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-grid">
            <div><span class="label">ID</span><div class="mono">{{ detail.id }}</div></div>
            <div><span class="label">用户名</span><div>{{ detail.username || '-' }}</div></div>
            <div><span class="label">昵称</span><div>{{ detail.nickname || '-' }}</div></div>
            <div><span class="label">邮箱</span><div>{{ detail.email || '-' }}</div></div>
            <div><span class="label">状态</span><div>{{ detail.status }}</div></div>
            <div><span class="label">设备数</span><div>{{ detail.deviceCount }}</div></div>
            <div><span class="label">注册时间</span><div>{{ detail.registerDateText || '-' }}</div></div>
            <div><span class="label">最近登录</span><div>{{ detail.lastLoginDateText || '-' }}</div></div>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserDetail, getUsers } from '../api'

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
  status: 'all'
})

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getUsers({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '用户列表加载失败'
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
    const res = await getUserDetail(row.id)
    detail.value = res?.data?.data || null
  } catch (error) {
    detail.value = null
    ElMessage.error(error?.response?.data?.msg || '用户详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchUsers()
}

function reset() {
  query.page = 1
  query.pageSize = 20
  query.keyword = ''
  query.status = 'all'
  fetchUsers()
}

function handlePageChange(page) {
  query.page = page
  fetchUsers()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-shell {
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
.brand-subtitle, .refresh-time { color: var(--text-secondary); font-size: 13px; }
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
