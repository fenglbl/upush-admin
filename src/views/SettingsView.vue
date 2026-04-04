<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader title="系统设置" subtitle="支持推送、日志与界面配置的第一版读写">
        <template #actions>
          <span class="refresh-time">最后刷新：{{ lastRefreshText }}</span>
          <el-button :loading="loading" @click="fetchSettings">刷新</el-button>
          <el-button @click="resetToServer">重置为当前保存值</el-button>
          <el-button :loading="saving" type="primary" @click="saveCurrentSettings">保存设置</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      show-icon
      :title="errorMessage"
      class="settings-alert"
    />

    <div class="settings-grid">
      <section class="card settings-card">
        <div class="section-head">
          <div>
            <h2>推送设置</h2>
            <p>控制后台默认推送行为与创建页体验</p>
          </div>
        </div>

        <el-form label-position="top">
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

          <el-form-item>
            <el-switch v-model="form.push.autoOpenBatchDetail" active-text="提交后自动打开批次详情" />
          </el-form-item>
        </el-form>
      </section>

      <section class="card settings-card">
        <div class="section-head">
          <div>
            <h2>日志设置</h2>
            <p>控制日志中心默认筛选与行为</p>
          </div>
        </div>

        <el-form label-position="top">
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

          <el-form-item>
            <el-switch v-model="form.logs.keepQueryInUrl" active-text="保留筛选参数到 URL" />
          </el-form-item>
        </el-form>
      </section>

      <section class="card settings-card settings-card--full">
        <div class="section-head">
          <div>
            <h2>界面设置</h2>
            <p>控制后台名称、主题与界面显示偏好</p>
          </div>
          <div v-if="serverMeta.updatedAtText" class="meta-text">最近保存：{{ serverMeta.updatedAtText }}</div>
        </div>

        <div class="settings-subgrid">
          <el-form label-position="top">
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

            <el-form-item>
              <el-switch v-model="form.ui.showQuickActions" active-text="显示 Dashboard 快捷卡片" />
            </el-form-item>

            <el-form-item>
              <el-switch v-model="form.ui.compactTable" active-text="表格使用紧凑模式（预留）" />
            </el-form-item>
          </el-form>

          <div class="preview-card">
            <div class="preview-card__title">当前预览</div>
            <ul class="preview-list">
              <li><strong>名称：</strong>{{ form.ui.appName || 'UPUSH Admin' }}</li>
              <li><strong>主题：</strong>{{ form.ui.theme }}</li>
              <li><strong>快捷卡片：</strong>{{ form.ui.showQuickActions ? '显示' : '隐藏' }}</li>
              <li><strong>表格模式：</strong>{{ form.ui.compactTable ? '紧凑' : '普通' }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </AdminPageLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings as saveSettingsApi } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

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
.settings-alert {
  margin-bottom: 16px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 20px;
}

.settings-card--full {
  grid-column: 1 / -1;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
}

.section-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.settings-subgrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
}

.preview-card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px;
}

.preview-card__title {
  font-weight: 700;
  margin-bottom: 12px;
}

.preview-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-primary);
}

.preview-list li + li {
  margin-top: 8px;
}

.refresh-time,
.meta-text {
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
