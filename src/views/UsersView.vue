<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="用户管理" subtitle="基于 uni-id-users 的第一版用户列表与详情">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" :disabled="actionLoading" @click="fetchUsers">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="users-page admin-ui-page">
      <AdminPageHero
        kicker="用户管理"
        title="先看用户状态，再进入个体详情"
        description="把筛选、概览和列表放进同一套后台语言里，先快速判断当前用户池状态，再决定是否展开查看具体账号。"
        :side-note="`当前筛选：${statusLabel}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              支持关键词筛选
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              可快速进入详情
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">概览</div>
          <h3>用户概览</h3>
        </div>
        <p>先通过当前页数量、状态和关键词判断筛选是否合理，再往下查看表格与详情。</p>
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
          description="按用户名、昵称、邮箱和状态收敛目标用户。"
          compact
        />

        <el-form :inline="true" class="admin-ui-form-inline" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model.trim="query.keyword"
              clearable
              placeholder="用户名 / 昵称 / 邮箱"
              style="width: 260px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" style="width: 140px" @change="handleSearch">
              <el-option label="全部" value="all" />
              <el-option label="正常(1)" value="1" />
              <el-option label="禁用(0)" value="0" />
            </el-select>
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
          title="用户列表"
          description="表格保留最必要的信息，详情留给抽屉展开。"
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

        <el-table :data="rows" v-loading="loading" empty-text="暂无用户数据" class="admin-ui-refined-table" :row-class-name="getRowClassName">
          <el-table-column label="用户名" min-width="160">
            <template #default="{ row }">
              <button class="table-link-button" type="button" @click="openDetail(row)">{{ row.username || '-' }}</button>
            </template>
          </el-table-column>
          <el-table-column label="昵称" min-width="160">
            <template #default="{ row }">
              <button class="table-link-button" type="button" @click="openDetail(row)">{{ row.nickname || '-' }}</button>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="220" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'" effect="light" round>
                {{ row.status === 1 ? '正常' : row.status === 0 ? '禁用' : `状态 ${row.status}` }}
              </el-tag>
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

    <el-drawer v-model="detailVisible" title="用户详情" size="560px" class="detail-drawer">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-drawer-body">
            <section class="detail-hero">
              <div class="detail-hero__main">
                <div class="detail-hero__eyebrow">用户档案</div>
                <h3>{{ detail.nickname || detail.username || '未命名用户' }}</h3>
                <p>{{ detail.email || '未绑定邮箱' }}</p>
              </div>
              <div class="detail-hero__meta">
                <el-tag :type="detail.status === 1 ? 'success' : 'warning'" effect="light" round>
                  {{ detail.status === 1 ? '状态正常' : detail.status === 0 ? '已禁用' : `状态 ${detail.status}` }}
                </el-tag>
                <span class="detail-hero__aux">设备数 {{ detail.deviceCount ?? 0 }}</span>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">基础信息</div>
                <h4>账号标识</h4>
              </div>
              <div class="detail-grid detail-grid--single">
                <div class="detail-item">
                  <div class="detail-item__topline">
                    <span class="detail-label">用户 ID</span>
                    <el-button text type="primary" size="small" @click="copyText(detail.id, '用户 ID')">复制</el-button>
                  </div>
                  <div class="detail-value detail-mono">{{ detail.id || '-' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">用户名</span>
                  <div class="detail-value">{{ detail.username || '未设置' }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">昵称</span>
                  <div class="detail-value">{{ detail.nickname || '未设置' }}</div>
                </div>
                <div class="detail-item">
                  <span class="detail-label">邮箱</span>
                  <div class="detail-value">{{ detail.email || '未绑定邮箱' }}</div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">状态与活跃</div>
                <h4>账户状态</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item detail-item--half">
                  <span class="detail-label">当前状态</span>
                  <div class="detail-status-row">
                    <el-tag :type="detail.status === 1 ? 'success' : 'warning'" effect="light" round>
                      {{ detail.status === 1 ? '正常' : detail.status === 0 ? '禁用' : `状态 ${detail.status}` }}
                    </el-tag>
                  </div>
                </div>
                <div class="detail-item detail-item--half">
                  <div class="detail-item__topline">
                    <span class="detail-label">关联设备数</span>
                    <el-button v-if="detail.id" text type="primary" size="small" :disabled="actionLoading || detailLoading" @click="goToUserDevices(detail.id)">查看设备</el-button>
                  </div>
                  <div class="detail-value">{{ detail.deviceCount ?? 0 }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">注册时间</span>
                  <div class="detail-value">{{ detail.registerDateText || '暂无记录' }}</div>
                  <div v-if="detail.registerDate" class="detail-subvalue">{{ formatRelativeTime(detail.registerDate) }}</div>
                </div>
                <div class="detail-item detail-item--half">
                  <span class="detail-label">最近登录</span>
                  <div class="detail-value">{{ detail.lastLoginDateText || '暂无记录' }}</div>
                  <div v-if="detail.lastLoginDate" class="detail-subvalue">{{ formatRelativeTime(detail.lastLoginDate) }}</div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">操作</div>
                <h4>账户操作</h4>
              </div>
              <div class="detail-action-card detail-action-card--warn detail-item" :class="{ 'is-busy': actionLoading }">
                <p class="detail-action-card__desc">
                  {{ detail.status === 1 ? '当前账号处于正常状态，可执行禁用操作。' : '当前账号已被禁用，可恢复为可用状态。' }}
                </p>
                <div class="detail-action-card__actions">
                  <el-button
                    :type="detail.status === 1 ? 'danger' : 'primary'"
                    :loading="actionLoading"
                    @click="handleToggleUserStatus"
                  >
                    {{ detail.status === 1 ? '禁用用户' : '启用用户' }}
                  </el-button>
                  <el-button :disabled="actionLoading || detailLoading" @click="openPushDialog">推送消息</el-button>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="detail-section__head">
                <div class="detail-section__eyebrow">设备预览</div>
                <h4>最近设备</h4>
              </div>
              <div class="detail-mini-device-list detail-item">
                <div v-if="userDevicesLoading" class="detail-empty-text">设备预览加载中...</div>
                <div v-else-if="userDevices.length" class="mini-device-list">
                  <button
                    v-for="device in userDevices"
                    :key="device.id"
                    class="mini-device-card"
                    type="button"
                    @click="goToDeviceDetail(device.id)"
                  >
                    <div class="mini-device-card__head">
                      <strong>{{ device.platform || '未知平台' }}</strong>
                      <span>{{ device.lastActiveDateText || '暂无活跃记录' }}</span>
                    </div>
                    <div class="mini-device-card__id">{{ device.deviceId || '暂无设备 ID' }}</div>
                  </button>
                </div>
                <div v-else class="detail-empty-text">暂无关联设备预览</div>
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
      <div class="push-create-dialog__desc">向当前用户的全部可用设备发送一条消息，提交成功后会保留当前详情上下文。</div>
      <PushCreateForm
        ref="pushCreateFormRef"
        :initial-target-type="'user'"
        :initial-user-id="detail?.id || ''"
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
import { getDevices, getUserDetail, getUsers, updateUserStatus } from '../api'
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
const userDevices = ref([])
const userDevicesLoading = ref(false)
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

const statusLabel = computed(() => {
  if (query.status === '1') return '仅正常用户'
  if (query.status === '0') return '仅禁用用户'
  return '全部状态'
})

const normalCount = computed(() => rows.value.filter((item) => item.status === 1).length)
const abnormalCount = computed(() => rows.value.filter((item) => item.status !== 1).length)

const summaryCards = computed(() => [
  {
    key: 'rows',
    label: '当前页用户',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'normal',
    label: '正常状态',
    value: normalCount.value,
    meta: 'status = 0',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'abnormal',
    label: '其他状态',
    value: abnormalCount.value,
    meta: '建议重点查看',
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

function goToUserDevices(userId) {
  if (!userId) return
  router.push({ path: '/devices', query: { userId } })
}

function getRowClassName({ row }) {
  return row?.id && String(row.id) === String(route.query.detail || '') ? 'is-current-detail-row' : ''
}

async function fetchUserDevices(userId) {
  if (!userId) {
    userDevices.value = []
    return
  }

  userDevicesLoading.value = true
  try {
    const res = await getDevices({ userId, page: 1, pageSize: 3 })
    userDevices.value = res?.data?.data?.list || []
  } catch {
    userDevices.value = []
  } finally {
    userDevicesLoading.value = false
  }
}

function goToDeviceDetail(deviceId) {
  if (!deviceId) return
  router.push({ path: '/devices', query: { detail: deviceId } })
}

function openPushDialog() {
  if (!detail.value?.id) return
  pushDialogVisible.value = true
}

function handlePushSuccess() {
  ElMessage.success('推送请求已提交')
  pushDialogVisible.value = false
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
  const id = row?.id || row
  if (!id) return

  detailVisible.value = true
  detailLoading.value = true
  syncDetailQuery(id)

  try {
    const res = await getUserDetail(id)
    detail.value = res?.data?.data || null
    await fetchUserDevices(id)
  } catch (error) {
    detail.value = null
    ElMessage.error(error?.response?.data?.msg || '用户详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleToggleUserStatus() {
  if (!detail.value?.id || actionLoading.value) return

  const nextStatus = detail.value.status === 1 ? 0 : 1
  const isDisable = nextStatus === 0

  try {
    await ElMessageBox.confirm(
      isDisable
        ? '禁用后，该账号会变为不可用状态，但用户数据不会被删除。'
        : '启用后，该账号会恢复到可用状态。',
      isDisable ? '确认禁用该用户？' : '确认启用该用户？',
      {
        confirmButtonText: isDisable ? '确认禁用' : '确认启用',
        cancelButtonText: '取消',
        type: isDisable ? 'warning' : 'info'
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
    await updateUserStatus(detail.value.id, { status: nextStatus })
    ElMessage.success(isDisable ? '用户已禁用' : '用户已启用')
    await Promise.all([
      fetchUsers(),
      openDetail(detail.value.id)
    ])
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '用户状态更新失败')
  } finally {
    actionLoading.value = false
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

watch(detailVisible, (visible) => {
  if (!visible) {
    detail.value = null
    userDevices.value = []
    pushDialogVisible.value = false
    syncDetailQuery('')
  }
})

onMounted(async () => {
  await fetchUsers()
  if (route.query.detail) {
    openDetail(String(route.query.detail))
  }
})
</script>

<style scoped>
.users-page,
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
  font-size: 30px;
  line-height: 1.1;
  color: #0f172a;
}

.summary-card__meta {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 13px;
}

.summary-card--success {
  background: linear-gradient(180deg, #ffffff, #f7fcf8);
}

.summary-card--warning {
  background: linear-gradient(180deg, #ffffff, #fffaf3);
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

.detail-action-card {
  transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.detail-action-card.is-busy {
  opacity: 0.84;
}

.detail-action-card--warn {
  background: linear-gradient(180deg, #ffffff, #fffaf3);
  border-color: #f5dfb3;
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

.detail-mini-device-list {
  padding: 18px;
}

.mini-device-list {
  display: grid;
  gap: 12px;
}

.mini-device-card {
  padding: 14px 16px;
  border: 1px solid #e5edf6;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.mini-device-card:hover {
  border-color: #bfd4ff;
  background: #f8fbff;
}

.mini-device-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mini-device-card__head strong {
  color: #0f172a;
}

.mini-device-card__head span,
.mini-device-card__id,
.detail-empty-text {
  color: #64748b;
  font-size: 13px;
}

.mini-device-card__id {
  margin-top: 8px;
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

:deep(.admin-ui-refined-table .el-table__row.is-current-detail-row td) {
  background: rgba(37, 99, 235, 0.08) !important;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
