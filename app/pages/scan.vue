<template>
  <div class="scanner" aria-label="Barcode-Scanner">

    <!-- Full-screen video viewfinder -->
    <video
      ref="videoEl"
      class="scanner__video"
      playsinline
      autoplay
      muted
      aria-hidden="true"
    />

    <!-- ── Idle / Requesting state ──────────────────────────────── -->
    <div
      v-if="barcodeState === 'idle' || barcodeState === 'requesting'"
      class="scanner__state-overlay"
    >
      <div class="loading scanner__spinner" aria-label="Kamera wird gestartet" />
      <p class="scanner__state-text">Kamera wird gestartet …</p>
    </div>

    <!-- ── Error state ──────────────────────────────────────────── -->
    <div v-else-if="barcodeState === 'error'" class="scanner__state-overlay">
      <AppIcon name="error" size="2.5rem" class="scanner__error-icon" />
      <p class="scanner__state-text scanner__state-text--error">{{ barcodeError }}</p>
      <button class="button scanner__retry-btn" @click="retry">
        Erneut versuchen
      </button>
    </div>

    <!-- ── Scanning overlay ─────────────────────────────────────── -->
    <div v-if="barcodeState === 'scanning'" class="scanner__overlay">

      <!-- Crosshair frame — box-shadow creates the dark vignette outside -->
      <div
        class="scanner__frame"
        :class="{ 'scanner__frame--processing': isProcessing }"
        aria-hidden="true"
      >
        <span class="scanner__corner scanner__corner--tl" />
        <span class="scanner__corner scanner__corner--tr" />
        <span class="scanner__corner scanner__corner--bl" />
        <span class="scanner__corner scanner__corner--br" />

        <!-- Scan line replaces with pulse during processing -->
        <div v-if="!isProcessing" class="scanner__scan-line" />
        <div v-else class="scanner__processing-pulse" />
      </div>

      <p class="scanner__hint">Barcode in das Feld halten</p>
    </div>

    <!-- ── Processing label (floats below the frame) ───────────── -->
    <div
      v-if="isProcessing"
      class="scanner__processing-label"
      aria-live="polite"
      role="status"
    >
      <div class="loading scanner__processing-spinner" />
      <span>Produkt wird gesucht …</span>
    </div>

    <!-- ── Back button ──────────────────────────────────────────── -->
    <button class="scanner__back" aria-label="Zurück" @click="goBack">
      <AppIcon name="arrow_back" size="1.25rem" />
    </button>

    <!-- ── Manual barcode input ─────────────────────────────────── -->
    <div v-if="barcodeState === 'scanning'" class="scanner__manual">
      <button
        v-if="!showManualInput"
        class="scanner__manual-toggle"
        @click="openManualInput"
      >
        Barcode manuell eingeben
      </button>
      <div v-else class="scanner__manual-form">
        <div class="input-group scanner__manual-input-wrap">
          <input
            ref="manualInputEl"
            v-model="manualBarcode"
            type="text"
            inputmode="numeric"
            class="scanner__manual-input"
            placeholder="EAN / GTIN …"
            aria-label="Barcode manuell eingeben"
            @keydown.enter="submitManual"
          />
        </div>
        <button
          class="button button-primary scanner__manual-submit"
          :disabled="!manualBarcode.trim() || isProcessing"
          aria-label="Barcode suchen"
          @click="submitManual"
        >
          <AppIcon name="search" size="1.125rem" />
        </button>
      </div>
    </div>

  </div>

  <!-- ── Result / Not-found bottom sheet ─────────────────────────── -->
  <Teleport to="body">
    <div
      class="scanner-sheet-wrapper"
      :class="{ 'is-visible': sheetMode !== 'hidden' }"
      :aria-hidden="sheetMode === 'hidden'"
    >
      <div class="scanner-sheet-backdrop" @click="dismissSheet" />

      <div
        class="scanner-sheet"
        role="dialog"
        :aria-modal="sheetMode !== 'hidden'"
        :aria-label="sheetMode === 'found' ? 'Produkt gefunden' : 'Produkt nicht gefunden'"
      >
        <div class="scanner-sheet__handle" aria-hidden="true" />

        <!-- ─ Found product ─ -->
        <template v-if="sheetMode === 'found' && offProduct">
          <div class="scanner-sheet__header">
            <AppIcon name="check_circle" size="1.375rem" class="scanner-sheet__found-icon" />
            <div class="scanner-sheet__product-info">
              <p class="scanner-sheet__product-name">{{ offProduct.name }}</p>
              <p v-if="offProduct.brand" class="scanner-sheet__product-brand">
                {{ offProduct.brand }}
              </p>
            </div>
          </div>

          <div class="scanner-sheet__body">
            <div class="scanner-sheet__macros">
              <div class="scanner-sheet__macro">
                <span class="scanner-sheet__macro-value">{{ offProduct.calories }}</span>
                <span class="scanner-sheet__macro-label">kcal</span>
              </div>
              <div class="scanner-sheet__macro scanner-sheet__macro--protein">
                <span class="scanner-sheet__macro-value">{{ offProduct.protein }}g</span>
                <span class="scanner-sheet__macro-label">Protein</span>
              </div>
              <div class="scanner-sheet__macro scanner-sheet__macro--carbs">
                <span class="scanner-sheet__macro-value">{{ offProduct.carbs }}g</span>
                <span class="scanner-sheet__macro-label">Kohlenhydrate</span>
              </div>
              <div class="scanner-sheet__macro scanner-sheet__macro--fat">
                <span class="scanner-sheet__macro-value">{{ offProduct.fat }}g</span>
                <span class="scanner-sheet__macro-label">Fett</span>
              </div>
            </div>
            <p class="scanner-sheet__per-100">pro 100 g</p>
          </div>

          <div class="scanner-sheet__footer">
            <button class="button scanner-sheet__rescan" @click="rescan">
              Nochmal scannen
            </button>
            <button
              class="button button-primary scanner-sheet__save"
              :disabled="isSaving"
              @click="saveAndAdd"
            >
              <span v-if="isSaving" class="loading" />
              <template v-else>
                <AppIcon name="add" size="1rem" />
                Speichern &amp; hinzufügen
              </template>
            </button>
          </div>
        </template>

        <!-- ─ Not found ─ -->
        <template v-if="sheetMode === 'not-found'">
          <div class="scanner-sheet__header">
            <AppIcon name="error" size="1.375rem" class="scanner-sheet__not-found-icon" />
            <div class="scanner-sheet__product-info">
              <p class="scanner-sheet__product-name">Produkt nicht gefunden</p>
              <p class="scanner-sheet__product-brand">
                Barcode: {{ scannedBarcode }}
              </p>
            </div>
          </div>

          <div class="scanner-sheet__footer">
            <button class="button scanner-sheet__rescan" @click="rescan">
              Nochmal scannen
            </button>
            <NuxtLink
              :to="`/food/add?barcode=${encodeURIComponent(scannedBarcode)}`"
              class="button button-outline scanner-sheet__manual-link"
              @click="stopScanner"
            >
              <AppIcon name="add" size="1rem" />
              Manuell anlegen
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const foodStore = useFoodStore()
const { lookupBarcode, mapToFoodItem } = useOpenFoodFacts()
const {
  state: barcodeState,
  error: barcodeError,
  startScanner,
  stopScanner,
} = useBarcode()

// ─── Template refs ────────────────────────────────────────────────────────────

const videoEl = ref<HTMLVideoElement | null>(null)
const manualInputEl = ref<HTMLInputElement | null>(null)

// ─── Scanner state ────────────────────────────────────────────────────────────

const isProcessing = ref(false)
const scannedBarcode = ref('')
const showManualInput = ref(false)
const manualBarcode = ref('')

// ─── Sheet state ──────────────────────────────────────────────────────────────

type SheetMode = 'hidden' | 'found' | 'not-found'
const sheetMode = ref<SheetMode>('hidden')
const isSaving = ref(false)

interface OffDisplayProduct {
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  rawMapped: ReturnType<typeof mapToFoodItem>
}

const offProduct = ref<OffDisplayProduct | null>(null)

// ─── Return-to params (passed in from diary/add) ──────────────────────────────

const fromDate = computed(
  () => (route.query.date as string) || new Date().toISOString().substring(0, 10),
)
const fromMeal = computed(() => (route.query.meal as string) || 'snack')

// ─── Core scan handler ────────────────────────────────────────────────────────

async function onDetected(barcode: string) {
  // Ignore repeated frames while already processing or sheet is open
  if (isProcessing.value || sheetMode.value !== 'hidden') return
  isProcessing.value = true
  scannedBarcode.value = barcode

  try {
    // 1. Check local DB first — fastest path
    const localItem = await foodStore.findByBarcode(barcode)
    if (localItem) {
      stopScanner()
      await navigateTo(
        `/diary/add?food_id=${localItem.id}&date=${fromDate.value}&meal=${fromMeal.value}`,
      )
      return
    }

    // 2. Query Open Food Facts
    const result = await lookupBarcode(barcode)

    if (result.found && result.product) {
      const mapped = mapToFoodItem(result.product)
      offProduct.value = {
        name: mapped.name,
        brand: mapped.brand,
        calories: mapped.calories_per_100g,
        protein: mapped.protein_per_100g,
        carbs: mapped.carbs_per_100g,
        fat: mapped.fat_per_100g,
        rawMapped: mapped,
      }
      sheetMode.value = 'found'
    }
    else {
      sheetMode.value = 'not-found'
    }
  }
  finally {
    isProcessing.value = false
  }
}

// ─── Sheet actions ────────────────────────────────────────────────────────────

async function saveAndAdd() {
  if (!offProduct.value || isSaving.value) return
  isSaving.value = true
  try {
    const id = await foodStore.addItem(offProduct.value.rawMapped)
    stopScanner()
    await navigateTo(
      `/diary/add?food_id=${id}&date=${fromDate.value}&meal=${fromMeal.value}`,
    )
  }
  finally {
    isSaving.value = false
  }
}

function rescan() {
  sheetMode.value = 'hidden'
  offProduct.value = null
  scannedBarcode.value = ''
  // Scanner is still running — no restart needed
}

function dismissSheet() {
  rescan()
}

// ─── Navigation / camera ──────────────────────────────────────────────────────

function goBack() {
  stopScanner()
  router.back()
}

async function retry() {
  if (videoEl.value) {
    await startScanner(videoEl.value, onDetected)
  }
}

// ─── Manual input ─────────────────────────────────────────────────────────────

async function openManualInput() {
  showManualInput.value = true
  await nextTick()
  manualInputEl.value?.focus()
}

async function submitManual() {
  const barcode = manualBarcode.value.trim()
  if (!barcode || isProcessing.value) return
  manualBarcode.value = ''
  showManualInput.value = false
  await onDetected(barcode)
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (sheetMode.value !== 'hidden') dismissSheet()
    else if (showManualInput.value) showManualInput.value = false
    else goBack()
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await nextTick()
  if (videoEl.value) {
    await startScanner(videoEl.value, onDetected)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  stopScanner()
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes scanLine {
  0%   { transform: translateY(0); }
  100% { transform: translateY(190px); }
}

@keyframes processingPulse {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .scanner__scan-line        { animation: none !important; }
  .scanner__processing-pulse { animation: none !important; }
  .scanner-sheet             { transition: none !important; }
  .scanner-sheet-backdrop    { transition: none !important; }
}

// ─── Root scanner container ───────────────────────────────────────────────────
// NO transform on this element — would break position:fixed in Teleport

.scanner {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;
}

// ─── Video viewfinder ─────────────────────────────────────────────────────────

.scanner__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

// ─── State overlays (idle / requesting / error) ───────────────────────────────

.scanner__state-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 1);
  background: rgba(0, 0, 0, 0.88);
  padding: $spacing * 2;
  text-align: center;
}

.scanner__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  flex-shrink: 0;
}

.scanner__state-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  max-width: 26ch;
  line-height: 1.5;

  &--error {
    color: #fca5a5;
  }
}

.scanner__error-icon {
  color: #f87171;
}

.scanner__retry-btn {
  margin-top: calc(#{$spacing} * 0.25);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  transition: background 150ms ease, border-color 150ms ease;

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.6);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
}

// ─── Scanning overlay (centered frame + hint) ─────────────────────────────────

.scanner__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 1.25);
  pointer-events: none;
}

// Frame: the transparent "window" — box-shadow darkens everything outside it
.scanner__frame {
  position: relative;
  width: min(65vw, 280px);
  height: 200px;
  border-radius: var(--radius-md);
  // Inset box-shadow expands outward, creating the vignette
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  transition: box-shadow 300ms ease;

  &--processing {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.72);
  }
}

// Corner bracket decorations — 4 corners, 3px border on 2 sides each
.scanner__corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: var(--accent-color);
  border-style: solid;
  border-width: 0;

  &--tl {
    top: -1px;
    left: -1px;
    border-top-width: 3px;
    border-left-width: 3px;
    border-top-left-radius: var(--radius-sm);
  }

  &--tr {
    top: -1px;
    right: -1px;
    border-top-width: 3px;
    border-right-width: 3px;
    border-top-right-radius: var(--radius-sm);
  }

  &--bl {
    bottom: -1px;
    left: -1px;
    border-bottom-width: 3px;
    border-left-width: 3px;
    border-bottom-left-radius: var(--radius-sm);
  }

  &--br {
    bottom: -1px;
    right: -1px;
    border-bottom-width: 3px;
    border-right-width: 3px;
    border-bottom-right-radius: var(--radius-sm);
  }
}

// Animated scan line — sweeps top to bottom
.scanner__scan-line {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 5px;
  height: 2px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-color) 25%,
    var(--accent-color) 75%,
    transparent 100%
  );
  box-shadow: 0 0 10px var(--accent-color), 0 0 4px var(--accent-color);
  animation: scanLine 2s ease-in-out infinite alternate;
}

// Pulsing overlay shown while lookupBarcode is in-flight
.scanner__processing-pulse {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.07);
  animation: processingPulse 900ms ease-in-out infinite;
}

// Hint text beneath the frame
.scanner__hint {
  font-size: 0.825rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.02em;
  text-align: center;
}

// ─── Processing label (below frame, visible when isProcessing) ────────────────

.scanner__processing-label {
  position: absolute;
  // Centered horizontally; vertically: center + half-frame + gap ≈ 130px
  top: calc(50% + 130px);
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-full);
  padding: 0.4rem 1rem;
  pointer-events: none;
  white-space: nowrap;

  span {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
  }
}

.scanner__processing-spinner {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  flex-shrink: 0;
}

// ─── Back button ──────────────────────────────────────────────────────────────

.scanner__back {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 1rem);
  left: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background 150ms ease, transform 150ms ease;
  z-index: 10;

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.65);
  }

  &:active {
    transform: scale(0.93);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
}

// ─── Manual barcode input ─────────────────────────────────────────────────────

.scanner__manual {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.scanner__manual-toggle {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-full);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  font-family: inherit;
  font-weight: 500;
  padding: 0.55rem 1.25rem;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
  letter-spacing: 0.01em;

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.35);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
}

.scanner__manual-form {
  display: flex;
  gap: calc(#{$spacing} * 0.5);
  width: 100%;
  max-width: 400px;
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 0.4) calc(#{$spacing} * 0.4) calc(#{$spacing} * 0.4) calc(#{$spacing} * 0.875);
}

.scanner__manual-input-wrap {
  flex: 1;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  min-height: unset !important;
}

.scanner__manual-input {
  background: transparent;
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  outline: none;
  width: 100%;
  padding: 0.3rem 0;

  &::placeholder {
    color: rgba(255, 255, 255, 0.38);
  }
}

.scanner__manual-submit {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

// ─── Result / Not-found sheet ─────────────────────────────────────────────────

.scanner-sheet-wrapper {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  visibility: hidden;

  &.is-visible {
    pointer-events: auto;
    visibility: visible;
  }
}

.scanner-sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 350ms ease;

  .is-visible & {
    opacity: 1;
  }
}

.scanner-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--primary-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transform: translateY(100%);
  transition: transform 380ms cubic-bezier(0.22, 1, 0.36, 1);

  .is-visible & {
    transform: translateY(0);
  }
}

// Drag handle
.scanner-sheet__handle {
  width: 2.5rem;
  height: 4px;
  background: var(--divider);
  border-radius: var(--radius-full);
  margin: 0.75rem auto 0;
}

// Header
.scanner-sheet__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.25) calc(#{$spacing} * 0.75);
  border-bottom: 1px solid var(--divider);
}

.scanner-sheet__found-icon {
  color: var(--success);
  flex-shrink: 0;
}

.scanner-sheet__not-found-icon {
  color: var(--warning);
  flex-shrink: 0;
}

.scanner-sheet__product-info {
  flex: 1;
  min-width: 0;
}

.scanner-sheet__product-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.scanner-sheet__product-brand {
  font-size: 0.78rem;
  color: var(--secondary-text);
  margin-top: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Body: macro grid
.scanner-sheet__body {
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.25) 0;
}

.scanner-sheet__macros {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
}

.scanner-sheet__macro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.scanner-sheet__macro-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;

  .scanner-sheet__macro--protein & { color: #ef4444; }
  .scanner-sheet__macro--carbs   & { color: #3b82f6; }
  .scanner-sheet__macro--fat     & { color: #f59e0b; }
}

.scanner-sheet__macro-label {
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.scanner-sheet__per-100 {
  font-size: 0.72rem;
  color: var(--secondary-text);
  text-align: center;
  margin-top: calc(#{$spacing} * 0.5);
}

// Footer: action buttons
.scanner-sheet__footer {
  display: flex;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.25) calc(#{$spacing} * 1.25);
}

.scanner-sheet__rescan {
  flex: 0 0 auto;
}

.scanner-sheet__save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: 600;
  min-height: 2.75rem;
}

.scanner-sheet__manual-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: 600;
  text-decoration: none;
  min-height: 2.75rem;
}
</style>
