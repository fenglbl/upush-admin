<template>
  <div class="admin-page-shell">
    <AdminSidebar />

    <div class="admin-page-main">
      <slot name="header" />

      <main class="admin-page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from './AdminSidebar.vue'
</script>

<style scoped>
.admin-page-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100vh;
}

.admin-page-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-page-content {
  padding: 24px;
}
</style>
