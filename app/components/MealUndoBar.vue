<template>
  <Transition name="undo-bar">
    <div v-if="undo" :key="undo.ids[0]" class="undo-bar" role="status" aria-live="polite">
      <AppIcon name="check_circle" size="1.25rem" class="undo-bar__icon" />
      <span class="undo-bar__msg">{{ undo.message }}</span>
      <button type="button" class="undo-bar__action" @click="runUndo()">
        {{ $t('mealClipboard.undo') }}
      </button>
      <span class="undo-bar__timer" aria-hidden="true" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
// Undo snackbar for a meal paste (Basix Toast has no action support).
// State is shared via useMealClipboard(); auto-dismisses after 6 s.
const props = defineProps<{ date: string }>()
const dateRef = computed(() => props.date)
const { undo, runUndo, dismissUndo } = useMealClipboard(dateRef)

const DURATION_MS = 6000
let timer: ReturnType<typeof setTimeout> | undefined

watch(undo, (value) => {
  clearTimeout(timer)
  if (value) timer = setTimeout(dismissUndo, DURATION_MS)
}, { immediate: true })

onBeforeUnmount(() => {
  clearTimeout(timer)
  dismissUndo()
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.undo-bar {
  position: fixed;
  left: 50%;
  bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.25rem 0.25rem 0.25rem 0.9rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--primary-text);
  color: var(--background);
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.25);
  font-size: 0.85rem;
}

.undo-bar__icon {
  flex-shrink: 0;
  color: var(--accent-color-lighten);
}

.undo-bar__msg {
  min-width: 0;
  line-height: 1.3;
}

.undo-bar__action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  min-height: 2.75rem;
  padding: 0 0.9rem;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--accent-color-lighten);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.8rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgb(255 255 255 / 0.12);
    outline: none;
  }

  &:active { background: rgb(255 255 255 / 0.2); }
}

// Thin countdown line along the bottom edge.
.undo-bar__timer {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: var(--accent-color-lighten);
  transform-origin: left;
  animation: undo-bar-timer 6s linear forwards;
}

.undo-bar-enter-active,
.undo-bar-leave-active {
  transition: opacity $duration-base $ease-standard, transform $duration-slow $ease-out-soft;
}

.undo-bar-enter-from,
.undo-bar-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.75rem);
}

@keyframes undo-bar-timer {
  to { transform: scaleX(0); }
}

@media (min-width: 768px) {
  .undo-bar { bottom: 2rem; }
}

@media (prefers-reduced-motion: reduce) {
  .undo-bar-enter-active,
  .undo-bar-leave-active { transition: opacity $duration-fast linear; }
  .undo-bar-enter-from,
  .undo-bar-leave-to { transform: translate(-50%, 0); }
  .undo-bar__timer { animation: none; display: none; }
}
</style>
