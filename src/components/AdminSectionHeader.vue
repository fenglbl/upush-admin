<template>
  <div class="admin-ui-section-head" :class="{ 'admin-ui-section-head--compact': compact }">
    <div>
      <div v-if="kicker" class="admin-ui-kicker">{{ kicker }}</div>
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="admin-ui-section-head__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  kicker: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})
</script>
