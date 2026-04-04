<template>
  <div class="detail-shell">
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
          <h1>批次详情</h1>
          <p>查看单次推送批次的完整结果明细</p>
        </div>
        <div class="topbar-actions">
          <el-button @click="goBack">返回列表</el-button>
          <el-button :loading="loading" type="primary" @click="fetchDetail">刷新</el-button>
        </div>
      </header>

      <main class="content-area">
        <el-alert
          v-if="errorMessage"
          type="error"
          :closable="false"
          show-icon
          :title="errorMessage"
          class="detail-alert"
        />

        <section v-if="detail" class="card base-card">
          <div class="base-grid">
            <div class="kv-item"><span class="k">批次 ID</span><span class="v">{{ detail.id }}</span></div>
            <div class="kv-item"><span class="k">状态</span><span class="v"><el-tag :type="statusTagType(detail.status)">{{ statusText(detail.status) }}</el-tag></span></div>
            <div class="kv-item"><span class="k">标题</span><span class="v">{{ detail.title }}</span></div>
            <div class="kv-item"><span class="k">结果码</span><span class="v">{{ detail.resultCode }}</span></div>
            <div class="kv-item"><span class="k">创建时间</span><span class="v">{{ detail.createTimeText }}</span></div>
            <div class="kv-item"><span class="k">更新时间</span><span class="v">{{ detail.updatedAtText || '-' }}</span></div>
            <div class="kv-item"><span class="k">设备总数</span><span class="v">{{ detail.totalDevices }}</span></div>
            <div class="kv-item"><span class="k">成功/失败</span><span class="v">{{ detail.successCount }} / {{ detail.failureCount }}</span></div>
            <div class="kv-item kv-item--full"><span class="k">结果消息</span><span class="v">{{ detail.resultMsg || '-' }}</span></div>
            <div class="kv-item kv-item--full"><span class="k">内容</span><span class="v">{{ detail.content || '-' }}</span></div>
          </div>
        </section>

        <section class="card results-card">
          <div class="results-head">
            <h2>设备推送结果（{{ results.length }}）</h2>
          </div>

          <el-table :data="results" stripe border v-loading="loading" empty-text="暂无结果明细">
            <el-table-column prop="deviceId" label="设备 ID" min-width="240" />
            <el-table-column label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.ok ? 'success' : 'danger'" effect="light">{{ row.ok ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="messageId" label="消息 ID" min-width="220" />
            <el-table-column prop="providerCode" label="Provider Code" width="130" />
            <el-table-column prop="providerMsg" label="Provider Msg" min-width="200" />
            <el-table-column prop="error" label="错误信息" min-width="220" />
          </el-table>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPushBatchDetail } from '../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const detail = ref(null)

const batchId = computed(() => String(route.params.id || ''))
const results = computed(() => (Array.isArray(detail.value?.results) ? detail.value.results : []))

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

function goBack() {
  router.push('/push-records')
}

async function fetchDetail() {
  if (!batchId.value) {
    errorMessage.value = '缺少批次 id'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getPushBatchDetail(batchId.value)
    detail.value = res?.data?.data || null
  } catch (error) {
    console.error('fetch batch detail failed', error)
    errorMessage.value = '批次详情加载失败，请确认 id 是否存在。'
    ElMessage.error('批次详情加载失败')
  } finally {
    loading.value = false
  }
}

fetchDetail()
</script>

<style scoped>
.detail-shell {
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

.content-area {
  padding: 24px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.detail-alert {
  margin-bottom: 16px;
}

.base-card {
  padding: 18px;
  margin-bottom: 16px;
}

.base-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.kv-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.kv-item--full {
  grid-column: 1 / -1;
}

.k {
  min-width: 86px;
  color: var(--text-secondary);
  font-size: 13px;
}

.v {
  color: var(--text-primary);
  word-break: break-all;
}

.results-card {
  padding: 18px;
}

.results-head {
  margin-bottom: 12px;
}

.results-head h2 {
  margin: 0;
  font-size: 18px;
}
</style>
