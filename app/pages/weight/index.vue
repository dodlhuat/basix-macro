<template>
  <div class="weight page-content">

    <!-- ─── Hero: current weight ─────────────────────────────────────────────── -->
    <section
      class="weight__hero"
      :class="heroBMIClass"
      aria-label="Aktuelles Gewicht"
    >
      <template v-if="latestEntry">
        <div class="weight__hero-body">
          <div class="weight__current">
            <span class="weight__current-value">{{ latestEntry.weight_kg.toFixed(1) }}</span>
            <span class="weight__current-unit">kg</span>
          </div>
          <div class="weight__hero-meta">
            <span
              v-if="bmi"
              class="badge"
              :class="bmiBadgeClass"
              :aria-label="`BMI ${bmi.value}: ${bmi.label}`"
            >
              BMI {{ bmi.value }} · {{ bmi.label }}
            </span>
            <span
              v-if="heroDelta !== null"
              class="weight__delta"
              :class="deltaClass"
            >
              {{ deltaDisplay }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="weight__hero-empty">
          <AppIcon name="monitor_weight" size="2rem" />
          <p>Noch kein Eintrag</p>
        </div>
      </template>
    </section>

    <!-- ─── SVG Chart ────────────────────────────────────────────────────────── -->
    <section class="weight__chart-section" aria-label="Gewichtsverlauf">
      <template v-if="chartData.length >= 2">
        <svg
          class="weight__chart"
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="weight-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-color)" stop-opacity="0.22" />
              <stop offset="100%" stop-color="var(--accent-color)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <!-- Subtle grid lines -->
          <line
            v-for="gw in gridWeights"
            :key="gw"
            :x1="0"
            :y1="toY(gw)"
            :x2="W"
            :y2="toY(gw)"
            class="weight__chart-grid"
          />
          <!-- Area fill -->
          <path :d="areaPath" fill="url(#weight-gradient)" />
          <!-- Line -->
          <path :d="linePath" class="weight__chart-line" />
          <!-- Latest point highlight -->
          <circle
            :cx="toX(chartData.length - 1)"
            :cy="toY(chartData.at(-1)!.weight_kg)"
            r="4"
            class="weight__chart-dot"
          />
        </svg>
      </template>
      <div v-else class="weight__chart-placeholder">
        <AppIcon name="show_chart" size="1.5rem" />
        <span>Mindestens 2 Einträge für den Chart</span>
      </div>
    </section>

    <!-- ─── Add entry form ───────────────────────────────────────────────────── -->
    <section class="weight__form">
      <p class="weight__section-label">Eintrag hinzufügen</p>
      <div class="weight__form-row">
        <div class="form-group weight__form-group">
          <label class="weight__field-label" for="weight-input">Gewicht</label>
          <div class="input-group">
            <input
              id="weight-input"
              v-model="newWeightStr"
              type="number"
              step="0.1"
              min="20"
              max="300"
              inputmode="decimal"
              placeholder="82.5"
              aria-label="Gewicht in Kilogramm"
              class="weight__weight-input"
            />
            <span class="weight__input-unit">kg</span>
          </div>
        </div>
        <div class="form-group weight__form-group">
          <label class="weight__field-label" for="weight-date">Datum</label>
          <div class="input-group">
            <input
              id="weight-date"
              v-model="newDate"
              type="date"
              aria-label="Datum des Eintrags"
            />
          </div>
        </div>
      </div>
      <div class="form-group">
        <div class="input-group">
          <input
            v-model="newNote"
            type="text"
            placeholder="Notiz (optional)"
            aria-label="Notiz"
            maxlength="200"
          />
        </div>
      </div>
      <button
        class="button button-primary weight__form-submit"
        :disabled="isSaving || !isWeightValid"
        :aria-busy="isSaving"
        @click="handleSave"
      >
        <span v-if="isSaving" class="loading" aria-hidden="true" />
        <template v-else>
          <AppIcon name="check" size="1rem" />
          Speichern
        </template>
      </button>
    </section>

    <!-- ─── History list ─────────────────────────────────────────────────────── -->
    <section class="weight__history" aria-label="Verlauf">
      <p class="weight__section-label">Verlauf</p>
      <ul
        v-if="recentEntries.length"
        class="weight__list"
        role="list"
        aria-label="Gewichtseinträge"
      >
        <li
          v-for="(entry, idx) in recentEntries"
          :key="entry.id"
          class="weight__item"
          :style="{ animationDelay: `${Math.min(idx, 14) * 30}ms` }"
        >
          <div class="weight__item-body">
            <span class="weight__item-date">{{ formatDate(entry.date) }}</span>
            <span v-if="entry.note" class="weight__item-note">{{ entry.note }}</span>
          </div>
          <div class="weight__item-meta">
            <span class="weight__item-weight">
              {{ entry.weight_kg.toFixed(1) }}<span class="weight__item-unit"> kg</span>
            </span>
            <span
              v-if="entryDelta(idx) !== null"
              class="badge"
              :class="entryDeltaBadgeClass(idx)"
              aria-label="Veränderung zum vorherigen Eintrag"
            >
              {{ entryDeltaDisplay(idx) }}
            </span>
            <button
              class="button button-icon weight__item-delete"
              :aria-label="`Eintrag vom ${formatDate(entry.date)} löschen`"
              @click="handleDelete(entry.id)"
            >
              <AppIcon name="delete_outline" size="1.125rem" />
            </button>
          </div>
        </li>
      </ul>
      <div v-else class="weight__empty">
        <AppIcon name="monitor_weight" size="2.5rem" class="weight__empty-icon" />
        <p class="weight__empty-title">Noch keine Einträge</p>
        <p class="weight__empty-hint">Trage dein erstes Gewicht oben ein, um zu starten.</p>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Gewicht' })

const weightStore = useWeightStore()
const userStore = useUserStore()
const { calcBMI } = useBMI()

const { entries, latestEntry, chartData } = storeToRefs(weightStore)

// ─── BMI ──────────────────────────────────────────────────────────────────────

const bmi = computed(() => {
  if (!latestEntry.value || !userStore.user?.height_cm) return null
  return calcBMI(latestEntry.value.weight_kg, userStore.user.height_cm)
})

const bmiBadgeClass = computed(() => {
  if (!bmi.value) return ''
  switch (bmi.value.category) {
    case 'normal':     return 'badge-success'
    case 'overweight': return 'badge-warning'
    default:           return 'badge-error'
  }
})

const heroBMIClass = computed(() => {
  if (!bmi.value) return ''
  switch (bmi.value.category) {
    case 'normal':     return 'weight__hero--normal'
    case 'overweight': return 'weight__hero--overweight'
    default:           return 'weight__hero--critical'
  }
})

// ─── Hero delta ───────────────────────────────────────────────────────────────

const heroDelta = computed<number | null>(() => {
  if (entries.value.length < 2) return null
  return +(entries.value[0]!.weight_kg - entries.value[1]!.weight_kg).toFixed(1)
})

const deltaDisplay = computed(() => {
  const d = heroDelta.value
  if (d === null) return ''
  if (d === 0)    return '±0.0 kg'
  const sign = d > 0 ? '+' : '−'
  return `${sign}${Math.abs(d).toFixed(1)} kg`
})

const deltaClass = computed(() => {
  const d = heroDelta.value
  if (d === null || d === 0) return 'weight__delta--neutral'
  return d < 0 ? 'weight__delta--down' : 'weight__delta--up'
})

// ─── Chart constants and helpers ──────────────────────────────────────────────

const W = 400
const H = 160
const PAD = 20

const minW = computed(() =>
  chartData.value.length
    ? Math.min(...chartData.value.map(e => e.weight_kg)) - 1.5
    : 60,
)
const maxW = computed(() =>
  chartData.value.length
    ? Math.max(...chartData.value.map(e => e.weight_kg)) + 1.5
    : 100,
)

function toX(i: number): number {
  return (i / Math.max(chartData.value.length - 1, 1)) * W
}

function toY(w: number): number {
  const range = maxW.value - minW.value || 1
  return PAD + ((maxW.value - w) / range) * (H - PAD * 2)
}

// ─── Chart paths ──────────────────────────────────────────────────────────────

const linePath = computed(() => {
  if (chartData.value.length < 2) return ''
  return chartData.value
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(e.weight_kg).toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (chartData.value.length < 2) return ''
  const n = chartData.value.length
  const line = chartData.value
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(e.weight_kg).toFixed(2)}`)
    .join(' ')
  return `${line} L ${toX(n - 1).toFixed(2)} ${H} L 0 ${H} Z`
})

const gridWeights = computed(() => {
  if (chartData.value.length < 2) return []
  const range = maxW.value - minW.value
  const step = range > 10 ? 5 : range > 4 ? 2 : 1
  const first = Math.ceil(minW.value / step) * step
  const weights: number[] = []
  for (let w = first; w < maxW.value; w += step) {
    weights.push(w)
  }
  return weights.slice(0, 5)
})

// ─── Form state ───────────────────────────────────────────────────────────────

const todayStr: string = new Date().toISOString().split('T')[0] ?? ''
const newWeightStr = ref('')
const newDate = ref(todayStr)
const newNote = ref('')
const isSaving = ref(false)

const isWeightValid = computed(() => {
  const v = parseFloat(newWeightStr.value)
  return !isNaN(v) && v >= 20 && v <= 300
})

async function handleSave() {
  if (!isWeightValid.value || isSaving.value) return
  isSaving.value = true
  try {
    await weightStore.addEntry(
      parseFloat(newWeightStr.value),
      newDate.value,
      newNote.value.trim() || undefined,
    )
    newWeightStr.value = ''
    newNote.value = ''
    newDate.value = todayStr
  }
  finally {
    isSaving.value = false
  }
}

// ─── History list ─────────────────────────────────────────────────────────────

const recentEntries = computed(() => entries.value.slice(0, 30))

function entryDelta(idx: number): number | null {
  const curr = recentEntries.value[idx]
  const prev = recentEntries.value[idx + 1]
  if (!curr || !prev) return null
  return +(curr.weight_kg - prev.weight_kg).toFixed(1)
}

function entryDeltaDisplay(idx: number): string {
  const d = entryDelta(idx)
  if (d === null) return ''
  if (d === 0)    return '±0'
  const sign = d > 0 ? '+' : '−'
  return `${sign}${Math.abs(d).toFixed(1)}`
}

function entryDeltaBadgeClass(idx: number): string {
  const d = entryDelta(idx)
  if (d === null || d === 0) return ''
  return d < 0 ? 'badge-success' : 'badge-error'
}

async function handleDelete(id: string) {
  await weightStore.deleteEntry(id)
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([userStore.loadUser(), weightStore.loadEntries()])
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes itemIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .weight__hero,
  .weight__chart-section,
  .weight__form,
  .weight__history,
  .weight__item {
    animation: none !important;
  }
}

// ─── Page layout ──────────────────────────────────────────────────────────────

.weight {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

.weight__hero {
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--accent-color-tint) 100%);
  padding: calc(#{$spacing} * 1.5) calc(#{$spacing} * 1.25) calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both;

  // BMI-driven gradient tints
  &--normal {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--success-tint) 100%);
  }
  &--overweight {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--warning-tint) 100%);
  }
  &--critical {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--error-tint) 100%);
  }
}

.weight__hero-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
}

.weight__current {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  min-width: 0;
}

.weight__current-value {
  font-size: clamp(2.8rem, 13vw, 3.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--primary-text);
  line-height: 1;
}

.weight__current-unit {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--secondary-text);
  letter-spacing: -0.02em;
  align-self: flex-end;
  padding-bottom: 0.3rem;
  flex-shrink: 0;
}

.weight__hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: calc(#{$spacing} * 0.5);
  padding-top: 0.25rem;
  flex-shrink: 0;
}

.weight__delta {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;

  &--down    { color: var(--success); }
  &--up      { color: var(--error); }
  &--neutral { color: var(--secondary-text); }
}

.weight__hero-empty {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  color: var(--secondary-text);

  p {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
}

// ─── Chart section ────────────────────────────────────────────────────────────

.weight__chart-section {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1) calc(#{$spacing} * 0.5) calc(#{$spacing} * 0.625);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
  overflow: hidden;
}

.weight__chart {
  display: block;
  width: 100%;
  height: 160px;
}

.weight__chart-grid {
  stroke: var(--divider);
  stroke-width: 1;
  opacity: 0.6;
}

.weight__chart-line {
  fill: none;
  stroke: var(--accent-color);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.weight__chart-dot {
  fill: var(--accent-color);
  stroke: var(--primary-bg);
  stroke-width: 2.5;
}

.weight__chart-placeholder {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 0.5);
  color: var(--secondary-text);
  font-size: 0.82rem;
  opacity: 0.55;
}

// ─── Section label ────────────────────────────────────────────────────────────

.weight__section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// ─── Form ─────────────────────────────────────────────────────────────────────

.weight__form {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.weight__form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.75);
  margin-bottom: calc(#{$spacing} * 0.75);
}

.weight__form-group {
  // Override basix form-group bottom margin inside grid
  margin-bottom: 0;
}

.weight__field-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  margin-bottom: calc(#{$spacing} * 0.35);
}

.weight__weight-input {
  // Remove spinner arrows on number inputs
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.weight__input-unit {
  padding: 0 calc(#{$spacing} * 0.625);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}

.weight__form-submit {
  width: 100%;
  margin-top: calc(#{$spacing} * 0.875);
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

// ─── History ──────────────────────────────────────────────────────────────────

.weight__history {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both;
}

.weight__list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--divider);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.weight__item {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  animation: itemIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.weight__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.weight__item-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.weight__item-note {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weight__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.375);
  flex-shrink: 0;
}

.weight__item-weight {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.weight__item-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--secondary-text);
  letter-spacing: 0;
}

.weight__item-delete {
  color: var(--secondary-text);
  opacity: 0.4;
  width: 2rem;
  height: 2rem;
  padding: 0;
  flex-shrink: 0;
  transition: color 150ms ease, opacity 150ms ease;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--error);
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.weight__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.weight__empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.weight__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.weight__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 26ch;
  line-height: 1.5;
  margin: 0;
}
</style>
