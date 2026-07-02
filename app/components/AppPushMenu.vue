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

        <!-- Admin-Bereich: nur für Benutzer mit role 'admin' -->
        <template v-if="authStore.isAdmin">
          <li class="push-menu-section-label" aria-hidden="true">
            <span class="push-menu-panel-title">{{ $t('nav.adminSection') }}</span>
          </li>
          <li>
            <NuxtLink to="/admin/users" class="push-menu-item" @click="close">
              <AppIcon name="group" size="1.25rem" />
              {{ $t('nav.adminUsers') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/foods" class="push-menu-item" @click="close">
              <AppIcon name="fact_check" size="1.25rem" />
              {{ $t('nav.adminFoods') }}
            </NuxtLink>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { close } = usePushMenu()
const today = new Date().toISOString().substring(0, 10)
const authStore = useAuthStore()
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;

.push-menu-item {
  gap: 0.75rem;
}

// Uppercase label separating regular nav from the admin-only section.
// Reuses Basix's .push-menu-panel-title text treatment (see push-menu.scss),
// just adds the padding it needs outside of a panel header context.
.push-menu-section-label {
  padding: calc($spacing * 1) calc($spacing * 1.5) calc($spacing * 0.4);
  pointer-events: none;
}
</style>
