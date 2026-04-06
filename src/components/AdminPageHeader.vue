<template>
  <header class="admin-page-header">
    <div class="admin-page-header__left">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <div class="admin-page-header__actions">
      <div v-if="adminUser && adminUser.username" class="admin-page-header__admin-chip">
        <span class="admin-page-header__admin-dot"></span>
        <span>管理员：{{ adminUser.username }}</span>
      </div>
      <el-button v-if="showLogout" text @click="handleLogout">退出登录</el-button>
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogout, clearAdminSession, getAdminUser } from '../api'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  showLogout: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const adminUser = computed(() => getAdminUser())

async function handleLogout() {
  try {
    await adminLogout()
  } catch (error) {
    // ignore network/logout api failure, local logout should still complete
  }

  clearAdminSession()
  ElMessage.success('已退出登录')
  router.replace('/login')
}
</script>

<style scoped>
.admin-page-header {
  min-height: 80px;
  background: var(--admin-header-bg, rgba(255, 255, 255, 0.82));
  border-bottom: 1px solid var(--admin-header-border, #e6edf5);
  box-shadow: var(--admin-header-shadow, 0 8px 24px rgba(15, 23, 42, 0.04));
  backdrop-filter: blur(14px);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.admin-page-header__left {
  min-width: 0;
}

.admin-page-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.admin-page-header p {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.admin-page-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-page-header__admin-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--admin-chip-bg, #f8fafc);
  border: 1px solid var(--admin-chip-border, #e8edf3);
  color: var(--admin-chip-text, #475569);
  font-size: 13px;
  font-weight: 600;
}

.admin-page-header__admin-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #16a34a;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

:deep(.admin-page-header__actions .el-button) {
  min-height: 36px;
  border-radius: 12px;
  border-color: var(--admin-chip-border, #e8edf3);
  background: rgba(255, 255, 255, 0.84);
  color: #334155;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

:deep(.admin-page-header__actions .el-button:hover) {
  border-color: #d7e3f6;
  color: #0f172a;
  background: #ffffff;
}

:deep(.admin-page-header__actions .el-button--primary) {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, var(--admin-primary-start, #2563eb), var(--admin-primary-end, #4f46e5));
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.2);
}

:deep(.admin-page-header__actions .el-button--primary:hover) {
  color: #fff !important;
  border-color: transparent !important;
  background: linear-gradient(135deg, var(--admin-primary-start, #2563eb), var(--admin-primary-end, #4f46e5)) !important;
  --el-button-text-color: #fff;
  --el-button-bg-color: linear-gradient(135deg, var(--admin-primary-start, #2563eb), var(--admin-primary-end, #4f46e5));
  --el-button-hover-text-color: #fff;
  --el-button-hover-border-color: transparent;
  filter: saturate(1.04) brightness(1.01);
}

:deep(.admin-page-header__actions .el-tag) {
  border-radius: 999px;
  min-height: 32px;
  padding: 0 12px;
  border-color: var(--admin-chip-border, #e8edf3);
  background: var(--admin-chip-bg, #f8fafc);
  color: var(--admin-chip-text, #475569);
  font-weight: 600;
}
</style>
