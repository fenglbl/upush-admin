<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="设备管理" subtitle="基于 uni-id-device 的第一版设备列表与详情">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" :disabled="actionLoading" @click="fetchDevices">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="devices-page admin-ui-page">
      <AdminPageHero
        kicker="设备管理"
        title="把设备分布与活跃信息放到同一视图里"
        description="优先看平台分布、用户归属和最近活跃时间，再决定是否深入某台设备详情，方便排查绑定与推送可达性。"
        :side-note="`当前用户筛选：${query.userId || '未限定用户'}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              支持设备 ID 搜索
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              关联用户信息
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">概览</div>
          <h3>设备概览</h3>
        </div>
        <p>先识别当前页平台分布和用户绑定情况，再通过详情查看 token 与最近活跃数据。</p>
      </section>

      <section v-if="query.userId" class="active-filter-banner admin-ui-card">
        <div class="active-filter-banner__content">
          <div class="active-filter-banner__eyebrow">当前筛选</div>
          <h3>正在查看用户设备</h3>
          <p>当前列表已按用户 ID 过滤，仅显示该用户名下的设备记录。</p>
        </div>
        <div class="active-filter-banner__meta">
          <div class="active-filter-banner__id">{{ query.userId }}</div>
          <el-button @click="clearUserFilter">清除筛选</el-button>
        </div>
      </section>

      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" class="summary-card admin-ui-card" :class="[`summary-card--${card.tone}`]">
          <div class="summary-card__head">
            <span>{{ card.label }}</span>
            <span class="summary-card__icon">{{ card.icon }}</span>
          </div>
          <strong>{{ card.value }}</strong>
          <div class="summary-card__meta">{{ card.meta }}</div>
        </article>
      </section>

      <section class="admin-ui-card admin-ui-panel">
        <AdminSectionHeader
          kicker="筛选"
          title="筛选条件"
          description="按设备标识、平台和所属用户快速收敛目标设备。"
          compact
        />

        <el-form :inline="true" class="admin-ui-form-inline" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model.trim="query.keyword"
              clearable
              placeholder="设备 ID / 平台"
              style="width: 240px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="用户 ID">
            <el-input
              v-model.trim="query.userId"
              clearable
              placeholder="按 userId 筛选"
              style="width: 240px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="admin-ui-card admin-ui-panel">
        <AdminSectionHeader
          kicker="列表"
          title="设备列表"
          description="保留设备、平台、用户和活跃时间四类核心信息，细节留给抽屉展开。"
          compact
        />

        <el-alert
          v-if="errorMessage"
          type="error"
          :closable="false"
          show-icon
          :title="errorMessage"
          class="admin-ui-table-alert"
        />

        <el-table :data="rows" v-loading="loading" empty-text="暂无设备数据" class="admin-ui-refined-table" :row-class-name="getRowClassName">
          <el-table-column label="设备 ID" min-width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <button class="table-link-button table-link-button--mono" type="button" @click="openDetail(row)">{{ row.deviceId || '-' }}</button>
            </template>
          </el-table-column>
          <el-table-column prop="platform" label="平台" width="110" />
          <el-table-column label="所属用户" min-width="220">
            <template #default="{ row }">
              <div v-if="row.user">
                <button class="table-link-button" type="button" @click="goToUserDetail(row.user.id)">{{ row.user.nickname || row.user.username || '-' }}</button>
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

        <div class="admin-ui-pagination">
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
    </div>

    <el-drawer v-model="detailVisible" title="设备详情" size="600px" class="detail-drawer">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-drawer-body">
            <section class="detail-hero">
              <div class="detail-hero__main">
                <div class="detail-hero__eyebrow">设备档案</div>
                <h3>{{ detail.platform || '未知平台' }}</h3>
                <p class="detail-mono">{{ detail.deviceId || '暂无设备 ID' }}</p>
              </div>
              <div class="detail-hero__meta">
                <el-tag :type="detail.tokenExpired === false ? 'success' : detail.tokenExpired === true ? 'warning' : 'info'" effect="light" round>
                  {{ detail.tokenExpired === false ? 'Token 正常' : detail.tokenExpired === true ? 'Token 已过期' : 'Token 状态未知' }}
                </el-tag>
                <span class="detail-hero__aux">{{ detail.user?.nickname || detail.user?.username || '未关联用户' }}</span>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">设备标识</div>
                <h4>基础信息</h4>
              </div>
              <div class="detail-grid detail-grid--single">
                <div class="detail-item">
                  <div class="detail-item__topline">
                    <span class="detail-label">记录 ID</span>
                    <el-button text type="primary" size="small" @click="copyText(detail.id, '记录 ID')">复制</el-button>
                  </div>
                  <div class="detail-value detail-mono">{{ detail.id || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item__topline">
                    <span class="detail-label">设备 ID</span>
                    <el-button text type="primary" size="small" @click="copyText(detail.deviceId, '设备 ID')">复制</el-button>
                  </div>
                  <div class="detail-value detail-mono">{{ detail.deviceId || '暂无设备 ID' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">平台</span>
                  <div class="detail-value">{{ detail.platform || '未知' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">Token 状态</span>
                  <div class="detail-status-row">
                    <el-tag :type="detail.tokenExpired === false ? 'success' : detail.tokenExpired === true ? 'warning' : 'info'" effect="light" round>
                      {{ detail.tokenExpired === false ? '正常' : detail.tokenExpired === true ? '已过期' : '未知' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">用户关联</div>
                <h4>归属信息</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">用户 ID</span>
                  <div class="detail-value detail-mono">{{ detail.userId || '未关联用户' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <div class="detail-item__topline">
                    <span class="detail-label">所属用户</span>
                    <el-button v-if="detail.user?.id" text type="primary" size="small" :disabled="actionLoading || detailLoading" @click="goToUserDetail(detail.user.id)">查看用户</el-button>
                  </div>
                  <div class="detail-value">{{ detail.user?.nickname || detail.user?.username || '未关联用户' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">用户邮箱</span>
                  <div class="detail-value">{{ detail.user?.email || '暂无邮箱' }}</div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">活跃时间</div>
                <h4>生命周期</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item detail-item--half">
                  <span class="detail-label">创建设备时间</span>
                  <div class="detail-value">{{ detail.createDateText || '暂无记录' }}</div>
                  <div v-if="detail.createDate" class="detail-subvalue">{{ formatRelativeTime(detail.createDate) }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">最近活跃</span>
                  <div class="detail-value">{{ detail.lastActiveDateText || '暂无记录' }}</div>
                  <div v-if="detail.lastActiveDate" class="detail-subvalue">{{ formatRelativeTime(detail.lastActiveDate) }}</div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">操作</div>
                <h4>设备操作</h4>
              </div>
              <div class="detail-action-card detail-action-card--danger detail-item" :class="{ 'is-busy': actionLoading }">
                <p class="detail-action-card__desc">移除后，该设备将从当前设备列表中消失。建议仅用于清理失效或不再使用的设备记录。</p>
                <div class="detail-action-card__actions">
                  <el-button type="danger" :loading="actionLoading" @click="handleRemoveDevice">移除设备</el-button>
                  <el-button :disabled="actionLoading || detailLoading" @click="openPushDialog">推送消息</el-button>
                </div>
              </div>
            </section>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>

    <el-dialog
      v-model="pushDialogVisible"
      title="推送消息"
      width="980px"
      top="5vh"
      destroy-on-close
      class="push-create-dialog"
    >
      <div class="push-create-dialog__desc">向当前设备发送一条消息，只会命中这台设备，不会广播给该用户的全部设备。</div>
      <PushCreateForm
        ref="pushCreateFormRef"
        :initial-target-type="'device'"
        :initial-user-id="detail?.userId || ''"
        :initial-device-id="detail?.id || ''"
        :initial-device-label="detail?.deviceId || ''"
        :lock-target="true"
        @success="handlePushSuccess"
      />
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getDeviceDetail, getDevices, removeDevice } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import AdminSectionHeader from '../components/AdminSectionHeader.vue'
import PushCreateForm from '../components/PushCreateForm.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detailLoading = ref(false)
const actionLoading = ref(false)
const detailVisible = ref(false)
const pushDialogVisible = ref(false)
const detail = ref(null)
const pushCreateFormRef = ref(null)
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

const platformSummary = computed(() => {
  return rows.value.reduce(
    (acc, item) => {
      const key = String(item?.platform || 'unknown').toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {}
  )
})

const topPlatformText = computed(() => {
  const entries = Object.entries(platformSummary.value)
  if (!entries.length) return '暂无平台数据'
  const [platform, count] = entries.sort((a, b) => b[1] - a[1])[0]
  return `${platform}（${count}）`
})

const linkedUserCount = computed(() => rows.value.filter((item) => item.user?.id).length)

const summaryCards = computed(() => [
  {
    key: 'rows',
    label: '当前页设备',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'platform',
    label: '主要平台',
    value: topPlatformText.value,
    meta: '当前页最高占比',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'linked',
    label: '已绑定用户',
    value: linkedUserCount.value,
    meta: '具备用户关联',
    icon: '△',
    tone: 'warning'
  }
])

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function copyText(value, label) {
  const text = String(value || '').trim()
  if (!text) {
    ElMessage.warning(`${label} 暂无可复制内容`)
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`${label} 已复制`)
  } catch {
    ElMessage.error(`${label} 复制失败`)
  }
}

function formatRelativeTime(value) {
  const time = Number(value || 0)
  if (!time) return ''

  const diff = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return '较早之前'
}

function syncDetailQuery(id = '') {
  const nextQuery = { ...route.query }

  if (id) nextQuery.detail = id
  else delete nextQuery.detail

  router.replace({ path: route.path, query: nextQuery })
}

function goToUserDetail(userId) {
  if (!userId) return
  router.push({ path: '/users', query: { detail: userId } })
}

function getRowClassName({ row }) {
  return row?.id && String(row.id) === String(route.query.detail || '') ? 'is-current-detail-row' : ''
}

function openPushDialog() {
  if (!detail.value?.id) return
  pushDialogVisible.value = true
}

function handlePushSuccess() {
  ElMessage.success('推送请求已提交')
  pushDialogVisible.value = false
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
  const id = row?.id || row
  if (!id) return

  detailVisible.value = true
  detailLoading.value = true
  syncDetailQuery(id)

  try {
    const res = await getDeviceDetail(id)
    detail.value = res?.data?.data || null
  } catch (error) {
    detail.value = null
    ElMessage.error(error?.response?.data?.msg || '设备详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleRemoveDevice() {
  if (!detail.value?.id || actionLoading.value) return

  try {
    await ElMessageBox.confirm(
      '移除后，该设备将从当前设备列表中消失。此操作用于清理失效或不再使用的设备记录。',
      '确认移除这台设备？',
      {
        confirmButtonText: '确认移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.info('已取消操作')
    }
    return
  }

  actionLoading.value = true
  try {
    await removeDevice(detail.value.id)
    ElMessage.success('设备已移除')
    detailVisible.value = false
    detail.value = null
    syncDetailQuery('')
    await fetchDevices()
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '设备移除失败')
  } finally {
    actionLoading.value = false
  }
}

function clearUserFilter() {
  const nextQuery = { ...route.query }
  delete nextQuery.userId
  router.replace({ path: route.path, query: nextQuery })
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

watch(detailVisible, (visible) => {
  if (!visible) {
    detail.value = null
    pushDialogVisible.value = false
    syncDetailQuery('')
  }
})

watch(() => route.query.userId, (value) => {
  const nextUserId = String(value || '')
  if (query.userId === nextUserId) return
  query.userId = nextUserId
  query.page = 1
  fetchDevices()
}, { immediate: true })

onMounted(async () => {
  if (!rows.value.length) {
    await fetchDevices()
  }
  if (route.query.detail) {
    openDetail(String(route.query.detail))
  }
})
</script>

<style scoped>
.devices-page,
.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  padding: 22px;
}

.summary-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  word-break: break-word;
}

.summary-card__meta {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 13px;
}

.summary-card--success {
  background: linear-gradient(180deg, #ffffff, #f7fcf8);
}

.active-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
}

.active-filter-banner__eyebrow {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.active-filter-banner__content h3 {
  margin: 8px 0 0;
  color: #0f172a;
}

.active-filter-banner__content p {
  margin: 8px 0 0;
  color: #64748b;
}

.active-filter-banner__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-filter-banner__id {
  padding: 8px 12px;
  border-radius: 999px;
  background: #f8fbff;
  border: 1px solid #d8e6ff;
  color: #1e3a8a;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
}

.summary-card--warning {
  background: linear-gradient(180deg, #ffffff, #fffaf3);
}

.sub-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.detail-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  border: 1px solid #e6edf5;
}

.detail-hero__eyebrow,
.detail-section__eyebrow {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-hero__main h3,
.detail-section__head h4 {
  margin: 8px 0 0;
  color: #0f172a;
}

.detail-hero__main h3 {
  font-size: 24px;
  line-height: 1.15;
}

.detail-hero__main p {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
}

.detail-hero__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.detail-hero__aux {
  color: #64748b;
  font-size: 13px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-section__head h4 {
  font-size: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-grid--single {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

.detail-item--half {
  min-width: 0;
}

.detail-action-card {
  transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.detail-action-card.is-busy {
  opacity: 0.84;
}

.detail-action-card--danger {
  background: linear-gradient(180deg, #ffffff, #fff6f6);
  border-color: #f2c8c8;
}

.detail-action-card__desc {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.detail-action-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.detail-item__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.detail-item__topline .detail-label {
  margin-bottom: 0;
}

.detail-value {
  color: #0f172a;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.detail-subvalue {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.detail-status-row {
  display: flex;
  align-items: center;
}

.detail-mono {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  word-break: break-all;
}

.table-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.table-link-button:hover {
  color: #1d4ed8;
}

.table-link-button--mono {
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

:deep(.admin-ui-refined-table .el-table__row.is-current-detail-row td) {
  background: rgba(37, 99, 235, 0.08) !important;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
