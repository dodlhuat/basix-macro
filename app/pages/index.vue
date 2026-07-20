<template>
  <div class="dashboard page-content">

    <!-- Date navigation -->
    <nav class="dashboard__date-nav" :aria-label="$t('dashboard.dateNav')">
      <button
        class="button button-icon dashboard__date-btn"
        :aria-label="$t('dashboard.prevDay')"
        @click="prevDay"
      >
        <AppIcon name="chevron_left" />
      </button>

      <div class="dashboard__date-center">
        <span class="dashboard__date-label">{{ formattedDate }}</span>
        <span v-if="streak > 0" class="chip dashboard__streak-chip">
          🔥 {{ streak }} {{ streak === 1 ? $t('dashboard.streakDay') : $t('dashboard.streakDays') }}
        </span>
      </div>

      <button
        class="button button-icon dashboard__date-btn"
        :aria-label="$t('dashboard.nextDay')"
        :disabled="isToday"
        @click="nextDay"
      >
        <AppIcon name="chevron_right" />
      </button>

      <Transition name="heute-fade">
        <button
          v-if="!isToday"
          class="chip clickable dashboard__heute-chip"
          @click="goToToday"
        >
          {{ $t('common.today') }}
        </button>
      </Transition>
    </nav>

    <!-- Calorie hero -->
    <section class="dashboard__hero" :class="{ 'dashboard__hero--over': isOverGoal }">
      <div class="dashboard__hero-body">
        <div class="dashboard__remaining">
          <span class="dashboard__remaining-number">
            {{ isOverGoal ? 0 : remainingCalories }}
          </span>
          <span class="dashboard__remaining-label">
            {{ isOverGoal ? $t('dashboard.overGoal') : $t('dashboard.remaining') }}
          </span>
        </div>

        <div class="dashboard__hero-stats">
          <div class="dashboard__stat">
            <span class="dashboard__stat-value">{{ Math.round(totalCalories) }}</span>
            <span class="dashboard__stat-label">{{ $t('dashboard.consumed') }}</span>
          </div>
          <div class="dashboard__stat-sep" aria-hidden="true" />
          <div class="dashboard__stat">
            <span class="dashboard__stat-value">{{ calorieGoal }}</span>
            <span class="dashboard__stat-label">{{ $t('dashboard.goal') }}</span>
          </div>
        </div>
      </div>

      <div class="progress dashboard__hero-progress">
        <div
          class="progress-bar"
          :class="isOverGoal ? 'error' : 'accent'"
          :style="{ width: caloriePercent + '%' }"
          role="progressbar"
          :aria-valuenow="Math.round(totalCalories)"
          :aria-valuemax="calorieGoal"
        />
      </div>

      <p v-if="isOverGoal" class="dashboard__over-label">
        {{ $t('dashboard.overGoalLabel', { n: Math.round(totalCalories - calorieGoal) }) }}
      </p>
    </section>

    <!-- Macro bars -->
    <section class="dashboard__macros">
      <div
        v-for="macro in macros"
        :key="macro.key"
        class="dashboard__macro"
      >
        <div class="dashboard__macro-header">
          <span class="dashboard__macro-dot" :style="{ backgroundColor: macro.color }" aria-hidden="true" />
          <span class="dashboard__macro-label">{{ macro.label }}</span>
          <span class="dashboard__macro-value">
            {{ Math.round(macro.current) }}<span class="dashboard__macro-unit">g</span>
            <span class="dashboard__macro-goal">/ {{ macro.goal }}g</span>
          </span>
        </div>
        <div class="progress dashboard__macro-bar">
          <div
            class="progress-bar"
            :style="{ width: macro.percent + '%', backgroundColor: macro.color }"
            role="progressbar"
            :aria-valuenow="Math.round(macro.current)"
            :aria-valuemax="macro.goal"
          />
        </div>
      </div>
    </section>

    <!-- Water tracker -->
    <section class="dashboard__water card card-bordered">
      <div class="dashboard__water-header">
        <AppIcon name="water_drop" class="dashboard__water-icon" />
        <span class="dashboard__water-title">{{ $t('dashboard.water') }}</span>
        <span class="dashboard__water-amount">
          {{ totalWater }}<span class="dashboard__water-unit">ml</span>
        </span>
        <span class="dashboard__water-goal">/ {{ WATER_GOAL }} ml</span>
      </div>
      <div class="progress dashboard__water-progress">
        <div
          class="progress-bar accent"
          :style="{ width: waterPercent + '%' }"
          role="progressbar"
          :aria-valuenow="totalWater"
          :aria-valuemax="WATER_GOAL"
        />
      </div>
      <div class="dashboard__water-actions">
        <button
          class="button button-outline button-sm dashboard__water-btn"
          aria-label="250 ml Wasser hinzufügen"
          @click="addWaterAmount(250)"
        >
          +250 ml
        </button>
        <button
          class="button button-outline button-sm dashboard__water-btn"
          aria-label="500 ml Wasser hinzufügen"
          @click="addWaterAmount(500)"
        >
          +500 ml
        </button>
        <button
          class="button button-outline button-sm dashboard__water-btn"
          aria-label="1 Liter Wasser hinzufügen"
          @click="addWaterAmount(1000)"
        >
          +1 L
        </button>
      </div>
    </section>

    <!-- Meal sections -->
    <section class="dashboard__meals">
      <div
        v-for="meal in mealSections"
        :key="meal.type"
        class="dashboard__meal"
        :class="`dashboard__meal--${meal.type}`"
      >
        <div class="dashboard__meal-header">
          <span class="dashboard__meal-name">{{ meal.label }}</span>
          <span
            v-if="meal.entries.length"
            class="dashboard__meal-kcal"
          >
            {{ Math.round(meal.totalKcal) }} kcal
          </span>
          <button
            class="button button-icon button-sm dashboard__meal-add"
            :aria-label="`${meal.label} Eintrag hinzufügen`"
            @click="addEntry(meal.type)"
          >
            <AppIcon name="add" />
          </button>
        </div>

        <ul v-if="meal.entries.length" class="dashboard__entries" role="list">
          <li
            v-for="entry in meal.entries"
            :key="entry.id"
            class="dashboard__entry"
            :class="{ 'dashboard__entry--editing': editingEntryId === entry.id }"
          >
            <Transition name="entry-edit" mode="out-in">
              <div
                v-if="editingEntryId !== entry.id"
                key="normal"
                class="dashboard__entry-row"
              >
                <div class="dashboard__entry-info">
                  <span class="dashboard__entry-name">{{ entry.food_item_name }}</span>
                  <span class="dashboard__entry-amount">
                    {{ isRecipeEntry(entry) ? `${entry.servings} ${$t('diary.sheet.portion')}` : `${entry.amount_g} g` }}
                  </span>
                </div>
                <div class="dashboard__entry-right">
                  <span class="dashboard__entry-kcal">{{ Math.round(entry.calories_total) }} kcal</span>
                  <button
                    class="button button-icon button-sm dashboard__entry-edit-toggle"
                    :aria-label="$t('dashboard.editEntry', { name: entry.food_item_name })"
                    @click="startEdit(entry)"
                  >
                    <AppIcon name="edit" size="1rem" />
                  </button>
                  <button
                    class="button button-icon button-sm dashboard__entry-delete"
                    :aria-label="`${entry.food_item_name} löschen`"
                    @click="removeEntry(entry.id)"
                  >
                    <AppIcon name="delete" size="1rem" />
                  </button>
                </div>
              </div>

              <div
                v-else
                key="edit"
                class="dashboard__entry-edit-row"
              >
                <div class="dashboard__entry-edit-top">
                  <span class="dashboard__entry-edit-label">
                    {{ isRecipeEntry(entry) ? $t('diary.sheet.servings') : $t('diary.sheet.amount') }}
                  </span>
                  <div class="dashboard__entry-edit-stepper">
                    <button
                      class="button button-outline dashboard__entry-edit-step-btn"
                      :disabled="editQuantity - stepFor(entry) < 1"
                      :aria-label="$t('diary.sheet.decrease')"
                      @click="adjustEditQuantity(entry, -stepFor(entry))"
                    >
                      <AppIcon name="remove" size="1rem" />
                    </button>
                    <div class="form-group dashboard__entry-edit-group">
                      <div class="input-group">
                        <input
                          v-model.number="editQuantity"
                          type="number"
                          min="1"
                          :max="maxFor(entry)"
                          step="1"
                          :aria-label="isRecipeEntry(entry) ? $t('diary.sheet.servings') : $t('diary.sheet.amount')"
                          class="dashboard__entry-edit-input"
                        >
                        <span class="dashboard__entry-edit-unit">
                          {{ isRecipeEntry(entry) ? $t('diary.sheet.portion') : 'g' }}
                        </span>
                      </div>
                    </div>
                    <button
                      class="button button-outline dashboard__entry-edit-step-btn"
                      :disabled="editQuantity + stepFor(entry) > maxFor(entry)"
                      :aria-label="$t('diary.sheet.increase')"
                      @click="adjustEditQuantity(entry, stepFor(entry))"
                    >
                      <AppIcon name="add" size="1rem" />
                    </button>
                  </div>
                </div>
                <div class="dashboard__entry-edit-actions">
                  <button
                    class="button button-sm button-primary"
                    :disabled="!isEditQuantityValid"
                    @click="saveEdit(entry.id)"
                  >
                    {{ $t('common.save') }}
                  </button>
                  <button class="button button-sm button-outline" @click="cancelEdit">
                    {{ $t('common.cancel') }}
                  </button>
                </div>
              </div>
            </Transition>
          </li>
        </ul>

        <p v-else class="dashboard__meal-empty">{{ $t('dashboard.emptyEntry') }}</p>
      </div>
    </section>

  </div>

  <!-- FAB -->
  <Teleport to="body">
    <button
      class="dashboard__fab"
      :aria-label="$t('dashboard.addEntry')"
      @click="openFab"
    >
      <AppIcon name="add" size="1.5rem" />
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import type { DiaryEntryWithName } from '~/stores/diary'

definePageMeta({ title: 'Dashboard' })

const diaryStore = useDiaryStore()
const userStore = useUserStore()
const { streak } = useStreak()
const { t, locale } = useI18n()

// ─── Date state ───────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const currentDate = ref<string>(toLocalDateStr(new Date()))

const isToday = computed(() =>
  currentDate.value === toLocalDateStr(new Date())
)

function toDateStr(d: Date): string {
  return toLocalDateStr(d)
}

const formattedDate = computed(() => {
  const loc = locale.value === 'en' ? 'en-US' : 'de-DE'
  const d = new Date(currentDate.value + 'T00:00:00')
  const weekday = d.toLocaleDateString(loc, { weekday: 'short' })
  const day = d.getDate()
  const month = d.toLocaleDateString(loc, { month: 'long' })
  return locale.value === 'en' ? `${weekday} ${month} ${day}` : `${weekday} ${day}. ${month}`
})

function prevDay() {
  const d = new Date(currentDate.value + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  currentDate.value = toDateStr(d)
}

function nextDay() {
  const d = new Date(currentDate.value + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  currentDate.value = toDateStr(d)
}

function goToToday() {
  currentDate.value = toLocalDateStr(new Date())
}

// ─── Store data ───────────────────────────────────────────────────────────────

const { totalCalories, totalProtein, totalCarbs, totalFat, totalWater, entryDetails } =
  storeToRefs(diaryStore)

// ─── Goals ────────────────────────────────────────────────────────────────────

const calorieGoal = computed(() => userStore.user?.calorie_goal ?? 2000)
const proteinGoal = computed(() => userStore.user?.protein_goal_g ?? 150)
const carbsGoal   = computed(() => userStore.user?.carbs_goal_g ?? 250)
const fatGoal     = computed(() => userStore.user?.fat_goal_g ?? 65)
const WATER_GOAL  = 2000

// ─── Calorie hero ─────────────────────────────────────────────────────────────

const remainingCalories = computed(() =>
  Math.max(0, calorieGoal.value - Math.round(totalCalories.value))
)
const caloriePercent = computed(() =>
  Math.min(100, (totalCalories.value / calorieGoal.value) * 100)
)
const isOverGoal = computed(() => totalCalories.value > calorieGoal.value)

// ─── Macros ───────────────────────────────────────────────────────────────────

const macros = computed(() => [
  {
    key: 'protein',
    label: t('common.protein'),
    current: totalProtein.value,
    goal: proteinGoal.value,
    color: '#ef4444',
    percent: Math.min(100, (totalProtein.value / proteinGoal.value) * 100),
  },
  {
    key: 'carbs',
    label: t('common.carbs'),
    current: totalCarbs.value,
    goal: carbsGoal.value,
    color: '#3b82f6',
    percent: Math.min(100, (totalCarbs.value / carbsGoal.value) * 100),
  },
  {
    key: 'fat',
    label: t('common.fat'),
    current: totalFat.value,
    goal: fatGoal.value,
    color: '#f59e0b',
    percent: Math.min(100, (totalFat.value / fatGoal.value) * 100),
  },
])

// ─── Water ────────────────────────────────────────────────────────────────────

const waterPercent = computed(() =>
  Math.min(100, (totalWater.value / WATER_GOAL) * 100)
)

async function addWaterAmount(amount: number) {
  await diaryStore.addWater(amount, currentDate.value)
}

// ─── Meal sections ────────────────────────────────────────────────────────────

const mealSections = computed(() => {
  const MEALS = [
    { type: 'breakfast' as const, label: t('meal.breakfast') },
    { type: 'lunch'     as const, label: t('meal.lunch') },
    { type: 'dinner'    as const, label: t('meal.dinner') },
    { type: 'snack'     as const, label: t('meal.snack') },
  ]
  return MEALS.map(m => {
    const entries = entryDetails.value.filter(e => e.meal_type === m.type)
    return {
      ...m,
      entries,
      totalKcal: entries.reduce((s, e) => s + e.calories_total, 0),
    }
  })
})

function addEntry(mealType: string) {
  navigateTo(`/diary/add?meal=${mealType}&date=${currentDate.value}`)
}

async function removeEntry(id: string) {
  await diaryStore.deleteEntry(id)
}

// ─── Inline quantity edit ──────────────────────────────────────────────────────

const editingEntryId = ref<string | null>(null)
const editQuantity = ref<number>(0)

function isRecipeEntry(entry: DiaryEntryWithName): boolean {
  return !!entry.recipe_id
}

function stepFor(entry: DiaryEntryWithName): number {
  return isRecipeEntry(entry) ? 1 : 10
}

function maxFor(entry: DiaryEntryWithName): number {
  return isRecipeEntry(entry) ? 99 : 9999
}

function startEdit(entry: DiaryEntryWithName): void {
  editingEntryId.value = entry.id
  editQuantity.value = isRecipeEntry(entry) ? entry.servings : entry.amount_g
}

function cancelEdit(): void {
  editingEntryId.value = null
}

function adjustEditQuantity(entry: DiaryEntryWithName, delta: number): void {
  editQuantity.value = Math.min(
    maxFor(entry),
    Math.max(1, editQuantity.value + delta)
  )
}

const isEditQuantityValid = computed(() =>
  Number.isFinite(editQuantity.value) && editQuantity.value > 0
)

async function saveEdit(id: string): Promise<void> {
  if (!isEditQuantityValid.value) return
  await diaryStore.updateEntryQuantity(id, editQuantity.value)
  editingEntryId.value = null
}

// ─── FAB — time-based meal suggestion ─────────────────────────────────────────

function getMealSuggestion(): string {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 20) return 'dinner'
  return 'snack'
}

function openFab() {
  navigateTo(`/diary/add?meal=${getMealSuggestion()}&date=${currentDate.value}`)
}

// ─── Load data ────────────────────────────────────────────────────────────────

onMounted(() => diaryStore.loadForDate(currentDate.value))
watch(currentDate, date => diaryStore.loadForDate(date))
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

@keyframes fabPop {
  0%   { opacity: 0; transform: scale(0.6); }
  70%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard__hero,
  .dashboard__macros,
  .dashboard__water,
  .dashboard__meals,
  .dashboard__fab {
    animation: none !important;
  }

  .progress-bar {
    transition: none !important;
  }

  .dashboard__entry-row,
  .dashboard__entry-edit-row {
    transition: none !important;
  }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.dashboard {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 4 + 3.5rem); // room for FAB
}

// ─── Date nav ─────────────────────────────────────────────────────────────────

.dashboard__date-nav {
  display: flex;
  align-items: center;
  gap: $spacing * 0.25;
}

.dashboard__date-btn {
  flex-shrink: 0;
}

.dashboard__date-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.dashboard__date-label {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: -0.01em;
  color: var(--primary-text);
}

.dashboard__streak-chip {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  background: var(--accent-color-tint);
  color: var(--accent-color);
  border-radius: var(--radius-full);
  pointer-events: none;
}

.dashboard__heute-chip {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

// ─── Today chip transition ─────────────────────────────────────────────────────

.heute-fade-enter-active,
.heute-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.heute-fade-enter-from,
.heute-fade-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

// ─── Hero section ─────────────────────────────────────────────────────────────

.dashboard__hero {
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

.dashboard__hero-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing;
  margin-bottom: calc(#{$spacing} * 0.875);
}

.dashboard__remaining {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dashboard__remaining-number {
  font-size: clamp(2.6rem, 12vw, 3.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--primary-text);
}

.dashboard__remaining-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dashboard__hero-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  padding-top: 0.4rem;
  flex-shrink: 0;
}

.dashboard__stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.dashboard__stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--primary-text);
}

.dashboard__stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dashboard__stat-sep {
  width: 1.5rem;
  height: 1px;
  background: var(--divider);
  align-self: flex-end;
}

.dashboard__hero-progress {
  height: 6px;
  border-radius: var(--radius-full);
  overflow: hidden;

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.dashboard__over-label {
  margin-top: calc(#{$spacing} * 0.5);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--error);
  text-align: right;
}

// ─── Macro bars ───────────────────────────────────────────────────────────────

.dashboard__macros {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: $spacing calc(#{$spacing} * 1.25);
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.9);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.dashboard__macro {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dashboard__macro-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard__macro-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dashboard__macro-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-text);
  flex: 1;
}

.dashboard__macro-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.01em;
}

.dashboard__macro-unit {
  font-weight: 500;
  color: var(--secondary-text);
}

.dashboard__macro-goal {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.dashboard__macro-bar {
  height: 5px;
  border-radius: var(--radius-full);
  overflow: hidden;

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1) 100ms;
    border-radius: var(--radius-full);
  }
}

// ─── Water tracker ────────────────────────────────────────────────────────────

.dashboard__water {
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
}

.dashboard__water-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: calc(#{$spacing} * 0.6);
}

.dashboard__water-icon {
  color: #60a5fa;
  flex-shrink: 0;
}

.dashboard__water-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  flex: 1;
}

.dashboard__water-amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-text);
}

.dashboard__water-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-text);
  margin-left: 1px;
}

.dashboard__water-goal {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.dashboard__water-progress {
  height: 5px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: calc(#{$spacing} * 0.875);

  .progress-bar {
    transition: width 700ms cubic-bezier(0.25, 1, 0.5, 1) 200ms;
  }
}

.dashboard__water-actions {
  display: flex;
  gap: calc(#{$spacing} * 0.5);
}

.dashboard__water-btn {
  flex: 1;
  font-weight: 600;
  font-size: 0.8rem;
}

// ─── Meal sections ────────────────────────────────────────────────────────────

.dashboard__meals {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--divider);
  animation: fadeSlideUp 500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.dashboard__meal {
  background: var(--primary-bg);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.125);

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }

  // Meal type accent — left border strip
  border-left: 3px solid transparent;

  &--breakfast { border-left-color: #f59e0b; }
  &--lunch     { border-left-color: #22c55e; }
  &--dinner    { border-left-color: #3b82f6; }
  &--snack     { border-left-color: #a855f7; }
}

.dashboard__meal-header {
  display: flex;
  align-items: center;
  gap: $spacing * 0.5;
  min-height: 2rem;
}

.dashboard__meal-name {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  flex: 1;
}

.dashboard__meal-kcal {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-text);
}

.dashboard__meal-add {
  color: var(--accent-color);
  margin: -0.25rem;
  flex-shrink: 0;

  &:hover,
  &:focus-visible {
    transform: scale(1.15);
  }
  transition: transform 200ms ease;
}

// ─── Meal entries ─────────────────────────────────────────────────────────────

.dashboard__entries {
  list-style: none;
  padding: 0;
  margin: 0.4rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dashboard__entry {
  border-top: 1px solid var(--divider);
  overflow: hidden;

  &:first-child { border-top: none; }

  &--editing {
    border-top-color: transparent;
    border-radius: $border-radius;
    margin: 0.15rem 0;
  }
}

.dashboard__entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing;
  padding: 0.4rem 0;
}

.dashboard__entry-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.dashboard__entry-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard__entry-amount {
  font-size: 0.75rem;
  color: var(--secondary-text);
}

.dashboard__entry-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.dashboard__entry-kcal {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-text);
  white-space: nowrap;
}

.dashboard__entry-edit-toggle {
  color: var(--secondary-text);
  opacity: 0.5;
  transition: opacity 150ms ease, color 150ms ease;
  padding: 0.15rem;
  margin: -0.15rem;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--accent-color);
  }
}

.dashboard__entry-delete {
  color: var(--secondary-text);
  opacity: 0.5;
  transition: opacity 150ms ease, color 150ms ease;
  padding: 0.15rem;
  margin: -0.15rem;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--error);
  }
}

// ─── Inline quantity edit row ──────────────────────────────────────────────────

.dashboard__entry-edit-row {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.6rem 0.7rem;
  background: var(--accent-color-tint);
  border-radius: $border-radius;
}

.dashboard__entry-edit-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dashboard__entry-edit-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
  flex-shrink: 0;
}

.dashboard__entry-edit-stepper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.dashboard__entry-edit-step-btn {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard__entry-edit-group {
  flex: 1;
  min-width: 0;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.dashboard__entry-edit-input {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.dashboard__entry-edit-unit {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.dashboard__entry-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

// ─── Entry row transition (delete ↔ edit swap) ─────────────────────────────────

.entry-edit-enter-active,
.entry-edit-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.entry-edit-enter-from,
.entry-edit-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.dashboard__meal-empty {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--secondary-text);
  opacity: 0.6;
  font-style: italic;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

.dashboard__fab {
  position: fixed;
  right: 1.25rem;
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--accent-color-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.18),
    0 1px 4px rgba(0, 0, 0, 0.12);
  animation: fabPop 400ms cubic-bezier(0.22, 1, 0.36, 1) 350ms both;
  transition: transform 200ms ease, box-shadow 200ms ease;
  z-index: 50;

  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, var(--accent-color) 85%, black);
    color: var(--accent-color-text);
    transform: scale(1.08);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.22),
      0 2px 6px rgba(0, 0, 0, 0.14);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 3px;
  }
}

// ─── Desktop: asymmetric 2-column grid ─────────────────────────────────────
// The stacked mobile order (date nav → hero → macros → water → meals) is a
// poor fit for a wide viewport — it leaves the page reading as one long,
// oddly-wide column. Instead: a wide primary column (today's calories +
// meals, the two things you actually scan first) and a narrower "at a
// glance" rail (macros + water) beside it. `.dashboard.page-content` beats
// the shared `.page-content` max-width via scoped-attribute specificity.
// Placed at the end of the stylesheet so it reliably wins the cascade over
// any of the unconditional per-section rules above.
@media (min-width: $breakpoint-desktop) {
  .dashboard {
    max-width: 1080px;
    display: grid;
    grid-template-columns: 1.7fr 1fr;
    grid-template-areas:
      "nav    nav"
      "hero   macros"
      "water  macros"
      "meals  meals";
    align-items: start;
    gap: calc(#{$spacing} * 1.25);
  }

  .dashboard__date-nav { grid-area: nav; }
  .dashboard__hero     { grid-area: hero; }
  .dashboard__macros   { grid-area: macros; height: 100%; }
  .dashboard__water    { grid-area: water; }
  .dashboard__meals    { grid-area: meals; }
}
</style>
