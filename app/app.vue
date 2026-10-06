<template>
  <div class="app-layout">
    <AppPushMenu />
    <div class="push-menu-backdrop" @click="close" />

    <div class="push-content">
      <AppHeader />
      <main>
        <NuxtPage />
      </main>
    </div>

    <!-- Adaptive calories toast -->
    <Transition name="app-toast">
      <div v-if="adaptiveToast" class="app-toast" role="status" aria-live="polite">
        <AppIcon name="show_chart" size="1rem" class="app-toast__icon" />
        <span class="app-toast__text">{{ adaptiveToast }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { initPushMenu, close } = usePushMenu()
const { initTheme } = useTheme()
const userStore = useUserStore()
const { checkAndAdjust } = useAdaptiveCalories()
const { setLocale, t } = useI18n()

const adaptiveToast = ref<string | null>(null)

function showToast(msg: string) {
  adaptiveToast.value = msg
  setTimeout(() => { adaptiveToast.value = null }, 5000)
}

onMounted(async () => {
  await userStore.loadUser()
  if (userStore.user?.locale) {
    await setLocale(userStore.user.locale)
  }
  await initTheme(userStore.user?.dark_mode)
  await initPushMenu()

  const result = await checkAndAdjust()
  if (result.adjusted && result.newGoal && result.deltaKcal) {
    const dir = t(result.deltaKcal > 0 ? 'adaptive.raised' : 'adaptive.lowered')
    const sign = result.deltaKcal > 0 ? '+' : ''
    showToast(t('adaptive.toast', { dir, goal: result.newGoal, delta: `${sign}${result.deltaKcal}` }))
  }
})
</script>

<style lang="scss">
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

// Desktop: nav is a permanent sidebar (see AppPushMenu.vue), there's nothing
// to scrim behind — the mobile overlay backdrop must never appear here.
@media (min-width: $breakpoint-desktop) {
  .push-menu-backdrop {
    display: none !important;
  }
}

// Pinned at the TOP (below the fixed header) rather than the bottom: the bottom
// edge is already taken by the dashboard FAB (z 50), MealUndoBar (z 1100, above
// the FAB) and bottom sheets (z 999). Top placement can never collide with them
// and does not cover the sync indicator, which lives inside the header itself.
// Informational only: pointer-events none so it never blocks a tap, and it
// auto-dismisses after 5s (see showToast).
.app-toast {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + #{$header-height} + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.65rem 1rem;
  background: var(--primary-text);
  color: var(--background);
  border-radius: var(--radius-lg);
  font-size: var(--fs-base-sm);
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  pointer-events: none;

  &__icon {
    flex-shrink: 0;
    margin-top: 0.1rem;
    opacity: 0.75;
  }

  &__text {
    min-width: 0;
  }
}

.app-toast-enter-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.app-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.2s ease;
}
.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .app-toast-enter-active,
  .app-toast-leave-active {
    transition: opacity 0.15s linear;
  }
  .app-toast-enter-from,
  .app-toast-leave-to {
    transform: translateX(-50%);
  }
}
</style>
