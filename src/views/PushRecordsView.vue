<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="推送记录" subtitle="基于 admin-push-batches 的批次数据（真实来源）">
        <template #actions>
          <el-tag type="info" effect="plain">MongoDB</el-tag>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button type="primary" @click="openCreateDialog">新建推送</el-button>
          <el-button :loading="loading" @click="fetchBatches">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="records-page admin-ui-page">
      <AdminPageHero
        kicker="Push Batches"
        title="按批次查看真实推送结果"
        description="聚焦每一次推送任务的发送状态、设备规模与失败分布，方便快速定位异常批次并进入详情排查。"
        :side-note="`当前范围：${rangeLabel}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              实时来源
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              数据可刷新
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="section-anchor admin-ui-section-anchor">
        <div>
          <div class="section-anchor__eyebrow admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>核心指标</h3>
        </div>
        <p>统一用更轻的卡片和更明确的层级来展示当前页推送结果。</p>
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
            <p>按时间、状态和关键词快速收敛目标批次。</p>
          </div>
        </div>

        <el-form :inline="true" class="filters-form admin-ui-form-inline" @submit.prevent>
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
              placeholder="标题 / 内容 / result msg"
              clearable
              style="width: 280px"
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

      <section class="table-shell page-card admin-ui-card admin-ui-panel">
        <div class="section-head section-head--compact admin-ui-section-head admin-ui-section-head--compact">
          <div>
            <div class="section-kicker admin-ui-kicker">Table</div>
            <h3>批次列表</h3>
            <p>优先查看失败与部分失败批次，再进入详情继续排查。</p>
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

        <el-table :data="rows" v-loading="loading" empty-text="暂无推送批次" class="refined-table admin-ui-refined-table">
          <el-table-column prop="createdAt" label="时间" min-width="170" />
          <el-table-column prop="title" label="标题" min-width="220" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="light" round>{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalDevices" label="设备数" width="90" />
          <el-table-column prop="successCount" label="成功" width="90" />
          <el-table-column prop="failureCount" label="失败" width="90" />
          <el-table-column prop="resultCode" label="Code" width="90" />
          <el-table-column prop="summary" label="摘要" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text @click="openDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap admin-ui-pagination">
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

    <el-dialog
      v-model="createDialogVisible"
      title="新建推送"
      width="980px"
      top="5vh"
      destroy-on-close
      class="push-create-dialog"
      @close="closeCreateDialog"
      @closed="handleDialogClosed"
    >
      <div class="push-create-dialog__desc">在当前页直接创建推送，提交成功后会自动刷新列表，并在有批次 ID 时跳转详情页。</div>
      <PushCreateForm ref="pushCreateFormRef" @success="handleCreateSuccess" />
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPushBatches } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import PushCreateForm from '../components/PushCreateForm.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const rows = ref([])
const total = ref(0)
const lastRefreshText = ref('--')
const createDialogVisible = ref(false)
const pushCreateFormRef = ref(null)

const query = reactive({
  page: 1,
  pageSize: 20,
  range: '7d',
  status: 'all',
  keyword: ''
})

const summaryCounts = computed(() => {
  return rows.value.reduce(
    (acc, item) => {
      const status = item?.status
      if (status === 'success') acc.success += 1
      else if (status === 'partial') acc.partial += 1
      else if (status === 'failed') acc.failed += 1
      else if (status === 'no_device') acc.noDevice += 1
      return acc
    },
    {
      success: 0,
      partial: 0,
      failed: 0,
      noDevice: 0
    }
  )
})

const rangeLabel = computed(() => {
  if (query.range === '24h') return '24小时'
  if (query.range === '30d') return '30天'
  return '7天'
})

const primaryStatusText = computed(() => {
  const entries = [
    { key: 'success', label: '成功批次为主', value: summaryCounts.value.success },
    { key: 'partial', label: '部分失败较多', value: summaryCounts.value.partial },
    { key: 'failed', label: '失败批次较多', value: summaryCounts.value.failed },
    { key: 'noDevice', label: '无设备批次较多', value: summaryCounts.value.noDevice }
  ]

  const top = entries.sort((a, b) => b.value - a.value)[0]
  return top?.value > 0 ? `${top.label}（${top.value}）` : '当前页暂无批次数据'
})

const summaryCards = computed(() => [
  {
    key: 'all',
    label: '当前页总数',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'success',
    label: '成功',
    value: summaryCounts.value.success,
    meta: '发送结果稳定',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'partial',
    label: '部分失败',
    value: summaryCounts.value.partial,
    meta: '建议优先关注波动',
    icon: '△',
    tone: 'warning'
  },
  {
    key: 'failed',
    label: '失败',
    value: summaryCounts.value.failed,
    meta: '建议进入详情排查',
    icon: '!',
    tone: 'danger'
  },
  {
    key: 'noDevice',
    label: '无设备',
    value: summaryCounts.value.noDevice,
    meta: '请检查目标设备状态',
    icon: '·',
    tone: 'default'
  }
])

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

function openCreateDialog() {
  const nextQuery = { ...route.query, create: '1' }
  router.push({ path: route.path, query: nextQuery })
}

async function closeCreateDialog() {
  const isDirty = pushCreateFormRef.value?.isDirty?.() ?? false

  if (isDirty) {
    try {
      await ElMessageBox.confirm('当前弹窗里还有未保存内容，确认现在关闭吗？', '关闭确认', {
        type: 'warning',
        confirmButtonText: '确认关闭',
        cancelButtonText: '继续编辑'
      })
    } catch {
      createDialogVisible.value = true
      return
    }
  }

  if (route.query.create === '1') {
    const nextQuery = { ...route.query }
    delete nextQuery.create
    router.push({ path: route.path, query: nextQuery })
    return
  }

  createDialogVisible.value = false
}

function handleDialogClosed() {
  pushCreateFormRef.value?.resetForm?.()
}

async function handleCreateSuccess(body) {
  await fetchBatches()

  const batchId = body?.data?.batchId
  closeCreateDialog()

  if (batchId) {
    router.push(`/push-records/${batchId}`)
  }
}

watch(
  () => route.query.create,
  (value) => {
    createDialogVisible.value = value === '1'
  },
  { immediate: true }
)

onMounted(() => {
  fetchBatches()
})
</script>

<style scoped>
.records-page {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.summary-card--success {
  background: linear-gradient(180deg, #ffffff 0%, #f7fcf8 100%);
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

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.push-create-dialog__desc {
  margin-bottom: 18px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.75;
}

:deep(.push-create-dialog .el-dialog) {
  border-radius: 24px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

:deep(.push-create-dialog .el-dialog__header) {
  flex: 0 0 auto;
}

:deep(.push-create-dialog .el-dialog__body) {
  padding-top: 12px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.push-create-dialog .el-overlay-dialog) {
  overflow-y: auto;
  padding: 0 0 24px;
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
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
