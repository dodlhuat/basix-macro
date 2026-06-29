<template>
  <header class="main-header">
    <div>
      <div class="navigation-controls">
        <label for="push-menu-toggle" aria-label="Menü öffnen">
          <AppIcon name="menu" size="1.5rem" />
        </label>
        <input id="push-menu-toggle" type="checkbox" @change="toggle" />
      </div>
    </div>
    <div>
      <div class="wordmark">
        <span class="wordmark-thin">basix</span><span class="wordmark-bold">makro</span>
      </div>
    </div>
    <div class="last">
      <button class="button button-icon" aria-label="Theme wechseln" @click="toggleTheme">
        <AppIcon :name="isDark ? 'light_mode' : 'dark_mode'" size="1.5rem" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const { toggle } = usePushMenu()
const { isDark, toggleTheme } = useTheme()
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;

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
</style>
