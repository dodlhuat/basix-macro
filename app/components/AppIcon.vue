<template>
  <svg
    class="app-icon"
    :style="{ width: size, height: size }"
    aria-hidden="true"
    focusable="false"
  >
    <use :href="`${base}/icons.svg#${name}`" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  size?: string
}>(), {
  size: '1.5rem',
})

const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
</script>

<style scoped>
.app-icon {
  display: inline-block;
  fill: currentColor;
  flex-shrink: 0;
  vertical-align: middle;
  overflow: visible;
}
</style>
