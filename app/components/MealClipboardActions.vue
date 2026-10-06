<template>
  <span class="meal-clip">
    <button
      v-if="canCopy"
      type="button"
      class="button button-icon button-sm meal-clip__btn"
      :class="{ 'meal-clip__btn--source': isSource }"
      :aria-label="$t('mealClipboard.copy', { meal: label })"
      :aria-pressed="isSource"
      @click="emit('copy')"
    >
      <AppIcon name="content_copy" size="1.25rem" />
    </button>
    <button
      v-if="canPaste"
      type="button"
      class="button button-icon button-sm meal-clip__btn meal-clip__btn--paste"
      :disabled="busy"
      :aria-label="$t('mealClipboard.paste', { meal: label })"
      @click="emit('paste')"
    >
      <AppIcon name="content_paste" size="1.25rem" />
    </button>
  </span>
</template>

<script setup lang="ts">
// Copy / paste icon pair for a meal header. Pure presentation: the parent
// wires the events to useMealClipboard(). Touch targets are 2.75rem, pulled
// back with negative margins so the header row keeps its height.
defineProps<{
  label: string
  canCopy: boolean
  canPaste: boolean
  isSource: boolean
  busy: boolean
}>()

const emit = defineEmits<{ copy: []; paste: [] }>()
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.meal-clip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.meal-clip__btn {
  width: 2.75rem;
  height: 2.75rem;
  margin: -0.375rem -0.3rem;
  color: var(--secondary-text);
  transition:
    transform $duration-base $ease-standard,
    color $duration-base $ease-standard,
    background-color $duration-base $ease-standard;

  &:hover,
  &:focus-visible {
    color: var(--accent-color);
  }

  &:active {
    transform: scale(0.9);
  }

  // Marks the meal the clipboard was copied from (same day only).
  &--source {
    color: var(--accent-color);
    background: var(--accent-color-tint);
  }

  &:disabled {
    opacity: 0.5;
  }
}

.meal-clip__btn--paste {
  color: var(--accent-color);
}

@media (prefers-reduced-motion: reduce) {
  .meal-clip__btn {
    transition: none;

    &:active {
      transform: none;
    }
  }
}
</style>
