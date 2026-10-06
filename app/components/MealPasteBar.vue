<template>
  <button
    v-if="clipboard.hasContent && clipboard.source"
    type="button"
    class="paste-bar"
    :disabled="busy"
    :aria-label="ariaLabel"
    @click="emit('paste')"
  >
    <AppIcon name="content_paste" size="1.25rem" class="paste-bar__icon" />
    <span class="paste-bar__action">{{ $t('mealClipboard.pasteAction') }}</span>
    <span class="paste-bar__meta">{{ meta }}</span>
  </button>
</template>

<script setup lang="ts">
// Contextual paste row inside a meal: only rendered while the clipboard holds
// content, and shows what would be pasted. Replaces the old header icon + chip.
const props = defineProps<{ label: string; busy: boolean }>()
const emit = defineEmits<{ paste: [] }>()

const clipboard = useMealClipboardStore()
const { t } = useI18n()

const params = computed(() => ({
  meal: clipboard.source ? t(`meal.${clipboard.source.mealType}`) : '',
  n: clipboard.count,
  kcal: Math.round(clipboard.totalKcal),
}))
const meta = computed(() => t('mealClipboard.pasteMeta', params.value))
const ariaLabel = computed(() => t('mealClipboard.pasteAria', { ...params.value, target: props.label }))
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.paste-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-height: 2.75rem;
  margin-top: 0.5rem;
  padding: 0 0.85rem;
  border: 1.5px dashed var(--accent-color);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--app-accent-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  animation: paste-bar-in $duration-slow $ease-out-soft;
  transition:
    background-color $duration-base $ease-standard,
    transform $duration-fast $ease-standard;

  &:hover,
  &:focus-visible {
    background: var(--accent-color-tint);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.985);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.paste-bar__icon {
  color: var(--app-accent-text);
}

.paste-bar__action {
  flex-shrink: 0;
  font-size: var(--fs-base-sm);
  font-weight: 700;
}

.paste-bar__meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--secondary-text);
  font-size: var(--fs-xs);
  text-align: right;
}

@keyframes paste-bar-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .paste-bar { animation: none; transition: none; }
  .paste-bar:active { transform: none; }
}
</style>
