<template>
  <div class="placeholder-page">
    <div class="placeholder-card">
      <h1>{{ route.meta?.title || '页面建设中' }}</h1>
      <p>{{ route.meta?.subtitle || '后续补齐' }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}

.placeholder-card {
  width: 480px;
  padding: 32px;
  border-radius: 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}

h1 {
  margin: 0 0 12px;
}

p {
  margin: 0;
  color: var(--text-secondary);
}
</style>
