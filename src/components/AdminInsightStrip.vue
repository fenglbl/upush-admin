<template>
  <section class="admin-ui-insight-strip">
    <div v-for="item in items" :key="item.key || item.label" class="admin-ui-insight-strip__item">
      <span class="admin-ui-insight-strip__label">{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </section>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>
