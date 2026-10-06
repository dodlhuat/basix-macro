<template>
  <!-- Visually hidden live region: announces state *changes* only (no counts, so it
       doesn't chatter on every local write). Empty + out of flow while hidden. -->
  <span class="sr-only" role="status" aria-live="polite">{{ liveText }}</span>

  <button
    v-if="state !== 'hidden'"
    ref="triggerEl"
    type="button"
    class="sync-indicator"
    :class="`sync-indicator--${state}`"
    :aria-label="triggerLabel"
    aria-haspopup="dialog"
    @click="openSheet"
  >
    <AppIcon :name="iconName" size="1.375rem" class="sync-indicator__icon" />
    <span v-if="showBadge" class="sync-indicator__badge" aria-hidden="true">{{ badgeText }}</span>
  </button>

  <Teleport to="body">
    <div
      v-if="sheetMounted"
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': sheetVisible }"
      :aria-hidden="!sheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeSheet" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('syncStatus.title')"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <div class="sync-sheet__title-group">
            <p class="title">{{ $t('syncStatus.title') }}</p>
          </div>
          <button
            ref="closeEl"
            type="button"
            class="close button button-icon"
            :aria-label="$t('common.close')"
            @click="closeSheet"
          >
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">
          <div class="sync-sheet__status" :class="`sync-sheet__status--${sheetKind}`">
            <span class="sync-sheet__icon" aria-hidden="true">
              <AppIcon :name="sheetIconName" size="1.5rem" :class="{ 'sync-sheet__spin': sheetKind === 'syncing' }" />
            </span>
            <div class="sync-sheet__text" aria-live="polite">
              <p class="sync-sheet__headline">{{ $t(`syncStatus.headline.${sheetKind}`) }}</p>
              <p class="sync-sheet__description">{{ $t(`syncStatus.description.${sheetKind}`) }}</p>
              <p v-if="showPendingLine" class="sync-sheet__pending">
                {{ $t('syncStatus.pendingCount', { count: pendingCount }, pendingCount) }}
              </p>
              <p v-if="sheetKind === 'error' && syncError" class="sync-sheet__error">
                <span class="sync-sheet__error-label">{{ $t('syncStatus.errorDetail') }}</span>
                {{ syncError }}
              </p>
            </div>
          </div>

          <dl class="sync-sheet__meta">
            <dt>{{ $t('syncStatus.lastSynced') }}</dt>
            <dd>{{ lastSyncedLabel }}</dd>
          </dl>
        </div>

        <div v-if="sheetKind !== 'done'" class="bottom-sheet-footer">
          <div class="sync-sheet__footer-stack">
          <p v-if="sheetKind === 'offline'" class="sync-sheet__hint">{{ $t('syncStatus.offlineHint') }}</p>
          <button
            type="button"
            class="button button-primary sync-sheet__action"
            :class="{ 'is-loading': isSyncing }"
            :disabled="isSyncing || !online"
            @click="handleSyncNow"
          >
            <template v-if="!isSyncing">
              <AppIcon name="sync" size="1.125rem" />
              {{ $t('syncStatus.syncNow') }}
            </template>
            <template v-else>{{ $t('syncStatus.syncing') }}</template>
          </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Header sync indicator + detail bottom sheet. Renders nothing while `state` is
 * 'hidden' (everything synced or logged out). Offline is a normal local-first
 * state, so only `error` uses a warning color.
 */
const { t, locale } = useI18n()
const { state, online, pendingCount, lastSyncedAt, syncError, isSyncing, syncNow } = useSyncStatus()

const triggerEl = ref<HTMLButtonElement | null>(null)
const closeEl = ref<HTMLButtonElement | null>(null)

// ─── Trigger ────────────────────────────────────────────────────────────────

const ICONS = { syncing: 'sync', offline: 'cloud_off', error: 'warning', pending: 'cloud_upload', done: 'check_circle' } as const

const iconName = computed(() => (state.value === 'hidden' ? ICONS.pending : ICONS[state.value]))

const showBadge = computed(() =>
  (state.value === 'pending' || state.value === 'offline') && pendingCount.value > 0,
)
const badgeText = computed(() => (pendingCount.value > 99 ? '99+' : String(pendingCount.value)))

const triggerLabel = computed(() => {
  const s = state.value
  if (s === 'hidden') return ''
  const count = pendingCount.value
  if (s !== 'syncing' && count > 0) {
    return t(`syncStatus.labelWithCount.${s}`, { count }, count)
  }
  return t(`syncStatus.label.${s}`)
})

const liveText = computed(() => (state.value === 'hidden' ? '' : t(`syncStatus.live.${state.value}`)))

// ─── Sheet ──────────────────────────────────────────────────────────────────

const sheetMounted = ref(false)
const sheetVisible = ref(false)
let unmountTimer: ReturnType<typeof setTimeout> | undefined
let doneTimer: ReturnType<typeof setTimeout> | undefined

// When the last change syncs, the indicator (state -> hidden) disappears; the open
// sheet keeps showing a brief "all synced" confirmation instead of going empty.
const sheetKind = computed<'syncing' | 'offline' | 'error' | 'pending' | 'done'>(() =>
  state.value === 'hidden' ? 'done' : state.value,
)
const sheetIconName = computed(() => ICONS[sheetKind.value])
const showPendingLine = computed(() =>
  pendingCount.value > 0 && (sheetKind.value === 'offline' || sheetKind.value === 'error'),
)

const lastSyncedLabel = computed(() =>
  lastSyncedAt.value ? formatLocalDateTime(lastSyncedAt.value, locale.value) : t('syncStatus.never'),
)

function openSheet() {
  clearTimeout(unmountTimer)
  sheetMounted.value = true
  // One frame after mounting so the Basix slide-up transition actually runs.
  requestAnimationFrame(() => {
    sheetVisible.value = true
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
    nextTick(() => closeEl.value?.focus())
  })
}

function closeSheet() {
  clearTimeout(doneTimer)
  sheetVisible.value = false
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
  triggerEl.value?.focus()
  unmountTimer = setTimeout(() => { sheetMounted.value = false }, 400)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeSheet()
}

async function handleSyncNow() {
  if (isSyncing.value || !online.value) return
  await syncNow()
}

watch(state, (s) => {
  if (!sheetVisible.value) return
  clearTimeout(doneTimer)
  if (s === 'hidden') doneTimer = setTimeout(closeSheet, 1600)
})

onBeforeUnmount(() => {
  clearTimeout(doneTimer)
  clearTimeout(unmountTimer)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

// ─── Header trigger ─────────────────────────────────────────────────────────
.sync-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  // Keeps the icon on the header's right gutter line while the tap area is 44px.
  margin-inline-end: -0.625rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 160ms ease, transform 160ms ease;

  &:hover {
    background: color-mix(in srgb, var(--secondary-text) 12%, transparent);
  }

  &:active {
    transform: scale(0.92);
  }

  &:focus-visible {
    outline: 2px solid var(--app-accent-text);
    outline-offset: -2px;
  }

  &--error {
    color: var(--app-warning-text);
  }

  &--syncing &__icon {
    animation: sync-spin 1.2s linear infinite;
  }

  &__badge {
    position: absolute;
    top: 0.25rem;
    right: 0.125rem;
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.25rem;
    border-radius: 0.5rem;
    // Inverse of the header surface: high contrast in light and dark, neutral hue.
    background: var(--primary-text);
    color: var(--secondary-background);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 0 0 2px var(--secondary-background);
    pointer-events: none;
  }
}

// ─── Detail sheet ───────────────────────────────────────────────────────────
.sync-sheet {
  &__title-group {
    flex: 1;
    min-width: 0;
  }

  &__status {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
    color: var(--secondary-text);

    &--error {
      --sync-tone: var(--app-warning-text);
    }

    &--done {
      --sync-tone: var(--app-success-text);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    color: var(--sync-tone, var(--secondary-text));
    background: color-mix(in srgb, var(--sync-tone, var(--secondary-text)) 14%, transparent);
  }

  &__spin {
    animation: sync-spin 1.2s linear infinite;
  }

  &__text {
    min-width: 0;
  }

  &__headline {
    margin: 0 0 0.25rem;
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--sync-tone, var(--primary-text));
  }

  &__description,
  &__pending {
    margin: 0 0 0.25rem;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: var(--secondary-text);
  }

  &__error {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
    color: var(--app-warning-text);
  }

  &__error-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin: 1.25rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid var(--divider);
    font-size: 0.9375rem;

    dt {
      color: var(--secondary-text);
    }

    dd {
      margin: 0;
      color: var(--primary-text);
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
  }

  &__footer-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  &__hint {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--secondary-text);
    text-align: center;
  }

  &__action {
    width: 100%;
    min-height: 2.75rem;
  }
}

@keyframes sync-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .sync-indicator--syncing .sync-indicator__icon,
  .sync-sheet__spin {
    animation: none;
  }

  .sync-indicator {
    transition: none;
  }
}
</style>
