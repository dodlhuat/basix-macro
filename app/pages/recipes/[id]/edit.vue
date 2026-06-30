<template>
  <div class="recipe-edit page-content">

    <!-- Header -->
    <div class="recipe-edit__header">
      <button
        class="button button-icon recipe-edit__back"
        aria-label="Zurück"
        @click="navigateTo('/recipes')"
      >
        <AppIcon name="arrow_back" size="1.25rem" />
      </button>
      <div class="recipe-edit__title-group">
        <h1 class="recipe-edit__title">{{ recipe?.name ?? 'Rezept' }}</h1>
        <p class="recipe-edit__subtitle">
          {{ recipe?.ingredients.length ?? 0 }} Zutat{{ (recipe?.ingredients.length ?? 0) === 1 ? '' : 'en' }}
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="!recipe" class="recipe-edit__loading">
      <div class="spinner" aria-label="Wird geladen …" />
    </div>

    <template v-else>

      <!-- ── Edit form ──────────────────────────────────────── -->
      <section class="recipe-edit__section">
        <p class="recipe-edit__section-label">Rezept-Details</p>

        <div class="form-group recipe-edit__form-group">
          <label class="recipe-edit__label" for="edit-name">Name</label>
          <div class="input-group">
            <input
              id="edit-name"
              v-model="editName"
              type="text"
              class="recipe-edit__text-input"
              maxlength="100"
              autocomplete="off"
              @blur="handleSaveMeta"
            >
          </div>
        </div>

        <div class="form-group recipe-edit__form-group">
          <label class="recipe-edit__label" for="edit-servings">Portionen</label>
          <div class="recipe-edit__qty-row">
            <button
              class="button button-outline recipe-edit__qty-btn"
              :disabled="editServings <= 1"
              aria-label="Weniger Portionen"
              type="button"
              @click="editServings = Math.max(1, editServings - 1)"
            >
              <AppIcon name="remove" size="1rem" />
            </button>
            <div class="input-group recipe-edit__qty-field">
              <input
                id="edit-servings"
                v-model.number="editServings"
                type="number"
                min="1"
                max="99"
                class="recipe-edit__qty-input"
                aria-label="Anzahl Portionen"
                @blur="handleSaveMeta"
              >
              <span class="recipe-edit__qty-unit">Portionen</span>
            </div>
            <button
              class="button button-outline recipe-edit__qty-btn"
              aria-label="Mehr Portionen"
              type="button"
              @click="editServings = Math.min(99, editServings + 1)"
            >
              <AppIcon name="add" size="1rem" />
            </button>
          </div>
        </div>

        <div class="form-group recipe-edit__form-group">
          <div class="recipe-edit__label-row">
            <label class="recipe-edit__label" for="edit-desc">Beschreibung</label>
            <span class="recipe-edit__optional">optional</span>
          </div>
          <div class="input-group">
            <textarea
              id="edit-desc"
              v-model="editDescription"
              placeholder="Kurze Beschreibung …"
              class="recipe-edit__textarea"
              maxlength="200"
              rows="2"
              @blur="handleSaveMeta"
            />
          </div>
        </div>

        <div v-if="hasPendingChanges" class="recipe-edit__save-row">
          <button
            class="button button-primary recipe-edit__save-btn"
            :disabled="isSaving"
            type="button"
            @click="handleSaveMeta"
          >
            <span v-if="isSaving" class="loading" />
            <template v-else>
              <AppIcon name="check" size="1rem" />
              Speichern
            </template>
          </button>
        </div>
      </section>

      <!-- ── Nutrition overview ─────────────────────────────── -->
      <section class="recipe-edit__section" aria-label="Nährwerte">
        <p class="recipe-edit__section-label">Nährwerte pro Portion</p>
        <div class="recipe-edit__nutrition card">
          <div class="recipe-edit__nutrition-grid">
            <div class="recipe-edit__nutrition-item">
              <span class="recipe-edit__nutrition-value recipe-edit__nutrition-value--cal">
                {{ Math.round(recipe.calories_per_serving) }}
              </span>
              <span class="recipe-edit__nutrition-label">kcal</span>
            </div>
            <div class="recipe-edit__nutrition-item">
              <span class="recipe-edit__nutrition-value recipe-edit__nutrition-value--protein">
                {{ recipe.protein_per_serving_g.toFixed(1) }}g
              </span>
              <span class="recipe-edit__nutrition-label">Protein</span>
            </div>
            <div class="recipe-edit__nutrition-item">
              <span class="recipe-edit__nutrition-value recipe-edit__nutrition-value--carbs">
                {{ recipe.carbs_per_serving_g.toFixed(1) }}g
              </span>
              <span class="recipe-edit__nutrition-label">Kohlenhydr.</span>
            </div>
            <div class="recipe-edit__nutrition-item">
              <span class="recipe-edit__nutrition-value recipe-edit__nutrition-value--fat">
                {{ recipe.fat_per_serving_g.toFixed(1) }}g
              </span>
              <span class="recipe-edit__nutrition-label">Fett</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Ingredients ────────────────────────────────────── -->
      <section class="recipe-edit__section">
        <div class="recipe-edit__ing-header">
          <p class="recipe-edit__section-label">Zutaten</p>
          <button
            class="button button-outline recipe-edit__add-ing-btn"
            type="button"
            @click="openIngSheet"
          >
            <AppIcon name="add" size="1rem" />
            Zutat hinzufügen
          </button>
        </div>

        <ul
          v-if="recipe.ingredients.length"
          class="recipe-edit__ing-list"
          role="list"
        >
          <li
            v-for="ing in recipe.ingredients"
            :key="ing.id"
            class="recipe-edit__ing-item"
          >
            <div class="recipe-edit__ing-body">
              <span class="recipe-edit__ing-name">{{ ing.food.name }}</span>
              <span class="recipe-edit__ing-meta">
                {{ ing.amount_g }}g &middot; {{ Math.round(ing.food.calories_per_100g * ing.amount_g / 100) }} kcal
              </span>
            </div>
            <div class="recipe-edit__ing-actions">
              <button
                class="button button-icon recipe-edit__ing-edit"
                :aria-label="`${ing.food.name} Menge bearbeiten`"
                @click="openEditIngSheet(ing)"
              >
                <AppIcon name="edit" size="1rem" />
              </button>
              <button
                class="button button-icon recipe-edit__ing-delete"
                :aria-label="`${ing.food.name} entfernen`"
                @click="handleRemoveIngredient(ing)"
              >
                <AppIcon name="delete_outline" size="1rem" />
              </button>
            </div>
          </li>
        </ul>

        <div v-else class="recipe-edit__ing-empty">
          <AppIcon name="add_shopping_cart" size="1.75rem" class="recipe-edit__ing-empty-icon" />
          <p class="recipe-edit__ing-empty-hint">Noch keine Zutaten.</p>
        </div>
      </section>

      <!-- ── Log to diary ───────────────────────────────────── -->
      <section class="recipe-edit__section">
        <button
          class="button button-primary recipe-edit__log-btn"
          type="button"
          @click="openLogSheet"
        >
          <AppIcon name="add_circle" size="1rem" />
          Als Diary-Eintrag loggen
        </button>
      </section>

      <!-- ── Danger zone ────────────────────────────────────── -->
      <section class="recipe-edit__section recipe-edit__danger">
        <button
          class="button button-error recipe-edit__delete-btn"
          type="button"
          @click="openDeleteSheet"
        >
          <AppIcon name="delete" size="1rem" />
          Rezept löschen
        </button>
      </section>

    </template>
  </div>

  <Teleport to="body">

    <!-- ── Ingredient bottom sheet ─────────────────────────── -->
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': ingSheetVisible }"
      :aria-hidden="!ingSheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeIngSheet" />

      <div
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="ingSheetPhase === 'search' ? 'Zutat suchen' : 'Menge festlegen'"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <!-- Phase: search -->
        <template v-if="ingSheetPhase === 'search'">
          <div class="bottom-sheet-header has-divider">
            <p class="title">Zutat hinzufügen</p>
            <button class="close button button-icon" aria-label="Schließen" @click="closeIngSheet">
              <AppIcon name="close" size="1.25rem" />
            </button>
          </div>
          <div class="bottom-sheet-body">
            <!-- Search input -->
            <div class="recipe-edit-sheet__search">
              <div class="input-group recipe-edit-sheet__search-field">
                <AppIcon name="search" size="1.25rem" class="recipe-edit-sheet__search-icon" />
                <input
                  ref="sheetSearchInput"
                  v-model="ingSearchQuery"
                  type="search"
                  class="recipe-edit-sheet__search-input"
                  placeholder="Lebensmittel suchen …"
                  aria-label="Lebensmittel suchen"
                  @input="handleIngSearch"
                  @search="handleIngSearch"
                >
                <button
                  v-if="ingSearchQuery"
                  class="button button-icon recipe-edit-sheet__search-clear"
                  aria-label="Suche löschen"
                  @click="clearIngSearch"
                >
                  <AppIcon name="close" size="1rem" />
                </button>
              </div>
            </div>
            <!-- Results -->
            <ul
              v-if="foodStore.items.length"
              class="recipe-edit-sheet__results"
              role="list"
            >
              <li
                v-for="(item, idx) in foodStore.items"
                :key="item.id"
                class="recipe-edit-sheet__result-item"
                :style="{ animationDelay: `${Math.min(idx, 5) * 30}ms` }"
                @click="selectFoodFromSheet(item)"
              >
                <div class="recipe-edit-sheet__result-body">
                  <span class="recipe-edit-sheet__result-name">{{ item.name }}</span>
                  <span v-if="item.brand" class="recipe-edit-sheet__result-brand">{{ item.brand }}</span>
                </div>
                <div class="recipe-edit-sheet__result-meta">
                  <span class="recipe-edit-sheet__result-kcal">{{ Math.round(item.calories_per_100g) }}</span>
                  <span class="recipe-edit-sheet__result-kcal-unit">kcal</span>
                </div>
              </li>
            </ul>

            <!-- OFF search results -->
            <div v-if="ingSearchQuery.trim()" class="recipe-edit-sheet__off">
              <div v-if="isOffLoading" class="recipe-edit-sheet__off-loading">
                <span class="loading recipe-edit-sheet__off-spinner" />
                <span class="recipe-edit-sheet__off-loading-text">Online suchen …</span>
              </div>
              <template v-else-if="offResults.length">
                <p class="recipe-edit-sheet__off-header">
                  <AppIcon name="public" size="0.875rem" />
                  Open Food Facts
                </p>
                <ul class="recipe-edit-sheet__results" role="list">
                  <li
                    v-for="product in offResults"
                    :key="product.code"
                    class="recipe-edit-sheet__result-item"
                    @click="addOffProduct(product)"
                  >
                    <div class="recipe-edit-sheet__result-body">
                      <span class="recipe-edit-sheet__result-name">{{ product.product_name }}</span>
                      <span v-if="product.brands" class="recipe-edit-sheet__result-brand">{{ offBrand(product.brands) }}</span>
                    </div>
                    <div class="recipe-edit-sheet__result-meta">
                      <span class="recipe-edit-sheet__result-kcal">{{ Math.round(product.nutriments['energy-kcal_100g'] ?? 0) }}</span>
                      <span class="recipe-edit-sheet__result-kcal-unit">kcal</span>
                      <AppIcon name="add" size="1.125rem" class="recipe-edit-sheet__off-add-icon" />
                    </div>
                  </li>
                </ul>
              </template>
            </div>
            <div v-else-if="ingSearchQuery && !offResults.length && !isOffLoading" class="recipe-edit-sheet__empty">
              <p>Kein Lebensmittel gefunden.</p>
            </div>
            <div v-else class="recipe-edit-sheet__empty">
              <p>Tippe um nach Lebensmitteln zu suchen.</p>
            </div>
          </div>
        </template>

        <!-- Phase: amount -->
        <template v-else>
          <div class="bottom-sheet-header has-divider">
            <div class="recipe-edit-sheet__title-group">
              <p class="title">{{ selectedFood?.name }}</p>
              <p class="subtitle">
                {{ selectedFood ? Math.round(selectedFood.calories_per_100g) : '—' }} kcal / 100g
              </p>
            </div>
            <button class="close button button-icon" aria-label="Schließen" @click="closeIngSheet">
              <AppIcon name="close" size="1.25rem" />
            </button>
          </div>
          <div class="bottom-sheet-body">
            <!-- Amount control -->
            <div class="recipe-edit-sheet__section">
              <p class="recipe-edit-sheet__section-label">Menge</p>
              <div class="recipe-edit-sheet__amount">
                <button
                  class="button button-outline recipe-edit-sheet__amount-btn"
                  :disabled="ingAmount <= 10"
                  aria-label="10g weniger"
                  @click="ingAmount = Math.max(1, ingAmount - 10)"
                >
                  <AppIcon name="remove" size="1rem" />
                </button>
                <div class="form-group recipe-edit-sheet__amount-group">
                  <div class="input-group">
                    <input
                      v-model.number="ingAmount"
                      type="number"
                      min="1"
                      max="9999"
                      step="1"
                      aria-label="Menge in Gramm"
                      class="recipe-edit-sheet__amount-input"
                    >
                    <span class="recipe-edit-sheet__amount-unit">g</span>
                  </div>
                </div>
                <button
                  class="button button-outline recipe-edit-sheet__amount-btn"
                  aria-label="10g mehr"
                  @click="ingAmount = Math.min(9999, ingAmount + 10)"
                >
                  <AppIcon name="add" size="1rem" />
                </button>
              </div>
            </div>
            <!-- Nutrition preview -->
            <div v-if="ingSheetNutrition" class="recipe-edit-sheet__nutrition">
              <div class="recipe-edit-sheet__nutrition-item">
                <span class="recipe-edit-sheet__nutrition-value">{{ ingSheetNutrition.cal }}</span>
                <span class="recipe-edit-sheet__nutrition-label">kcal</span>
              </div>
              <div class="recipe-edit-sheet__nutrition-item">
                <span class="recipe-edit-sheet__nutrition-value recipe-edit-sheet__nutrition-value--protein">
                  {{ ingSheetNutrition.protein }}g
                </span>
                <span class="recipe-edit-sheet__nutrition-label">Protein</span>
              </div>
              <div class="recipe-edit-sheet__nutrition-item">
                <span class="recipe-edit-sheet__nutrition-value recipe-edit-sheet__nutrition-value--carbs">
                  {{ ingSheetNutrition.carbs }}g
                </span>
                <span class="recipe-edit-sheet__nutrition-label">Kohlenhydrate</span>
              </div>
              <div class="recipe-edit-sheet__nutrition-item">
                <span class="recipe-edit-sheet__nutrition-value recipe-edit-sheet__nutrition-value--fat">
                  {{ ingSheetNutrition.fat }}g
                </span>
                <span class="recipe-edit-sheet__nutrition-label">Fett</span>
              </div>
            </div>
          </div>
          <div class="bottom-sheet-footer">
            <div class="buttons">
              <button class="button" @click="closeIngSheet">Abbrechen</button>
              <button
                class="button button-primary"
                :disabled="isIngLoading"
                @click="handleConfirmIngredient"
              >
                <span v-if="isIngLoading" class="loading" />
                <template v-else>
                  <AppIcon name="check" size="1rem" />
                  {{ editingIngredientId ? 'Aktualisieren' : 'Hinzufügen' }}
                </template>
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- ── Log to diary bottom sheet ───────────────────────── -->
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': logSheetVisible }"
      :aria-hidden="!logSheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeLogSheet" />
      <div class="bottom-sheet" role="dialog" aria-modal="true" aria-label="Als Diary-Eintrag loggen">
        <div class="bottom-sheet-handle" aria-hidden="true" />
        <div class="bottom-sheet-header has-divider">
          <p class="title">Als Eintrag loggen</p>
          <button class="close button button-icon" aria-label="Schließen" @click="closeLogSheet">
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>
        <div class="bottom-sheet-body">

          <div class="recipe-log-sheet__section">
            <p class="recipe-log-sheet__section-label">Datum</p>
            <div class="form-group">
              <div class="input-group">
                <input
                  v-model="logDate"
                  type="date"
                  class="recipe-log-sheet__date-input"
                  aria-label="Datum"
                >
              </div>
            </div>
          </div>

          <div class="recipe-log-sheet__section">
            <p class="recipe-log-sheet__section-label">Mahlzeit</p>
            <div class="chips">
              <button
                v-for="meal in MEALS"
                :key="meal.type"
                class="chip clickable"
                :class="{ selected: logMeal === meal.type }"
                @click="logMeal = meal.type"
              >
                {{ meal.label }}
              </button>
            </div>
          </div>

          <div class="recipe-log-sheet__section">
            <p class="recipe-log-sheet__section-label">Portionen</p>
            <div class="recipe-log-sheet__qty-row">
              <button
                class="button button-outline recipe-log-sheet__qty-btn"
                :disabled="logServings <= 0.5"
                aria-label="Weniger Portionen"
                @click="logServings = Math.max(0.5, +(logServings - 0.5).toFixed(1))"
              >
                <AppIcon name="remove" size="1rem" />
              </button>
              <div class="input-group recipe-log-sheet__qty-field">
                <input
                  v-model.number="logServings"
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  aria-label="Anzahl Portionen"
                  class="recipe-log-sheet__qty-input"
                >
                <span class="recipe-log-sheet__qty-unit">Portionen</span>
              </div>
              <button
                class="button button-outline recipe-log-sheet__qty-btn"
                aria-label="Mehr Portionen"
                @click="logServings = Math.min(20, +(logServings + 0.5).toFixed(1))"
              >
                <AppIcon name="add" size="1rem" />
              </button>
            </div>
          </div>

          <!-- Log nutrition preview -->
          <div v-if="recipe" class="recipe-log-sheet__preview">
            <div class="recipe-log-sheet__preview-item">
              <span class="recipe-log-sheet__preview-value recipe-log-sheet__preview-value--cal">
                {{ Math.round(recipe.calories_per_serving * logServings) }}
              </span>
              <span class="recipe-log-sheet__preview-label">kcal</span>
            </div>
            <div class="recipe-log-sheet__preview-item">
              <span class="recipe-log-sheet__preview-value recipe-log-sheet__preview-value--protein">
                {{ (recipe.protein_per_serving_g * logServings).toFixed(1) }}g
              </span>
              <span class="recipe-log-sheet__preview-label">Protein</span>
            </div>
            <div class="recipe-log-sheet__preview-item">
              <span class="recipe-log-sheet__preview-value recipe-log-sheet__preview-value--carbs">
                {{ (recipe.carbs_per_serving_g * logServings).toFixed(1) }}g
              </span>
              <span class="recipe-log-sheet__preview-label">Kohlenhydr.</span>
            </div>
            <div class="recipe-log-sheet__preview-item">
              <span class="recipe-log-sheet__preview-value recipe-log-sheet__preview-value--fat">
                {{ (recipe.fat_per_serving_g * logServings).toFixed(1) }}g
              </span>
              <span class="recipe-log-sheet__preview-label">Fett</span>
            </div>
          </div>

        </div>
        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" @click="closeLogSheet">Abbrechen</button>
            <button
              class="button button-primary"
              :disabled="isLogging"
              @click="handleLog"
            >
              <span v-if="isLogging" class="loading" />
              <template v-else>
                <AppIcon name="check" size="1rem" />
                Eintragen
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Delete confirmation bottom sheet ────────────────── -->
    <div
      class="bottom-sheet-wrapper"
      :class="{ 'is-visible': deleteSheetVisible }"
      :aria-hidden="!deleteSheetVisible"
    >
      <div class="bottom-sheet-backdrop" @click="closeDeleteSheet" />
      <div class="bottom-sheet" role="dialog" aria-modal="true" aria-label="Rezept löschen">
        <div class="bottom-sheet-handle" aria-hidden="true" />
        <div class="bottom-sheet-header has-divider">
          <p class="title">Rezept löschen?</p>
          <button class="close button button-icon" aria-label="Schließen" @click="closeDeleteSheet">
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>
        <div class="bottom-sheet-body">
          <p class="recipe-delete-sheet__message">
            „{{ recipe?.name }}" wird unwiderruflich gelöscht. Diary-Einträge bleiben erhalten.
          </p>
        </div>
        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" @click="closeDeleteSheet">Abbrechen</button>
            <button
              class="button button-error"
              :disabled="isDeleting"
              @click="handleDeleteRecipe"
            >
              <span v-if="isDeleting" class="loading" />
              <template v-else>
                <AppIcon name="delete" size="1rem" />
                Löschen
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>

  </Teleport>
</template>

<script setup lang="ts">
import type { FoodItem } from '../../../../db'
import type { OFFProduct } from '../../../../composables/useOpenFoodFacts'

definePageMeta({ title: 'Rezept bearbeiten' })

const route = useRoute()
const recipesStore = useRecipesStore()
const foodStore = useFoodStore()
const { searchProducts, mapToFoodItem } = useOpenFoodFacts()
const diaryStore = useDiaryStore()

// ─── Recipe data ───────────────────────────────────────────────────────────────

const recipe = computed(() => recipesStore.activeRecipe)
const recipeId = computed(() => route.params.id as string)

// ─── Edit form state ───────────────────────────────────────────────────────────

const editName        = ref('')
const editServings    = ref(1)
const editDescription = ref('')
const isSaving        = ref(false)

const hasPendingChanges = computed(() =>
  recipe.value !== null && (
    editName.value        !== recipe.value.name ||
    editServings.value    !== recipe.value.servings ||
    editDescription.value !== (recipe.value.description ?? '')
  ),
)

async function handleSaveMeta() {
  if (!recipe.value || !hasPendingChanges.value || isSaving.value) return
  isSaving.value = true
  try {
    await recipesStore.updateRecipe(recipe.value.id, {
      name:        editName.value.trim() || recipe.value.name,
      servings:    editServings.value,
      description: editDescription.value.trim() || undefined,
    })
    await recipesStore.loadRecipe(recipeId.value)
  } finally {
    isSaving.value = false
  }
}

// ─── Watch recipe to sync edit fields ──────────────────────────────────────────

watch(recipe, (r) => {
  if (r) {
    editName.value        = r.name
    editServings.value    = r.servings
    editDescription.value = r.description ?? ''
  }
}, { immediate: true })

// ─── Ingredient sheet ──────────────────────────────────────────────────────────

const ingSheetVisible      = ref(false)
const ingSheetPhase        = ref<'search' | 'amount'>('search')
const editingIngredientId  = ref<string | null>(null)
const selectedFood         = ref<FoodItem | null>(null)
const ingAmount            = ref(100)
const isIngLoading         = ref(false)
const ingSearchQuery       = ref('')
const sheetSearchInput     = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

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

const ingSheetNutrition = computed(() => {
  if (!selectedFood.value || ingAmount.value <= 0) return null
  const f = ingAmount.value / 100
  return {
    cal:     Math.round(selectedFood.value.calories_per_100g * f),
    protein: +(selectedFood.value.protein_per_100g * f).toFixed(1),
    carbs:   +(selectedFood.value.carbs_per_100g   * f).toFixed(1),
    fat:     +(selectedFood.value.fat_per_100g     * f).toFixed(1),
  }
})

function openIngSheet() {
  ingSheetPhase.value       = 'search'
  editingIngredientId.value = null
  selectedFood.value        = null
  ingSearchQuery.value      = ''
  offResults.value          = []
  isOffLoading.value        = false
  ingAmount.value           = 100
  ingSheetVisible.value     = true
  document.body.style.overflow = 'hidden'
  // Focus search on next tick
  nextTick(() => sheetSearchInput.value?.focus())
}

function openEditIngSheet(ing: { id: string; amount_g: number; food: FoodItem }) {
  editingIngredientId.value = ing.id
  selectedFood.value        = ing.food
  ingAmount.value           = ing.amount_g
  ingSheetPhase.value       = 'amount'
  ingSheetVisible.value     = true
  document.body.style.overflow = 'hidden'
}

function closeIngSheet() {
  ingSheetVisible.value = false
  document.body.style.overflow = ''
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)
  setTimeout(() => {
    ingSheetPhase.value       = 'search'
    editingIngredientId.value = null
    selectedFood.value        = null
    ingSearchQuery.value      = ''
    offResults.value          = []
    isOffLoading.value        = false
  }, 420)
}

function handleIngSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)

  const q = ingSearchQuery.value.trim()

  if (!q) {
    offResults.value = []
    isOffLoading.value = false
    return
  }

  searchTimer = setTimeout(() => foodStore.search(ingSearchQuery.value), 300)

  offResults.value = []
  isOffLoading.value = true
  offTimer = setTimeout(() => runOffSearch(q), 700)
}

function clearIngSearch() {
  ingSearchQuery.value = ''
  offResults.value = []
  isOffLoading.value = false
  if (searchTimer) clearTimeout(searchTimer)
  if (offTimer) clearTimeout(offTimer)
  sheetSearchInput.value?.focus()
}

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
  const { db } = await import('../../../../db')
  const food = await db.food_items.get(id)
  if (food) selectFoodFromSheet(food)
}

function selectFoodFromSheet(food: FoodItem) {
  selectedFood.value  = food
  ingAmount.value     = 100
  ingSheetPhase.value = 'amount'
  ingSearchQuery.value = ''
}

async function handleConfirmIngredient() {
  if (!selectedFood.value || isIngLoading.value) return
  isIngLoading.value = true
  try {
    if (editingIngredientId.value) {
      // Update existing ingredient
      await recipesStore.updateIngredient(editingIngredientId.value, ingAmount.value)
    } else {
      // Add new ingredient
      await recipesStore.addIngredient(recipeId.value, selectedFood.value.id, ingAmount.value)
    }
    await recipesStore.loadRecipe(recipeId.value)
    closeIngSheet()
  } finally {
    isIngLoading.value = false
  }
}

async function handleRemoveIngredient(ing: { id: string; recipe_id: string }) {
  await recipesStore.removeIngredient(ing.id, ing.recipe_id)
  await recipesStore.loadRecipe(recipeId.value)
}

// ─── Log to diary sheet ────────────────────────────────────────────────────────

const MEALS = [
  { type: 'breakfast' as const, label: 'Frühstück' },
  { type: 'lunch'     as const, label: 'Mittagessen' },
  { type: 'dinner'    as const, label: 'Abendessen' },
  { type: 'snack'     as const, label: 'Snacks' },
]

function getDefaultMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 20) return 'dinner'
  return 'snack'
}

const logSheetVisible = ref(false)
const logDate         = ref(new Date().toISOString().substring(0, 10))
const logMeal         = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getDefaultMeal())
const logServings     = ref(1)
const isLogging       = ref(false)

function openLogSheet() {
  logDate.value         = new Date().toISOString().substring(0, 10)
  logMeal.value         = getDefaultMeal()
  logServings.value     = recipe.value?.servings ?? 1
  logSheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeLogSheet() {
  logSheetVisible.value = false
  document.body.style.overflow = ''
}

async function handleLog() {
  if (!recipe.value || isLogging.value) return
  isLogging.value = true
  try {
    await diaryStore.addRecipeEntry({
      date:                   logDate.value,
      meal_type:              logMeal.value,
      recipe_id:              recipe.value.id,
      servings:               logServings.value,
      calories_per_serving:   recipe.value.calories_per_serving,
      protein_per_serving_g:  recipe.value.protein_per_serving_g,
      carbs_per_serving_g:    recipe.value.carbs_per_serving_g,
      fat_per_serving_g:      recipe.value.fat_per_serving_g,
    })
    navigateTo('/')
  } finally {
    isLogging.value = false
  }
}

// ─── Delete confirmation sheet ─────────────────────────────────────────────────

const deleteSheetVisible = ref(false)
const isDeleting         = ref(false)

function openDeleteSheet() {
  deleteSheetVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeDeleteSheet() {
  deleteSheetVisible.value = false
  document.body.style.overflow = ''
}

async function handleDeleteRecipe() {
  if (!recipe.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await recipesStore.deleteRecipe(recipe.value.id)
    navigateTo('/recipes')
  } finally {
    isDeleting.value = false
  }
}

// ─── Keyboard ──────────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (ingSheetVisible.value)    closeIngSheet()
    if (logSheetVisible.value)    closeLogSheet()
    if (deleteSheetVisible.value) closeDeleteSheet()
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await recipesStore.loadRecipe(recipeId.value)
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
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .recipe-edit-sheet__result-item { animation: none !important; }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.recipe-edit {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1.25);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Header ───────────────────────────────────────────────────────────────────

.recipe-edit__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit__back {
  flex-shrink: 0;
  margin-left: calc(#{$spacing} * -0.5);
}

.recipe-edit__title-group {
  min-width: 0;
}

.recipe-edit__title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--primary-text);
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-edit__subtitle {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--secondary-text);
  margin-top: 0.15rem;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

.recipe-edit__loading {
  display: flex;
  justify-content: center;
  padding: calc(#{$spacing} * 3);
}

// ─── Sections ─────────────────────────────────────────────────────────────────

.recipe-edit__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.75);
}

.recipe-edit__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

// ─── Edit form ────────────────────────────────────────────────────────────────

.recipe-edit__form-group {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.4);
  margin: 0;
}

.recipe-edit__label-row {
  display: flex;
  align-items: baseline;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
}

.recipe-edit__optional {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--secondary-text);
  opacity: 0.65;
}

.recipe-edit__text-input {
  width: 100%;
  font-size: 1rem;
  font-weight: 600;
}

.recipe-edit__textarea {
  width: 100%;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.5;
}

.recipe-edit__qty-row {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit__qty-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.recipe-edit__qty-field {
  flex: 1;
  margin: 0;
  display: flex;
  align-items: center;
}

.recipe-edit__qty-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.recipe-edit__qty-unit {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  white-space: nowrap;
}

.recipe-edit__save-row {
  display: flex;
  justify-content: flex-end;
}

.recipe-edit__save-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

// ─── Nutrition card ───────────────────────────────────────────────────────────

.recipe-edit__nutrition {
  padding: calc(#{$spacing} * 0.875) $spacing;
  background: var(--primary-bg);
}

.recipe-edit__nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.recipe-edit__nutrition-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;

  &--cal     { color: var(--accent-color); }
  &--protein { color: $macro-protein; }
  &--carbs   { color: $macro-carbs; }
  &--fat     { color: $macro-fat; }
}

.recipe-edit__nutrition-label {
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

// ─── Ingredients section ──────────────────────────────────────────────────────

.recipe-edit__ing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing;
}

.recipe-edit__add-ing-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.recipe-edit__ing-list {
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

.recipe-edit__ing-item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.75) $spacing;
  background: var(--primary-bg);

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.recipe-edit__ing-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.recipe-edit__ing-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-edit__ing-meta {
  font-size: 0.75rem;
  color: var(--secondary-text);
}

.recipe-edit__ing-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.recipe-edit__ing-edit {
  color: var(--secondary-text);
  width: 2rem;
  height: 2rem;
  padding: 0;
  transition: color 150ms ease;

  &:hover,
  &:focus-visible { color: var(--primary-text); }
}

.recipe-edit__ing-delete {
  color: var(--error);
  opacity: 0.7;
  width: 2rem;
  height: 2rem;
  padding: 0;
  transition: opacity 150ms ease;

  &:hover,
  &:focus-visible { opacity: 1; }
}

.recipe-edit__ing-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: calc(#{$spacing} * 1.5) 0;
  text-align: center;
}

.recipe-edit__ing-empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
}

.recipe-edit__ing-empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
}

// ─── Log / Danger buttons ─────────────────────────────────────────────────────

.recipe-edit__log-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.recipe-edit__danger {
  margin-top: calc(#{$spacing} * 0.5);
  padding-top: calc(#{$spacing} * 1);
  border-top: 1px solid var(--divider);
}

.recipe-edit__delete-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

// ─── Ingredient sheet: search phase ──────────────────────────────────────────

.recipe-edit-sheet__search {
  margin-bottom: $spacing;
}

.recipe-edit-sheet__search-field {
  display: flex;
  align-items: center;
  border-radius: var(--radius-full) !important;
  overflow: hidden;
  background: var(--secondary-background);
  border: 1px solid var(--divider);
  padding: 0 calc(#{$spacing} * 0.75);
  gap: calc(#{$spacing} * 0.5);
  height: 2.5rem;

  &:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-tint);
  }
}

.recipe-edit-sheet__search-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
}

.recipe-edit-sheet__search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--primary-text);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  min-width: 0;
  box-shadow: none;

  &::placeholder {
    color: var(--secondary-text);
    opacity: 0.7;
  }

  &::-webkit-search-cancel-button { display: none; }
}

.recipe-edit-sheet__search-clear {
  flex-shrink: 0;
  color: var(--secondary-text);
  padding: 0.2rem;
  margin: -0.2rem;
  transition: color 150ms ease;

  &:hover { color: var(--primary-text); }
}

// ─── OFF section ──────────────────────────────────────────────────────────────

.recipe-edit-sheet__off {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit-sheet__off-header {
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

.recipe-edit-sheet__off-loading {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 0.75) calc(#{$spacing} * 0.25);
}

.recipe-edit-sheet__off-spinner {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  flex-shrink: 0;
}

.recipe-edit-sheet__off-loading-text {
  font-size: 0.85rem;
  color: var(--secondary-text);
}

.recipe-edit-sheet__off-add-icon {
  color: var(--accent-color);
  opacity: 0.7;
}

.recipe-edit-sheet__results {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--divider);
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 50vh;
  overflow-y: auto;
}

.recipe-edit-sheet__result-item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.7) $spacing;
  background: var(--primary-bg);
  cursor: pointer;
  transition: background 120ms ease;
  animation: itemIn 350ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }

  &:active { background: var(--hover); }

  @media (hover: hover) {
    &:hover { background: var(--hover); }
  }
}

.recipe-edit-sheet__result-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.recipe-edit-sheet__result-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-edit-sheet__result-brand {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-edit-sheet__result-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.recipe-edit-sheet__result-kcal {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.recipe-edit-sheet__result-kcal-unit {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  line-height: 1;
}

.recipe-edit-sheet__empty {
  padding: $spacing 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--secondary-text);
}

// ─── Ingredient sheet: amount phase ──────────────────────────────────────────

.recipe-edit-sheet__title-group {
  flex: 1;
  min-width: 0;

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.recipe-edit-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.recipe-edit-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.recipe-edit-sheet__amount {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-edit-sheet__amount-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.recipe-edit-sheet__amount-group {
  flex: 1;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.recipe-edit-sheet__amount-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.recipe-edit-sheet__amount-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.recipe-edit-sheet__nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
  margin-bottom: calc(#{$spacing} * 0.5);
}

.recipe-edit-sheet__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.recipe-edit-sheet__nutrition-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;

  &--protein { color: $macro-protein; }
  &--carbs   { color: $macro-carbs; }
  &--fat     { color: $macro-fat; }
}

.recipe-edit-sheet__nutrition-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

// ─── Log sheet ────────────────────────────────────────────────────────────────

.recipe-log-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.recipe-log-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.recipe-log-sheet__date-input {
  width: 100%;
  font-size: 0.9rem;
}

.recipe-log-sheet__qty-row {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-log-sheet__qty-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.recipe-log-sheet__qty-field {
  flex: 1;
  margin: 0;
  display: flex;
  align-items: center;
}

.recipe-log-sheet__qty-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.recipe-log-sheet__qty-unit {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  white-space: nowrap;
}

.recipe-log-sheet__preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
}

.recipe-log-sheet__preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.recipe-log-sheet__preview-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;

  &--cal     { color: var(--accent-color); }
  &--protein { color: $macro-protein; }
  &--carbs   { color: $macro-carbs; }
  &--fat     { color: $macro-fat; }
}

.recipe-log-sheet__preview-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

// ─── Delete sheet ─────────────────────────────────────────────────────────────

.recipe-delete-sheet__message {
  font-size: 0.9rem;
  color: var(--secondary-text);
  line-height: 1.5;
  margin-bottom: calc(#{$spacing} * 0.5);
}
</style>
