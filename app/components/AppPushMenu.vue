<template>
  <nav class="push-menu">
    <div class="push-menu-panel is-active" data-level="0">
      <ul>
        <li>
          <NuxtLink to="/" class="push-menu-item" @click="close">
            <AppIcon name="home" size="1.25rem" />
            {{ $t('nav.dashboard') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="`/diary/${today}`" class="push-menu-item" @click="close">
            <AppIcon name="book" size="1.25rem" />
            {{ $t('nav.diary') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/food" class="push-menu-item" @click="close">
            <AppIcon name="nutrition" size="1.25rem" />
            {{ $t('nav.food') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/recipes" class="push-menu-item" @click="close">
            <AppIcon name="menu_book" size="1.25rem" />
            {{ $t('nav.recipes') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/history" class="push-menu-item" @click="close">
            <AppIcon name="bar_chart" size="1.25rem" />
            {{ $t('nav.statistics') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/weight" class="push-menu-item" @click="close">
            <AppIcon name="monitor_weight" size="1.25rem" />
            {{ $t('nav.weight') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/body-fat" class="push-menu-item" @click="close">
            <AppIcon name="straighten" size="1.25rem" />
            {{ $t('nav.bodyFat') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/settings" class="push-menu-item" @click="close">
            <AppIcon name="settings" size="1.25rem" />
            {{ $t('nav.settings') }}
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
