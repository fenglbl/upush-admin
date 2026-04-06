<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-card__header">
        <div class="admin-login-card__eyebrow">ADMIN ACCESS</div>
        <h1>管理端登录</h1>
        <p>使用环境变量中配置的管理员账号登录后台。</p>
      </div>

      <el-form @submit.prevent="handleSubmit">
        <el-form-item label="管理员账号">
          <el-input v-model="form.username" placeholder="请输入管理员账号" @keyup.enter="handleSubmit" />
        </el-form-item>
        <el-form-item label="管理员密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入管理员密码" @keyup.enter="handleSubmit" />
        </el-form-item>
        <el-button class="admin-login-card__button" type="primary" :loading="submitting" @click="handleSubmit">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin, getLastAdminUsername, setAdminSession, setLastAdminUsername } from '../api'

const router = useRouter()
const route = useRoute()
const submitting = ref(false)
const form = reactive({
  username: '',
  password: ''
})

onMounted(() => {
  form.username = getLastAdminUsername()
})

async function handleSubmit() {
  if (!form.username.trim() || !form.password.trim()) {
    ElMessage.warning('请输入管理员账号和密码')
    return
  }

  submitting.value = true
  try {
    const { data } = await adminLogin({
      username: form.username.trim(),
      password: form.password.trim()
    })

    if (data.code !== 200) {
      throw new Error(data.msg || '登录失败')
    }

    setLastAdminUsername(form.username)
    setAdminSession(data.data.token, data.data.user)
    ElMessage.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect || '/dashboard')
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || error.message || '登录失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    radial-gradient(circle at top, rgba(42, 122, 255, 0.14), transparent 36%),
    linear-gradient(180deg, #f5f7fb 0%, #eef3fb 100%);
}

.admin-login-card {
  width: 100%;
  max-width: 460px;
  padding: 32px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px -36px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(16px);
}

.admin-login-card__header {
  margin-bottom: 24px;
}

.admin-login-card__eyebrow {
  font-size: 12px;
  letter-spacing: 0.24em;
  color: #3b82f6;
  margin-bottom: 12px;
}

.admin-login-card__header h1 {
  margin: 0;
  font-size: 32px;
  color: #111827;
}

.admin-login-card__header p {
  margin: 12px 0 0;
  color: #6b7280;
  line-height: 1.7;
}

.admin-login-card__button {
  width: 100%;
  margin-top: 8px;
  height: 44px;
}
</style>
