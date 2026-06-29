<template>
  <nav class="push-menu">
    <div class="push-menu-panel is-active" data-level="0">
      <ul>
        <li>
          <NuxtLink to="/" class="push-menu-item" @click="close">
            <AppIcon name="home" size="1.25rem" />
            Dashboard
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="`/diary/${today}`" class="push-menu-item" @click="close">
            <AppIcon name="book" size="1.25rem" />
            Tagebuch
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/food" class="push-menu-item" @click="close">
            <AppIcon name="nutrition" size="1.25rem" />
            Lebensmittel
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/recipes" class="push-menu-item" @click="close">
            <AppIcon name="menu_book" size="1.25rem" />
            Rezepte
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/history" class="push-menu-item" @click="close">
            <AppIcon name="bar_chart" size="1.25rem" />
            Statistiken
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/weight" class="push-menu-item" @click="close">
            <AppIcon name="monitor_weight" size="1.25rem" />
            Gewicht
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings" class="push-menu-item" @click="close">
            <AppIcon name="settings" size="1.25rem" />
            Einstellungen
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { close } = usePushMenu()
const today = new Date().toISOString().split('T')[0]
</script>

<style lang="scss" scoped>
.push-menu-item {
  gap: 0.75rem;
}
</style>
