<template>
  <div v-if="hasItems" class="meal-menu">
    <button
      ref="triggerEl"
      type="button"
      class="meal-menu__trigger"
      :class="{ 'meal-menu__trigger--open': open }"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="$t('mealClipboard.menu', { meal: label })"
      @click="toggle"
    >
      <AppIcon name="more_horiz" size="1.4rem" />
    </button>

    <Teleport to="body">
      <Transition name="meal-menu-pop">
        <div
          v-if="open"
          ref="popEl"
          class="meal-menu__pop"
          role="menu"
          :style="popStyle"
          @keydown="onKeydown"
        >
          <button
            v-if="canCopy"
            type="button"
            class="meal-menu__item"
            role="menuitem"
            @click="pick('copy')"
          >
            <AppIcon name="content_copy" size="1.25rem" />
            <span class="meal-menu__text">{{ $t('mealClipboard.copyAction') }}</span>
            <AppIcon v-if="isSource" name="check" size="1.1rem" class="meal-menu__check" />
          </button>
          <button
            v-if="canSaveRecipe"
            type="button"
            class="meal-menu__item"
            role="menuitem"
            @click="pick('save-recipe')"
          >
            <AppIcon name="bookmark_add" size="1.25rem" />
            <span class="meal-menu__text">{{ $t('diary.diaryPage.saveAsRecipe') }}</span>
          </button>
          <button
            v-if="clipboard.hasContent"
            type="button"
            class="meal-menu__item meal-menu__item--muted"
            role="menuitem"
            @click="pick('discard')"
          >
            <AppIcon name="close" size="1.25rem" />
            <span class="meal-menu__text">{{ $t('mealClipboard.discard') }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// Overflow menu (⋯) for secondary meal actions: copy, save as recipe, clear
// clipboard. Basix' ContextMenu/Popover are imperative DOM controllers, so a
// small Vue disclosure menu is used instead; the popover is teleported to
// <body> because the meal list clips its overflow.
const props = defineProps<{
  label: string
  canCopy: boolean
  canSaveRecipe?: boolean
  isSource: boolean
}>()

const emit = defineEmits<{ copy: []; 'save-recipe': []; discard: [] }>()

const clipboard = useMealClipboardStore()
const hasItems = computed(() => props.canCopy || props.canSaveRecipe || clipboard.hasContent)

const open = ref(false)
const triggerEl = ref<HTMLButtonElement>()
const popEl = ref<HTMLElement>()
const popStyle = ref<Record<string, string>>({})

function place() {
  const r = triggerEl.value?.getBoundingClientRect()
  if (!r) return
  popStyle.value = {
    top: `${Math.round(r.bottom + 4)}px`,
    right: `${Math.max(8, Math.round(window.innerWidth - r.right))}px`,
  }
}

async function openMenu() {
  place()
  open.value = true
  await nextTick()
  popEl.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
}

function close(returnFocus = false) {
  if (!open.value) return
  open.value = false
  if (returnFocus) triggerEl.value?.focus()
}

function toggle() {
  if (open.value) close()
  else openMenu()
}

function pick(action: 'copy' | 'save-recipe' | 'discard') {
  close(true)
  if (action === 'copy') emit('copy')
  else if (action === 'save-recipe') emit('save-recipe')
  else emit('discard')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close(true)
    return
  }
  if (e.key === 'Tab') {
    close()
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const items = Array.from(popEl.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  const i = items.indexOf(document.activeElement as HTMLElement)
  const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
  items[next]?.focus()
}

function onPointerDown(e: PointerEvent) {
  const t = e.target as Node
  if (popEl.value?.contains(t) || triggerEl.value?.contains(t)) return
  close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('resize', onDismiss)
  window.addEventListener('scroll', onDismiss, { passive: true, capture: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('resize', onDismiss)
  window.removeEventListener('scroll', onDismiss, { capture: true })
})
function onDismiss() { close() }
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

.meal-menu {
  flex-shrink: 0;
}

// 2.75rem hit area; negative margins keep the header row compact.
.meal-menu__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin: -0.5rem -0.35rem;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  transition:
    background-color $duration-base $ease-standard,
    color $duration-base $ease-standard,
    transform $duration-fast $ease-standard;

  &:hover,
  &--open {
    background: var(--hover);
    color: var(--primary-text);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: -2px;
  }

  &:active {
    transform: scale(0.92);
  }
}

.meal-menu__pop {
  position: fixed;
  z-index: 1200;
  min-width: 13.5rem;
  max-width: calc(100vw - 1rem);
  padding: 0.35rem;
  border: 1px solid var(--divider);
  border-radius: var(--radius-lg);
  background: var(--primary-bg);
  box-shadow: 0 10px 32px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.08);
  transform-origin: top right;
}

.meal-menu__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--primary-text);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color $duration-fast $ease-standard;

  &:hover,
  &:focus-visible {
    background: var(--accent-color-tint);
    color: var(--accent-color-text);
    outline: none;
  }

  &--muted {
    color: var(--secondary-text);
  }

  // Separates the destructive-ish clipboard action from the primary ones.
  & + &--muted {
    margin-top: 0.25rem;
    border-top: 1px solid var(--divider);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }
}

.meal-menu__text {
  flex: 1;
  min-width: 0;
}

.meal-menu__check {
  color: var(--success-text);
}

.meal-menu-pop-enter-active,
.meal-menu-pop-leave-active {
  transition:
    opacity $duration-fast $ease-standard,
    transform $duration-base $ease-out-soft;
}

.meal-menu-pop-enter-from,
.meal-menu-pop-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .meal-menu__trigger { transition: none; }
  .meal-menu-pop-enter-active,
  .meal-menu-pop-leave-active { transition: opacity $duration-fast linear; }
  .meal-menu-pop-enter-from,
  .meal-menu-pop-leave-to { transform: none; }
}
</style>
