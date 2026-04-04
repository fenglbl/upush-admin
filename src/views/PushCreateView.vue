<template>
  <div class="create-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div>
          <div class="brand-title">UPUSH</div>
          <div class="brand-subtitle">Admin</div>
        </div>
      </div>

      <el-menu :default-active="'/push-create'" class="sidebar-menu" router>
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/push-create">新建推送</el-menu-item>
        <el-menu-item index="/push-records">推送记录</el-menu-item>
        <el-menu-item index="/logs">日志中心</el-menu-item>
        <el-menu-item index="/users">用户管理</el-menu-item>
        <el-menu-item index="/devices">设备管理</el-menu-item>
        <el-menu-item index="/settings">系统设置</el-menu-item>
      </el-menu>
    </aside>

    <div class="main-panel">
      <header class="topbar">
        <div>
          <h1>新建推送</h1>
          <p>提交到 /pushMessage，成功后自动跳转批次详情</p>
        </div>
      </header>

      <main class="content-area">
        <section class="card form-card">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="目标用户 ID">
              <el-input v-model.trim="form.id" placeholder="例如：687ba27b7afc5034100a83f0" />
            </el-form-item>

            <el-form-item label="标题">
              <el-input v-model.trim="form.title" maxlength="100" show-word-limit />
            </el-form-item>

            <el-form-item label="内容">
              <el-input v-model="form.content" type="textarea" :rows="3" maxlength="500" show-word-limit />
            </el-form-item>

            <el-form-item label="payload 模板">
              <div class="payload-template-row">
                <el-select v-model="selectedTemplate" style="width: 300px">
                  <el-option label="默认消息（首页消息列表）" value="default" />
                  <el-option label="纯文本消息模板" value="simple" />
                  <el-option label="系统提醒模板" value="system_notice" />
                </el-select>
                <el-button @click="applyTemplate">应用模板</el-button>
              </div>
            </el-form-item>

            <el-form-item label="payload(JSON)">
              <el-input v-model="payloadText" type="textarea" :rows="8" placeholder='{"type":"push_message"}' />
            </el-form-item>

            <div class="form-actions">
              <el-button :loading="submitting" type="primary" @click="submit">提交推送</el-button>
              <el-button @click="fillExample">填充示例</el-button>
            </div>
          </el-form>

          <el-alert
            v-if="lastResult"
            class="result-alert"
            :type="lastResult.code === 200 || lastResult.code === 207 ? 'success' : 'warning'"
            :closable="false"
            show-icon
            :title="`最近提交：code=${lastResult.code}，msg=${lastResult.msg}`"
          />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createPushMessage } from '../api'

const router = useRouter()
const submitting = ref(false)
const lastResult = ref(null)

const form = reactive({
  id: '',
  title: '',
  content: ''
})

const payloadTemplates = {
  default: {
    type: 'push_message',
    action: 'open_home_message_list',
    route: '/pages/home/index'
  },
  simple: {
    type: 'text',
    action: 'open_home',
    route: '/pages/home/index'
  },
  system_notice: {
    type: 'system_notice',
    action: 'open_home_message_list',
    route: '/pages/home/index',
    source: 'admin-system-notice'
  }
}

const selectedTemplate = ref('default')
const payloadText = ref(JSON.stringify(payloadTemplates.default, null, 2))

function applyTemplate() {
  const template = payloadTemplates[selectedTemplate.value] || payloadTemplates.default
  payloadText.value = JSON.stringify(template, null, 2)
}

function fillExample() {
  form.id = '687ba27b7afc5034100a83f0'
  form.title = '测试推送'
  form.content = '这是一条来自 upush-admin 的测试消息'
}

async function submit() {
  if (!form.id) {
    ElMessage.warning('请填写目标用户 ID')
    return
  }

  if (!form.title) {
    ElMessage.warning('请填写推送标题')
    return
  }

  let payload
  try {
    payload = payloadText.value ? JSON.parse(payloadText.value) : {}
  } catch (error) {
    ElMessage.error('payload 不是合法 JSON')
    return
  }

  submitting.value = true
  try {
    const res = await createPushMessage({
      id: form.id,
      title: form.title,
      content: form.content,
      payload
    })

    const body = res?.data || {}
    lastResult.value = body

    const batchId = body?.data?.batchId
    if (batchId) {
      ElMessage.success('推送提交成功，正在跳转批次详情')
      router.push(`/push-records/${batchId}`)
      return
    }

    ElMessage.success(body.msg || '推送提交成功')
  } catch (error) {
    const data = error?.response?.data || {}
    lastResult.value = data
    ElMessage.error(data.msg || '推送提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  background: #ffffff;
  border-right: 1px solid var(--border-color);
  padding: 20px 16px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 20px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-title {
  font-weight: 700;
}

.brand-subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.sidebar-menu {
  border-right: none;
}

.main-panel {
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.content-area {
  padding: 24px;
}

.form-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 18px;
  max-width: 920px;
}

.payload-template-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.result-alert {
  margin-top: 16px;
}
</style>
