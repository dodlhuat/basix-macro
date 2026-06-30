<template>
  <div class="food page-content">

    <!-- Search bar -->
    <div class="food__search">
      <div class="input-group food__search-field">
        <AppIcon name="search" size="1.25rem" class="food__search-icon" />
        <input
          ref="searchInput"
          v-model="localQuery"
          type="search"
          class="food__search-input"
          placeholder="Lebensmittel suchen …"
          aria-label="Lebensmittel suchen"
          @input="handleSearch"
          @search="handleSearch"
        />
        <button
          v-if="localQuery"
          class="button button-icon food__search-clear"
          aria-label="Suche löschen"
          @click="clearSearch"
        >
          <AppIcon name="close" size="1rem" />
        </button>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="chips food__filters" role="tablist">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        role="tab"
        class="chip clickable"
        :class="{ selected: foodStore.activeFilter === f.key }"
        :aria-selected="foodStore.activeFilter === f.key"
        @click="setFilter(f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Food list -->
    <ul
      v-if="foodStore.items.length"
      class="food__list"
      role="list"
      aria-label="Lebensmittelliste"
    >
      <li
        v-for="(item, idx) in foodStore.items"
        :key="item.id"
        class="food__item"
        :style="{ animationDelay: `${Math.min(idx, 9) * 35}ms` }"
        @click="openSheet(item)"
      >
        <div class="food__item-body">
          <span class="food__item-name">{{ item.name }}</span>
          <span v-if="item.brand" class="food__item-brand">{{ item.brand }}</span>
        </div>

        <div class="food__item-meta">
          <div class="food__item-kcal-wrap">
            <span class="food__item-kcal">{{ Math.round(item.calories_per_100g) }}</span>
            <span class="food__item-kcal-unit">kcal</span>
          </div>

          <button
            class="food__item-star"
            :class="{ 'food__item-star--active': item.is_favorite }"
            :aria-label="item.is_favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
            :aria-pressed="item.is_favorite"
            @click.stop="foodStore.toggleFavorite(item.id)"
          >
            <AppIcon
              :name="item.is_favorite ? 'star' : 'star_border'"
              size="1.125rem"
            />
          </button>

          <button
            class="food__item-edit button button-icon"
            :aria-label="`${item.name} bearbeiten`"
            @click.stop="navigateTo(`/food/${item.id}/edit`)"
          >
            <AppIcon name="chevron_right" size="1.125rem" />
          </button>
        </div>
      </li>
    </ul>

    <!-- OFF search results -->
    <div v-if="localQuery" class="food__off">
      <div v-if="isOffLoading" class="food__off-loading">
        <span class="loading food__off-spinner" />
        <span class="food__off-loading-text">Online suchen …</span>
      </div>
      <template v-else-if="offResults.length">
        <p class="food__off-header">
          <AppIcon name="public" size="0.875rem" />
          Open Food Facts
        </p>
        <ul class="food__list" role="list">
          <li
            v-for="product in offResults"
            :key="product.code"
            class="food__item food__off-item"
            @click="addOffProduct(product)"
          >
            <div class="food__item-body">
              <span class="food__item-name">{{ product.product_name }}</span>
              <span v-if="product.brands" class="food__item-brand">{{ offBrand(product.brands) }}</span>
            </div>
            <div class="food__item-meta">
              <div class="food__item-kcal-wrap">
                <span class="food__item-kcal">{{ Math.round(product.nutriments['energy-kcal_100g'] ?? 0) }}</span>
                <span class="food__item-kcal-unit">kcal</span>
              </div>
              <AppIcon name="add" size="1.125rem" class="food__off-add-icon" />
            </div>
          </li>
        </ul>
      </template>
    </div>

    <!-- Empty states -->
    <div v-else-if="!localQuery || (!foodStore.items.length && !offResults.length && !isOffLoading)" class="food__empty">
      <template v-if="localQuery">
        <AppIcon name="search_off" size="2.5rem" class="food__empty-icon" />
        <p class="food__empty-title">Keine Treffer</p>
        <p class="food__empty-hint">Kein Lebensmittel gefunden für „{{ localQuery }}".</p>
        <button class="button button-outline food__empty-action" @click="navigateTo('/food/add')">
          <AppIcon name="add" size="1rem" />
          Neu anlegen
        </button>
      </template>

      <template v-else-if="foodStore.activeFilter === 'favorites'">
        <AppIcon name="star_border" size="2.5rem" class="food__empty-icon" />
        <p class="food__empty-title">Keine Favoriten</p>
        <p class="food__empty-hint">Tippe auf ★ bei einem Lebensmittel, um es zu speichern.</p>
      </template>

      <template v-else-if="foodStore.activeFilter === 'recent'">
        <AppIcon name="history" size="2.5rem" class="food__empty-icon" />
        <p class="food__empty-title">Noch keine Aktivität</p>
        <p class="food__empty-hint">Hier erscheinen Lebensmittel, die du kürzlich geloggt hast.</p>
      </template>

      <template v-else>
        <AppIcon name="restaurant" size="2.5rem" class="food__empty-icon" />
        <p class="food__empty-title">Noch keine Lebensmittel</p>
        <p class="food__empty-hint">Lege dein erstes Lebensmittel an.</p>
        <button class="button button-primary food__empty-action" @click="navigateTo('/food/add')">
          <AppIcon name="add" size="1rem" />
          Lebensmittel anlegen
        </button>
      </template>
    </div>

  </div>

  <!-- FAB -->
  <button
    class="food__fab"
    aria-label="Neues Lebensmittel anlegen"
    @click="navigateTo('/food/add')"
  >
    <AppIcon name="add" size="1.5rem" />
  </button>

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
          <div class="food-sheet__title-group">
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
          <div class="food-sheet__section">
            <p class="food-sheet__section-label">Mahlzeit</p>
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
          <div class="food-sheet__section">
            <p class="food-sheet__section-label">Menge</p>
            <div class="food-sheet__amount">
              <button
                class="button button-outline food-sheet__amount-btn"
                :disabled="sheetAmount <= 10"
                aria-label="10g weniger"
                @click="adjustAmount(-10)"
              >
                <AppIcon name="remove" size="1rem" />
              </button>
              <div class="form-group food-sheet__amount-group">
                <div class="input-group">
                  <input
                    v-model.number="sheetAmount"
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    aria-label="Menge in Gramm"
                    class="food-sheet__amount-input"
                  />
                  <span class="food-sheet__amount-unit">g</span>
                </div>
              </div>
              <button
                class="button button-outline food-sheet__amount-btn"
                aria-label="10g mehr"
                @click="adjustAmount(10)"
              >
                <AppIcon name="add" size="1rem" />
              </button>
            </div>
          </div>

          <!-- Nutrition preview -->
          <div v-if="sheetNutrition" class="food-sheet__nutrition">
            <div class="food-sheet__nutrition-item">
              <span class="food-sheet__nutrition-value">{{ sheetNutrition.calories }}</span>
              <span class="food-sheet__nutrition-label">kcal</span>
            </div>
            <div class="food-sheet__nutrition-item">
              <span
                class="food-sheet__nutrition-value"
                style="color: #ef4444"
              >{{ sheetNutrition.protein }}g</span>
              <span class="food-sheet__nutrition-label">Protein</span>
            </div>
            <div class="food-sheet__nutrition-item">
              <span
                class="food-sheet__nutrition-value"
                style="color: #3b82f6"
              >{{ sheetNutrition.carbs }}g</span>
              <span class="food-sheet__nutrition-label">Kohlenhydrate</span>
            </div>
            <div class="food-sheet__nutrition-item">
              <span
                class="food-sheet__nutrition-value"
                style="color: #f59e0b"
              >{{ sheetNutrition.fat }}g</span>
              <span class="food-sheet__nutrition-label">Fett</span>
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
import type { OFFProduct } from '../../composables/useOpenFoodFacts'

definePageMeta({ title: 'Lebensmittel' })

const foodStore = useFoodStore()
const { searchProducts, mapToFoodItem } = useOpenFoodFacts()
const diaryStore = useDiaryStore()
const route = useRoute()
const router = useRouter()

// ─── Filter config ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all' as const,       label: 'Alle' },
  { key: 'favorites' as const, label: 'Favoriten' },
  { key: 'recent' as const,    label: 'Zuletzt' },
]

const MEALS = [
  { type: 'breakfast' as const, label: 'Frühstück' },
  { type: 'lunch'     as const, label: 'Mittagessen' },
  { type: 'dinner'    as const, label: 'Abendessen' },
  { type: 'snack'     as const, label: 'Snacks' },
]

// ─── Search ────────────────────────────────────────────────────────────────────

const localQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── OFF state ────────────────────────────────────────────────────────────────

const offResults = ref<OFFProduct[]>([])
const isOffLoading = ref(false)
let offSearchId = 0
let offTimer: ReturnType<typeof setTimeout> | null = null

async function runOffSearch(query: string) {
  const id = ++offSearchId
  const results = await searchProducts(query)
  if (id !== offSearchId) return
  offResults.value = results
  isOffLoading.value = false
}

function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)

  const q = localQuery.value.trim()

  if (!q) {
    offResults.value = []
    isOffLoading.value = false
    searchTimer = setTimeout(() => foodStore.search(''), 300)
    return
  }

  searchTimer = setTimeout(() => foodStore.search(localQuery.value), 300)

  offResults.value = []
  isOffLoading.value = true
  offTimer = setTimeout(() => runOffSearch(q), 700)
}

function clearSearch() {
  localQuery.value = ''
  offResults.value = []
  isOffLoading.value = false
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)
  foodStore.search('')
  searchInput.value?.focus()
}

// ─── Filter switching ──────────────────────────────────────────────────────────

async function setFilter(key: 'all' | 'favorites' | 'recent') {
  foodStore.activeFilter = key
  localQuery.value = ''
  offResults.value = []
  isOffLoading.value = false
  foodStore.searchQuery = ''
  if (key === 'favorites') await foodStore.loadFavorites()
  else if (key === 'recent') await foodStore.loadRecent()
  else await foodStore.loadAll()
}

// ─── Quick-add bottom sheet ────────────────────────────────────────────────────

const sheetVisible = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const sheetAmount = ref(100)
const isAdding = ref(false)

// Pre-fill from URL params (set by dashboard or diary/add)
const paramMeal = (route.query.meal as string) || null
const paramDate = (route.query.date as string) || null

function getDefaultMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 20) return 'dinner'
  return 'snack'
}

const sheetMeal = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>(
  (paramMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack') || getDefaultMeal(),
)
const sheetDate = ref<string>(
  paramDate || new Date().toISOString().substring(0, 10),
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
      date:         sheetDate.value,
      meal_type:    sheetMeal.value,
      food_item_id: selectedFood.value.id,
      amount_g:     sheetAmount.value,
      food:         selectedFood.value,
    })
    closeSheet()
    // If we came from the diary flow, go back
    if (paramDate || paramMeal) {
      router.back()
    }
  } finally {
    isAdding.value = false
  }
}

// ─── OFF helpers ──────────────────────────────────────────────────────────────

function offBrand(brands: unknown): string {
  if (Array.isArray(brands)) return String(brands[0] ?? '')
  if (typeof brands === 'string') return brands.split(',')[0]?.trim() ?? ''
  return ''
}

async function addOffProduct(product: OFFProduct) {
  const existing = product.code ? await foodStore.findByBarcode(product.code) : undefined
  let id: string
  if (existing) {
    id = existing.id
  } else {
    id = await foodStore.addItem(mapToFoodItem(product))
  }
  const { db } = await import('../../../db')
  const food = await db.food_items.get(id)
  if (food) openSheet(food)
}

// ─── Keyboard handler ──────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && sheetVisible.value) closeSheet()
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await foodStore.loadAll()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)
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

@keyframes fabPop {
  0%   { opacity: 0; transform: scale(0.6); }
  70%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .food__item,
  .food__fab {
    animation: none !important;
  }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.food {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.875);
  padding-bottom: calc(#{$spacing} * 4 + 3.5rem);
}

// ─── Search ───────────────────────────────────────────────────────────────────

.food__search {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(#{$spacing} * 0.5) 0 calc(#{$spacing} * 0.25);
  background: var(--background);
}

.food__search-field {
  position: relative;
  display: flex;
  align-items: center;

  // Override input-group defaults for search pill
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

.food__search-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
  font-size: 1.1rem;
}

.food__search-input {
  flex: 1;
  border: none;
  box-shadow: none;
  background: transparent;
  color: var(--primary-text);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  min-width: 0;

  // Focus ring is handled by .food__search-field :focus-within — suppress input-level styles
  &:hover,
  &:focus {
    border-color: transparent;
    box-shadow: none;
  }

  &::placeholder {
    color: var(--secondary-text);
    opacity: 0.7;
  }

  // Remove native search cancel button
  &::-webkit-search-cancel-button { display: none; }
}

.food__search-clear {
  flex-shrink: 0;
  color: var(--secondary-text);
  padding: 0.2rem;
  margin: -0.2rem;
  transition: color 150ms ease;

  &:hover { color: var(--primary-text); }
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

.food__filters {
  // Overrides chips row gap
  gap: calc(#{$spacing} * 0.5);
}

// ─── Food list ────────────────────────────────────────────────────────────────

.food__list {
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

.food__item {
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

  &:active {
    background: var(--hover);
  }

  @media (hover: hover) {
    &:hover {
      background: var(--hover);
    }
  }
}

.food__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.food__item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.food__item-brand {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.food__item-meta {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.35);
  flex-shrink: 0;
}

.food__item-kcal-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  min-width: 3rem;
  text-align: right;
}

.food__item-kcal {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.food__item-kcal-unit {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  letter-spacing: 0.03em;
  line-height: 1;
}

.food__item-star {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-full);
  color: var(--secondary-text);
  transition: color 180ms ease, transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0;

  &--active {
    color: #f59e0b;
  }

  &:active {
    transform: scale(0.8);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }
}

.food__item-edit {
  color: var(--secondary-text);
  width: 2rem;
  height: 2rem;
  padding: 0;
  transition: color 150ms ease;

  &:hover,
  &:focus-visible {
    color: var(--primary-text);
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.food__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.food__empty-icon {
  color: var(--secondary-text);
  opacity: 0.4;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.food__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.food__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 22ch;
  line-height: 1.5;
}

.food__empty-action {
  margin-top: calc(#{$spacing} * 0.5);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

.food__fab {
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
  animation: fabPop 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
  transition: transform 200ms ease, box-shadow 200ms ease;
  z-index: 50;

  &:hover,
  &:focus-visible {
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

// ─── Quick-add sheet content ──────────────────────────────────────────────────

.food-sheet__title-group {
  flex: 1;
  min-width: 0;

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.food-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.food-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.food-sheet__amount {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.food-sheet__amount-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.food-sheet__amount-group {
  flex: 1;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.food-sheet__amount-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.food-sheet__amount-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.food-sheet__nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
  margin-bottom: calc(#{$spacing} * 0.5);
}

.food-sheet__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.food-sheet__nutrition-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.food-sheet__nutrition-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

// ─── OFF section ──────────────────────────────────────────────────────────────

.food__off {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
}

.food__off-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  padding: 0 calc(#{$spacing} * 0.25);
}

.food__off-loading {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 0.25);
}

.food__off-spinner {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  flex-shrink: 0;
}

.food__off-loading-text {
  font-size: 0.85rem;
  color: var(--secondary-text);
}

.food__off-add-icon {
  color: var(--accent-color);
  flex-shrink: 0;
}

.food__off-item {
  cursor: pointer;
}
</style>
