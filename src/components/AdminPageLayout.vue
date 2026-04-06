<template>
  <div
    class="admin-page-shell"
    :class="{
      'is-mobile': isMobile,
      'is-mobile-sidebar-open': isMobileSidebarOpen
    }"
  >
    <button
      v-if="isMobile"
      class="admin-mobile-nav-trigger"
      type="button"
      aria-label="打开导航菜单"
      @click="isMobileSidebarOpen = true"
    >
      ☰
    </button>

    <div
      v-if="isMobile && isMobileSidebarOpen"
      class="admin-mobile-sidebar-backdrop"
      @click="isMobileSidebarOpen = false"
    ></div>

    <AdminSidebar
      :mobile="isMobile"
      :mobile-open="isMobileSidebarOpen"
      @close-mobile="isMobileSidebarOpen = false"
    />

    <div class="admin-page-main">
      <slot name="header" />

      <main class="admin-page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AdminSidebar from './AdminSidebar.vue'

const isMobile = ref(false)
const isMobileSidebarOpen = ref(false)

function syncViewport() {
  const mobile = window.innerWidth <= 980
  isMobile.value = mobile
  if (!mobile) {
    isMobileSidebarOpen.value = false
  }
}

function handleMobileClose() {
  isMobileSidebarOpen.value = false
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
  window.addEventListener('admin-sidebar-close-mobile', handleMobileClose)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
  window.removeEventListener('admin-sidebar-close-mobile', handleMobileClose)
})
</script>

<style scoped>
.admin-page-shell {
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  min-height: 100vh;
}

.admin-page-shell.is-mobile {
  grid-template-columns: minmax(0, 1fr);
}

.admin-page-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-page-content {
  padding: 24px;
}

.admin-mobile-nav-trigger {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 70;
  width: 40px;
  height: 40px;
  border: 1px solid var(--admin-chip-border, #e8edf3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  cursor: pointer;
}

.admin-mobile-sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(4px);
}
</style>
