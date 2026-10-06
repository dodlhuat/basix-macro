<template>
  <div v-if="clipboard.hasContent && clipboard.source" class="clip-chip" role="status">
    <AppIcon name="content_paste" size="1rem" class="clip-chip__icon" />
    <span class="clip-chip__text">
      {{ $t('mealClipboard.chip', {
        meal: $t(`meal.${clipboard.source.mealType}`),
        n: clipboard.count,
        kcal: Math.round(clipboard.totalKcal),
      }) }}
    </span>
    <button
      type="button"
      class="clip-chip__close"
      :aria-label="$t('mealClipboard.discard')"
      @click="clipboard.clear()"
    >
      <AppIcon name="close" size="1rem" />
    </button>
  </div>
</template>

<script setup lang="ts">
// Status chip shown while the meal clipboard holds content. (Basix has no
// removable-chip JS/Vue API, so this reuses its pill tokens in scoped SCSS.)
const clipboard = useMealClipboardStore()
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.clip-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.1rem 0.15rem 0.1rem 0.7rem;
  border-radius: var(--radius-full);
  background: var(--accent-color-tint);
  color: var(--accent-color-text);
  font-size: 0.75rem;
  font-weight: 600;
  animation: clip-chip-in 0.3s $ease-out-soft;
}

.clip-chip__icon {
  margin-left: -0.2rem;
}

.clip-chip__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 2.75rem hit area, visually a small circle.
.clip-chip__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  margin: -0.65rem -0.55rem -0.65rem -0.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: var(--radius-full);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: var(--primary-text);
  }
}

@keyframes clip-chip-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .clip-chip { animation: none; }
}
</style>
