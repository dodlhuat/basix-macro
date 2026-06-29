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
  </div>
</template>

<script setup lang="ts">
const { initPushMenu, close } = usePushMenu()
const { initTheme } = useTheme()
const userStore = useUserStore()

onMounted(async () => {
  await userStore.loadUser()
  await initTheme(userStore.user?.dark_mode)
  await initPushMenu()
})
</script>
