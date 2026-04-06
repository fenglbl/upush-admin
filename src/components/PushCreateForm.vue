<template>
  <section class="push-create-form">
    <div class="push-create-form__grid">
      <div class="push-create-form__main">
        <section class="push-create-form__panel push-create-form__panel--soft">
          <div class="push-create-form__section-head">
            <div>
              <div class="push-create-form__eyebrow">编辑内容</div>
              <h3>推送内容</h3>
              <p>{{ targetHintText }}</p>
            </div>
            <el-tag :type="isDirty ? 'warning' : 'success'" effect="light" round>
              {{ isDirty ? '有未保存编辑' : '内容已就绪' }}
            </el-tag>
          </div>

          <el-form label-position="top" @submit.prevent>
            <div class="push-create-form__field-grid">
              <el-form-item :label="targetFieldLabel" class="push-create-form__field push-create-form__field--full">
                <el-input v-model.trim="form.id" :disabled="targetLocked" :placeholder="targetFieldPlaceholder" />
              </el-form-item>

              <el-form-item v-if="isDeviceMode" label="设备标识" class="push-create-form__field push-create-form__field--full">
                <el-input :model-value="deviceLabelText" disabled />
              </el-form-item>

              <el-form-item label="标题" class="push-create-form__field push-create-form__field--full">
                <el-input v-model.trim="form.title" maxlength="100" show-word-limit placeholder="输入推送标题" />
              </el-form-item>

              <el-form-item label="内容" class="push-create-form__field push-create-form__field--full">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="4"
                  maxlength="500"
                  show-word-limit
                  placeholder="输入推送正文内容"
                />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="push-create-form__panel">
          <div class="push-create-form__section-head">
            <div>
              <div class="push-create-form__eyebrow">载荷配置</div>
              <h3>打开行为与载荷</h3>
              <p>先选模板，再按需要补充或修改 JSON。</p>
            </div>
          </div>

          <el-form label-position="top" @submit.prevent>
            <el-form-item label="payload 模板">
              <div class="payload-template-row">
                <el-select v-model="selectedTemplate" style="width: 320px">
                  <el-option label="默认消息（首页消息列表）" value="default" />
                  <el-option label="纯文本消息模板" value="simple" />
                  <el-option label="系统提醒模板" value="system_notice" />
                </el-select>
                <el-button @click="applyTemplate">应用模板</el-button>
                <el-button @click="formatPayload">格式化 JSON</el-button>
              </div>
            </el-form-item>

            <div class="push-create-form__template-tip">
              <strong>{{ currentTemplateMeta.label }}</strong>
              <span>{{ currentTemplateMeta.desc }}</span>
            </div>

            <el-form-item label="payload (JSON)">
              <el-input
                v-model="payloadText"
                type="textarea"
                :rows="12"
                placeholder='{"type":"push_message"}'
                class="push-create-form__json"
              />
            </el-form-item>

            <div class="form-actions">
              <el-button :loading="submitting" type="primary" @click="submit">提交推送</el-button>
              <el-button @click="fillExample">填充示例</el-button>
              <el-button @click="resetForm">重置</el-button>
            </div>
          </el-form>
        </section>
      </div>

      <aside class="push-create-form__aside">
        <section class="push-create-form__panel push-create-form__panel--sticky">
          <div class="push-create-form__section-head push-create-form__section-head--compact">
            <div>
              <div class="push-create-form__eyebrow">模板说明</div>
              <h3>模板说明</h3>
            </div>
          </div>

          <div class="push-create-form__guide-list">
            <div class="push-create-form__guide-item" :class="{ 'is-active': selectedTemplate === 'default' }">
              <strong>默认消息</strong>
              <span>用于首页消息列表定位，适合普通消息推送。</span>
            </div>
            <div class="push-create-form__guide-item" :class="{ 'is-active': selectedTemplate === 'simple' }">
              <strong>纯文本模板</strong>
              <span>结构更轻，适合简单提醒或测试消息。</span>
            </div>
            <div class="push-create-form__guide-item" :class="{ 'is-active': selectedTemplate === 'system_notice' }">
              <strong>系统提醒</strong>
              <span>带系统来源标识，更适合后台公告类消息。</span>
            </div>
          </div>
        </section>

        <section class="push-create-form__panel push-create-form__panel--sticky">
          <div class="push-create-form__section-head push-create-form__section-head--compact">
            <div>
              <div class="push-create-form__eyebrow">当前预览</div>
              <h3>当前摘要</h3>
            </div>
          </div>

          <ul class="push-create-form__summary-list">
            <li><strong>目标类型：</strong>{{ isDeviceMode ? '单设备' : '用户全部设备' }}</li>
            <li><strong>{{ targetFieldLabel }}：</strong>{{ form.id || '未填写' }}</li>
            <li v-if="isDeviceMode"><strong>设备标识：</strong>{{ deviceLabelText }}</li>
            <li><strong>标题：</strong>{{ form.title || '未填写标题' }}</li>
            <li><strong>正文长度：</strong>{{ form.content?.length || 0 }} 字</li>
            <li><strong>当前模板：</strong>{{ currentTemplateMeta.label }}</li>
            <li><strong>JSON 状态：</strong>{{ payloadValid ? '合法' : '待修正' }}</li>
          </ul>
        </section>

        <el-alert
          v-if="lastResult"
          class="result-alert"
          :type="lastResult.code === 200 || lastResult.code === 207 ? 'success' : 'warning'"
          :closable="false"
          show-icon
          :title="`最近提交：code=${lastResult.code}，msg=${lastResult.msg}`"
        />
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createPushMessage } from '../api'

const props = defineProps({
  initialTargetType: {
    type: String,
    default: 'user'
  },
  initialUserId: {
    type: String,
    default: ''
  },
  initialDeviceId: {
    type: String,
    default: ''
  },
  initialDeviceLabel: {
    type: String,
    default: ''
  },
  lockTarget: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success'])

const submitting = ref(false)
const lastResult = ref(null)

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

const templateMetas = {
  default: {
    label: '默认消息（首页消息列表）',
    desc: '适合普通业务消息，点击后优先进入首页消息列表。'
  },
  simple: {
    label: '纯文本消息模板',
    desc: '结构更轻，适合调试、测试或轻量提醒。'
  },
  system_notice: {
    label: '系统提醒模板',
    desc: '适合后台公告、系统通知类场景，带明确来源标记。'
  }
}

const form = reactive({
  id: '',
  title: '',
  content: ''
})

const selectedTemplate = ref('default')
const payloadText = ref(JSON.stringify(payloadTemplates.default, null, 2))
const targetType = ref(props.initialTargetType === 'device' ? 'device' : 'user')

const isDeviceMode = computed(() => targetType.value === 'device')
const targetLocked = computed(() => !!props.lockTarget)
const targetFieldLabel = computed(() => (isDeviceMode.value ? '目标设备记录 ID' : '目标用户 ID'))
const targetFieldPlaceholder = computed(() => (isDeviceMode.value ? '例如：69c8cd272d09cc6938ba57d3' : '例如：687ba27b7afc5034100a83f0'))
const deviceLabelText = computed(() => props.initialDeviceLabel || props.initialDeviceId || '未指定设备')
const targetHintText = computed(() => {
  if (isDeviceMode.value) {
    return '当前推送会发送到这台指定设备，不会广播给该用户的全部设备。'
  }
  return '当前推送会发送到该用户的全部可用设备。'
})

const currentTemplateMeta = computed(() => templateMetas[selectedTemplate.value] || templateMetas.default)

const defaultSnapshot = computed(() => JSON.stringify({
  form: {
    id: form.id,
    title: '',
    content: ''
  },
  selectedTemplate: 'default',
  payloadText: JSON.stringify(payloadTemplates.default, null, 2),
  targetType: targetType.value
}))

const currentSnapshot = computed(() => JSON.stringify({
  form: {
    id: form.id,
    title: form.title,
    content: form.content
  },
  selectedTemplate: selectedTemplate.value,
  payloadText: payloadText.value,
  targetType: targetType.value
}))

const isDirty = computed(() => currentSnapshot.value !== defaultSnapshot.value)

const payloadValid = computed(() => {
  try {
    JSON.parse(payloadText.value || '{}')
    return true
  } catch {
    return false
  }
})

function syncInitialTarget() {
  targetType.value = props.initialTargetType === 'device' ? 'device' : 'user'
  form.id = targetType.value === 'device'
    ? (props.initialDeviceId || '')
    : (props.initialUserId || '')
}

watch(
  () => [props.initialTargetType, props.initialUserId, props.initialDeviceId],
  () => {
    syncInitialTarget()
  },
  { immediate: true }
)

function applyTemplate() {
  const template = payloadTemplates[selectedTemplate.value] || payloadTemplates.default
  payloadText.value = JSON.stringify(template, null, 2)
}

function formatPayload() {
  try {
    const parsed = JSON.parse(payloadText.value || '{}')
    payloadText.value = JSON.stringify(parsed, null, 2)
    ElMessage.success('JSON 已格式化')
  } catch {
    ElMessage.error('当前 JSON 不合法，无法格式化')
  }
}

function fillExample() {
  if (!form.id) {
    syncInitialTarget()
  }
  form.title = '测试推送'
  form.content = isDeviceMode.value
    ? '这是一条发往当前设备的测试消息'
    : '这是一条发往当前用户的测试消息'
}

function resetForm() {
  syncInitialTarget()
  form.title = ''
  form.content = ''
  selectedTemplate.value = 'default'
  payloadText.value = JSON.stringify(payloadTemplates.default, null, 2)
  lastResult.value = null
}

async function submit() {
  if (!form.id) {
    ElMessage.warning(isDeviceMode.value ? '请填写目标设备记录 ID' : '请填写目标用户 ID')
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

  const requestPayload = {
    id: isDeviceMode.value ? (props.initialUserId || form.id) : form.id,
    title: form.title,
    content: form.content,
    payload
  }

  if (isDeviceMode.value) {
    requestPayload.targetType = 'device'
    requestPayload.deviceId = form.id
  }

  submitting.value = true
  try {
    const res = await createPushMessage(requestPayload)

    const body = res?.data || {}
    lastResult.value = body
    ElMessage.success(body.msg || '推送提交成功')
    emit('success', body)
  } catch (error) {
    const data = error?.response?.data || {}
    lastResult.value = data
    ElMessage.error(data.msg || '推送提交失败')
  } finally {
    submitting.value = false
  }
}

defineExpose({
  resetForm,
  fillExample,
  isDirty: () => isDirty.value
})
</script>

<style scoped>
.push-create-form {
  display: flex;
  flex-direction: column;
}

.push-create-form__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
}

.push-create-form__main,
.push-create-form__aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.push-create-form__panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #ffffff);
  border: 1px solid #e8edf3;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  padding: 22px;
}

.push-create-form__panel--soft {
  background: linear-gradient(180deg, #ffffff, #fbfdff);
}

.push-create-form__panel--sticky {
  position: sticky;
  top: 0;
}

.push-create-form__section-head {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.push-create-form__section-head--compact {
  margin-bottom: 14px;
}

.push-create-form__section-head h3 {
  margin: 8px 0 0;
  font-size: 20px;
  color: #0f172a;
}

.push-create-form__section-head p {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.push-create-form__eyebrow {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3b82f6;
}

.push-create-form__field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.push-create-form__field--full {
  grid-column: 1 / -1;
}

.payload-template-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.push-create-form__template-tip {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.push-create-form__json :deep(textarea) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.push-create-form__guide-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.push-create-form__guide-item {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #64748b;
}

.push-create-form__guide-item strong {
  color: #0f172a;
}

.push-create-form__guide-item.is-active {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.push-create-form__summary-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-alert {
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .push-create-form__grid {
    grid-template-columns: 1fr;
  }

  .push-create-form__panel--sticky {
    position: static;
  }
}

@media (max-width: 768px) {
  .push-create-form__field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
