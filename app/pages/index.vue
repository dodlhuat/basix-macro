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
          <AppIcon name="local_fire_department" size="0.9rem" class="dashboard__streak-icon" />
          {{ streak }} {{ streak === 1 ? $t('dashboard.streakDay') : $t('dashboard.streakDays') }}
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
    <section class="dashboard__hero" :class="{ 'dashboard__hero--over': isOverGoal }" :aria-busy="isLoading">
      <template v-if="isLoading">
        <div class="dashboard__hero-body">
          <div class="dashboard__remaining">
            <span class="skeleton dashboard__skel-number" />
            <span class="skeleton-text dashboard__skel-label" />
          </div>
          <div class="dashboard__hero-stats">
            <span class="skeleton-text dashboard__skel-stat" />
            <span class="skeleton-text dashboard__skel-stat" />
          </div>
        </div>
        <div class="skeleton dashboard__skel-progress" />
      </template>

      <template v-else>
        <div class="dashboard__hero-body">
          <div class="dashboard__remaining">
            <span class="dashboard__remaining-number" :class="{ 'dashboard__remaining-number--over': isOverGoal }">
              {{ remainingCalories }}
            </span>
            <span class="dashboard__remaining-label">{{ $t('dashboard.remaining') }}</span>
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
            <template v-if="totalBurned > 0">
              <div class="dashboard__stat-sep" aria-hidden="true" />
              <NuxtLink to="/activity" class="dashboard__stat dashboard__stat--burned">
                <span class="dashboard__stat-value dashboard__stat-value--burned">{{ Math.round(totalBurned) }}</span>
                <span class="dashboard__stat-label">{{ $t('dashboard.burned') }}</span>
              </NuxtLink>
            </template>
          </div>
        </div>

        <div class="progress dashboard__hero-progress">
          <div
            class="progress-bar"
            :class="isOverGoal ? 'error' : 'accent'"
            :style="{ width: caloriePercent + '%' }"
            role="progressbar"
            :aria-valuenow="Math.round(totalCalories)"
            :aria-valuemax="effectiveCalorieGoal"
          />
          <div
            v-if="expectedCaloriePercent !== null"
            class="dashboard__pace-marker"
            :style="{ left: expectedCaloriePercent + '%' }"
            :aria-label="$t('dashboard.paceMarkerLabel', { n: expectedCalories })"
            role="img"
          />
        </div>

        <p v-if="paceStatus" class="dashboard__pace-caption">
          <AppIcon name="info" size="0.85rem" class="dashboard__pace-icon" />
          <span>
            {{
              paceStatus === 'on-track'
                ? $t('dashboard.paceOnTrack')
                : paceStatus === 'ahead'
                  ? $t('dashboard.paceAhead', { n: paceDeltaAbs })
                  : $t('dashboard.paceBehind', { n: paceDeltaAbs })
            }}
          </span>
        </p>
      </template>
    </section>

    <!-- Macro bars -->
    <section class="dashboard__macros" :aria-busy="isLoading">
      <template v-if="isLoading">
        <div v-for="n in 3" :key="n" class="dashboard__macro">
          <div class="dashboard__macro-header">
            <span class="skeleton dashboard__skel-dot" />
            <span class="skeleton-text dashboard__skel-macro-label" />
          </div>
          <div class="skeleton dashboard__skel-macro-bar" />
        </div>
      </template>

      <template v-else>
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
      </template>
    </section>

    <!-- Water tracker -->
    <section class="dashboard__water" :aria-busy="isLoading">
      <template v-if="isLoading">
        <div class="dashboard__water-header">
          <span class="skeleton dashboard__skel-dot" />
          <span class="skeleton-text dashboard__skel-water-title" />
        </div>
        <div class="skeleton dashboard__skel-progress" />
      </template>

      <template v-else>
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
      </template>
    </section>

    <!-- Meal sections -->
    <section class="dashboard__meals" :aria-busy="isLoading">
      <template v-if="isLoading">
        <div v-for="n in 4" :key="n" class="dashboard__meal">
          <span class="skeleton-text dashboard__skel-meal-label" />
          <div class="skeleton dashboard__skel-meal-entry" />
        </div>
      </template>

      <template v-else>
        <div
          v-for="meal in mealSections"
          :key="meal.type"
          class="dashboard__meal"
          :class="[
            `dashboard__meal--${meal.type}`,
            { 'dashboard__meal--current': meal.type === currentMealType },
          ]"
        >
          <div class="dashboard__meal-header">
            <span class="dashboard__meal-name">{{ meal.label }}</span>
            <span v-if="meal.type === currentMealType" class="dashboard__meal-now">
              {{ $t('dashboard.now') }}
            </span>
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
                    <span v-if="!entry.is_quick_add" class="dashboard__entry-amount">
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
      </template>
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
const activityStore = useActivityStore()
const { streak } = useStreak()
const { t, locale } = useI18n()

// ─── Date state ───────────────────────────────────────────────────────────────

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

// Exercise "earns" extra calories rather than reducing what's shown as
// consumed — totalCalories is displayed literally as "verbraucht" elsewhere,
// so subtracting burned calories from it would misrepresent that label.
// effectiveCalorieGoal is used only for the remaining/percent/over-goal math
// (and the pace baseline below) — the raw calorieGoal keeps showing as-is
// everywhere it's labelled "Ziel", so that number never silently shifts.
// On a day with no activity entries, totalBurned is 0 and this is a no-op.
const totalBurned = computed(() => activityStore.totalBurnedForDate(currentDate.value))
const effectiveCalorieGoal = computed(() => calorieGoal.value + totalBurned.value)

// Signed — negative once over goal (e.g. "-180"), replacing the old
// clamp-to-0 + separate red caption with a single headline number.
const remainingCalories = computed(() =>
  Math.round(effectiveCalorieGoal.value - totalCalories.value)
)
const caloriePercent = computed(() =>
  Math.min(100, (totalCalories.value / effectiveCalorieGoal.value) * 100)
)
const isOverGoal = computed(() => totalCalories.value > effectiveCalorieGoal.value)

// ─── Pace indicator ───────────────────────────────────────────────────────────
// Compares calories consumed so far against what a steady, evenly-paced day
// would predict "by this hour" — only meaningful while viewing today (a past
// day is already decided, a future one has no "now"). The eating window is a
// deliberately simple 07:00–22:00 model (covers breakfast through the tail
// end of snack hours) rather than assuming intake is spread across the full
// 24h clock.
const PACE_WINDOW_START_HOUR = 7
const PACE_WINDOW_END_HOUR = 22
const PACE_TOLERANCE_KCAL = 75 // inside this band from the expected value counts as "on track"

const expectedCaloriePercent = computed<number | null>(() => {
  if (!isToday.value) return null
  const now = new Date()
  const hourFraction = now.getHours() + now.getMinutes() / 60
  const span = PACE_WINDOW_END_HOUR - PACE_WINDOW_START_HOUR
  const progress = (hourFraction - PACE_WINDOW_START_HOUR) / span
  return Math.min(100, Math.max(0, progress * 100))
})

const expectedCalories = computed<number | null>(() =>
  expectedCaloriePercent.value === null
    ? null
    : Math.round((expectedCaloriePercent.value / 100) * effectiveCalorieGoal.value)
)

const paceDelta = computed<number | null>(() =>
  expectedCalories.value === null ? null : Math.round(totalCalories.value - expectedCalories.value)
)

const paceStatus = computed<'ahead' | 'behind' | 'on-track' | null>(() => {
  if (paceDelta.value === null) return null
  if (paceDelta.value > PACE_TOLERANCE_KCAL) return 'ahead'
  if (paceDelta.value < -PACE_TOLERANCE_KCAL) return 'behind'
  return 'on-track'
})

// Template-friendly non-null magnitude — `paceStatus` already guards the
// caption to only render once `paceDelta` is a real number.
const paceDeltaAbs = computed(() => Math.abs(paceDelta.value ?? 0))

// ─── Macros ───────────────────────────────────────────────────────────────────

// Colors read from the --macro-* custom properties (app/assets/scss/main.scss),
// which are themselves generated from the single canonical $macro-* SCSS vars
// in _variables.scss — no hex re-typed here.
const macros = computed(() => [
  {
    key: 'protein',
    label: t('common.protein'),
    current: totalProtein.value,
    goal: proteinGoal.value,
    color: 'var(--macro-protein)',
    percent: Math.min(100, (totalProtein.value / proteinGoal.value) * 100),
  },
  {
    key: 'carbs',
    label: t('common.carbs'),
    current: totalCarbs.value,
    goal: carbsGoal.value,
    color: 'var(--macro-carbs)',
    percent: Math.min(100, (totalCarbs.value / carbsGoal.value) * 100),
  },
  {
    key: 'fat',
    label: t('common.fat'),
    current: totalFat.value,
    goal: fatGoal.value,
    color: 'var(--macro-fat)',
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

// ─── Current / suggested meal (time-of-day heuristic) ─────────────────────────

function mealTypeForHour(h: number): string {
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 20) return 'dinner'
  return 'snack'
}

// The "current" meal by real-world clock time — only meaningful while
// viewing today. Drives both the meal-list highlight below and the FAB
// suggestion. On a past/future day there is no "now", so this is null.
const currentMealType = computed<string | null>(() =>
  isToday.value ? mealTypeForHour(new Date().getHours()) : null
)

function getMealSuggestion(): string {
  if (currentMealType.value) return currentMealType.value
  // Viewing a day that isn't today: real-world clock time tells us nothing
  // useful about that day, so suggest the first meal that has no entries yet.
  const firstEmpty = mealSections.value.find(m => m.entries.length === 0)
  return firstEmpty ? firstEmpty.type : 'snack'
}

function openFab() {
  navigateTo(`/diary/add?meal=${getMealSuggestion()}&date=${currentDate.value}`)
}

// ─── Load data ────────────────────────────────────────────────────────────────

const isLoading = ref(true)

async function loadDate(date: string) {
  isLoading.value = true
  await diaryStore.loadForDate(date)
  isLoading.value = false
}

onMounted(() => {
  loadDate(currentDate.value)
  activityStore.loadEntries()
})
watch(currentDate, date => loadDate(date))
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

// The overshoot (0% → 70% past-full-scale → 100% settle) is the textbook use
// case for Basix 1.5's $ease-spring — kept as a keyframe (rather than a plain
// transition) since the mid-point overshoot needs an explicit frame.
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

  .progress-bar,
  .skeleton,
  .skeleton-text {
    transition: none !important;
    animation: none !important;
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
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  background: var(--accent-color-tint);
  color: var(--accent-color);
  border-radius: var(--radius-full);
  pointer-events: none;
}

.dashboard__streak-icon {
  color: var(--accent-color);
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
  transition: opacity $duration-base $ease-standard, transform $duration-base $ease-standard;
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
  animation: fadeSlideUp 500ms $ease-out-soft both;

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
  transition: color $duration-base $ease-standard;

  // Over goal: the number itself goes negative and red (e.g. "-180") instead
  // of clamping to 0 with a separate caption below — one signed headline
  // number reads faster than two disjoint pieces of text.
  &--over {
    color: var(--error);
  }
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
  // Calorie identity color — distinct from the giant remaining-number above,
  // which intentionally stays --primary-text/--error so its over-goal alarm
  // transition (see .dashboard__remaining-number--over) reads unambiguously.
  color: var(--macro-calories);
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

// Burned-calories tile links to /activity — reads as a "credit" rather than
// intake, so it deliberately breaks from the shared --macro-calories orange
// used by consumed/goal above (that hue already means "intake" on this
// page) and uses --success instead, matching the app's existing "down/back
// is good" polarity (see weight/body-fat delta badges).
.dashboard__stat--burned {
  text-decoration: none;
  cursor: pointer;
  transition: opacity 150ms ease;

  &:hover,
  &:focus-visible {
    opacity: 0.75;
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
}

.dashboard__stat-value--burned {
  color: var(--success);
}

.dashboard__hero-progress {
  position: relative; // anchors the pace marker below
  height: 6px;
  border-radius: var(--radius-full);
  // Basix's own `.progress` sets `overflow: hidden` — explicitly override it
  // here (higher specificity via the scoped attribute wins) so the pace
  // marker can ride slightly above the bar instead of being clipped.
  overflow: visible;

  .progress-bar {
    border-radius: var(--radius-full);
    overflow: hidden;
    transition: width 700ms $ease-out-soft;
  }
}

// A thin vertical tick showing where calorie intake "should" be by this
// point in the day (see the pace computeds in <script>), so the remaining
// number reads as on-track/ahead/behind rather than a flat total. Only
// rendered for today — see `expectedCaloriePercent`.
.dashboard__pace-marker {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 12px;
  margin-left: -1px;
  background: var(--primary-text);
  opacity: 0.45;
  border-radius: var(--radius-full);
  pointer-events: none;
}

// Deliberately low-key: this is a descriptive comparison against an artificial
// even-pace model (eat lunch late and you'll always look "behind" in the
// morning, even landing exactly on goal by day's end), never a judgment —
// so no warning/success colour-coding, no bold weight. The `info` icon does
// the "this is just an FYI" work instead of a red/amber tone. Same treatment
// regardless of ahead/behind/on-track so the visual never implies good vs. bad.
.dashboard__pace-caption {
  display: flex;
  align-items: flex-start; // text can wrap to 2 lines at narrow widths — keep
  // the icon pinned to the first line's cap-height instead of drifting to
  // the vertical centre of the whole block.
  gap: 0.35rem;
  margin-top: calc(#{$spacing} * 0.5);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  color: var(--secondary-text);
}

.dashboard__pace-icon {
  flex-shrink: 0;
  margin-top: 0.15rem; // optical alignment with the first line of text
  color: var(--accent-color);
  opacity: 0.8;
}

// ─── Macro bars ───────────────────────────────────────────────────────────────

.dashboard__macros {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: $spacing calc(#{$spacing} * 1.25);
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.9);
  animation: fadeSlideUp 500ms $ease-out-soft 80ms both;
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
    transition: width 700ms $ease-out-soft 100ms;
    border-radius: var(--radius-full);
  }
}

// ─── Water tracker ────────────────────────────────────────────────────────────
// Plain panel matching .dashboard__macros — was the one boxy `.card
// .card-bordered` leftover on an otherwise card-grid-free dashboard.

.dashboard__water {
  background: var(--primary-bg);
  border-radius: var(--radius-xl);
  padding: $spacing calc(#{$spacing} * 1.25);
  animation: fadeSlideUp 500ms $ease-out-soft 160ms both;
}

.dashboard__water-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: calc(#{$spacing} * 0.6);
}

.dashboard__water-icon {
  color: var(--water-color);
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
    transition: width 700ms $ease-out-soft 200ms;
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
  animation: fadeSlideUp 500ms $ease-out-soft 240ms both;
}

.dashboard__meal {
  background: var(--primary-bg);
  padding: calc(#{$spacing} * 0.875) calc(#{$spacing} * 1.125);
  transition: background-color $duration-base $ease-standard;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }

  // Meal type accent — left border strip
  border-left: 3px solid transparent;

  &--breakfast { border-left-color: var(--meal-breakfast); }
  &--lunch     { border-left-color: var(--meal-lunch); }
  &--dinner    { border-left-color: var(--meal-dinner); }
  &--snack     { border-left-color: var(--meal-snack); }

  // Today's active meal (by time-of-day, see `currentMealType`) — a subtle
  // accent wash rather than a loud badge, so it reads at a glance without
  // competing with the entries themselves.
  &--current {
    background: var(--accent-color-tint);
  }
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

.dashboard__meal-now {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-color);
  background: var(--primary-bg);
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-full);
  padding: 0.1rem 0.45rem;
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
  transition: transform $duration-base $ease-standard;

  &:hover,
  &:focus-visible {
    transform: scale(1.15);
  }
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
  transition: opacity $duration-fast $ease-standard, color $duration-fast $ease-standard;
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
  transition: opacity $duration-fast $ease-standard, color $duration-fast $ease-standard;
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
  transition: opacity $duration-fast $ease-standard, transform $duration-fast $ease-standard;
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
  animation: fabPop 400ms $ease-spring 350ms both;
  transition: transform $duration-base $ease-standard, box-shadow $duration-base $ease-standard;
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

// ─── Skeleton loading state ────────────────────────────────────────────────
// Shown while `diaryStore.loadForDate()` is in flight (initial mount and any
// date change), sized to roughly match each section's real content so
// nothing visibly jumps once the data lands. Uses Basix's `.skeleton` /
// `.skeleton-text` shimmer classes (progress.scss) — only the width/height
// per placeholder is custom.

.dashboard__skel-number {
  width: 60%;
  height: clamp(2.6rem, 12vw, 3.5rem);
  border-radius: var(--radius-md);
}

.dashboard__skel-label {
  width: 40%;
  margin-top: 0.4rem;
}

.dashboard__skel-stat {
  width: 3rem;
}

.dashboard__skel-progress {
  width: 100%;
  height: 6px;
  margin-top: calc(#{$spacing} * 0.875);
}

.dashboard__skel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dashboard__skel-macro-label {
  width: 45%;
}

.dashboard__skel-macro-bar {
  width: 100%;
  height: 5px;
  margin-top: 0.35rem;
}

.dashboard__skel-water-title {
  width: 35%;
}

.dashboard__skel-meal-label {
  display: block;
  width: 30%;
  height: 0.7rem;
  margin-bottom: 0.6rem;
}

.dashboard__skel-meal-entry {
  width: 100%;
  height: 2rem;
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
