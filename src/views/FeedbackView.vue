<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="反馈中心" subtitle="查看用户反馈、截图与后台回复处理">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchFeedback">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <section class="card filters-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model.trim="query.keyword" clearable placeholder="内容 / 联系方式 / 回复内容" style="width: 280px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="Bug" value="bug" />
            <el-option label="建议" value="suggestion" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复状态">
          <el-select v-model="query.replyStatus" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="未回复" value="0" />
            <el-option label="已回复" value="1" />
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

      <el-table :data="rows" stripe border v-loading="loading" empty-text="暂无反馈数据">
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="feedbackTypeTag(row.type)">{{ feedbackTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系方式" min-width="220" />
        <el-table-column label="内容" min-width="320">
          <template #default="{ row }">
            <div class="content-preview">{{ row.content || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="截图" width="90">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.screenshots?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回复状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.replyStatus === 1 ? 'success' : 'warning'">{{ row.replyStatus === 1 ? '已回复' : '未回复' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createDateText" label="提交时间" min-width="180" />
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

    <el-drawer v-model="detailVisible" title="反馈详情" size="680px">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-grid">
            <div><span class="label">ID</span><div class="mono">{{ detail.id }}</div></div>
            <div><span class="label">类型</span><div>{{ feedbackTypeText(detail.type) }}</div></div>
            <div><span class="label">联系方式</span><div>{{ detail.contact || '-' }}</div></div>
            <div><span class="label">提交时间</span><div>{{ detail.createDateText || '-' }}</div></div>
            <div><span class="label">回复状态</span><div>{{ detail.replyStatus === 1 ? '已回复' : '未回复' }}</div></div>
            <div><span class="label">回复时间</span><div>{{ detail.replyTimeText || '-' }}</div></div>
            <div class="full-row"><span class="label">反馈内容</span><div class="multiline-box">{{ detail.content || '-' }}</div></div>
            <div class="full-row">
              <span class="label">截图预览</span>
              <div v-if="detail.screenshots?.length" class="screenshot-gallery">
                <div v-for="(item, index) in detail.screenshots" :key="index" class="screenshot-card">
                  <el-image
                    :src="item"
                    :preview-src-list="detail.screenshots"
                    :initial-index="index"
                    fit="cover"
                    class="screenshot-image"
                    preview-teleported
                  >
                    <template #error>
                      <div class="screenshot-fallback">加载失败</div>
                    </template>
                  </el-image>
                  <a :href="item" target="_blank" rel="noreferrer" class="screenshot-link">{{ item }}</a>
                </div>
              </div>
              <el-empty v-else description="暂无截图" :image-size="84" />
            </div>
            <div class="full-row"><span class="label">当前回复</span><div class="multiline-box">{{ detail.replyContent || '-' }}</div></div>
          </div>

          <section v-if="detail" class="reply-panel">
            <div class="reply-panel__title">后台回复</div>
            <el-form label-position="top" @submit.prevent>
              <el-form-item label="回复状态">
                <el-select v-model="replyForm.replyStatus" style="width: 180px">
                  <el-option label="未回复" :value="0" />
                  <el-option label="已回复" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item label="回复内容">
                <el-input v-model="replyForm.replyContent" type="textarea" :rows="5" maxlength="1000" show-word-limit />
              </el-form-item>
              <div class="reply-actions">
                <el-button :loading="replySaving" type="primary" @click="submitReply">保存回复</el-button>
              </div>
            </el-form>
          </section>
        </template>
      </el-skeleton>
    </el-drawer>
  </AdminPageLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeedbackDetail, getFeedbackList, replyFeedback } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const replySaving = ref(false)
const detail = ref(null)
const rows = ref([])
const total = ref(0)
const errorMessage = ref('')
const lastRefreshText = ref('--')

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  type: 'all',
  replyStatus: 'all'
})

const replyForm = reactive({
  replyStatus: 1,
  replyContent: ''
})

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function feedbackTypeText(type) {
  if (type === 'bug') return 'Bug'
  if (type === 'suggestion') return '建议'
  return '其他'
}

function feedbackTypeTag(type) {
  if (type === 'bug') return 'danger'
  if (type === 'suggestion') return 'success'
  return 'info'
}

async function fetchFeedback() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getFeedbackList({ ...query })
    const data = res?.data?.data || {}
    rows.value = data.list || []
    total.value = Number(data.total || 0)
    lastRefreshText.value = formatNow()
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '反馈列表加载失败'
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
    const res = await getFeedbackDetail(row.id)
    detail.value = res?.data?.data || null
    replyForm.replyStatus = Number(detail.value?.replyStatus || 0)
    replyForm.replyContent = detail.value?.replyContent || ''
  } catch (error) {
    detail.value = null
    ElMessage.error(error?.response?.data?.msg || '反馈详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function submitReply() {
  if (!detail.value?.id) return
  if (!String(replyForm.replyContent || '').trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }

  replySaving.value = true
  try {
    const res = await replyFeedback(detail.value.id, {
      replyStatus: replyForm.replyStatus,
      replyContent: replyForm.replyContent
    })
    detail.value = res?.data?.data || detail.value
    replyForm.replyStatus = Number(detail.value?.replyStatus || 0)
    replyForm.replyContent = detail.value?.replyContent || ''
    ElMessage.success(res?.data?.msg || '反馈回复已保存')
    fetchFeedback()
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '反馈回复保存失败')
  } finally {
    replySaving.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchFeedback()
}

function reset() {
  query.page = 1
  query.pageSize = 20
  query.keyword = ''
  query.type = 'all'
  query.replyStatus = 'all'
  fetchFeedback()
}

function handlePageChange(page) {
  query.page = page
  fetchFeedback()
}

function handleSizeChange(size) {
  query.page = 1
  query.pageSize = size
  fetchFeedback()
}

onMounted(() => {
  fetchFeedback()
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-row {
  grid-column: 1 / -1;
}

.label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.mono {
  font-family: Consolas, Monaco, monospace;
  word-break: break-all;
}

.multiline-box {
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;
}

.screenshot-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.screenshot-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: #f8fafc;
  padding: 10px;
}

.screenshot-image {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  display: block;
  background: #eef2f7;
}

.screenshot-fallback {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: #eef2f7;
}

.screenshot-link {
  display: block;
  margin-top: 8px;
  color: #2563eb;
  word-break: break-all;
  text-decoration: none;
  font-size: 12px;
  line-height: 1.5;
}

.reply-panel {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.reply-panel__title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
