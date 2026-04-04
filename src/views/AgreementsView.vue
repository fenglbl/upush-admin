<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="协议管理" subtitle="管理协议列表、预览内容并发布生效版本">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchAgreements">刷新</el-button>
          <el-button type="primary" @click="goCreate">新建协议</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <section class="card filters-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model.trim="query.keyword" clearable placeholder="标题 / 内容 / 协议ID" style="width: 260px" />
        </el-form-item>
        <el-form-item label="协议类型">
          <el-select v-model="query.agreementId" style="width: 180px">
            <el-option label="全部" value="all" />
            <el-option label="用户服务协议" value="user_service" />
            <el-option label="隐私政策" value="privacy_policy" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" style="width: 140px">
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

    <section class="card table-card">
      <el-alert
        v-if="errorMessage"
        type="error"
        :closable="false"
        show-icon
        :title="errorMessage"
        class="table-alert"
      />

      <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无协议数据">
        <el-table-column prop="agreementId" label="协议 ID" min-width="150" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="内容预览" min-width="280">
          <template #default="{ row }">
            <div class="content-preview">{{ toPreviewText(row.content) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已发布' : '草稿' }}</el-tag>
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

    <el-dialog v-model="previewVisible" title="协议预览" width="860px">
      <div class="preview-dialog" v-html="previewContent"></div>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAgreements, publishAgreement } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

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
.refresh-time {
  color: var(--text-secondary);
  font-size: 13px;
}

.filters-card,
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 18px;
}

.table-card {
  margin-top: 16px;
}

.table-alert {
  margin-bottom: 16px;
}

.content-preview {
  color: var(--text-primary);
  line-height: 1.7;
  white-space: normal;
  word-break: break-word;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.preview-dialog {
  min-height: 280px;
  line-height: 1.75;
  word-break: break-word;
}
</style>
