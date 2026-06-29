<template>
  <div class="diary-add page-content">

    <!-- Page header -->
    <div class="diary-add__header">
      <button
        class="button button-icon diary-add__back"
        aria-label="Zurück"
        @click="router.back()"
      >
        <AppIcon name="arrow_back" size="1.25rem" />
      </button>
      <div class="diary-add__title-group">
        <h1 class="diary-add__title">Eintrag hinzufügen</h1>
        <p class="diary-add__subtitle">{{ mealLabel }} · {{ formattedDate }}</p>
      </div>
    </div>

    <!-- Search bar -->
    <div class="diary-add__search">
      <div class="input-group diary-add__search-field">
        <AppIcon name="search" size="1.25rem" class="diary-add__search-icon" />
        <input
          ref="searchInput"
          v-model="localQuery"
          type="search"
          class="diary-add__search-input"
          placeholder="Lebensmittel suchen …"
          aria-label="Lebensmittel suchen"
          autofocus
          @input="handleSearch"
          @search="handleSearch"
        />
        <button
          v-if="localQuery"
          class="button button-icon diary-add__search-clear"
          aria-label="Suche löschen"
          @click="clearSearch"
        >
          <AppIcon name="close" size="1rem" />
        </button>
      </div>
      <button
        class="button button-icon diary-add__scan-btn"
        aria-label="Barcode scannen"
        @click="navigateTo(`/scan?date=${paramDate}&meal=${paramMeal}`)"
      >
        <AppIcon name="qr_code_scanner" size="1.25rem" />
      </button>
    </div>

    <!-- Filter chips -->
    <div class="chips diary-add__filters" role="tablist">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        role="tab"
        class="chip clickable"
        :class="{ selected: activeFilter === f.key }"
        :aria-selected="activeFilter === f.key"
        @click="setFilter(f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Food list -->
    <ul
      v-if="foodStore.items.length"
      class="diary-add__list"
      role="list"
      aria-label="Lebensmittelliste"
    >
      <li
        v-for="(item, idx) in foodStore.items"
        :key="item.id"
        class="diary-add__item"
        :style="{ animationDelay: `${Math.min(idx, 9) * 35}ms` }"
        @click="openSheet(item)"
      >
        <div class="diary-add__item-body">
          <span class="diary-add__item-name">{{ item.name }}</span>
          <span v-if="item.brand" class="diary-add__item-brand">{{ item.brand }}</span>
        </div>
        <div class="diary-add__item-meta">
          <div class="diary-add__item-kcal-wrap">
            <span class="diary-add__item-kcal">{{ Math.round(item.calories_per_100g) }}</span>
            <span class="diary-add__item-kcal-unit">kcal</span>
          </div>
          <AppIcon name="chevron_right" size="1.125rem" class="diary-add__item-arrow" />
        </div>
      </li>
    </ul>

    <!-- Empty states -->
    <div v-else class="diary-add__empty">
      <template v-if="localQuery">
        <AppIcon name="search_off" size="2.5rem" class="diary-add__empty-icon" />
        <p class="diary-add__empty-title">Keine Treffer</p>
        <p class="diary-add__empty-hint">Kein Lebensmittel für „{{ localQuery }}" gefunden.</p>
      </template>
      <template v-else-if="activeFilter === 'favorites'">
        <AppIcon name="star_border" size="2.5rem" class="diary-add__empty-icon" />
        <p class="diary-add__empty-title">Keine Favoriten</p>
        <p class="diary-add__empty-hint">Tippe auf ★ bei einem Lebensmittel, um es zu speichern.</p>
      </template>
      <template v-else-if="activeFilter === 'recent'">
        <AppIcon name="history" size="2.5rem" class="diary-add__empty-icon" />
        <p class="diary-add__empty-title">Noch keine Aktivität</p>
        <p class="diary-add__empty-hint">Hier erscheinen kürzlich geloggte Lebensmittel.</p>
      </template>
      <template v-else>
        <AppIcon name="restaurant" size="2.5rem" class="diary-add__empty-icon" />
        <p class="diary-add__empty-title">Noch keine Lebensmittel</p>
        <p class="diary-add__empty-hint">Leg zuerst Lebensmittel an.</p>
      </template>
    </div>

    <!-- Create new food link -->
    <div class="diary-add__create">
      <NuxtLink to="/food/add" class="diary-add__create-link">
        <AppIcon name="add_circle_outline" size="1rem" />
        Neues Lebensmittel anlegen
      </NuxtLink>
    </div>

  </div>

  <!-- Quick-add bottom sheet -->
  <Teleport to="body">
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': sheetVisible }"
      :aria-hidden="!sheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeSheet" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Eintrag hinzufügen"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <div class="da-sheet__title-group">
            <p class="title">{{ selectedFood?.name }}</p>
            <p class="subtitle">
              {{ selectedFood ? Math.round(selectedFood.calories_per_100g) : '—' }} kcal / 100g
            </p>
          </div>
          <button
            class="close button button-icon"
            aria-label="Schließen"
            @click="closeSheet"
          >
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">

          <!-- Meal chips -->
          <div class="da-sheet__section">
            <p class="da-sheet__section-label">Mahlzeit</p>
            <div class="chips">
              <button
                v-for="meal in MEALS"
                :key="meal.type"
                class="chip clickable"
                :class="{ selected: sheetMeal === meal.type }"
                @click="sheetMeal = meal.type"
              >
                {{ meal.label }}
              </button>
            </div>
          </div>

          <!-- Amount control -->
          <div class="da-sheet__section">
            <p class="da-sheet__section-label">Menge</p>
            <div class="da-sheet__amount">
              <button
                class="button button-outline da-sheet__amount-btn"
                :disabled="sheetAmount <= 10"
                aria-label="10g weniger"
                @click="adjustAmount(-10)"
              >
                <AppIcon name="remove" size="1rem" />
              </button>
              <div class="form-group da-sheet__amount-group">
                <div class="input-group">
                  <input
                    v-model.number="sheetAmount"
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    aria-label="Menge in Gramm"
                    class="da-sheet__amount-input"
                  />
                  <span class="da-sheet__amount-unit">g</span>
                </div>
              </div>
              <button
                class="button button-outline da-sheet__amount-btn"
                aria-label="10g mehr"
                @click="adjustAmount(10)"
              >
                <AppIcon name="add" size="1rem" />
              </button>
            </div>
          </div>

          <!-- Nutrition preview -->
          <div v-if="sheetNutrition" class="da-sheet__nutrition">
            <div class="da-sheet__nutrition-item">
              <span class="da-sheet__nutrition-value">{{ sheetNutrition.calories }}</span>
              <span class="da-sheet__nutrition-label">kcal</span>
            </div>
            <div class="da-sheet__nutrition-item">
              <span class="da-sheet__nutrition-value" style="color: #ef4444">
                {{ sheetNutrition.protein }}g
              </span>
              <span class="da-sheet__nutrition-label">Protein</span>
            </div>
            <div class="da-sheet__nutrition-item">
              <span class="da-sheet__nutrition-value" style="color: #3b82f6">
                {{ sheetNutrition.carbs }}g
              </span>
              <span class="da-sheet__nutrition-label">Kohlenhydrate</span>
            </div>
            <div class="da-sheet__nutrition-item">
              <span class="da-sheet__nutrition-value" style="color: #f59e0b">
                {{ sheetNutrition.fat }}g
              </span>
              <span class="da-sheet__nutrition-label">Fett</span>
            </div>
          </div>

        </div>

        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" @click="closeSheet">Abbrechen</button>
            <button
              class="button button-primary"
              :disabled="isAdding"
              @click="handleAdd"
            >
              <span v-if="isAdding" class="loading" />
              <template v-else>
                <AppIcon name="check" size="1rem" />
                Hinzufügen
              </template>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { FoodItem } from '../../../db'

definePageMeta({ title: 'Eintrag hinzufügen' })

const foodStore = useFoodStore()
const diaryStore = useDiaryStore()
const route = useRoute()
const router = useRouter()

// ─── Route params ──────────────────────────────────────────────────────────────

const today = new Date().toISOString().substring(0, 10)

function getDefaultMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 20) return 'dinner'
  return 'snack'
}

const paramMeal = (route.query.meal as string) || getDefaultMeal()
const paramDate = (route.query.date as string) || today

// ─── Meal label + date display ─────────────────────────────────────────────────

const MEALS = [
  { type: 'breakfast' as const, label: 'Frühstück' },
  { type: 'lunch'     as const, label: 'Mittagessen' },
  { type: 'dinner'    as const, label: 'Abendessen' },
  { type: 'snack'     as const, label: 'Snacks' },
]

const mealLabel = computed(() =>
  MEALS.find(m => m.type === paramMeal)?.label ?? paramMeal,
)

const formattedDate = computed(() => {
  const d = new Date(paramDate + 'T00:00:00')
  const isToday = paramDate === today
  if (isToday) return 'Heute'
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
})

// ─── Filter config ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all' as const,       label: 'Alle' },
  { key: 'favorites' as const, label: 'Favoriten' },
  { key: 'recent' as const,    label: 'Zuletzt' },
]

const activeFilter = ref<'all' | 'favorites' | 'recent'>('recent')

async function setFilter(key: 'all' | 'favorites' | 'recent') {
  activeFilter.value = key
  localQuery.value = ''
  if (key === 'favorites') await foodStore.loadFavorites()
  else if (key === 'recent') await foodStore.loadRecent()
  else await foodStore.loadAll()
}

// ─── Search ────────────────────────────────────────────────────────────────────

const localQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!localQuery.value.trim()) {
      // Revert to active filter on clear
      if (activeFilter.value === 'favorites') await foodStore.loadFavorites()
      else if (activeFilter.value === 'recent') await foodStore.loadRecent()
      else await foodStore.loadAll()
    } else {
      await foodStore.search(localQuery.value)
    }
  }, 300)
}

function clearSearch() {
  localQuery.value = ''
  handleSearch()
  searchInput.value?.focus()
}

// ─── Quick-add bottom sheet ────────────────────────────────────────────────────

const sheetVisible = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const sheetAmount = ref(100)
const isAdding = ref(false)
const sheetMeal = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>(
  paramMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
)

const sheetNutrition = computed(() => {
  if (!selectedFood.value || sheetAmount.value <= 0) return null
  const f = sheetAmount.value / 100
  return {
    calories: Math.round(selectedFood.value.calories_per_100g * f),
    protein:  +(selectedFood.value.protein_per_100g * f).toFixed(1),
    carbs:    +(selectedFood.value.carbs_per_100g * f).toFixed(1),
    fat:      +(selectedFood.value.fat_per_100g * f).toFixed(1),
  }
})

function openSheet(food: FoodItem) {
  selectedFood.value = food
  sheetAmount.value = 100
  sheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeSheet() {
  sheetVisible.value = false
  document.body.style.overflow = ''
  setTimeout(() => { selectedFood.value = null }, 420)
}

function adjustAmount(delta: number) {
  sheetAmount.value = Math.max(1, (sheetAmount.value || 0) + delta)
}

async function handleAdd() {
  if (!selectedFood.value || isAdding.value) return
  isAdding.value = true
  try {
    await diaryStore.addEntry({
      date:         paramDate,
      meal_type:    sheetMeal.value,
      food_item_id: selectedFood.value.id,
      amount_g:     sheetAmount.value,
      food:         selectedFood.value,
    })
    closeSheet()
    router.back()
  } finally {
    isAdding.value = false
  }
}

// ─── Keyboard handler ──────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && sheetVisible.value) closeSheet()
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Default to recent for diary flow
  await foodStore.loadRecent()
  window.addEventListener('keydown', onKeydown)

  // Pre-select food item when returning from barcode scanner
  if (route.query.food_id) {
    const { db } = await import('../../../db')
    const food = await db.food_items.get(String(route.query.food_id))
    if (food) openSheet(food)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes itemIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .diary-add__item { animation: none !important; }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.diary-add {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.875);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Header ───────────────────────────────────────────────────────────────────

.diary-add__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.diary-add__back {
  flex-shrink: 0;
  margin-left: calc(#{$spacing} * -0.5);
}

.diary-add__title-group {
  min-width: 0;
}

.diary-add__title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--primary-text);
  line-height: 1.1;
}

.diary-add__subtitle {
  font-size: 0.8rem;
  color: var(--secondary-text);
  font-weight: 500;
  margin-top: 0.15rem;
}

// ─── Search ───────────────────────────────────────────────────────────────────

.diary-add__search {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(#{$spacing} * 0.25) 0;
  background: var(--background);
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.diary-add__search-field {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-full) !important;
  overflow: hidden;
  background: var(--primary-bg);
  border: 1px solid var(--divider);
  padding: 0 calc(#{$spacing} * 0.75);
  gap: calc(#{$spacing} * 0.5);
  height: 2.5rem;

  &:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-tint);
  }
}

.diary-add__scan-btn {
  flex-shrink: 0;
  color: var(--accent-color);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  transition: background 150ms ease, transform 200ms ease;

  &:hover,
  &:focus-visible {
    background: var(--accent-color-tint);
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.93);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }
}

.diary-add__search-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
  font-size: 1.1rem;
}

.diary-add__search-input {
  flex: 1;
  border: none;
  box-shadow: none;
  background: transparent;
  color: var(--primary-text);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  min-width: 0;
  padding: 0;

  &::placeholder {
    color: var(--secondary-text);
    opacity: 0.7;
  }

  &::-webkit-search-cancel-button { display: none; }
}

.diary-add__search-clear {
  flex-shrink: 0;
  color: var(--secondary-text);
  padding: 0.2rem;
  margin: -0.2rem;
  transition: color 150ms ease;

  &:hover { color: var(--primary-text); }
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

.diary-add__filters {
  gap: calc(#{$spacing} * 0.5);
}

// ─── Food list ────────────────────────────────────────────────────────────────

.diary-add__list {
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

.diary-add__item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 1);
  background: var(--primary-bg);
  cursor: pointer;
  transition: background 120ms ease;
  animation: itemIn 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }

  &:active { background: var(--hover); }

  @media (hover: hover) {
    &:hover { background: var(--hover); }
  }
}

.diary-add__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.diary-add__item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.diary-add__item-brand {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary-add__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.35);
  flex-shrink: 0;
}

.diary-add__item-kcal-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 3rem;
  text-align: right;
}

.diary-add__item-kcal {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.diary-add__item-kcal-unit {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  letter-spacing: 0.03em;
  line-height: 1;
}

.diary-add__item-arrow {
  color: var(--secondary-text);
  opacity: 0.5;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.diary-add__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.diary-add__empty-icon {

  color: var(--secondary-text);
  opacity: 0.4;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.diary-add__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.diary-add__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 22ch;
  line-height: 1.5;
}

// ─── Create new food link ─────────────────────────────────────────────────────

.diary-add__create {
  display: flex;
  justify-content: center;
  padding: calc(#{$spacing} * 0.5) 0;
}

.diary-add__create-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent-color);
  text-decoration: none;
  padding: calc(#{$spacing} * 0.5) $spacing;
  border-radius: var(--radius-full);
  transition: background 150ms ease;

  &:hover,
  &:focus-visible {
    background: var(--accent-color-tint);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }
}

// ─── Quick-add sheet content ──────────────────────────────────────────────────

.da-sheet__title-group {
  flex: 1;
  min-width: 0;

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.da-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.da-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.da-sheet__amount {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.da-sheet__amount-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.da-sheet__amount-group {
  flex: 1;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.da-sheet__amount-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.da-sheet__amount-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.da-sheet__nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
  margin-bottom: calc(#{$spacing} * 0.5);
}

.da-sheet__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.da-sheet__nutrition-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.da-sheet__nutrition-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
</style>
