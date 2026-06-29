<template>
  <div class="history page-content">

    <!-- ─── Period tabs ─────────────────────────────────────────────────────── -->
    <section class="history__tabs">
      <div class="chips" role="group" aria-label="Zeitraum wählen">
        <button
          class="chip clickable"
          :class="{ selected: period === 7 }"
          :aria-pressed="period === 7"
          @click="selectPeriod(7)"
        >
          7 Tage
        </button>
        <button
          class="chip clickable"
          :class="{ selected: period === 30 }"
          :aria-pressed="period === 30"
          @click="selectPeriod(30)"
        >
          30 Tage
        </button>
        <button
          class="chip clickable"
          :class="{ selected: period === 90 }"
          :aria-pressed="period === 90"
          @click="selectPeriod(90)"
        >
          90 Tage
        </button>
      </div>
    </section>

    <!-- ─── Hero: key stats ──────────────────────────────────────────────────── -->
    <section class="history__hero" aria-label="Schlüsselkennzahlen">
      <div class="history__stat-card" aria-label="Durchschnittliche Kalorien">
        <div class="history__stat-number">
          <span class="history__stat-value">{{ avg.calories }}</span>
          <span class="history__stat-unit">kcal</span>
        </div>
        <span class="history__stat-label">Ø Kalorien</span>
      </div>

      <div class="history__stat-divider" aria-hidden="true" />

      <div class="history__stat-card" aria-label="Streak in Tagen">
        <div class="history__stat-number">
          <span
            class="history__stat-value"
            :class="{ 'history__stat-value--streak': streak > 0 }"
          >{{ streak }}<template v-if="streak > 0"> 🔥</template></span>
        </div>
        <span class="history__stat-label">Streak · Tage</span>
      </div>

      <div class="history__stat-divider" aria-hidden="true" />

      <div class="history__stat-card" aria-label="Zielerreichung in Prozent">
        <div class="history__stat-number">
          <span class="history__stat-value" :class="adherenceClass">{{ adherence }}</span>
          <span class="history__stat-unit">%</span>
        </div>
        <span class="history__stat-label">Zielerreichung</span>
      </div>
    </section>

    <!-- ─── SVG bar chart ────────────────────────────────────────────────────── -->
    <section class="history__chart-section" aria-label="Kalorienverlauf">
      <div
        v-if="isLoading"
        class="history__chart-loader"
        aria-busy="true"
        aria-label="Lade Daten"
      >
        <span class="loading" aria-hidden="true" />
      </div>

      <svg
        v-else-if="days.length > 0"
        class="history__chart"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <!-- goal line -->
        <line
          :x1="0"
          :y1="goalY"
          :x2="400"
          :y2="goalY"
          stroke-dasharray="4 3"
          class="history__chart-goal"
        />
        <!-- daily bars -->
        <rect
          v-for="(day, i) in days"
          :key="day.date"
          :x="barX(i, days.length)"
          :y="day.calories === 0 ? H - PAD_BOTTOM - 2 : barY(day.calories)"
          :width="barWidth(days.length)"
          :height="day.calories === 0 ? 2 : Math.max(barHeight(day.calories), 3)"
          :class="barClass(day)"
          rx="2"
        />
      </svg>

      <div v-else class="history__chart-empty">
        <AppIcon name="bar_chart" size="1.5rem" />
        <span>Keine Daten</span>
      </div>
    </section>

    <!-- ─── Macro averages ───────────────────────────────────────────────────── -->
    <section class="history__macros" aria-label="Durchschnittliche Makros">
      <p class="history__section-label">Ø Makros pro Tag</p>

      <div class="history__macro-row">
        <div class="history__macro-head">
          <span class="history__macro-name history__macro-name--protein">Protein</span>
          <span class="history__macro-amount">
            {{ avg.protein_g }}g
            <span class="history__macro-detail">({{ Math.round(avg.protein_g * 4) }} kcal · {{ macroPerc.protein }}%)</span>
          </span>
        </div>
        <div class="progress history__macro-progress" role="none">
          <div
            class="progress-bar history__macro-bar"
            :style="{ width: macroBarWidth(avg.protein_g) + '%', backgroundColor: '#ef4444' }"
            role="progressbar"
            :aria-valuenow="avg.protein_g"
            :aria-valuemax="maxMacro"
            aria-label="Protein-Anteil"
          />
        </div>
      </div>

      <div class="history__macro-row">
        <div class="history__macro-head">
          <span class="history__macro-name history__macro-name--carbs">Carbs</span>
          <span class="history__macro-amount">
            {{ avg.carbs_g }}g
            <span class="history__macro-detail">({{ Math.round(avg.carbs_g * 4) }} kcal · {{ macroPerc.carbs }}%)</span>
          </span>
        </div>
        <div class="progress history__macro-progress" role="none">
          <div
            class="progress-bar history__macro-bar"
            :style="{ width: macroBarWidth(avg.carbs_g) + '%', backgroundColor: '#3b82f6' }"
            role="progressbar"
            :aria-valuenow="avg.carbs_g"
            :aria-valuemax="maxMacro"
            aria-label="Kohlenhydrat-Anteil"
          />
        </div>
      </div>

      <div class="history__macro-row">
        <div class="history__macro-head">
          <span class="history__macro-name history__macro-name--fat">Fett</span>
          <span class="history__macro-amount">
            {{ avg.fat_g }}g
            <span class="history__macro-detail">({{ Math.round(avg.fat_g * 9) }} kcal · {{ macroPerc.fat }}%)</span>
          </span>
        </div>
        <div class="progress history__macro-progress" role="none">
          <div
            class="progress-bar history__macro-bar"
            :style="{ width: macroBarWidth(avg.fat_g) + '%', backgroundColor: '#f59e0b' }"
            role="progressbar"
            :aria-valuenow="avg.fat_g"
            :aria-valuemax="maxMacro"
            aria-label="Fett-Anteil"
          />
        </div>
      </div>
    </section>

    <!-- ─── Day list ─────────────────────────────────────────────────────────── -->
    <section class="history__list-section" aria-label="Tagesverlauf">
      <p class="history__section-label">Verlauf</p>

      <!-- Empty state -->
      <div
        v-if="loggedDays.length === 0"
        class="history__empty"
        aria-live="polite"
      >
        <AppIcon name="bar_chart" size="2.5rem" class="history__empty-icon" />
        <p class="history__empty-title">Noch keine Daten</p>
        <p class="history__empty-hint">Trag deine ersten Mahlzeiten ein.</p>
      </div>

      <!-- Day list -->
      <ul v-else class="history__list" role="list">
        <li
          v-for="(day, idx) in displayDays"
          :key="day.date"
          class="history__list-item"
          :style="{ animationDelay: `${Math.min(idx, 14) * 30}ms` }"
          role="button"
          tabindex="0"
          :aria-label="`${formatDate(day.date)}: ${day.calories} kcal`"
          @click="navigateTo('/diary/' + day.date)"
          @keydown.enter="navigateTo('/diary/' + day.date)"
          @keydown.space.prevent="navigateTo('/diary/' + day.date)"
        >
          <span
            class="history__list-dot"
            :class="dayDotClass(day)"
            aria-hidden="true"
          />
          <div class="history__list-body">
            <span class="history__list-date">{{ formatDate(day.date) }}</span>
            <span class="history__list-macros" aria-hidden="true">
              <span class="history__macro-pill history__macro-pill--protein">P {{ day.protein_g }}g</span>
              <span class="history__macro-pill history__macro-pill--carbs">K {{ day.carbs_g }}g</span>
              <span class="history__macro-pill history__macro-pill--fat">F {{ day.fat_g }}g</span>
            </span>
          </div>
          <div class="history__list-meta">
            <span class="history__list-cal">{{ day.calories }}</span>
            <span class="history__list-cal-unit">kcal</span>
            <AppIcon name="chevron_right" size="1rem" class="history__list-chevron" />
          </div>
        </li>
      </ul>
    </section>

  </div>
</template>

<script setup lang="ts">
import type { DayTotal } from '~/composables/useStats'

definePageMeta({ title: 'Verlauf' })

const statsStore = useStatsStore()
const userStore = useUserStore()
const { calcAverage, calcMacroPercentages, calcAdherence } = useStats()
const { streak } = useStreak()

const { period, days, loggedDays, isLoading } = storeToRefs(statsStore)

// ─── Calorie goal ─────────────────────────────────────────────────────────────

const calorieGoal = computed(() => userStore.user?.calorie_goal ?? 2000)

// ─── Derived stats ────────────────────────────────────────────────────────────

const avg = computed(() => calcAverage(loggedDays.value))
const adherence = computed(() => calcAdherence(days.value, calorieGoal.value))
const macroPerc = computed(() => calcMacroPercentages(avg.value.protein_g, avg.value.carbs_g, avg.value.fat_g))
const maxMacro = computed(() => Math.max(avg.value.protein_g, avg.value.carbs_g, avg.value.fat_g, 1))

const adherenceClass = computed(() => {
  if (adherence.value >= 75) return 'history__stat-value--success'
  if (adherence.value >= 50) return 'history__stat-value--warning'
  return ''
})

function macroBarWidth(val: number): number {
  return Math.round((val / maxMacro.value) * 100)
}

// ─── SVG chart constants & helpers ───────────────────────────────────────────

const W = 400
const H = 160
const PAD_TOP = 16
const PAD_BOTTOM = 24

const maxCal = computed(() =>
  Math.max(calorieGoal.value * 1.3, ...days.value.map(d => d.calories), 1),
)

function barX(i: number, n: number): number {
  return (i / n) * W
}

function barWidth(n: number): number {
  return (W / n) * 0.7
}

function barHeight(cal: number): number {
  return (cal / maxCal.value) * (H - PAD_TOP - PAD_BOTTOM)
}

function barY(cal: number): number {
  return H - PAD_BOTTOM - barHeight(cal)
}

const goalY = computed(() =>
  H - PAD_BOTTOM - (calorieGoal.value / maxCal.value) * (H - PAD_TOP - PAD_BOTTOM),
)

function barClass(day: DayTotal): string {
  if (day.calories === 0) return 'history__chart-bar--empty'
  if (day.calories > calorieGoal.value) return 'history__chart-bar--over'
  return 'history__chart-bar--on-target'
}

// ─── Day list helpers ─────────────────────────────────────────────────────────

const displayDays = computed(() =>
  loggedDays.value.slice().reverse().slice(0, 30),
)

function dayDotClass(day: DayTotal): string {
  if (day.calories > calorieGoal.value * 1.1) return 'history__list-dot--over'
  if (day.calories <= calorieGoal.value) return 'history__list-dot--ok'
  return ''
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Period selection ─────────────────────────────────────────────────────────

async function selectPeriod(p: 7 | 30 | 90) {
  await statsStore.loadPeriod(p)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([userStore.loadUser(), statsStore.loadPeriod(7)])
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
  .history__tabs,
  .history__hero,
  .history__chart-section,
  .history__macros,
  .history__list-section,
  .history__list-item {
    animation: none !important;
  }
}

// ─── Page layout ──────────────────────────────────────────────────────────────

.history {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Period tabs ──────────────────────────────────────────────────────────────

.history__tabs {
  animation: fadeSlideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

// ─── Hero stats ───────────────────────────────────────────────────────────────

.history__hero {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--accent-color-tint) 100%);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25) calc(#{$spacing} * 0.75);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.history__stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.2);
  text-align: center;
  padding: 0 calc(#{$spacing} * 0.25);
}

.history__stat-divider {
  width: 1px;
  height: 2.5rem;
  background: var(--divider);
  flex-shrink: 0;
}

.history__stat-number {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.history__stat-value {
  font-size: clamp(1.5rem, 6vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--primary-text);
  line-height: 1;

  &--streak  { color: var(--accent-color); }
  &--success { color: var(--success); }
  &--warning { color: var(--warning); }
}

.history__stat-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-bottom: 0.1rem;
  flex-shrink: 0;
}

.history__stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
  white-space: nowrap;
}

// ─── Chart section ────────────────────────────────────────────────────────────

.history__chart-section {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 0.5) calc(#{$spacing} * 0.5);
  overflow: hidden;
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
}

.history__chart {
  display: block;
  width: 100%;
  height: 160px;
}

.history__chart-goal {
  stroke: var(--secondary-text);
  stroke-width: 1;
  opacity: 0.4;
}

.history__chart-bar--empty {
  fill: var(--divider);
  opacity: 0.6;
}

.history__chart-bar--on-target {
  fill: var(--accent-color);
  opacity: 0.85;
}

.history__chart-bar--over {
  fill: var(--warning);
  opacity: 0.9;
}

.history__chart-loader {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history__chart-empty {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 0.4);
  color: var(--secondary-text);
  font-size: 0.82rem;
  opacity: 0.5;
}

// ─── Section label ────────────────────────────────────────────────────────────

.history__section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text);
  margin: 0 0 calc(#{$spacing} * 0.75);
}

// ─── Macro section ────────────────────────────────────────────────────────────

.history__macros {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

.history__macro-row {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.35);
  margin-bottom: calc(#{$spacing} * 0.875);

  &:last-child {
    margin-bottom: 0;
  }
}

.history__macro-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: calc(#{$spacing} * 0.5);
}

.history__macro-name {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  flex-shrink: 0;

  &--protein { color: $macro-protein; }
  &--carbs   { color: $macro-carbs; }
  &--fat     { color: $macro-fat; }
}

.history__macro-amount {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary-text);
  text-align: right;
  min-width: 0;
}

.history__macro-detail {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.history__macro-progress {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--divider);
}

.history__macro-bar {
  height: 6px;
  border-radius: var(--radius-full);
  transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 0;
}

// ─── List section ─────────────────────────────────────────────────────────────

.history__list-section {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.history__list {
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

.history__list-item {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.75);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  cursor: pointer;
  animation: itemIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: background 150ms ease;

  &:hover,
  &:focus-visible {
    background: var(--hover);
    outline: none;
  }

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.history__list-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--divider);
  flex-shrink: 0;

  &--ok   { background: var(--success); }
  &--over { background: var(--warning); }
}

.history__list-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.history__list-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.history__list-macros {
  display: flex;
  gap: calc(#{$spacing} * 0.25);
  flex-wrap: nowrap;
}

.history__macro-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  line-height: 1.4;
  flex-shrink: 0;

  &--protein {
    color: $macro-protein;
    background: rgba(239, 68, 68, 0.12);
  }

  &--carbs {
    color: $macro-carbs;
    background: rgba(59, 130, 246, 0.12);
  }

  &--fat {
    color: $macro-fat;
    background: rgba(245, 158, 11, 0.12);
  }
}

.history__list-meta {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

.history__list-cal {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.history__list-cal-unit {
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--secondary-text);
  padding-bottom: 0.05rem;
}

.history__list-chevron {
  color: var(--secondary-text);
  opacity: 0.4;
  margin-left: 0.15rem;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.history__empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.history__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.history__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 26ch;
  line-height: 1.5;
  margin: 0;
}
</style>
