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
            class="badge badge-info diary__today-badge"
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
            <div class="diary__activity-value-row">
              <span class="diary__stat-value diary__activity-burned-value">{{ Math.round(totalBurned) }}</span>
              <button
                type="button"
                class="diary__activity-add"
                :aria-label="$t('activity.addEntry')"
                @click="openActivitySheet"
              >
                <AppIcon name="add" size="1rem" />
              </button>
            </div>
            <span class="diary__stat-label">{{ $t('dashboard.consumed') }}</span>
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
          :aria-valuemax="effectiveCalorieGoal"
          aria-label="Kalorienfortschritt"
        />
      </div>

      <p v-if="isOverGoal" class="diary__over-label">
        + {{ Math.round(totalCalories - effectiveCalorieGoal) }} kcal über dem Ziel
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
        data-meal
        :class="[`diary__meal--${meal.type}`, { 'diary__meal--pasted': pastedMeal === meal.type }]"
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
          <MealMenu
            :label="meal.label"
            :can-copy="meal.entries.length > 0"
            :can-save-recipe="meal.entries.length > 0"
            :is-source="isSource(meal.type)"
            @copy="copy(meal.entries, meal.type)"
            @save-recipe="openSaveRecipeSheet(meal)"
            @discard="clipboard.clear()"
          />
          <button
            class="button button-icon button-sm diary__meal-add"
            data-meal-focus
            :aria-label="`${meal.label} – Eintrag hinzufügen`"
            @click="addEntry(meal.type)"
          >
            <AppIcon name="add" size="1.25rem" />
          </button>
        </div>
        <MealPasteBar :label="meal.label" :busy="pastingMeal !== null" @paste="paste(meal.type)" />

        <ul v-if="meal.entries.length" class="diary__entries" role="list">
          <MealEntryRow
            v-for="entry in meal.entries"
            :key="entry.id"
            :entry="entry"
            :date="date"
            :editing="editingEntryId === entry.id"
            @open="editingEntryId = entry.id"
            @close="editingEntryId = null"
          />
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

  <MealUndoBar :date="date" />

  <!-- Save-meal-as-recipe bottom sheet -->
  <Teleport to="body">
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': saveRecipeSheetVisible }"
      :aria-hidden="!saveRecipeSheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeSaveRecipeSheet" />
      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('diary.diaryPage.saveAsRecipe')"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />
        <div class="bottom-sheet-header has-divider">
          <p class="title">{{ $t('diary.diaryPage.saveAsRecipe') }}</p>
          <button class="close button button-icon" :aria-label="$t('common.close')" @click="closeSaveRecipeSheet">
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>
        <div class="bottom-sheet-body">
          <div class="form-group">
            <label for="recipe-name">{{ $t('diary.diaryPage.saveAsRecipeName') }}</label>
            <div class="input-group">
              <input
                id="recipe-name"
                v-model.trim="newRecipeName"
                type="text"
                enterkeyhint="done"
                maxlength="100"
                :disabled="isSavingRecipe"
              >
            </div>
          </div>
        </div>
        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" :disabled="isSavingRecipe" @click="closeSaveRecipeSheet">{{ $t('common.cancel') }}</button>
            <button
              class="button button-primary"
              :disabled="isSavingRecipe || !newRecipeName.trim()"
              @click="handleSaveAsRecipe"
            >
              <span v-if="isSavingRecipe" class="loading" />
              <template v-else>
                <AppIcon name="check" size="1rem" />
                {{ $t('common.save') }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Quick-add activity bottom sheet -->
  <Teleport to="body">
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': activitySheetVisible }"
      :aria-hidden="!activitySheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeActivitySheet" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('activity.addEntry')"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <div class="act-sheet__title-group">
            <p class="title">{{ $t('activity.addEntry') }}</p>
            <p class="subtitle">{{ formattedDayMonth }}</p>
          </div>
          <button
            class="close button button-icon"
            :aria-label="$t('common.close')"
            @click="closeActivitySheet"
          >
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">

          <div class="act-sheet__section">
            <label class="act-sheet__section-label" for="diary-act-sheet-name">
              {{ $t('activity.nameLabel') }}
            </label>
            <div class="form-group act-sheet__field-group">
              <div class="input-group">
                <input
                  id="diary-act-sheet-name"
                  v-model="activityName"
                  type="text"
                  enterkeyhint="next"
                  :placeholder="$t('activity.namePlaceholder')"
                  :aria-label="$t('activity.nameLabel')"
                  maxlength="60"
                  autofocus
                >
              </div>
            </div>
          </div>

          <div class="act-sheet__row">
            <div class="act-sheet__section act-sheet__field">
              <label class="act-sheet__section-label" for="diary-act-sheet-calories">
                {{ $t('activity.caloriesLabel') }}
              </label>
              <div class="form-group act-sheet__field-group">
                <div class="input-group">
                  <input
                    id="diary-act-sheet-calories"
                    v-model="activityCaloriesStr"
                    type="number"
                    enterkeyhint="next"
                    inputmode="numeric"
                    min="1"
                    step="1"
                    placeholder="300"
                    :aria-label="$t('activity.caloriesLabel')"
                    class="act-sheet__num-input"
                  >
                  <span class="act-sheet__input-unit">kcal</span>
                </div>
              </div>
            </div>
            <div class="act-sheet__section act-sheet__field">
              <label class="act-sheet__section-label" for="diary-act-sheet-duration">
                {{ $t('activity.durationLabel') }}
                <span class="act-sheet__optional">({{ $t('common.optional') }})</span>
              </label>
              <div class="form-group act-sheet__field-group">
                <div class="input-group">
                  <input
                    id="diary-act-sheet-duration"
                    v-model="activityDurationStr"
                    type="number"
                    enterkeyhint="done"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    placeholder="30"
                    :aria-label="$t('activity.durationLabel')"
                    class="act-sheet__num-input"
                  >
                  <span class="act-sheet__input-unit">min</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" @click="closeActivitySheet">{{ $t('common.cancel') }}</button>
            <button
              class="button button-primary"
              :disabled="!isActivityFormValid || isAddingActivity"
              @click="handleAddActivity"
            >
              <span v-if="isAddingActivity" class="loading" />
              <template v-else>
                <AppIcon name="check" size="1rem" />
                {{ $t('common.add') }}
              </template>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { DiaryEntryWithName } from '~/stores/diary'

definePageMeta({ title: 'Tagebuch' })

const route = useRoute()
const diaryStore = useDiaryStore()
const userStore = useUserStore()
const recipesStore = useRecipesStore()
const activityStore = useActivityStore()
const { t } = useI18n()
const { showToast } = useToast()

// ─── Date ─────────────────────────────────────────────────────────────────────

const date = computed(() => route.params.date as string)

const isToday = computed(() =>
  date.value === toLocalDateStr(new Date())
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
  navigateTo('/diary/' + toLocalDateStr(d))
}

function nextDay(): void {
  const d = new Date(date.value + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  navigateTo('/diary/' + toLocalDateStr(d))
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

// See index.vue for the full rationale: burned calories extend the daily
// budget rather than reduce what's shown as consumed (dashboard.consumed).
// effectiveCalorieGoal feeds only the remaining/percent/over-goal math below;
// the raw calorieGoal keeps showing as-is wherever it's labelled "Ziel".
// Zero activity entries means totalBurned is 0 and this is a no-op.
const totalBurned = computed(() => activityStore.totalBurnedForDate(date.value))
const effectiveCalorieGoal = computed(() => calorieGoal.value + totalBurned.value)

const remainingCalories = computed(() =>
  Math.max(0, effectiveCalorieGoal.value - Math.round(totalCalories.value))
)

const caloriePercent = computed(() =>
  Math.min(100, effectiveCalorieGoal.value > 0
    ? (totalCalories.value / effectiveCalorieGoal.value) * 100
    : 0
  )
)

const isOverGoal = computed(() => totalCalories.value > effectiveCalorieGoal.value)

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
    color: 'var(--macro-protein)',
    percent: pct(totalProtein.value, proteinGoal.value),
  },
  {
    key: 'carbs',
    label: 'Kohlenhydrate',
    current: totalCarbs.value,
    goal: carbsGoal.value,
    color: 'var(--macro-carbs)',
    percent: pct(totalCarbs.value, carbsGoal.value),
  },
  {
    key: 'fat',
    label: 'Fett',
    current: totalFat.value,
    goal: fatGoal.value,
    color: 'var(--macro-fat)',
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

interface MealSection {
  type: MealType
  label: string
  entries: DiaryEntryWithName[]
  totalKcal: number
}

const mealSections = computed<MealSection[]>(() =>
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

// ─── Meal clipboard (copy / paste / undo) ───────────────────────────────────────
const { clipboard, pastedMeal, pastingMeal, isSource, copy, paste } = useMealClipboard(date)

function addEntry(mealType: MealType): void {
  navigateTo(`/diary/add?date=${date.value}&meal=${mealType}`)
}

// ─── Save meal as recipe ────────────────────────────────────────────────────────
// Converts every entry in a meal section into ingredients of a new recipe.
// food_item_id entries map 1:1; recipe_id entries (logged via the "as recipe"
// mode) get resolved by loading the underlying recipe and scaling its
// ingredient amounts by entry.servings / recipe.servings — RecipeIngredient
// has no concept of a nested recipe reference, so this is the only way to
// represent "a recipe that was itself logged as part of this meal" as plain
// ingredients. Same food_item_id appearing more than once (as two direct
// entries, or once direct + once via a resolved recipe) gets summed into a
// single ingredient row rather than duplicated.

const saveRecipeSheetVisible = ref(false)
const savingMeal = ref<MealSection | null>(null)
const newRecipeName = ref('')
const isSavingRecipe = ref(false)

function openSaveRecipeSheet(meal: MealSection): void {
  savingMeal.value = meal
  newRecipeName.value = `${meal.label} ${formattedDayMonth.value}`
  saveRecipeSheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeSaveRecipeSheet(): void {
  saveRecipeSheetVisible.value = false
  document.body.style.overflow = ''
  setTimeout(() => { savingMeal.value = null }, 420)
}

async function handleSaveAsRecipe(): Promise<void> {
  if (!savingMeal.value || isSavingRecipe.value || !newRecipeName.value.trim()) return
  isSavingRecipe.value = true
  try {
    const merged = new Map<string, number>() // food_item_id -> summed amount_g

    for (const entry of savingMeal.value.entries) {
      if (entry.food_item_id) {
        merged.set(entry.food_item_id, (merged.get(entry.food_item_id) ?? 0) + entry.amount_g)
      } else if (entry.recipe_id) {
        const recipe = await recipesStore.loadRecipe(entry.recipe_id)
        if (!recipe) continue
        const factor = entry.servings / recipe.servings
        for (const ing of recipe.ingredients) {
          const amount = Math.round(ing.amount_g * factor)
          merged.set(ing.food_item_id, (merged.get(ing.food_item_id) ?? 0) + amount)
        }
      }
    }

    const ingredients = Array.from(merged.entries()).map(([food_item_id, amount_g]) => ({ food_item_id, amount_g }))
    await recipesStore.createRecipeWithIngredients(newRecipeName.value.trim(), ingredients)

    showToast(t('diary.diaryPage.saveAsRecipeToast'))
    closeSaveRecipeSheet()
  } finally {
    isSavingRecipe.value = false
  }
}

// ─── Inline entry edit ─────────────────────────────────────────────────────────
// Which entry's edit panel is open (one at a time); the panel itself lives in MealEntryRow.

const editingEntryId = ref<string | null>(null)

// ─── Quick-add activity bottom sheet ───────────────────────────────────────────
// Entry point is the small `diary__activity-add` button next to the
// "consumed" hero tile, always visible (no separate stat slot needed) — see
// index.vue's identical sheet for the full rationale. Logs against `date`
// (the day being viewed).

const activitySheetVisible = ref(false)
const activityName = ref('')
const activityCaloriesStr = ref('')
const activityDurationStr = ref('')
const isAddingActivity = ref(false)

const isActivityFormValid = computed(() => {
  const cal = parseFloat(activityCaloriesStr.value)
  return activityName.value.trim().length > 0 && !isNaN(cal) && cal > 0
})

function openActivitySheet(): void {
  activityName.value = ''
  activityCaloriesStr.value = ''
  activityDurationStr.value = ''
  activitySheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeActivitySheet(): void {
  activitySheetVisible.value = false
  document.body.style.overflow = ''
}

async function handleAddActivity(): Promise<void> {
  if (!isActivityFormValid.value || isAddingActivity.value) return
  isAddingActivity.value = true
  try {
    const duration = activityDurationStr.value ? parseFloat(activityDurationStr.value) : NaN
    await activityStore.addEntry(
      activityName.value.trim(),
      parseFloat(activityCaloriesStr.value),
      date.value,
      !isNaN(duration) && duration > 0 ? duration : undefined,
    )
    closeActivitySheet()
  } finally {
    isAddingActivity.value = false
  }
}

function onActivitySheetKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && activitySheetVisible.value) closeActivitySheet()
}

// ─── Data loading ──────────────────────────────────────────────────────────────

onMounted(() => {
  diaryStore.loadForDate(date.value)
  activityStore.loadEntries()
  window.addEventListener('keydown', onActivitySheetKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onActivitySheetKeydown)
  document.body.style.overflow = ''
})
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

// Row pairing the burned-kcal value with the quick-add-activity button —
// food-consumed calories aren't shown here at all ("remaining" and "goal"
// already cover that), this tile is purely the activity entry point now.
.diary__activity-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

// Burned kcal reuses .diary__stat-value's sizing, just recolored —
// --success = "credit", matching the app's existing "down/back is good"
// polarity (see weight/body-fat delta badges).
.diary__activity-burned-value {
  color: var(--app-success-text);
}

// Quick-add-activity button — sits right next to the first stat rather than
// getting its own hero stat slot.
.diary__activity-add {
  display: flex;
  align-items: center;
  align-self: center;
  padding: 0.2rem;
  background: none;
  border: none;
  font-family: inherit;
  color: var(--app-success-text);
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

  &--breakfast { border-left-color: var(--meal-breakfast); }
  &--lunch     { border-left-color: var(--meal-lunch); }
  &--dinner    { border-left-color: var(--meal-dinner); }
  &--snack     { border-left-color: var(--meal-snack); }
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

/* Brief accent outline after a paste so the new entries are easy to spot. */
.diary__meal--pasted {
  animation: diaryMealPasted 900ms $ease-out-soft;
}

@keyframes diaryMealPasted {
  0%   { box-shadow: inset 0 0 0 2px var(--accent-color); }
  100% { box-shadow: inset 0 0 0 2px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .diary__meal--pasted { animation: none; }
}

.diary__meal-add {
  color: var(--app-accent-text);
  width: 2.75rem;
  height: 2.75rem;
  margin: -0.5rem -0.35rem -0.5rem 0;
  flex-shrink: 0;
  transition: transform 200ms ease;

  &:hover,
  &:focus-visible {
    transform: scale(1.15);
  }
}

/* ─── Entry list ──────────────────────────────────────────────────────────────── */
/* Row + inline edit panel styles live in components/MealEntryRow.vue. */

.diary__entries {
  list-style: none;
  padding: 0;
  margin: 0.4rem 0 0;
  display: flex;
  flex-direction: column;
}

/* ─── Empty meal state ────────────────────────────────────────────────────────── */

.diary__meal-empty {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--secondary-text);
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
  color: var(--water-color-text);
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

// ─── Activity quick-add sheet ──────────────────────────────────────────────
// Mirrors index.vue's identical `act-sheet__*` block — kept as its own copy
// since scoped styles can't be shared across SFCs.

.act-sheet__title-group {
  flex: 1;
  min-width: 0;

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.act-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.act-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.act-sheet__optional {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
}

.act-sheet__field-group {
  margin: 0;
}

.act-sheet__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.75);
}

.act-sheet__field {
  min-width: 0;
}

.act-sheet__num-input {
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.act-sheet__input-unit {
  padding: 0 calc(#{$spacing} * 0.625);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}
</style>
