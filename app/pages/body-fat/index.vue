<template>
  <div class="body-fat page-content">

    <!-- ─── Hero: result or empty state ───────────────────────────────────────── -->
    <section
      class="body-fat__hero"
      :class="heroClass"
      aria-label="Körperfett-Ergebnis"
    >
      <template v-if="result">
        <div class="body-fat__hero-body">
          <div class="body-fat__value-group">
            <span class="body-fat__eyebrow">Körperfett</span>
            <div class="body-fat__value-row">
              <span class="body-fat__value">{{ result.value.toFixed(1) }}</span>
              <span class="body-fat__unit">%</span>
            </div>
          </div>
          <div class="body-fat__hero-meta">
            <span
              class="badge"
              :class="badgeClass"
              :aria-label="`Kategorie: ${result.label}`"
            >
              {{ result.label }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="body-fat__hero-empty">
          <AppIcon name="monitor_weight" size="2rem" />
          <p>Noch nicht berechnet</p>
        </div>
      </template>
    </section>

    <!-- ─── No profile fallback ───────────────────────────────────────────────── -->
    <div v-if="!userStore.user" class="body-fat__no-profile">
      <div class="alert alert-info">
        <AppIcon name="person" size="1.125rem" />
        <span>
          Bitte fülle zuerst dein
          <NuxtLink to="/settings/profile" class="body-fat__profile-link">Profil</NuxtLink>
          aus, um die Körperfett-Berechnung nutzen zu können.
        </span>
      </div>
    </div>

    <template v-else>

      <!-- ─── Input form ─────────────────────────────────────────────────────── -->
      <section class="body-fat__form" aria-label="Maße eingeben">
        <p class="body-fat__section-label">Maße eingeben</p>

        <!-- Height info chip (read-only, from profile) -->
        <div class="body-fat__height-info" aria-label="Körpergröße aus Profil">
          <AppIcon name="height" size="1rem" class="body-fat__height-icon" />
          <span class="body-fat__height-text">
            Körpergröße: <strong>{{ userStore.user.height_cm }}&thinsp;cm</strong>
          </span>
        </div>

        <!-- Neck + Waist (2-column) -->
        <div class="body-fat__form-row">
          <div class="form-group body-fat__form-group">
            <label class="body-fat__field-label" for="bf-neck">Hals</label>
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
              />
              <span class="body-fat__input-unit" aria-hidden="true">cm</span>
            </div>
          </div>
          <div class="form-group body-fat__form-group">
            <label class="body-fat__field-label" for="bf-waist">Taille</label>
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
              />
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
            <label class="body-fat__field-label" for="bf-hip">Hüfte</label>
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
              />
              <span class="body-fat__input-unit" aria-hidden="true">cm</span>
            </div>
          </div>
        </Transition>

        <!-- Validation error -->
        <p v-if="formError" class="body-fat__form-error" role="alert">
          {{ formError }}
        </p>

        <button
          class="button button-primary body-fat__calc-btn"
          :disabled="!canCalc"
          @click="handleCalc"
        >
          <AppIcon name="calculate" size="1rem" />
          Berechnen
        </button>
      </section>

      <!-- ─── Info card ──────────────────────────────────────────────────────── -->
      <section class="body-fat__info" aria-label="Über die Navy-Methode">
        <p class="body-fat__section-label">Über die Navy-Methode</p>
        <p class="body-fat__info-text">
          Die US-Navy-Methode schätzt den Körperfettanteil anhand einfacher Körpermaße – ohne Geräte oder Spezialtechnik.
          Sie kombiniert Hals- und Taillenumfang (bei Frauen zusätzlich Hüfte) mit der Körpergröße zu einer validierten Formel.
        </p>
        <p class="body-fat__info-text body-fat__info-text--muted">
          Die Methode stammt vom U.S. Naval Health Research Center und gilt als zuverlässige Schätzung für gesunde Erwachsene mit einer Genauigkeit von ±&thinsp;3&thinsp;%.
        </p>
      </section>

      <!-- ─── Category reference table ──────────────────────────────────────── -->
      <section class="body-fat__table-section" aria-label="Kategorie-Referenz">
        <p class="body-fat__section-label">Kategorien ({{ genderLabel }})</p>
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

    </template>

  </div>
</template>

<script setup lang="ts">
import type { BodyFatCategory } from '~/composables/useBodyFat'

definePageMeta({ title: 'Körperfett' })

const userStore = useUserStore()
const { calcBodyFat } = useBodyFat()

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

// Clear error whenever any input changes
watch([neckStr, waistStr, hipStr], () => {
  formError.value = null
})

// ─── Result ───────────────────────────────────────────────────────────────────

const result = ref<{ value: number; category: BodyFatCategory; label: string } | null>(null)

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
      formError.value = 'Unplausibles Ergebnis – bitte prüfe die eingegebenen Maße.'
      return
    }
    result.value = raw
  }
  catch {
    formError.value = 'Ungültige Eingabe – bitte prüfe die eingegebenen Werte.'
    result.value = null
  }
}

// ─── Hero gradient + badge ────────────────────────────────────────────────────

const heroClass = computed(() => {
  if (!result.value) return ''
  switch (result.value.category) {
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
  if (!result.value) return ''
  switch (result.value.category) {
    case 'athlete':
    case 'fitness':
      return 'badge-success'
    case 'average':
      return 'badge-warning'
    default:
      return 'badge-error'
  }
})

// ─── Category reference table ─────────────────────────────────────────────────

interface CategoryRow {
  category: BodyFatCategory
  label: string
  range: string
  badgeClass: string
}

const maleCategoryTable: CategoryRow[] = [
  { category: 'essential', label: 'Essenziell',   range: '< 6 %',     badgeClass: 'badge-error' },
  { category: 'athlete',   label: 'Sportler',     range: '6 – 13 %',  badgeClass: 'badge-success' },
  { category: 'fitness',   label: 'Fitness',      range: '14 – 17 %', badgeClass: 'badge-success' },
  { category: 'average',   label: 'Durchschnitt', range: '18 – 24 %', badgeClass: 'badge-warning' },
  { category: 'obese',     label: 'Übergewicht',  range: '≥ 25 %',    badgeClass: 'badge-error' },
]

const femaleCategoryTable: CategoryRow[] = [
  { category: 'essential', label: 'Essenziell',   range: '< 14 %',    badgeClass: 'badge-error' },
  { category: 'athlete',   label: 'Sportlich',    range: '14 – 20 %', badgeClass: 'badge-success' },
  { category: 'fitness',   label: 'Fitness',      range: '21 – 24 %', badgeClass: 'badge-success' },
  { category: 'average',   label: 'Durchschnitt', range: '25 – 31 %', badgeClass: 'badge-warning' },
  { category: 'obese',     label: 'Übergewicht',  range: '≥ 32 %',    badgeClass: 'badge-error' },
]

const categoryTable = computed<CategoryRow[]>(() =>
  userStore.user?.gender === 'male' ? maleCategoryTable : femaleCategoryTable,
)

const genderLabel = computed(() =>
  userStore.user?.gender === 'male' ? 'Männer' : 'Frauen',
)

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await userStore.loadUser()
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

@media (prefers-reduced-motion: reduce) {
  .body-fat__hero,
  .body-fat__no-profile,
  .body-fat__form,
  .body-fat__info,
  .body-fat__table-section {
    animation: none !important;
  }

  .bf-hip-enter-active,
  .bf-hip-leave-active {
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
  padding-top: 0.3rem;
  flex-shrink: 0;
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

// ─── Form ─────────────────────────────────────────────────────────────────────

.body-fat__form {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
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

// Calculate button
.body-fat__calc-btn {
  width: 100%;
  margin-top: calc(#{$spacing} * 0.875);
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

// ─── Info card ────────────────────────────────────────────────────────────────

.body-fat__info {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
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
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both;
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
</style>
