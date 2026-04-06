<template>
  <section class="admin-ui-card admin-ui-hero">
    <div class="admin-ui-hero__main">
      <div v-if="kicker" class="admin-ui-kicker">{{ kicker }}</div>
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
      <slot />
    </div>

    <div v-if="$slots.side || sideNote" class="admin-ui-hero__side">
      <slot name="side" />
      <div v-if="sideNote" class="admin-ui-hero-side-note">{{ sideNote }}</div>
    </div>
  </section>
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
  sideNote: {
    type: String,
    default: ''
  }
})
</script>
