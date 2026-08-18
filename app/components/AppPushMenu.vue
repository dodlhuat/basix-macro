<template>
  <nav class="push-menu">
    <!-- Desktop-only sidebar brand lockup — hidden on mobile, sits in the
         same reserved top gutter the overlay's ul padding-top already
         leaves empty (see .push-menu-panel[data-level="0"] > ul below). -->
    <div class="push-menu-brand" aria-hidden="true">
      <span class="push-menu-brand-thin">basix</span><span class="push-menu-brand-bold">makro</span>
    </div>

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
          <NuxtLink to="/activity" class="push-menu-item" @click="close">
            <AppIcon name="directions_run" size="1.25rem" />
            {{ $t('nav.activity') }}
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
const today = toLocalDateStr(new Date())
const authStore = useAuthStore()
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

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

// Brand lockup shown only inside the desktop persistent sidebar (see below).
// Hidden by default so it never affects the mobile overlay's layout/hit area.
.push-menu-brand {
  display: none;
}

// ─── Desktop: persistent sidebar instead of a slide-in overlay ─────────────
// Re-skins the exact same PushMenu DOM/JS (push-menu.scss + push-menu.js)
// used on mobile rather than introducing a second nav component — the JS
// toggle (checkbox in AppHeader) is hidden at this breakpoint so `.pushed`
// never gets applied in practice, but both variants are overridden below
// defensively (e.g. a resize from a mobile-width open menu to desktop width
// without a reload). Every selector here is scoped (carries this
// component's data-v-* attribute), which always outranks push-menu.scss's
// plain `.push-menu`/`.push-menu.pushed` selectors regardless of CSS import
// order — no !important needed.
@media (min-width: $breakpoint-desktop) {
  .push-menu,
  .push-menu.pushed {
    position: fixed;
    transform: none;
    width: $sidebar-width;
    box-shadow: none;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .push-menu-brand {
    display: flex;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: calc($spacing * 3.5);
    padding: 0 calc($spacing * 1.5);
    z-index: 2;
    font-family: 'Outfit', sans-serif;
    font-size: 1.1rem;
    letter-spacing: -0.035em;
    pointer-events: none;
  }

  .push-menu-brand-thin {
    font-weight: 200;
    opacity: 0.55;
    color: #fff;
  }

  .push-menu-brand-bold {
    font-weight: 700;
    color: #fff;
    margin-left: 0.15em;
  }
}
</style>
