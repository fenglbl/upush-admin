<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="版本管理" subtitle="管理客户端版本列表、编辑信息并发布生效版本">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchVersions">刷新</el-button>
          <el-button type="primary" @click="goCreate">新建版本</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <section class="card filters-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model.trim="query.keyword" clearable placeholder="版本号 / 更新说明 / 下载地址" style="width: 280px" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="query.platform" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="App" value="app" />
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

      <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无版本数据">
        <el-table-column prop="platform" label="平台" width="90" />
        <el-table-column prop="versionName" label="版本号" min-width="130" />
        <el-table-column prop="versionCode" label="版本编码" width="110" />
        <el-table-column label="强制更新" width="110">
          <template #default="{ row }">
            <el-tag :type="row.forceUpdate ? 'danger' : 'info'">{{ row.forceUpdate ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已发布' : '草稿' }}</el-tag>
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

    <el-dialog v-model="previewVisible" title="版本预览" width="760px">
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVersions, publishVersion } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

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

.notes-preview {
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

.preview-dialog__title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
}

.preview-dialog__meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.preview-dialog__notes,
.preview-dialog__url {
  line-height: 1.75;
  word-break: break-word;
}
</style>
