<template>
  <header class="main-header">
    <div>
      <div class="navigation-controls">
        <label for="push-menu-toggle" aria-label="Menü öffnen">
          <AppIcon name="menu" size="1.5rem" />
        </label>
        <input id="push-menu-toggle" type="checkbox" @change="toggle" >
      </div>
    </div>
    <div>
      <div class="wordmark">
        <span class="wordmark-thin">basix</span><span class="wordmark-bold">makro</span>
      </div>
    </div>
    <div class="last"/>
  </header>
</template>

<script setup lang="ts">
const { toggle } = usePushMenu()
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

.wordmark {
  font-family: 'Outfit', sans-serif;
  font-size: 1.15rem;
  line-height: 1;
  letter-spacing: -0.035em;
  color: var(--primary-text);
}

.wordmark-thin {
  font-weight: 200;
  opacity: 0.65;
}

.wordmark-bold {
  font-weight: 700;
}

.navigation-controls label {
  display: flex;
  align-items: center;
  justify-content: center;
}

// ─── Desktop: persistent sidebar replaces the hamburger overlay ────────────
// The header no longer needs a menu toggle, and it now sits to the right of
// the fixed sidebar rather than spanning the full viewport width. Selectors
// below repeat both the base and `.pushed` variant of .main-header (owned by
// push-menu.scss) so this scoped, higher-specificity override wins outright
// regardless of any leftover toggle state — see main.scss / AppPushMenu.vue
// for the matching sidebar/content-offset half of this change.
//
// `left: 0` (not `$sidebar-width`) is intentional: .main-header's parent
// .push-content has `will-change: transform` (push-menu.scss, for the mobile
// slide animation), which makes it the containing block for this `position:
// fixed` header instead of the viewport. .push-content itself already carries
// `margin-left: $sidebar-width` on desktop (main.scss), so `left` here is
// relative to that already-shifted box — using $sidebar-width again would
// double the offset and leave a gap between the sidebar and the header.
@media (min-width: $breakpoint-desktop) {
  .main-header,
  .main-header.pushed {
    left: 0;
    right: 0;
    width: auto;
  }

  .navigation-controls {
    display: none;
  }

  .wordmark {
    font-size: 1.3rem;
    margin-left: calc($spacing * 1.5);
  }
}
</style>
