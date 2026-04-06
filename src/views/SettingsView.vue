<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="系统设置" subtitle="支持推送、日志与界面配置的第一版读写">
        <template #actions>
          <span class="admin-ui-refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchSettings">刷新</el-button>
          <el-button @click="resetToServer">重置为当前保存值</el-button>
          <el-button :loading="saving" type="primary" @click="saveCurrentSettings">保存设置</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <div class="settings-page admin-ui-page">
      <AdminPageHero
        kicker="Settings"
        title="把后台偏好整理成可读、可保存的控制面板"
        description="将推送、日志与界面偏好拆成三组设置卡，保留统一视觉层级，同时提供即时预览与恢复能力。"
        :side-note="serverMeta.updatedAtText ? `最近保存：${serverMeta.updatedAtText}` : '尚未读取到保存时间'"
      >
        <template #side>
          <div class="admin-ui-pill-group">
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--primary"></span>
              支持即时预览
            </span>
            <span class="admin-ui-pill">
              <span class="admin-ui-pill__dot admin-ui-pill__dot--success"></span>
              可恢复服务器值
            </span>
          </div>
        </template>
      </AdminPageHero>

      <el-alert
        v-if="errorMessage"
        type="error"
        :closable="false"
        show-icon
        :title="errorMessage"
        class="admin-ui-table-alert"
      />

      <section class="admin-ui-section-anchor">
        <div>
          <div class="admin-ui-section-anchor__eyebrow">Overview</div>
          <h3>设置概览</h3>
        </div>
        <p>一页完成推送、日志与界面偏好的编辑，同时保留当前配置摘要，减少来回切换和误保存。</p>
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

      <div class="settings-layout">
        <div class="settings-main">
          <section class="admin-ui-card admin-ui-panel">
            <AdminSectionHeader
              kicker="Push"
              title="推送设置"
              description="控制后台默认推送行为与创建页体验。"
              compact
            />

            <el-form label-position="top" class="settings-form-grid">
              <el-form-item label="默认时间范围">
                <el-select v-model="form.push.defaultRange" style="width: 220px">
                  <el-option label="7天" value="7d" />
                  <el-option label="30天" value="30d" />
                  <el-option label="24小时" value="24h" />
                </el-select>
              </el-form-item>

              <el-form-item label="默认目标模式">
                <el-select v-model="form.push.defaultTargetMode" style="width: 220px">
                  <el-option label="用户" value="user" />
                  <el-option label="分组" value="group" />
                  <el-option label="全部" value="all" />
                </el-select>
              </el-form-item>

              <el-form-item label="默认 payload 模板">
                <el-select v-model="form.push.defaultPayloadTemplate" style="width: 240px">
                  <el-option label="default" value="default" />
                  <el-option label="simple" value="simple" />
                  <el-option label="system_notice" value="system_notice" />
                </el-select>
              </el-form-item>

              <el-form-item class="settings-form-grid__full">
                <el-switch v-model="form.push.autoOpenBatchDetail" active-text="提交后自动打开批次详情" />
              </el-form-item>
            </el-form>
          </section>

          <section class="admin-ui-card admin-ui-panel">
            <AdminSectionHeader
              kicker="Logs"
              title="日志设置"
              description="控制日志中心默认筛选与行为。"
              compact
            />

            <el-form label-position="top" class="settings-form-grid">
              <el-form-item label="默认日志级别">
                <el-select v-model="form.logs.defaultLevel" style="width: 220px">
                  <el-option label="全部" value="" />
                  <el-option label="INFO" value="INFO" />
                  <el-option label="WARN" value="WARN" />
                  <el-option label="ERROR" value="ERROR" />
                </el-select>
              </el-form-item>

              <el-form-item label="默认返回条数">
                <el-input-number v-model="form.logs.defaultLimit" :min="1" :max="500" />
              </el-form-item>

              <el-form-item label="默认排序">
                <el-select v-model="form.logs.defaultOrder" style="width: 220px">
                  <el-option label="倒序(desc)" value="desc" />
                  <el-option label="正序(asc)" value="asc" />
                </el-select>
              </el-form-item>

              <el-form-item class="settings-form-grid__full">
                <el-switch v-model="form.logs.keepQueryInUrl" active-text="保留筛选参数到 URL" />
              </el-form-item>
            </el-form>
          </section>

          <section class="admin-ui-card admin-ui-panel">
            <AdminSectionHeader
              kicker="UI"
              title="界面设置"
              description="控制后台名称、主题与界面显示偏好。"
              compact
            />

            <el-form label-position="top" class="settings-form-grid">
              <el-form-item label="后台名称">
                <el-input v-model.trim="form.ui.appName" maxlength="60" show-word-limit style="width: 320px" />
              </el-form-item>

              <el-form-item label="主题">
                <el-select v-model="form.ui.theme" style="width: 220px">
                  <el-option label="light" value="light" />
                  <el-option label="dark" value="dark" />
                  <el-option label="system" value="system" />
                </el-select>
              </el-form-item>

              <el-form-item class="settings-form-grid__full">
                <el-switch v-model="form.ui.showQuickActions" active-text="显示 Dashboard 快捷卡片" />
              </el-form-item>

              <el-form-item class="settings-form-grid__full">
                <el-switch v-model="form.ui.compactTable" active-text="表格使用紧凑模式（预留）" />
              </el-form-item>
            </el-form>
          </section>
        </div>

        <aside class="settings-side">
          <section class="admin-ui-card admin-ui-panel preview-card">
            <AdminSectionHeader
              kicker="Preview"
              title="当前预览"
              description="保存前先确认核心偏好是否符合预期。"
              compact
            />

            <ul class="preview-list">
              <li><strong>名称：</strong>{{ form.ui.appName || 'UPUSH Admin' }}</li>
              <li><strong>主题：</strong>{{ form.ui.theme }}</li>
              <li><strong>快捷卡片：</strong>{{ form.ui.showQuickActions ? '显示' : '隐藏' }}</li>
              <li><strong>表格模式：</strong>{{ form.ui.compactTable ? '紧凑' : '普通' }}</li>
              <li><strong>推送范围：</strong>{{ form.push.defaultRange }}</li>
              <li><strong>日志排序：</strong>{{ form.logs.defaultOrder }}</li>
            </ul>
          </section>

          <section class="admin-ui-card admin-ui-panel preview-card">
            <AdminSectionHeader
              kicker="Server"
              title="服务器快照"
              description="展示当前读取到的服务器保存信息。"
              compact
            />

            <ul class="preview-list">
              <li><strong>最近保存：</strong>{{ serverMeta.updatedAtText || '-' }}</li>
              <li><strong>创建时间：</strong>{{ serverMeta.createdAtText || '-' }}</li>
              <li><strong>当前状态：</strong>{{ isDirty ? '有未保存修改' : '与服务器一致' }}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </AdminPageLayout>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings as saveSettingsApi } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageHero from '../components/AdminPageHero.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'
import AdminSectionHeader from '../components/AdminSectionHeader.vue'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const lastRefreshText = ref('--')
const serverMeta = reactive({
  updatedAtText: '',
  createdAtText: ''
})

const form = reactive(createDefaultForm())
let serverSnapshot = createDefaultForm()

function createDefaultForm() {
  return {
    push: {
      defaultRange: '7d',
      defaultTargetMode: 'user',
      defaultPayloadTemplate: 'default',
      autoOpenBatchDetail: true
    },
    logs: {
      defaultLevel: '',
      defaultLimit: 100,
      defaultOrder: 'desc',
      keepQueryInUrl: true
    },
    ui: {
      appName: 'UPUSH Admin',
      theme: 'light',
      showQuickActions: true,
      compactTable: false
    }
  }
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function applyFormValue(target, source) {
  const next = cloneValue(source)
  Object.assign(target.push, next.push)
  Object.assign(target.logs, next.logs)
  Object.assign(target.ui, next.ui)
}

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(serverSnapshot))

const summaryCards = computed(() => [
  {
    key: 'app',
    label: '后台名称',
    value: form.ui.appName || 'UPUSH Admin',
    meta: '当前界面展示名称',
    icon: '◌',
    tone: 'default'
  },
  {
    key: 'theme',
    label: '主题模式',
    value: form.ui.theme,
    meta: form.ui.showQuickActions ? '快捷卡片已开启' : '快捷卡片已关闭',
    icon: '↗',
    tone: 'success'
  },
  {
    key: 'dirty',
    label: '保存状态',
    value: isDirty.value ? '待保存' : '已同步',
    meta: isDirty.value ? '当前有未保存修改' : '当前与服务器一致',
    icon: '△',
    tone: isDirty.value ? 'warning' : 'default'
  }
])

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function fetchSettings() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getSettings()
    const data = res?.data?.data || createDefaultForm()
    const nextForm = {
      push: data.push || createDefaultForm().push,
      logs: data.logs || createDefaultForm().logs,
      ui: data.ui || createDefaultForm().ui
    }

    applyFormValue(form, nextForm)
    serverSnapshot = cloneValue(nextForm)
    serverMeta.updatedAtText = data?.meta?.updatedAtText || ''
    serverMeta.createdAtText = data?.meta?.createdAtText || ''
    lastRefreshText.value = formatNow()
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '系统设置加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function resetToServer() {
  applyFormValue(form, serverSnapshot)
  ElMessage.success('已重置为当前服务器保存值')
}

async function saveCurrentSettings() {
  saving.value = true
  errorMessage.value = ''

  try {
    const payload = cloneValue(form)
    const res = await saveSettingsApi(payload)
    const data = res?.data?.data || payload
    const nextForm = {
      push: data.push || payload.push,
      logs: data.logs || payload.logs,
      ui: data.ui || payload.ui
    }

    applyFormValue(form, nextForm)
    serverSnapshot = cloneValue(nextForm)
    serverMeta.updatedAtText = data?.meta?.updatedAtText || ''
    serverMeta.createdAtText = data?.meta?.createdAtText || ''
    lastRefreshText.value = formatNow()
    ElMessage.success(res?.data?.msg || '系统设置保存成功')
  } catch (error) {
    const data = error?.response?.data || {}
    errorMessage.value = data.msg || '系统设置保存失败'
    ElMessage.error(errorMessage.value)
  } finally {
    saving.value = false
  }
}

fetchSettings()
</script>

<style scoped>
.settings-page,
.summary-grid,
.settings-main {
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

.summary-card--warning {
  background: linear-gradient(180deg, #ffffff, #fffaf3);
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.settings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 20px;
}

.settings-form-grid__full {
  grid-column: 1 / -1;
}

.settings-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-card {
  position: sticky;
  top: 0;
}

.preview-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-primary);
}

.preview-list li + li {
  margin-top: 8px;
}

@media (max-width: 1280px) {
  .summary-grid,
  .settings-layout,
  .settings-form-grid {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
  }
}
</style>
