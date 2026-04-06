<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="反馈中心" subtitle="查看用户反馈、截图与后台回复处理">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchFeedback">刷新</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="feedback-page admin-ui-page">
      <AdminPageHero
        kicker="Feedback"
        title="先聚焦信号，再处理回复"
        description="把反馈类型、回复状态和内容预览放进统一结构里，帮助你先识别高优先级问题，再进入详情完成截图查看与后台回复。"
        :side-note="`当前回复状态：${replyStatusLabel}`"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--warning"></span>
              支持未回复筛选
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              可直接后台回复
            </span>
          </div>
        </template>
      </AdminPageHero>

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>反馈概览</h3>
        </div>
        <p>先看当前页反馈类型和待处理量，再进入列表与详情展开处理。</p>
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
          description="按内容、联系方式、类型和回复状态快速锁定目标反馈。"
          compact
        />

        <el-form :inline="true" class="admin-ui-form-inline" @submit.prevent>
          <el-form-item label="关键词">
            <el-input
              v-model.trim="query.keyword"
              clearable
              placeholder="内容 / 联系方式 / 回复内容"
              style="width: 280px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="query.type" style="width: 140px" @change="handleSearch">
              <el-option label="全部" value="all" />
              <el-option label="Bug" value="bug" />
              <el-option label="建议" value="suggestion" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="回复状态">
            <el-select v-model="query.replyStatus" style="width: 140px" @change="handleSearch">
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

      <section class="admin-ui-card admin-ui-panel">
        <AdminSectionHeader
          kicker="Table"
          title="反馈列表"
          description="先看类型、联系方式与内容摘要，再进入详情处理截图和回复。"
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

        <el-table :data="rows" v-loading="loading" empty-text="暂无反馈数据" class="admin-ui-refined-table">
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="feedbackTypeTag(row.type)" effect="light" round>{{ feedbackTypeText(row.type) }}</el-tag>
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
              <el-tag type="info" effect="plain" round>{{ row.screenshots?.length || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="回复状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.replyStatus === 1 ? 'success' : 'warning'" effect="light" round>
                {{ row.replyStatus === 1 ? '已回复' : '未回复' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createDateText" label="提交时间" min-width="180" />
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

    <el-drawer v-model="detailVisible" title="反馈详情" size="680px">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <div v-if="detail" class="detail-grid">
            <div class="detail-item"><span class="detail-label">ID</span><div class="detail-mono">{{ detail.id }}</div></div>
            <div class="detail-item"><span class="detail-label">类型</span><div>{{ feedbackTypeText(detail.type) }}</div></div>
            <div class="detail-item"><span class="detail-label">联系方式</span><div>{{ detail.contact || '-' }}</div></div>
            <div class="detail-item"><span class="detail-label">提交时间</span><div>{{ detail.createDateText || '-' }}</div></div>
            <div class="detail-item"><span class="detail-label">回复状态</span><div>{{ detail.replyStatus === 1 ? '已回复' : '未回复' }}</div></div>
            <div class="detail-item"><span class="detail-label">回复时间</span><div>{{ detail.replyTimeText || '-' }}</div></div>
            <div class="detail-item detail-item--full"><span class="detail-label">反馈内容</span><div class="multiline-box">{{ detail.content || '-' }}</div></div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">截图预览</span>
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
            <div class="detail-item detail-item--full"><span class="detail-label">当前回复</span><div class="multiline-box">{{ detail.replyContent || '-' }}</div></div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeedbackDetail, getFeedbackList, replyFeedback } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import AdminSectionHeader from '../components/AdminSectionHeader.vue'

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

const replyStatusLabel = computed(() => {
  if (query.replyStatus === '0') return '仅未回复'
  if (query.replyStatus === '1') return '仅已回复'
  return '全部反馈'
})

const unrepliedCount = computed(() => rows.value.filter((item) => Number(item.replyStatus) !== 1).length)
const bugCount = computed(() => rows.value.filter((item) => item.type === 'bug').length)
const suggestionCount = computed(() => rows.value.filter((item) => item.type === 'suggestion').length)

const summaryCards = computed(() => [
  {
    key: 'rows',
    label: '当前页反馈',
    value: rows.value.length,
    meta: `分页总量 ${total.value}`,
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'unreplied',
    label: '待回复',
    value: unrepliedCount.value,
    meta: '建议优先处理',
    icon: '!',
    tone: 'warning'
  },
  {
    key: 'bug',
    label: 'Bug 反馈',
    value: bugCount.value,
    meta: `建议 ${suggestionCount.value} 条`,
    icon: '△',
    tone: 'danger'
  }
])

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
.feedback-page,
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

.summary-card--warning {
  background: linear-gradient(180deg, #ffffff, #fffaf3);
}

.summary-card--danger {
  background: linear-gradient(180deg, #ffffff, #fff7f7);
}

.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.detail-mono {
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

@media (max-width: 1280px) {
  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
