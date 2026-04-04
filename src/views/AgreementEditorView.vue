<template>
  <AdminPageLayout>
    <template #header>
      <AdminPageHeader :title="pageTitle" :subtitle="pageSubtitle">
        <template #actions>
          <el-tag :type="hasUnsavedChanges ? 'warning' : 'success'" effect="light" round>
            {{ hasUnsavedChanges ? '未保存修改' : '已保存' }}
          </el-tag>
          <el-button @click="goBack">返回列表</el-button>
          <el-button :loading="saving" @click="submitAgreement(0)">保存草稿</el-button>
          <el-button :loading="saving" type="primary" @click="submitAgreement(1)">保存并发布</el-button>
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
          <section class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">协议 ID</div>
              <div class="meta-value">{{ form.agreementId || '-' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">当前状态</div>
              <div class="meta-value">
                <el-tag :type="form.status === 1 ? 'success' : 'info'">{{ form.status === 1 ? '已发布' : '草稿' }}</el-tag>
              </div>
            </div>
            <div class="meta-item">
              <div class="meta-label">创建时间</div>
              <div class="meta-value">{{ form.createDateText || '-' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">更新时间</div>
              <div class="meta-value">{{ form.updateTimeText || '-' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">发布时间</div>
              <div class="meta-value">{{ form.publishTimeText || '-' }}</div>
            </div>
          </section>

          <el-form-item label="协议类型">
            <el-select v-model="form.agreementId" style="width: 220px" :disabled="isEdit">
              <el-option label="用户服务协议" value="user_service" />
              <el-option label="隐私政策" value="privacy_policy" />
            </el-select>
          </el-form-item>

          <el-form-item label="标题">
            <el-input v-model.trim="form.title" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="协议内容">
            <div class="editor-shell">
              <Toolbar class="editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
              <Editor
                v-model="form.content"
                class="editor-content"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleCreated"
              />
            </div>
          </el-form-item>
        </el-form>
      </section>

      <aside class="card preview-panel">
        <div class="preview-panel__head">
          <span>实时预览</span>
          <span class="preview-meta">{{ form.agreementId || '-' }}</span>
        </div>
        <div class="preview-title">{{ form.title || '未填写标题' }}</div>
        <div class="preview-html" v-html="form.content || editorPreviewHtml"></div>
      </aside>
    </section>
  </AdminPageLayout>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { getAgreementDetail, saveAgreement } from '../api'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import AdminPageLayout from '../components/AdminPageLayout.vue'

const route = useRoute()
const router = useRouter()
const editorRef = shallowRef()
const saving = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入协议正文（支持富文本 HTML）'
}
const editorPreviewHtml = '<p style="color:#94a3b8">暂无内容</p>'

const form = reactive({
  id: '',
  agreementId: 'user_service',
  title: '',
  content: '',
  status: 0,
  createDateText: '',
  updateTimeText: '',
  publishTimeText: ''
})
const initialSnapshot = ref('')
const skipLeaveGuard = ref(false)

const isEdit = computed(() => Boolean(route.params.id))
const currentSnapshot = computed(() => JSON.stringify({
  agreementId: form.agreementId,
  title: form.title,
  content: form.content,
  status: form.status
}))
const hasUnsavedChanges = computed(() => currentSnapshot.value !== initialSnapshot.value)
const pageTitle = computed(() => (isEdit.value ? '编辑协议' : '新建协议'))
const pageSubtitle = computed(() => (isEdit.value ? '在独立页面中编辑富文本协议内容' : '创建新的协议版本并编辑富文本内容'))

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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

async function loadAgreement() {
  if (!isEdit.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getAgreementDetail(route.params.id)
    const data = res?.data?.data || {}
    form.id = data.id || ''
    form.agreementId = data.agreementId || 'user_service'
    form.title = data.title || ''
    form.content = data.content || ''
    form.status = Number(data.status || 0)
    form.createDateText = data.createDateText || ''
    form.updateTimeText = data.updateTimeText || ''
    form.publishTimeText = data.publishTimeText || ''
    syncSnapshot()
  } catch (error) {
    errorMessage.value = error?.response?.data?.msg || '协议详情加载失败'
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
  router.push('/agreements')
}

async function submitAgreement(targetStatus) {
  if (!form.agreementId) {
    ElMessage.warning('请选择协议类型')
    return
  }
  if (!form.title.trim()) {
    ElMessage.warning('标题不能为空')
    return
  }
  if (!stripHtml(form.content)) {
    ElMessage.warning('协议内容不能为空')
    return
  }

  saving.value = true
  try {
    const res = await saveAgreement({
      id: form.id || undefined,
      agreementId: form.agreementId,
      title: form.title,
      content: form.content,
      status: Number(targetStatus)
    })

    const data = res?.data?.data || {}
    form.id = data.id || form.id
    form.status = Number(data.status ?? targetStatus)
    form.createDateText = data.createDateText || form.createDateText
    form.updateTimeText = data.updateTimeText || form.updateTimeText
    form.publishTimeText = data.publishTimeText || form.publishTimeText
    syncSnapshot()

    ElMessage.success(res?.data?.msg || '协议保存成功')

    if (!isEdit.value && form.id) {
      skipLeaveGuard.value = true
      router.replace(`/agreements/${form.id}/edit`)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '协议保存失败')
  } finally {
    saving.value = false
  }
}

function handleCreated(editor) {
  editorRef.value = editor
}

onBeforeRouteLeave(async () => {
  return await confirmLeave()
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)

  if (isEdit.value) {
    loadAgreement()
  } else {
    syncSnapshot()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)

  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<style scoped>
.editor-page {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
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

.meta-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.meta-item {
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #f8fafc;
}

.meta-label {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.meta-value {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.editor-shell {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  border-bottom: 1px solid var(--border-color);
}

.editor-content {
  min-height: 520px;
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
  font-weight: 500;
}

.preview-title {
  padding: 18px 16px 0;
  font-size: 22px;
  font-weight: 700;
}

.preview-html {
  padding: 16px;
  min-height: 320px;
  line-height: 1.75;
  word-break: break-word;
}
</style>
