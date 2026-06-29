<template>
  <Teleport to="body">
    <div class="fullscreen-layout">
      <slot />
    </div>
  </Teleport>
</template>

<style>
.fullscreen-layout {
  position: fixed;
  inset: 0;
  background: var(--background);
  overflow: hidden;
  z-index: 200;
}
</style>
