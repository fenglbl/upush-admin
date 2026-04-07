<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader :title="pageTitle" :subtitle="pageSubtitle">
        <template #actions>
          <el-tag :type="hasUnsavedChanges ? 'warning' : 'success'" effect="light" round>
            {{ hasUnsavedChanges ? '未保存修改' : '已保存' }}
          </el-tag>
          <el-button @click="goBack">返回列表</el-button>
          <el-button :loading="saving" @click="submitVersion(0)">保存草稿</el-button>
          <el-button :loading="saving" type="primary" @click="submitVersion(1)">保存并发布</el-button>
        </template>
      </AdminPageHeader>
    </template>

    <section class="editor-page">
      <section class="card editor-panel">
        <el-alert
          v-if="errorMessage"
          type="error"
          :closable="false"
          show-icon
          :title="errorMessage"
          class="form-alert"
        />

        <el-form label-position="top" @submit.prevent>
          <el-form-item label="平台">
            <el-select v-model="form.platform" style="width: 220px">
              <el-option label="App" value="app" />
            </el-select>
          </el-form-item>

          <el-form-item label="版本号">
            <el-input v-model.trim="form.versionName" placeholder="例如：0.0.2" />
          </el-form-item>

          <el-form-item label="版本编码">
            <el-input-number v-model="form.versionCode" :min="1" :step="1" controls-position="right" />
          </el-form-item>

          <el-form-item label="更新文件上传">
            <div class="upload-row">
              <input ref="fileInputRef" class="native-file-input" type="file" :accept="ACCEPTED_PACKAGE_EXTENSIONS.join(',')" @change="handleFileChange" />
              <el-button @click="triggerFilePick">选择文件</el-button>
              <el-button :disabled="!selectedFile || uploading" :loading="uploading" type="primary" @click="submitUpload">上传文件</el-button>
              <span class="upload-file-name">{{ selectedFile?.name || '未选择文件' }}</span>
            </div>
            <div v-if="uploading || uploadProgress > 0" class="upload-progress-wrap">
              <el-progress :percentage="uploadProgress" :status="uploadProgress >= 100 && !uploading ? 'success' : ''" />
            </div>
          </el-form-item>

          <el-form-item label="下载地址">
            <el-input v-model.trim="form.downloadUrl" placeholder="https://example.com/upush.apk" />
            <div v-if="form.downloadUrl" class="download-link-row">
              <a :href="form.downloadUrl" target="_blank" rel="noopener noreferrer" class="download-link">打开下载链接</a>
              <span class="download-link-hint">上传成功后可直接点开验证</span>
            </div>
          </el-form-item>

          <el-form-item label="更新策略">
            <el-switch v-model="form.forceUpdate" active-text="强制更新" inactive-text="普通更新" />
          </el-form-item>

          <el-form-item label="更新说明">
            <el-input v-model="form.notes" type="textarea" :rows="10" maxlength="4000" show-word-limit />
          </el-form-item>
        </el-form>
      </section>

      <aside class="card preview-panel">
        <div class="preview-panel__head">
          <span>版本预览</span>
          <span class="preview-meta">{{ form.platform || '-' }}</span>
        </div>
        <div class="preview-title">{{ form.versionName || '未填写版本号' }}</div>
        <div class="preview-version-code">Version Code: {{ form.versionCode || '-' }}</div>
        <div class="preview-flags">
          <el-tag :type="form.forceUpdate ? 'danger' : 'info'">{{ form.forceUpdate ? '强制更新' : '普通更新' }}</el-tag>
          <el-tag :type="form.status === 1 ? 'success' : 'info'">{{ form.status === 1 ? '已发布' : '草稿' }}</el-tag>
        </div>
        <div class="preview-block">
          <div class="preview-label">下载地址</div>
          <div class="preview-value">{{ form.downloadUrl || '-' }}</div>
        </div>
        <div class="preview-block">
          <div class="preview-label">更新说明</div>
          <div class="preview-value preview-notes">{{ form.notes || '暂无更新说明' }}</div>
        </div>
      </aside>
    </section>
  </AdminPageLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const ACCEPTED_PACKAGE_EXTENSIONS = ['.apk', '.ipa', '.zip', '.exe', '.msi', '.dmg', '.AppImage', '.wgt']
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVersionDetail, saveVersion, uploadPackage } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const fileInputRef = ref(null)
const selectedFile = ref(null)

const form = reactive({
  id: '',
  platform: 'app',
  versionName: '',
  versionCode: 1,
  status: 0,
  forceUpdate: false,
  downloadUrl: '',
  notes: ''
})
const initialSnapshot = ref('')
const skipLeaveGuard = ref(false)

const isEdit = computed(() => Boolean(route.params.id))
const currentSnapshot = computed(() => JSON.stringify({
  platform: form.platform,
  versionName: form.versionName,
  versionCode: form.versionCode,
  status: form.status,
  forceUpdate: form.forceUpdate,
  downloadUrl: form.downloadUrl,
  notes: form.notes
}))
const hasUnsavedChanges = computed(() => currentSnapshot.value !== initialSnapshot.value)
const pageTitle = computed(() => (isEdit.value ? '编辑版本' : '新建版本'))
const pageSubtitle = computed(() => (isEdit.value ? '在独立页面中编辑客户端版本信息' : '创建新的客户端版本并配置发布信息'))

function syncSnapshot() {
  initialSnapshot.value = currentSnapshot.value
}

function handleBeforeUnload(event) {
  if (skipLeaveGuard.value || !hasUnsavedChanges.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

async function confirmLeave() {
  if (skipLeaveGuard.value || !hasUnsavedChanges.value) {
    return true
  }

  try {
    await ElMessageBox.confirm('当前有未保存内容，确认离开当前编辑页吗？', '未保存离开提醒', {
      type: 'warning',
      confirmButtonText: '仍然离开',
      cancelButtonText: '留在当前页'
    })
    return true
  } catch {
    return false
  }
}

function triggerFilePick() {
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event?.target?.files?.[0] || null
  uploadProgress.value = 0

  if (!file) {
    selectedFile.value = null
    return
  }

  const lowerName = String(file.name || '').toLowerCase()
  const isAllowed = ACCEPTED_PACKAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext.toLowerCase()))

  if (!isAllowed) {
    selectedFile.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    ElMessage.warning('仅支持 apk、ipa、zip、exe、msi、dmg、AppImage、wgt 文件')
    return
  }

  selectedFile.value = file
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploadProgress.value = 0
  uploading.value = true
  try {
    const res = await uploadPackage(selectedFile.value, (event) => {
      const total = Number(event?.total || selectedFile.value?.size || 0)
      const loaded = Number(event?.loaded || 0)
      if (total > 0) {
        uploadProgress.value = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)))
      }
    })
    const data = res?.data?.data || {}
    form.downloadUrl = data.downloadUrl || ''
    uploadProgress.value = 100
    ElMessage.success(res?.data?.msg || '文件上传成功')
  } catch (error) {
    uploadProgress.value = 0
    ElMessage.error(error?.response?.data?.msg || '文件上传失败')
  } finally {
    uploading.value = false
  }
}

async function loadVersion() {
  if (!isEdit.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getVersionDetail(route.params.id)
    const data = res?.data?.data || {}
    form.id = data.id || ''
    form.platform = data.platform || 'app'
    form.versionName = data.versionName || ''
    form.versionCode = Number(data.versionCode || 1)
    form.status = Number(data.status || 0)
    form.forceUpdate = !!data.forceUpdate
    form.downloadUrl = data.downloadUrl || ''
    form.notes = data.notes || ''
    syncSnapshot()
  } catch (error) {
    errorMessage.value = error?.response?.data?.msg || '版本详情加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

async function goBack() {
  if (!(await confirmLeave())) {
    return
  }

  skipLeaveGuard.value = true
  router.push('/versions')
}

async function submitVersion(targetStatus) {
  if (!form.platform) {
    ElMessage.warning('请选择平台')
    return
  }
  if (!form.versionName.trim()) {
    ElMessage.warning('版本号不能为空')
    return
  }
  if (!Number.isFinite(Number(form.versionCode)) || Number(form.versionCode) <= 0) {
    ElMessage.warning('版本编码不能为空')
    return
  }

  saving.value = true
  try {
    const res = await saveVersion({
      id: form.id || undefined,
      platform: form.platform,
      versionName: form.versionName,
      versionCode: Number(form.versionCode),
      status: Number(targetStatus),
      forceUpdate: !!form.forceUpdate,
      downloadUrl: form.downloadUrl,
      notes: form.notes
    })

    const data = res?.data?.data || {}
    form.id = data.id || form.id
    form.status = Number(data.status ?? targetStatus)
    syncSnapshot()

    ElMessage.success(res?.data?.msg || '版本保存成功')

    if (!isEdit.value && form.id) {
      skipLeaveGuard.value = true
      router.replace(`/versions/${form.id}/edit`)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '版本保存失败')
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(async () => {
  return await confirmLeave()
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)

  if (isEdit.value) {
    loadVersion()
  } else {
    syncSnapshot()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.editor-page {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
  gap: 20px;
  padding: 20px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.editor-panel {
  padding: 18px;
}

.form-alert {
  margin-bottom: 16px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.native-file-input {
  display: none;
}

.upload-file-name {
  color: var(--text-secondary);
  font-size: 13px;
  word-break: break-all;
}

.upload-progress-wrap {
  width: 100%;
  margin-top: 12px;
}

.download-link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.download-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 600;
}

.download-link:hover {
  text-decoration: underline;
}

.download-link-hint {
  color: var(--text-secondary);
  font-size: 12px;
}

.preview-panel {
  overflow: hidden;
  align-self: start;
}

.preview-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  background: #f8fafc;
  font-weight: 700;
}

.preview-meta {
  color: var(--text-secondary);
  font-size: 12px;
}

.preview-title {
  padding: 18px 16px 0;
  font-size: 24px;
  font-weight: 700;
}

.preview-version-code {
  padding: 8px 16px 0;
  color: var(--text-secondary);
}

.preview-flags {
  display: flex;
  gap: 10px;
  padding: 16px;
}

.preview-block {
  padding: 0 16px 16px;
}

.preview-label {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.preview-value {
  color: var(--text-primary);
  line-height: 1.75;
  word-break: break-word;
}

.preview-notes {
  white-space: pre-wrap;
}
</style>
