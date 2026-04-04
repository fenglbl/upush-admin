<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-badge">UP</div>
      <div>
        <div class="brand-title">UPUSH</div>
        <div class="brand-subtitle">Admin</div>
      </div>
    </div>

    <el-menu :default-active="route.path" class="sidebar-menu" router>
      <el-menu-item index="/dashboard">Dashboard</el-menu-item>
      <el-menu-item index="/push-create">新建推送</el-menu-item>
      <el-menu-item index="/push-records">推送记录</el-menu-item>
      <el-menu-item index="/logs">日志中心</el-menu-item>
      <el-menu-item index="/users">用户管理</el-menu-item>
      <el-menu-item index="/devices">设备管理</el-menu-item>
      <el-menu-item index="/feedback">反馈中心</el-menu-item>
      <el-menu-item index="/settings">系统设置</el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
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
</style>
