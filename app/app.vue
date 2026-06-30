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
        <AppIcon name="auto_graph" size="1rem" class="app-toast__icon" />
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

const adaptiveToast = ref<string | null>(null)

function showToast(msg: string) {
  adaptiveToast.value = msg
  setTimeout(() => { adaptiveToast.value = null }, 5000)
}

onMounted(async () => {
  await userStore.loadUser()
  await initTheme(userStore.user?.dark_mode)
  await initPushMenu()

  const result = await checkAndAdjust()
  if (result.adjusted && result.newGoal && result.deltaKcal) {
    const dir = result.deltaKcal > 0 ? 'erhöht' : 'gesenkt'
    showToast(`Kalorienziel ${dir} auf ${result.newGoal} kcal (${result.deltaKcal > 0 ? '+' : ''}${result.deltaKcal} kcal)`)
  }
})
</script>

<style lang="scss">
@use "@dodlhuat/basix/css/parameters" as *;

.app-toast {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: var(--primary-text);
  color: var(--background);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  pointer-events: none;

  &__icon {
    flex-shrink: 0;
    opacity: 0.75;
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
  transform: translateX(-50%) translateY(0.5rem);
}
</style>
