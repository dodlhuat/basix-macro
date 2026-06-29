<template>
  <div class="diary page-content">

    <!-- Page header -->
    <header class="diary__header">
      <button
        class="button button-icon diary__back-btn"
        aria-label="Zurück zum Dashboard"
        @click="navigateTo('/')"
      >
        <AppIcon name="arrow_back" size="1.25rem" />
      </button>

      <div class="diary__header-center">
        <span class="diary__date-weekday">{{ formattedWeekday }}</span>
        <span class="diary__date-day">{{ formattedDayMonth }}</span>
        <Transition name="badge-fade">
          <span
            v-if="isToday"
            class="badge badge-primary diary__today-badge"
            aria-label="Heutiger Tag"
          >Heute</span>
        </Transition>
      </div>

      <div class="diary__date-nav" role="navigation" aria-label="Datumsnavigation">
        <button
          class="button button-icon diary__nav-btn"
          aria-label="Vorheriger Tag"
          @click="prevDay"
        >
          <AppIcon name="chevron_left" size="1.25rem" />
        </button>
        <button
          class="button button-icon diary__nav-btn"
          aria-label="Nächster Tag"
          @click="nextDay"
        >
          <AppIcon name="chevron_right" size="1.25rem" />
        </button>
      </div>
    </header>

    <!-- Calorie hero -->
    <section
      class="diary__hero"
      :class="{ 'diary__hero--over': isOverGoal }"
      aria-label="Kalorien-Zusammenfassung"
    >
      <div class="diary__hero-body">
        <div class="diary__remaining">
          <span class="diary__remaining-number">
            {{ isOverGoal ? 0 : remainingCalories }}
          </span>
          <span class="diary__remaining-label">
            {{ isOverGoal ? 'Ziel überschritten' : 'verbleibend' }}
          </span>
        </div>

        <div class="diary__hero-stats">
          <div class="diary__stat">
            <span class="diary__stat-value">{{ Math.round(totalCalories) }}</span>
            <span class="diary__stat-label">verbraucht</span>
          </div>
          <div class="diary__stat-sep" aria-hidden="true" />
          <div class="diary__stat">
            <span class="diary__stat-value">{{ calorieGoal }}</span>
            <span class="diary__stat-label">Ziel</span>
          </div>
        </div>
      </div>

      <div class="progress diary__hero-progress">
        <div
          class="progress-bar"
          :class="isOverGoal ? 'error' : 'accent'"
          :style="{ width: caloriePercent + '%' }"
          role="progressbar"
          :aria-valuenow="Math.round(totalCalories)"
          :aria-valuemax="calorieGoal"
          aria-label="Kalorienfortschritt"
        />
      </div>

      <p v-if="isOverGoal" class="diary__over-label">
        + {{ Math.round(totalCalories - calorieGoal) }} kcal über dem Ziel
      </p>
    </section>

    <!-- Macro bars -->
    <section class="diary__macros" aria-label="Makronährstoffe">
      <div
        v-for="macro in macros"
        :key="macro.key"
        class="diary__macro"
      >
        <div class="diary__macro-header">
          <span
            class="diary__macro-dot"
            :style="{ backgroundColor: macro.color }"
            aria-hidden="true"
          />
          <span class="diary__macro-label">{{ macro.label }}</span>
          <span class="diary__macro-value">
            {{ Math.round(macro.current) }}<span class="diary__macro-unit">g</span>
            <span class="diary__macro-pct">· {{ macro.percent }}%</span>
          </span>
        </div>
        <div class="progress diary__macro-bar">
          <div
            class="progress-bar"
            :style="{ width: macro.percent + '%', backgroundColor: macro.color }"
            role="progressbar"
            :aria-valuenow="Math.round(macro.current)"
            :aria-valuemax="macro.goal"
            :aria-label="`${macro.label}: ${Math.round(macro.current)} von ${macro.goal} g`"
          />
        </div>
      </div>
    </section>

    <!-- Meal sections -->
    <section class="diary__meals" aria-label="Mahlzeiten">
      <div
        v-for="meal in mealSections"
        :key="meal.type"
        class="diary__meal"
        :class="`diary__meal--${meal.type}`"
      >
        <div class="diary__meal-header">
          <span class="diary__meal-name">{{ meal.label }}</span>
          <span
            v-if="meal.entries.length"
            class="diary__meal-kcal"
            aria-label="`${Math.round(meal.totalKcal)} Kilokalorien`"
          >
            {{ Math.round(meal.totalKcal) }} kcal
          </span>
          <button
            class="button button-icon button-sm diary__meal-add"
            :aria-label="`${meal.label} – Eintrag hinzufügen`"
            @click="addEntry(meal.type)"
          >
            <AppIcon name="add" size="1.25rem" />
          </button>
        </div>

        <ul v-if="meal.entries.length" class="diary__entries" role="list">
          <li
            v-for="entry in meal.entries"
            :key="entry.id"
            class="diary__entry"
            :class="{ 'diary__entry--confirming': confirmingDeleteId === entry.id }"
          >
            <Transition name="entry-confirm" mode="out-in">
              <div
                v-if="confirmingDeleteId !== entry.id"
                key="normal"
                class="diary__entry-row"
              >
                <div class="diary__entry-info">
                  <span class="diary__entry-name">{{ entry.food_item_name }}</span>
                  <span class="diary__entry-amount">
                    {{ entry.amount_g > 0 ? `${entry.amount_g} g` : `${entry.servings} Port.` }}
                  </span>
                </div>
                <div class="diary__entry-right">
                  <span class="diary__entry-kcal">{{ Math.round(entry.calories_total) }} kcal</span>
                  <button
                    class="button button-icon button-sm diary__entry-delete"
                    :aria-label="`${entry.food_item_name} löschen`"
                    @click="requestDelete(entry.id)"
                  >
                    <AppIcon name="delete" size="1rem" />
                  </button>
                </div>
              </div>

              <div
                v-else
                key="confirm"
                class="diary__entry-confirm-row"
              >
                <span class="diary__entry-confirm-label">Eintrag löschen?</span>
                <div class="diary__entry-confirm-actions">
                  <button
                    class="button button-sm button-error"
                    @click="confirmDelete(entry.id)"
                  >
                    Löschen
                  </button>
                  <button
                    class="button button-sm button-outline"
                    @click="cancelDelete"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </Transition>
          </li>
        </ul>

        <p v-else class="diary__meal-empty">Noch nichts eingetragen</p>
      </div>
    </section>

    <!-- Water tracker -->
    <section class="diary__water card card-bordered" aria-label="Wasseraufnahme">
      <div class="diary__water-header">
        <AppIcon name="water_drop" class="diary__water-icon" size="1.25rem" />
        <span class="diary__water-title">Wasser</span>
        <span class="diary__water-amount">
          {{ totalWater }}<span class="diary__water-unit">ml</span>
        </span>
        <span class="diary__water-goal">/ {{ waterGoal }} ml</span>
      </div>

      <div class="progress diary__water-progress">
        <div
          class="progress-bar success"
          :style="{ width: waterPercent + '%' }"
          role="progressbar"
          :aria-valuenow="totalWater"
          :aria-valuemax="waterGoal"
          aria-label="Wasserfortschritt"
        />
      </div>

      <div class="chips diary__water-chips">
        <button
          class="chip clickable"
          aria-label="150 ml Wasser hinzufügen"
          @click="addWaterAmount(150)"
        >+150 ml</button>
        <button
          class="chip clickable"
          aria-label="250 ml Wasser hinzufügen"
          @click="addWaterAmount(250)"
        >+250 ml</button>
        <button
          class="chip clickable"
          aria-label="330 ml Wasser hinzufügen"
          @click="addWaterAmount(330)"
        >+330 ml</button>
        <button
          class="chip clickable"
          aria-label="500 ml Wasser hinzufügen"
          @click="addWaterAmount(500)"
        >+500 ml</button>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Tagebuch' })

const route = useRoute()
const diaryStore = useDiaryStore()
const userStore = useUserStore()

// ─── Date ─────────────────────────────────────────────────────────────────────

const date = computed(() => route.params.date as string)

const isToday = computed(() =>
  date.value === new Date().toISOString().substring(0, 10)
)

const formattedWeekday = computed(() =>
  new Date(date.value + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long' })
)

const formattedDayMonth = computed(() =>
  new Date(date.value + 'T12:00:00').toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
)

function prevDay(): void {
  const d = new Date(date.value + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  navigateTo('/diary/' + d.toISOString().substring(0, 10))
}

function nextDay(): void {
  const d = new Date(date.value + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  navigateTo('/diary/' + d.toISOString().substring(0, 10))
}

// ─── Store refs ───────────────────────────────────────────────────────────────

const {
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  totalWater,
  entryDetails,
} = storeToRefs(diaryStore)

// ─── Goals ────────────────────────────────────────────────────────────────────

const calorieGoal = computed(() => userStore.user?.calorie_goal   ?? 2000)
const proteinGoal = computed(() => userStore.user?.protein_goal_g ?? 150)
const carbsGoal   = computed(() => userStore.user?.carbs_goal_g   ?? 250)
const fatGoal     = computed(() => userStore.user?.fat_goal_g     ?? 65)
const waterGoal   = computed(() => userStore.user?.water_goal_ml  ?? 2000)

// ─── Calorie hero ─────────────────────────────────────────────────────────────

const remainingCalories = computed(() =>
  Math.max(0, calorieGoal.value - Math.round(totalCalories.value))
)

const caloriePercent = computed(() =>
  Math.min(100, calorieGoal.value > 0
    ? (totalCalories.value / calorieGoal.value) * 100
    : 0
  )
)

const isOverGoal = computed(() => totalCalories.value > calorieGoal.value)

// ─── Macros ───────────────────────────────────────────────────────────────────

function pct(value: number, goal: number): number {
  return Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0)
}

const macros = computed(() => [
  {
    key: 'protein',
    label: 'Protein',
    current: totalProtein.value,
    goal: proteinGoal.value,
    color: '#ef4444',
    percent: pct(totalProtein.value, proteinGoal.value),
  },
  {
    key: 'carbs',
    label: 'Kohlenhydrate',
    current: totalCarbs.value,
    goal: carbsGoal.value,
    color: '#3b82f6',
    percent: pct(totalCarbs.value, carbsGoal.value),
  },
  {
    key: 'fat',
    label: 'Fett',
    current: totalFat.value,
    goal: fatGoal.value,
    color: '#f59e0b',
    percent: pct(totalFat.value, fatGoal.value),
  },
])

// ─── Water ────────────────────────────────────────────────────────────────────

const waterPercent = computed(() =>
  Math.min(100, waterGoal.value > 0
    ? (totalWater.value / waterGoal.value) * 100
    : 0
  )
)

async function addWaterAmount(amount: number): Promise<void> {
  await diaryStore.addWater(amount, date.value)
}

// ─── Meal sections ────────────────────────────────────────────────────────────

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
}

const mealSections = computed(() =>
  MEAL_TYPES.map(type => {
    const entries = entryDetails.value.filter(e => e.meal_type === type)
    return {
      type,
      label: MEAL_LABELS[type],
      entries,
      totalKcal: entries.reduce((sum, e) => sum + e.calories_total, 0),
    }
  })
)

function addEntry(mealType: MealType): void {
  navigateTo(`/diary/add?date=${date.value}&meal=${mealType}`)
}

// ─── Inline delete confirmation ────────────────────────────────────────────────

const confirmingDeleteId = ref<string | null>(null)

function requestDelete(id: string): void {
  confirmingDeleteId.value = id
}

async function confirmDelete(id: string): Promise<void> {
  await diaryStore.deleteEntry(id)
  confirmingDeleteId.value = null
}

function cancelDelete(): void {
  confirmingDeleteId.value = null
}

// ─── Data loading ──────────────────────────────────────────────────────────────

onMounted(() => diaryStore.loadForDate(date.value))
watch(date, newDate => diaryStore.loadForDate(newDate))
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

/* ─── Animations ──────────────────────────────────────────────────────────────── */

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
  .diary__hero,
  .diary__macros,
  .diary__meals,
  .diary__water {
    animation: none !important;
  }

  .progress-bar {
    transition: none !important;
  }

  .diary__entry-row,
  .diary__entry-confirm-row {
    transition: none !important;
  }
}

/* ─── Page layout ─────────────────────────────────────────────────────────────── */

.diary {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 2);
}

/* ─── Page header ─────────────────────────────────────────────────────────────── */

.diary__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.diary__back-btn {
  flex-shrink: 0;
}

.diary__header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;
}

.diary__date-weekday {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--secondary-text);
  line-height: 1;
}

.diary__date-day {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--primary-text);
  text-align: center;
  line-height: 1.2;
}

.diary__today-badge {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  pointer-events: none;
  margin-top: 0.15rem;
}

.diary__date-nav {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ─── Today badge transition ──────────────────────────────────────────────────── */

.badge-fade-enter-active,
.badge-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.badge-fade-enter-from,
.badge-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ─── Calorie hero ────────────────────────────────────────────────────────────── */

.diary__hero {
  background: linear-gradient(
    135deg,
    var(--primary-bg) 0%,
    var(--accent-color-tint) 100%
  );
  border-radius: var(--radius-xl);
  padding: calc(#{$spacing} * 1.25) calc(#{$spacing} * 1.5);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &--over {
    background: linear-gradient(
      135deg,
      var(--primary-bg) 0%,
      var(--error-tint) 100%
    );
  }
}

.diary__hero-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
  margin-bottom: calc(#{$spacing} * 0.875);
}

.diary__remaining {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.diary__remaining-number {
  font-size: clamp(2.6rem, 12vw, 3.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--primary-text);
}

.diary__remaining-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.diary__hero-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  padding-top: 0.4rem;
  flex-shrink: 0;
}

.diary__stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.diary__stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--primary-text);
}

.diary__stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.diary__stat-sep {
  width: 1.5rem;
  height: 1px;
  background: var(--divider);
  align-self: flex-end;
}

.diary__hero-progress {
  height: 6px;
  border-radius: var(--radius-full);
  overflow: hidden;

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.diary__over-label {
  margin-top: calc(#{$spacing} * 0.5);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--error);
  text-align: right;
}

/* ─── Macro bars ──────────────────────────────────────────────────────────────── */

.diary__macros {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: $spacing calc(#{$spacing} * 1.25);
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.9);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.diary__macro {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.diary__macro-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.diary__macro-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.diary__macro-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-text);
  flex: 1;
}

.diary__macro-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.diary__macro-unit {
  font-weight: 500;
  color: var(--secondary-text);
}

.diary__macro-pct {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--secondary-text);
  margin-left: 0.2rem;
}

.diary__macro-bar {
  height: 5px;
  border-radius: var(--radius-full);
  overflow: hidden;

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1) 100ms;
    border-radius: var(--radius-full);
  }
}

/* ─── Meal sections ───────────────────────────────────────────────────────────── */

.diary__meals {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--divider);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
}

.diary__meal {
  background: var(--primary-bg);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.125);
  border-left: 3px solid transparent;

  &:first-child {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  &--breakfast { border-left-color: #f59e0b; }
  &--lunch     { border-left-color: #22c55e; }
  &--dinner    { border-left-color: #3b82f6; }
  &--snack     { border-left-color: #a855f7; }
}

.diary__meal-header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  min-height: 2rem;
}

.diary__meal-name {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  flex: 1;
}

.diary__meal-kcal {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-text);
}

.diary__meal-add {
  color: var(--accent-color);
  margin: -0.25rem;
  flex-shrink: 0;
  transition: transform 200ms ease;

  &:hover,
  &:focus-visible {
    transform: scale(1.15);
  }
}

/* ─── Entry list ──────────────────────────────────────────────────────────────── */

.diary__entries {
  list-style: none;
  padding: 0;
  margin: 0.4rem 0 0;
  display: flex;
  flex-direction: column;
}

.diary__entry {
  border-top: 1px solid var(--divider);
  overflow: hidden;

  &:first-child {
    border-top: none;
  }

  &--confirming {
    border-top-color: transparent;
    border-radius: $border-radius;
    margin: 0.15rem 0;
  }
}

.diary__entry-row {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: 0.4rem 0;
}

.diary__entry-confirm-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  background: var(--error-tint);
  border-radius: $border-radius;
}

.diary__entry-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.diary__entry-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary__entry-amount {
  font-size: 0.72rem;
  color: var(--secondary-text);
}

.diary__entry-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.diary__entry-kcal {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-text);
  white-space: nowrap;
}

.diary__entry-delete {
  color: var(--secondary-text);
  opacity: 0.45;
  transition: opacity 150ms ease, color 150ms ease;
  padding: 0.15rem;
  margin: -0.15rem;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--error);
  }
}

.diary__entry-confirm-label {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--error);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diary__entry-confirm-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* ─── Entry confirm transition ────────────────────────────────────────────────── */

.entry-confirm-enter-active,
.entry-confirm-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.entry-confirm-enter-from,
.entry-confirm-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

/* ─── Empty meal state ────────────────────────────────────────────────────────── */

.diary__meal-empty {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--secondary-text);
  opacity: 0.55;
  font-style: italic;
}

/* ─── Water tracker ───────────────────────────────────────────────────────────── */

.diary__water {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.diary__water-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: calc(#{$spacing} * 0.6);
}

.diary__water-icon {
  color: #60a5fa;
  flex-shrink: 0;
}

.diary__water-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  flex: 1;
}

.diary__water-amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-text);
}

.diary__water-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-text);
  margin-left: 1px;
}

.diary__water-goal {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.diary__water-progress {
  height: 5px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: calc(#{$spacing} * 0.875);

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1) 200ms;
  }
}

.diary__water-chips {
  flex-wrap: wrap;
  gap: calc(#{$spacing} * 0.5);
}
</style>
