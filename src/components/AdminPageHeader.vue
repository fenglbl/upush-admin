<template>
  <header class="admin-page-header">
    <div class="admin-page-header__left">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="admin-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.admin-page-header {
  min-height: 72px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
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
}

.admin-page-header p {
  margin: 6px 0 0;
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
</style>
