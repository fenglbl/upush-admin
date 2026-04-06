<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="协议管理" subtitle="管理协议列表、预览内容并发布生效版本">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchAgreements">刷新</el-button>
          <el-button type="primary" @click="goCreate">新建协议</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="agreements-page admin-ui-page">
      <AdminPageHero
        kicker="Agreements"
        title="把协议版本与发布状态放进同一视图里"
        description="先看协议类型、发布状态和内容概览，再决定进入编辑、预览还是直接发布，让法务内容管理也保持和整个后台一致的阅读节奏。"
        :side-note="`当前协议类型：${agreementTypeLabel}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              支持内容预览
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              可直接发布
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>协议概览</h3>
        </div>
        <p>优先看草稿与已发布数量，再结合类型筛选定位要处理的协议版本。</p>
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
          description="按标题、内容、协议类型与状态快速缩小范围。"
          compact
        />

        <el-form :inline="true" class="admin-ui-form-inline" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model.trim="query.keyword"
              clearable
              placeholder="标题 / 内容 / 协议ID"
              style="width: 260px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="协议类型">
            <el-select v-model="query.agreementId" style="width: 180px" @change="handleSearch">
              <el-option label="全部" value="all" />
              <el-option label="用户服务协议" value="user_service" />
              <el-option label="隐私政策" value="privacy_policy" />
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
          title="协议列表"
          description="列表负责展示发布状态与内容摘要，完整内容交给预览弹窗和编辑页。"
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

        <el-table :data="rows" v-loading="loading" empty-text="暂无协议数据" class="admin-ui-refined-table">
          <el-table-column prop="agreementId" label="协议 ID" min-width="150" />
          <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
          <el-table-column label="内容预览" min-width="280">
            <template #default="{ row }">
              <div class="content-preview">{{ toPreviewText(row.content) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
                {{ row.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
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

    <el-dialog v-model="previewVisible" title="协议预览" width="860px" class="preview-dialog-shell">
      <div class="preview-dialog">
        <div class="preview-dialog__meta">以只读方式预览当前协议 HTML 内容</div>
        <div class="preview-dialog__content" v-html="previewContent"></div>
      </div>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAgreements, publishAgreement } from '../api'
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
const previewContent = ref('')

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  agreementId: 'all',
  status: 'all'
})

const agreementTypeLabel = computed(() => {
  if (query.agreementId === 'user_service') return '用户服务协议'
  if (query.agreementId === 'privacy_policy') return '隐私政策'
  return '全部协议类型'
})

const publishedCount = computed(() => rows.value.filter((item) => item.status === 1).length)
const draftCount = computed(() => rows.value.filter((item) => item.status !== 1).length)

const summaryCards = computed(() => [
  {
    key: 'rows',
    label: '当前页协议',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'published',
    label: '已发布',
    value: publishedCount.value,
    meta: '当前可生效版本',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'draft',
    label: '草稿',
    value: draftCount.value,
    meta: '待编辑或待发布',
    icon: '△',
    tone: 'warning'
  }
])

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toPreviewText(html) {
  const text = stripHtml(html)
  return text ? text.slice(0, 120) : '-'
}

async function fetchAgreements() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getAgreements({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    errorMessage.value = error?.response?.data?.msg || '协议列表加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/agreements/new')
}

function goEdit(row) {
  if (!row?.id) return
  router.push(`/agreements/${row.id}/edit`)
}

function openPreview(row) {
  previewContent.value = row?.content || '<p style="color:#94a3b8">暂无内容</p>'
  previewVisible.value = true
}

async function handlePublish(row) {
  if (!row?.id) return
  try {
    await ElMessageBox.confirm(`确认发布《${row.title || row.agreementId}》吗？`, '发布确认', {
      type: 'warning'
    })
    const res = await publishAgreement(row.id)
    ElMessage.success(res?.data?.msg || '协议发布成功')
    fetchAgreements()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.msg || '协议发布失败')
  }
}

function handleSearch() {
  query.page = 1
  fetchAgreements()
}

function reset() {
  query.page = 1
  query.pageSize = 20
  query.keyword = ''
  query.agreementId = 'all'
  query.status = 'all'
  fetchAgreements()
}

function handlePageChange(page) {
  query.page = page
  fetchAgreements()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchAgreements()
}

onMounted(() => {
  fetchAgreements()
})
</script>

<style scoped>
.agreements-page,
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

.content-preview {
  color: var(--text-primary);
  line-height: 1.7;
  white-space: normal;
  word-break: break-word;
}

.preview-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-dialog__meta {
  color: #94a3b8;
  font-size: 13px;
}

.preview-dialog__content {
  min-height: 280px;
  line-height: 1.75;
  word-break: break-word;
  padding: 20px 22px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
