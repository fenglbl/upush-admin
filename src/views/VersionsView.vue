<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="版本管理" subtitle="管理客户端版本列表、编辑信息并发布生效版本">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchVersions">刷新</el-button>
          <el-button type="primary" @click="goCreate">新建版本</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="versions-page admin-ui-page">
      <AdminPageHero
        kicker="Versions"
        title="把版本节奏、发布状态和升级策略放进同一层级"
        description="先看当前页版本数量、发布状态和强更分布，再进入编辑、预览或发布，整体视觉与其他运营列表页保持一致。"
        :side-note="`当前平台：${platformLabel}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              支持版本预览
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--warning"></span>
              包含强更标记
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>版本概览</h3>
        </div>
        <p>先看当前页发布状态和强制更新分布，再决定是否进入某个版本做详细处理。</p>
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
          kicker="Filter"
          title="筛选条件"
          description="按版本号、更新说明、平台和状态快速缩小目标版本。"
          compact
        />

        <el-form :inline="true" class="admin-ui-form-inline" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model.trim="query.keyword"
              clearable
              placeholder="版本号 / 更新说明 / 下载地址"
              style="width: 280px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="平台">
            <el-select v-model="query.platform" style="width: 140px" @change="handleSearch">
              <el-option label="全部" value="all" />
              <el-option label="App" value="app" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" style="width: 140px" @change="handleSearch">
              <el-option label="全部" value="all" />
              <el-option label="草稿" value="0" />
              <el-option label="已发布" value="1" />
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
          kicker="Table"
          title="版本列表"
          description="表格负责看节奏和升级策略，详情留给预览弹窗和编辑页。"
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

        <el-table :data="rows" v-loading="loading" empty-text="暂无版本数据" class="admin-ui-refined-table">
          <el-table-column prop="platform" label="平台" width="90" />
          <el-table-column prop="versionName" label="版本号" min-width="130" />
          <el-table-column prop="versionCode" label="版本编码" width="110" />
          <el-table-column label="强制更新" width="110">
            <template #default="{ row }">
              <el-tag :type="row.forceUpdate ? 'danger' : 'info'" effect="light" round>
                {{ row.forceUpdate ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
                {{ row.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新说明" min-width="260">
            <template #default="{ row }">
              <div class="notes-preview">{{ toPreviewText(row.notes) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="publishTimeText" label="发布时间" min-width="180" />
          <el-table-column prop="createDateText" label="创建时间" min-width="180" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="goEdit(row)">编辑</el-button>
              <el-button text @click="openPreview(row)">预览</el-button>
              <el-button v-if="row.status !== 1" text type="success" @click="handlePublish(row)">发布</el-button>
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

    <el-dialog v-model="previewVisible" title="版本预览" width="760px" class="preview-dialog-shell">
      <div class="preview-dialog">
        <div class="preview-dialog__title">{{ previewData.versionName || '-' }}</div>
        <div class="preview-dialog__meta">
          <span>平台：{{ previewData.platform || '-' }}</span>
          <span>版本编码：{{ previewData.versionCode || '-' }}</span>
          <span>强制更新：{{ previewData.forceUpdate ? '是' : '否' }}</span>
        </div>
        <div class="preview-dialog__notes">{{ previewData.notes || '暂无更新说明' }}</div>
        <div class="preview-dialog__url">下载地址：{{ previewData.downloadUrl || '-' }}</div>
      </div>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVersions, publishVersion } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import AdminSectionHeader from '../components/AdminSectionHeader.vue'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const errorMessage = ref('')
const lastRefreshText = ref('--')
const previewVisible = ref(false)
const previewData = ref({})

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  platform: 'all',
  status: 'all'
})

const platformLabel = computed(() => {
  if (query.platform === 'app') return 'App'
  return '全部平台'
})

const publishedCount = computed(() => rows.value.filter((item) => item.status === 1).length)
const draftCount = computed(() => rows.value.filter((item) => item.status !== 1).length)
const forceCount = computed(() => rows.value.filter((item) => Boolean(item.forceUpdate)).length)

const summaryCards = computed(() => [
  {
    key: 'rows',
    label: '当前页版本',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'published',
    label: '已发布',
    value: publishedCount.value,
    meta: '当前上线版本',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'force',
    label: '强制更新',
    value: forceCount.value,
    meta: `草稿 ${draftCount.value} 个`,
    icon: '!',
    tone: 'danger'
  }
])

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function toPreviewText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120) || '-'
}

async function fetchVersions() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getVersions({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    errorMessage.value = error?.response?.data?.msg || '版本列表加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/versions/new')
}

function goEdit(row) {
  if (!row?.id) return
  router.push(`/versions/${row.id}/edit`)
}

function openPreview(row) {
  previewData.value = row || {}
  previewVisible.value = true
}

async function handlePublish(row) {
  if (!row?.id) return
  try {
    await ElMessageBox.confirm(`确认发布版本 ${row.versionName} 吗？`, '发布确认', {
      type: 'warning'
    })
    const res = await publishVersion(row.id)
    ElMessage.success(res?.data?.msg || '版本发布成功')
    fetchVersions()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.msg || '版本发布失败')
  }
}

function handleSearch() {
  query.page = 1
  fetchVersions()
}

function reset() {
  query.page = 1
  query.pageSize = 20
  query.keyword = ''
  query.platform = 'all'
  query.status = 'all'
  fetchVersions()
}

function handlePageChange(page) {
  query.page = page
  fetchVersions()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchVersions()
}

onMounted(() => {
  fetchVersions()
})
</script>

<style scoped>
.versions-page,
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

.summary-card--danger {
  background: linear-gradient(180deg, #ffffff, #fff7f7);
}

.notes-preview {
  color: var(--text-primary);
  line-height: 1.7;
  white-space: normal;
  word-break: break-word;
}

.preview-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.preview-dialog__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.preview-dialog__meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.preview-dialog__notes,
.preview-dialog__url {
  line-height: 1.75;
  word-break: break-word;
  padding: 16px 18px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
