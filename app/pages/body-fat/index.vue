<template>
  <div class="body-fat page-content">

    <!-- ─── Hero: result or empty state ───────────────────────────────────────── -->
    <section
      class="body-fat__hero"
      :class="heroClass"
      aria-label="Körperfett-Ergebnis"
    >
      <template v-if="displayResult">
        <div class="body-fat__hero-body">
          <div class="body-fat__value-group">
            <span class="body-fat__eyebrow">{{ $t('bodyFat.title') }}</span>
            <div class="body-fat__value-row">
              <span class="body-fat__value">{{ displayResult.value.toFixed(1) }}</span>
              <span class="body-fat__unit">%</span>
            </div>
          </div>
          <div class="body-fat__hero-meta">
            <span
              class="badge"
              :class="badgeClass"
              :aria-label="`Kategorie: ${resultLabel}`"
            >
              {{ resultLabel }}
            </span>
            <span v-if="result && !justSaved" class="body-fat__preview-tag">
              {{ $t('bodyFat.previewTag') }}
            </span>
            <span
              v-else-if="heroDelta !== null"
              class="body-fat__delta"
              :class="deltaClass"
            >
              {{ deltaDisplay }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="body-fat__hero-empty">
          <AppIcon name="monitor_weight" size="2rem" />
          <p>{{ $t('bodyFat.notCalculated') }}</p>
        </div>
      </template>
    </section>

    <!-- ─── No profile fallback ───────────────────────────────────────────────── -->
    <div v-if="!userStore.user" class="body-fat__no-profile">
      <div class="alert alert-info">
        <AppIcon name="person" size="1.125rem" />
        <span>
          {{ $t('bodyFat.noProfilePre') }}
          <NuxtLink to="/settings/profile" class="body-fat__profile-link">{{ $t('bodyFat.noProfileLink') }}</NuxtLink>
          {{ $t('bodyFat.noProfilePost') }}
        </span>
      </div>
    </div>

    <template v-else>

      <!-- ─── SVG Chart ──────────────────────────────────────────────────────── -->
      <section class="body-fat__chart-section" aria-label="Körperfettverlauf">
        <template v-if="chartData.length >= 2">
          <svg
            class="body-fat__chart"
            :viewBox="`0 0 ${W} ${H}`"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="body-fat-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent-color)" stop-opacity="0.22" />
                <stop offset="100%" stop-color="var(--accent-color)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <!-- Subtle grid lines -->
            <line
              v-for="gv in gridValues"
              :key="gv"
              :x1="0"
              :y1="toY(gv)"
              :x2="W"
              :y2="toY(gv)"
              class="body-fat__chart-grid"
            />
            <!-- Area fill -->
            <path :d="areaPath" fill="url(#body-fat-gradient)" />
            <!-- Line -->
            <path :d="linePath" class="body-fat__chart-line" />
            <!-- Latest point highlight -->
            <circle
              :cx="toX(chartData.length - 1)"
              :cy="toY(chartData.at(-1)!.body_fat_percent)"
              r="4"
              class="body-fat__chart-dot"
            />
          </svg>
        </template>
        <div v-else class="body-fat__chart-placeholder">
          <AppIcon name="show_chart" size="1.5rem" />
          <span>{{ $t('bodyFat.chartHint') }}</span>
        </div>
      </section>

      <!-- ─── Input form ─────────────────────────────────────────────────────── -->
      <section class="body-fat__form" aria-label="Maße eingeben">
        <p class="body-fat__section-label">{{ $t('bodyFat.measurements') }}</p>

        <!-- Height info chip (read-only, from profile) -->
        <div class="body-fat__height-info" aria-label="Körpergröße aus Profil">
          <AppIcon name="height" size="1rem" class="body-fat__height-icon" />
          <span class="body-fat__height-text">
            {{ $t('bodyFat.height') }}: <strong>{{ userStore.user.height_cm }}&thinsp;cm</strong>
          </span>
        </div>

        <!-- Neck + Waist (2-column) -->
        <div class="body-fat__form-row">
          <div class="form-group body-fat__form-group">
            <label class="body-fat__field-label" for="bf-neck">{{ $t('bodyFat.neck') }}</label>
            <div class="input-group">
              <input
                id="bf-neck"
                v-model="neckStr"
                type="number"
                inputmode="decimal"
                step="0.1"
                min="20"
                max="80"
                placeholder="37.0"
                class="body-fat__num-input"
                aria-label="Halsumfang in Zentimeter"
              >
              <span class="body-fat__input-unit" aria-hidden="true">cm</span>
            </div>
          </div>
          <div class="form-group body-fat__form-group">
            <label class="body-fat__field-label" for="bf-waist">{{ $t('bodyFat.waist') }}</label>
            <div class="input-group">
              <input
                id="bf-waist"
                v-model="waistStr"
                type="number"
                inputmode="decimal"
                step="0.1"
                min="40"
                max="200"
                placeholder="84.0"
                class="body-fat__num-input"
                aria-label="Taillenumfang in Zentimeter"
              >
              <span class="body-fat__input-unit" aria-hidden="true">cm</span>
            </div>
          </div>
        </div>

        <!-- Hip (female / other only) -->
        <Transition name="bf-hip">
          <div
            v-if="showHip"
            class="form-group body-fat__form-group body-fat__hip-group"
          >
            <label class="body-fat__field-label" for="bf-hip">{{ $t('bodyFat.hip') }}</label>
            <div class="input-group">
              <input
                id="bf-hip"
                v-model="hipStr"
                type="number"
                inputmode="decimal"
                step="0.1"
                min="50"
                max="200"
                placeholder="95.0"
                class="body-fat__num-input"
                aria-label="Hüftumfang in Zentimeter"
              >
              <span class="body-fat__input-unit" aria-hidden="true">cm</span>
            </div>
          </div>
        </Transition>

        <!-- Validation error -->
        <p v-if="formError" class="body-fat__form-error" role="alert">
          {{ formError }}
        </p>

        <div class="body-fat__actions">
          <button
            class="button button-primary body-fat__calc-btn"
            :disabled="!canCalc"
            @click="handleCalc"
          >
            <AppIcon name="calculate" size="1rem" />
            {{ $t('bodyFat.calculate') }}
          </button>
          <Transition name="bf-save">
            <button
              v-if="result && !justSaved"
              class="button button-success body-fat__save-btn"
              :disabled="isSaving"
              :aria-busy="isSaving"
              @click="handleSave"
            >
              <span v-if="isSaving" class="loading" aria-hidden="true" />
              <template v-else>
                <AppIcon name="bookmark_add" size="1rem" />
                {{ $t('bodyFat.saveEntry') }}
              </template>
            </button>
          </Transition>
          <Transition name="bf-save">
            <p v-if="justSaved" class="body-fat__saved-note" role="status">
              <AppIcon name="check_circle" size="1rem" />
              {{ $t('common.saved') }}
            </p>
          </Transition>
        </div>
      </section>

      <!-- ─── Info card ──────────────────────────────────────────────────────── -->
      <section class="body-fat__info" aria-label="Über die Navy-Methode">
        <p class="body-fat__section-label">{{ $t('bodyFat.navyTitle') }}</p>
        <p class="body-fat__info-text">{{ $t('bodyFat.navyDesc1') }}</p>
        <p class="body-fat__info-text body-fat__info-text--muted">{{ $t('bodyFat.navyDesc2') }}</p>
      </section>

      <!-- ─── Category reference table ──────────────────────────────────────── -->
      <section class="body-fat__table-section" aria-label="Kategorie-Referenz">
        <p class="body-fat__section-label">{{ $t('bodyFat.categories') }} ({{ genderLabel }})</p>
        <ul class="body-fat__cat-list" role="list">
          <li
            v-for="row in categoryTable"
            :key="row.category"
            class="body-fat__cat-row"
            :class="{ 'body-fat__cat-row--active': result?.category === row.category }"
          >
            <span class="body-fat__cat-name">{{ row.label }}</span>
            <span class="badge" :class="row.badgeClass">{{ row.range }}</span>
          </li>
        </ul>
      </section>

      <!-- ─── History list ─────────────────────────────────────────────────── -->
      <section class="body-fat__history" aria-label="Verlauf">
        <p class="body-fat__section-label">{{ $t('bodyFat.history') }}</p>
        <ul
          v-if="recentEntries.length"
          class="body-fat__list"
          role="list"
          aria-label="Körperfett-Einträge"
        >
          <li
            v-for="(entry, idx) in recentEntries"
            :key="entry.id"
            class="body-fat__item"
            :style="{ animationDelay: `${Math.min(idx, 14) * 30}ms` }"
          >
            <div class="body-fat__item-body">
              <span class="body-fat__item-date">{{ formatDate(entry.date) }}</span>
              <span class="body-fat__item-cat">{{ categoryLabelForEntry(entry) }}</span>
            </div>
            <div class="body-fat__item-meta">
              <span class="body-fat__item-value">
                {{ entry.body_fat_percent.toFixed(1) }}<span class="body-fat__item-unit"> %</span>
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
                class="button button-icon body-fat__item-delete"
                :aria-label="`Eintrag vom ${formatDate(entry.date)} löschen`"
                @click="handleDelete(entry.id)"
              >
                <AppIcon name="delete" size="1.125rem" />
              </button>
            </div>
          </li>
        </ul>
        <div v-else class="body-fat__empty">
          <AppIcon name="straighten" size="2.5rem" class="body-fat__empty-icon" />
          <p class="body-fat__empty-title">{{ $t('bodyFat.empty') }}</p>
          <p class="body-fat__empty-hint">{{ $t('bodyFat.emptyHint') }}</p>
        </div>
      </section>

    </template>

  </div>
</template>

<script setup lang="ts">
import type { BodyFatCategory } from '~/composables/useBodyFat'
import type { BodyFatEntry } from '../../../db'

definePageMeta({ title: 'Body Fat' })

const userStore = useUserStore()
const bodyFatStore = useBodyFatStore()
const { calcBodyFat } = useBodyFat()
const { t, locale } = useI18n()

const { entries, latestEntry, chartData } = storeToRefs(bodyFatStore)

// ─── Input state ──────────────────────────────────────────────────────────────

const neckStr = ref('')
const waistStr = ref('')
const hipStr = ref('')

const showHip = computed(() => userStore.user?.gender !== 'male')

// ─── Parsed values ────────────────────────────────────────────────────────────

const neck = computed(() => parseFloat(neckStr.value))
const waist = computed(() => parseFloat(waistStr.value))
const hip = computed(() => parseFloat(hipStr.value))

// ─── Validation ───────────────────────────────────────────────────────────────

const formError = ref<string | null>(null)

const canCalc = computed(() => {
  if (!userStore.user) return false
  if (isNaN(neck.value) || neck.value <= 0) return false
  if (isNaN(waist.value) || waist.value <= 0) return false
  if (showHip.value && (isNaN(hip.value) || hip.value <= 0)) return false
  // Ensure the log10 argument is strictly positive
  if (!showHip.value && waist.value <= neck.value) return false
  if (showHip.value && waist.value + hip.value <= neck.value) return false
  return true
})

// Clear error and any stale live-preview whenever an input changes — keeps
// the hero's "preview" state honest (it should never show a calculation
// that no longer matches what's in the form fields).
watch([neckStr, waistStr, hipStr], () => {
  formError.value = null
  result.value = null
  justSaved.value = false
})

// ─── Result ───────────────────────────────────────────────────────────────────

// `result` is the ephemeral, unsaved output of the last "Berechnen" click —
// a live preview. `displayResult` is what the hero actually renders: the
// live preview while one exists, falling back to the latest *saved* entry
// so the page still shows "where you stand" on a fresh load (matching the
// weight page), without a session-only calculation forcing a stale one.
const result = ref<{ value: number; category: BodyFatCategory } | null>(null)

const displayResult = computed<{ value: number; category: BodyFatCategory } | null>(() => {
  if (result.value) return result.value
  if (latestEntry.value) {
    return { value: latestEntry.value.body_fat_percent, category: latestEntry.value.category }
  }
  return null
})

function handleCalc() {
  if (!canCalc.value || !userStore.user) return
  formError.value = null
  try {
    const raw = calcBodyFat({
      gender: userStore.user.gender,
      height_cm: userStore.user.height_cm,
      neck_cm: neck.value,
      waist_cm: waist.value,
      hip_cm: showHip.value ? hip.value : undefined,
    })
    if (isNaN(raw.value) || raw.value < 0 || raw.value > 80) {
      formError.value = t('bodyFat.errorResult')
      return
    }
    result.value = raw
    justSaved.value = false
  }
  catch {
    formError.value = t('bodyFat.errorInput')
    result.value = null
  }
}

// ─── Save flow ────────────────────────────────────────────────────────────────
// "Berechnen" stays a preview step (matches this page's existing calculator
// rhythm); a second explicit action persists it to history. Kept as two
// steps rather than merging them because a Navy-method measurement is easy
// to fat-finger (wrong tape position, misread cm) — letting the user see
// the number before it becomes a permanent history row avoids polluting
// the chart/history with mistaken one-off readings.

const todayStr: string = new Date().toISOString().split('T')[0] ?? ''
const isSaving = ref(false)
const justSaved = ref(false)

let savedNoteTimer: ReturnType<typeof setTimeout> | undefined

async function handleSave() {
  if (!result.value || !userStore.user || isSaving.value) return
  isSaving.value = true
  try {
    await bodyFatStore.addEntry({
      date: todayStr,
      gender: userStore.user.gender,
      height_cm: userStore.user.height_cm,
      neck_cm: neck.value,
      waist_cm: waist.value,
      hip_cm: showHip.value ? hip.value : undefined,
      body_fat_percent: result.value.value,
      category: result.value.category,
    })
    // Clear the live preview now that it's part of history — `displayResult`
    // then falls back to `latestEntry` (the entry we just saved), which is
    // what lets the hero delta badge and future deletions stay correctly
    // in sync with the store instead of a "stuck" stale preview.
    result.value = null
    justSaved.value = true
    clearTimeout(savedNoteTimer)
    savedNoteTimer = setTimeout(() => { justSaved.value = false }, 2500)
  }
  finally {
    isSaving.value = false
  }
}

onBeforeUnmount(() => clearTimeout(savedNoteTimer))

// ─── Hero gradient + badge ────────────────────────────────────────────────────

const heroClass = computed(() => {
  if (!displayResult.value) return ''
  switch (displayResult.value.category) {
    case 'athlete':
    case 'fitness':
      return 'body-fat__hero--good'
    case 'average':
      return 'body-fat__hero--warning'
    default:
      return 'body-fat__hero--critical'
  }
})

const badgeClass = computed(() => {
  if (!displayResult.value) return ''
  switch (displayResult.value.category) {
    case 'athlete':
    case 'fitness':
      return 'badge-success'
    case 'average':
      return 'badge-warning'
    default:
      return 'badge-error'
  }
})

// ─── Hero delta (vs. previous saved entry) ────────────────────────────────────
// Only shown when the hero is displaying saved history (not a live,
// unsaved preview) — comparing an in-progress calculation against history
// would be misleading before it's actually part of it.

const heroDelta = computed<number | null>(() => {
  if (result.value) return null
  if (entries.value.length < 2) return null
  return +(entries.value[0]!.body_fat_percent - entries.value[1]!.body_fat_percent).toFixed(1)
})

const deltaDisplay = computed(() => {
  const d = heroDelta.value
  if (d === null) return ''
  if (d === 0) return '±0.0 %'
  const sign = d > 0 ? '+' : '−'
  return `${sign}${Math.abs(d).toFixed(1)} %`
})

const deltaClass = computed(() => {
  const d = heroDelta.value
  if (d === null || d === 0) return 'body-fat__delta--neutral'
  // Declining body fat % is the desired direction — same "down is good"
  // polarity as the weight page's delta indicator.
  return d < 0 ? 'body-fat__delta--down' : 'body-fat__delta--up'
})

// ─── Category reference table ─────────────────────────────────────────────────

interface CategoryRow {
  category: BodyFatCategory
  label: string
  range: string
  badgeClass: string
}

const maleCategoryTable = computed<CategoryRow[]>(() => [
  { category: 'essential', label: t('bodyFat.cat.essential'), range: '< 6 %',     badgeClass: 'badge-error' },
  { category: 'athlete',   label: t('bodyFat.cat.athlete'),   range: '6 – 13 %',  badgeClass: 'badge-success' },
  { category: 'fitness',   label: t('bodyFat.cat.fitness'),   range: '14 – 17 %', badgeClass: 'badge-success' },
  { category: 'average',   label: t('bodyFat.cat.average'),   range: '18 – 24 %', badgeClass: 'badge-warning' },
  { category: 'obese',     label: t('bodyFat.cat.obese'),     range: '≥ 25 %',    badgeClass: 'badge-error' },
])

const femaleCategoryTable = computed<CategoryRow[]>(() => [
  { category: 'essential', label: t('bodyFat.cat.essential'), range: '< 14 %',    badgeClass: 'badge-error' },
  { category: 'athlete',   label: t('bodyFat.cat.athleteF'),  range: '14 – 20 %', badgeClass: 'badge-success' },
  { category: 'fitness',   label: t('bodyFat.cat.fitness'),   range: '21 – 24 %', badgeClass: 'badge-success' },
  { category: 'average',   label: t('bodyFat.cat.average'),   range: '25 – 31 %', badgeClass: 'badge-warning' },
  { category: 'obese',     label: t('bodyFat.cat.obese'),     range: '≥ 32 %',    badgeClass: 'badge-error' },
])

const categoryTable = computed<CategoryRow[]>(() =>
  userStore.user?.gender === 'male' ? maleCategoryTable.value : femaleCategoryTable.value,
)

// Translated label for the currently displayed result's category — reuses
// the same gender-aware category→label mapping as the reference table
// below, instead of baking a hardcoded-German label into the calculation
// result itself.
const resultLabel = computed(() =>
  categoryTable.value.find(row => row.category === displayResult.value?.category)?.label ?? '',
)

const genderLabel = computed(() =>
  userStore.user?.gender === 'male' ? t('profile.male') : t('profile.female'),
)

// Category label for a *saved history entry* — uses the gender stored on
// the entry itself (captured at save time), not the current profile
// gender, since a user's profile gender could change after the fact.
function categoryLabelForEntry(entry: BodyFatEntry): string {
  const table = entry.gender === 'male' ? maleCategoryTable.value : femaleCategoryTable.value
  return table.find(row => row.category === entry.category)?.label ?? ''
}

// ─── Chart constants and helpers ───────────────────────────────────────────────

const W = 400
const H = 160
const PAD = 20

const minBF = computed(() =>
  chartData.value.length
    ? Math.min(...chartData.value.map(e => e.body_fat_percent)) - 1.5
    : 5,
)
const maxBF = computed(() =>
  chartData.value.length
    ? Math.max(...chartData.value.map(e => e.body_fat_percent)) + 1.5
    : 35,
)

function toX(i: number): number {
  return (i / Math.max(chartData.value.length - 1, 1)) * W
}

function toY(v: number): number {
  const range = maxBF.value - minBF.value || 1
  return PAD + ((maxBF.value - v) / range) * (H - PAD * 2)
}

// ─── Chart paths ────────────────────────────────────────────────────────────────

const linePath = computed(() => {
  if (chartData.value.length < 2) return ''
  return chartData.value
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(e.body_fat_percent).toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (chartData.value.length < 2) return ''
  const n = chartData.value.length
  const line = chartData.value
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(e.body_fat_percent).toFixed(2)}`)
    .join(' ')
  return `${line} L ${toX(n - 1).toFixed(2)} ${H} L 0 ${H} Z`
})

const gridValues = computed(() => {
  if (chartData.value.length < 2) return []
  const range = maxBF.value - minBF.value
  const step = range > 10 ? 5 : range > 4 ? 2 : 1
  const first = Math.ceil(minBF.value / step) * step
  const values: number[] = []
  for (let v = first; v < maxBF.value; v += step) {
    values.push(v)
  }
  return values.slice(0, 5)
})

// ─── History list ───────────────────────────────────────────────────────────────

const recentEntries = computed(() => entries.value.slice(0, 30))

function entryDelta(idx: number): number | null {
  const curr = recentEntries.value[idx]
  const prev = recentEntries.value[idx + 1]
  if (!curr || !prev) return null
  return +(curr.body_fat_percent - prev.body_fat_percent).toFixed(1)
}

function entryDeltaDisplay(idx: number): string {
  const d = entryDelta(idx)
  if (d === null) return ''
  if (d === 0) return '±0.0 %'
  const sign = d > 0 ? '+' : '−'
  return `${sign}${Math.abs(d).toFixed(1)} %`
}

function entryDeltaBadgeClass(idx: number): string {
  const d = entryDelta(idx)
  if (d === null || d === 0) return ''
  // Declining body fat % = good, same polarity as the hero delta above.
  return d < 0 ? 'badge-success' : 'badge-error'
}

async function handleDelete(id: string) {
  await bodyFatStore.deleteEntry(id)
}

// ─── Formatting ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const loc = locale.value === 'en' ? 'en-US' : 'de-DE'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(loc, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([userStore.loadUser(), bodyFatStore.loadEntries()])
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
  .body-fat__hero,
  .body-fat__no-profile,
  .body-fat__chart-section,
  .body-fat__form,
  .body-fat__info,
  .body-fat__table-section,
  .body-fat__history,
  .body-fat__item {
    animation: none !important;
  }

  .bf-hip-enter-active,
  .bf-hip-leave-active,
  .bf-save-enter-active,
  .bf-save-leave-active {
    transition: none !important;
  }
}

// ─── Page layout ──────────────────────────────────────────────────────────────

.body-fat {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

.body-fat__hero {
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--accent-color-tint) 100%);
  padding: calc(#{$spacing} * 1.5) calc(#{$spacing} * 1.25) calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &--good {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--success-tint) 100%);
  }

  &--warning {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--warning-tint) 100%);
  }

  &--critical {
    background: linear-gradient(135deg, var(--primary-bg) 0%, var(--error-tint) 100%);
  }
}

.body-fat__hero-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
}

.body-fat__value-group {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.body-fat__eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
}

.body-fat__value-row {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.body-fat__value {
  font-size: clamp(2.8rem, 13vw, 3.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--primary-text);
  line-height: 1;
}

.body-fat__unit {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--secondary-text);
  letter-spacing: -0.02em;
  align-self: flex-end;
  padding-bottom: 0.35rem;
  flex-shrink: 0;
}

.body-fat__hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: calc(#{$spacing} * 0.5);
  padding-top: 0.3rem;
  flex-shrink: 0;
}

// Marks the hero as showing a live, unsaved calculation rather than
// saved history — distinct from the delta badge below, never both at once.
.body-fat__preview-tag {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-color);
  background: var(--primary-bg);
  border-radius: var(--radius-full);
  padding: 0.15rem 0.55rem;
}

.body-fat__delta {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;

  &--down    { color: var(--success); }
  &--up      { color: var(--error); }
  &--neutral { color: var(--secondary-text); }
}

.body-fat__hero-empty {
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

// ─── No-profile fallback ──────────────────────────────────────────────────────

.body-fat__no-profile {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.body-fat__profile-link {
  color: var(--accent-color);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

// ─── Section label (shared) ───────────────────────────────────────────────────

.body-fat__section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// ─── Chart section ────────────────────────────────────────────────────────────

.body-fat__chart-section {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1) calc(#{$spacing} * 0.5) calc(#{$spacing} * 0.625);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
  overflow: hidden;
}

.body-fat__chart {
  display: block;
  width: 100%;
  height: 160px;
}

.body-fat__chart-grid {
  stroke: var(--divider);
  stroke-width: 1;
  opacity: 0.6;
}

.body-fat__chart-line {
  fill: none;
  stroke: var(--accent-color);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.body-fat__chart-dot {
  fill: var(--accent-color);
  stroke: var(--primary-bg);
  stroke-width: 2.5;
}

.body-fat__chart-placeholder {
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

// ─── Form ─────────────────────────────────────────────────────────────────────

.body-fat__form {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

// Height info chip
.body-fat__height-info {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--background);
  border-radius: var(--radius-full);
  padding: 0.3rem 0.75rem 0.3rem 0.5rem;
  margin-bottom: calc(#{$spacing} * 0.875);
}

.body-fat__height-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
}

.body-fat__height-text {
  font-size: 0.8rem;
  color: var(--secondary-text);

  strong {
    color: var(--primary-text);
    font-weight: 700;
  }
}

// Input rows
.body-fat__form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.75);
  margin-bottom: calc(#{$spacing} * 0.75);
}

.body-fat__form-group {
  margin-bottom: 0;
}

.body-fat__hip-group {
  margin-bottom: calc(#{$spacing} * 0.75);
}

.body-fat__field-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  margin-bottom: calc(#{$spacing} * 0.35);
}

// Remove spinner arrows from number inputs
.body-fat__num-input {
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.body-fat__input-unit {
  padding: 0 calc(#{$spacing} * 0.625);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}

// Hip field transition
.bf-hip-enter-active {
  transition: opacity 260ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bf-hip-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.bf-hip-enter-from,
.bf-hip-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// Validation error
.body-fat__form-error {
  font-size: 0.82rem;
  color: var(--error);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// Calculate + save actions
.body-fat__actions {
  display: flex;
  flex-direction: column;
  margin-top: calc(#{$spacing} * 0.875);
}

.body-fat__calc-btn {
  width: 100%;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

.body-fat__save-btn {
  width: 100%;
  margin-top: calc(#{$spacing} * 0.625);
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

.body-fat__saved-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: calc(#{$spacing} * 0.625) 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--success);
}

.bf-save-enter-active {
  transition: opacity 260ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bf-save-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.bf-save-enter-from,
.bf-save-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// ─── Info card ────────────────────────────────────────────────────────────────

.body-fat__info {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both;
}

.body-fat__info-text {
  font-size: 0.875rem;
  color: var(--primary-text);
  line-height: 1.65;
  margin: 0 0 calc(#{$spacing} * 0.5);

  &--muted {
    color: var(--secondary-text);
    font-size: 0.82rem;
    margin-bottom: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

// ─── Category reference table ─────────────────────────────────────────────────

.body-fat__table-section {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 480ms both;
}

.body-fat__cat-list {
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

.body-fat__cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  // Inset left accent for active state — no layout shift
  box-shadow: inset 3px 0 0 transparent;
  transition: background 200ms ease, box-shadow 200ms ease;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }

  &--active {
    background: var(--accent-color-tint);
    box-shadow: inset 3px 0 0 var(--accent-color);
  }
}

.body-fat__cat-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

// ─── History ──────────────────────────────────────────────────────────────────

.body-fat__history {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 600ms both;
}

.body-fat__list {
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

.body-fat__item {
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

.body-fat__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.body-fat__item-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.body-fat__item-cat {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body-fat__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.375);
  flex-shrink: 0;
}

.body-fat__item-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.body-fat__item-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--secondary-text);
  letter-spacing: 0;
}

.body-fat__item-delete {
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

.body-fat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.body-fat__empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.body-fat__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.body-fat__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 26ch;
  line-height: 1.5;
  margin: 0;
}
</style>
