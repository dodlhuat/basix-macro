<template>
  <div class="recipe-add page-content">

    <!-- Header -->
    <div class="recipe-add__header">
      <button
        class="button button-icon recipe-add__back"
        aria-label="Zurück"
        @click="handleBack"
      >
        <AppIcon name="arrow_back" size="1.25rem" />
      </button>
      <div class="recipe-add__title-group">
        <h1 class="recipe-add__title">Neues Rezept</h1>
        <p class="recipe-add__step-label">Schritt {{ step }} von 2</p>
      </div>
    </div>

    <!-- Step progress -->
    <div class="recipe-add__progress" aria-hidden="true">
      <div class="recipe-add__progress-track">
        <div class="recipe-add__progress-fill" :style="{ width: step === 1 ? '50%' : '100%' }" />
      </div>
    </div>

    <!-- ── Step 1: Grunddaten ────────────────────────────────── -->
    <div v-if="step === 1" class="recipe-add__step">

      <div class="form-group recipe-add__form-group">
        <label class="recipe-add__label" for="recipe-name">Name</label>
        <div class="input-group">
          <input
            id="recipe-name"
            v-model="form.name"
            type="text"
            placeholder="z.B. Hähnchen mit Reis"
            class="recipe-add__text-input"
            maxlength="100"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="form-group recipe-add__form-group">
        <label class="recipe-add__label" for="recipe-servings">Portionen</label>
        <div class="recipe-add__qty-row">
          <button
            class="button button-outline recipe-add__qty-btn"
            :disabled="form.servings <= 1"
            aria-label="Weniger Portionen"
            type="button"
            @click="form.servings = Math.max(1, form.servings - 1)"
          >
            <AppIcon name="remove" size="1rem" />
          </button>
          <div class="input-group recipe-add__qty-field">
            <input
              id="recipe-servings"
              v-model.number="form.servings"
              type="number"
              min="1"
              max="99"
              class="recipe-add__qty-input"
              aria-label="Anzahl Portionen"
            />
            <span class="recipe-add__qty-unit">Portionen</span>
          </div>
          <button
            class="button button-outline recipe-add__qty-btn"
            aria-label="Mehr Portionen"
            type="button"
            @click="form.servings = Math.min(99, form.servings + 1)"
          >
            <AppIcon name="add" size="1rem" />
          </button>
        </div>
      </div>

      <div class="form-group recipe-add__form-group">
        <div class="recipe-add__label-row">
          <label class="recipe-add__label" for="recipe-desc">Beschreibung</label>
          <span class="recipe-add__optional">optional</span>
        </div>
        <div class="input-group">
          <textarea
            id="recipe-desc"
            v-model="form.description"
            placeholder="Kurze Beschreibung …"
            class="recipe-add__textarea"
            maxlength="200"
            rows="3"
          />
        </div>
        <p class="recipe-add__char-count">{{ form.description.length }}/200</p>
      </div>

      <div class="recipe-add__actions">
        <button
          class="button button-primary recipe-add__next-btn"
          :disabled="!form.name.trim() || isCreating"
          type="button"
          @click="goToStep2"
        >
          <span v-if="isCreating" class="loading" />
          <template v-else>
            Weiter
            <AppIcon name="arrow_forward" size="1rem" />
          </template>
        </button>
      </div>

    </div>

    <!-- ── Step 2: Zutaten ───────────────────────────────────── -->
    <div v-else class="recipe-add__step">

      <!-- Recipe summary chip -->
      <div class="recipe-add__recipe-chip">
        <AppIcon name="menu_book" size="0.9rem" class="recipe-add__chip-icon" />
        <span class="recipe-add__chip-name">{{ form.name }}</span>
        <span class="recipe-add__chip-servings">· {{ form.servings }} Portion{{ form.servings === 1 ? '' : 'en' }}</span>
      </div>

      <!-- Food search -->
      <div class="recipe-add__search">
        <div class="input-group recipe-add__search-field">
          <AppIcon name="search" size="1.25rem" class="recipe-add__search-icon" />
          <input
            ref="ingSearchInput"
            v-model="ingSearchQuery"
            type="search"
            class="recipe-add__search-input"
            placeholder="Zutat suchen …"
            aria-label="Zutat suchen"
            @input="handleIngSearch"
            @search="handleIngSearch"
          />
          <button
            v-if="ingSearchQuery"
            class="button button-icon recipe-add__search-clear"
            aria-label="Suche löschen"
            @click="clearIngSearch"
          >
            <AppIcon name="close" size="1rem" />
          </button>
        </div>
      </div>

      <!-- Search results -->
      <ul
        v-if="ingSearchQuery.trim() && foodStore.items.length"
        class="recipe-add__results"
        role="list"
        aria-label="Suchergebnisse"
      >
        <li
          v-for="(item, idx) in foodStore.items"
          :key="item.id"
          class="recipe-add__result-item"
          :style="{ animationDelay: `${Math.min(idx, 5) * 30}ms` }"
          @click="selectFood(item)"
        >
          <div class="recipe-add__result-body">
            <span class="recipe-add__result-name">{{ item.name }}</span>
            <span v-if="item.brand" class="recipe-add__result-brand">{{ item.brand }}</span>
          </div>
          <div class="recipe-add__result-meta">
            <span class="recipe-add__result-kcal">{{ Math.round(item.calories_per_100g) }}</span>
            <span class="recipe-add__result-kcal-unit">kcal</span>
          </div>
        </li>
      </ul>

      <!-- No search results -->
      <div
        v-else-if="ingSearchQuery.trim() && !foodStore.items.length"
        class="recipe-add__search-empty"
      >
        <AppIcon name="search_off" size="1.5rem" class="recipe-add__search-empty-icon" />
        <p>Kein Lebensmittel gefunden.</p>
      </div>

      <!-- Ingredient list (when not searching) -->
      <template v-if="!ingSearchQuery.trim()">
        <p v-if="liveIngredients.length" class="recipe-add__section-label">Zutaten</p>

        <ul v-if="liveIngredients.length" class="recipe-add__ing-list" role="list">
          <li
            v-for="ing in liveIngredients"
            :key="ing.id"
            class="recipe-add__ing-item"
          >
            <div class="recipe-add__ing-body">
              <span class="recipe-add__ing-name">{{ ing.food.name }}</span>
              <span class="recipe-add__ing-meta">
                {{ ing.amount_g }}g &middot; {{ Math.round(ing.food.calories_per_100g * ing.amount_g / 100) }} kcal
              </span>
            </div>
            <button
              class="button button-icon recipe-add__ing-delete"
              :aria-label="`${ing.food.name} entfernen`"
              @click="handleRemoveIngredient(ing)"
            >
              <AppIcon name="delete_outline" size="1.125rem" />
            </button>
          </li>
        </ul>

        <!-- Empty ingredient prompt -->
        <div v-else class="recipe-add__ing-empty">
          <AppIcon name="add_shopping_cart" size="2rem" class="recipe-add__ing-empty-icon" />
          <p class="recipe-add__ing-empty-hint">Suche nach Zutaten und füge sie hinzu.</p>
        </div>

        <!-- Live nutrition preview -->
        <div v-if="liveNutrition" class="recipe-add__nutrition card">
          <p class="recipe-add__nutrition-title">Pro Portion</p>
          <div class="recipe-add__nutrition-grid">
            <div class="recipe-add__nutrition-item">
              <span class="recipe-add__nutrition-value recipe-add__nutrition-value--cal">{{ liveNutrition.cal }}</span>
              <span class="recipe-add__nutrition-label">kcal</span>
            </div>
            <div class="recipe-add__nutrition-item">
              <span class="recipe-add__nutrition-value recipe-add__nutrition-value--protein">{{ liveNutrition.protein }}g</span>
              <span class="recipe-add__nutrition-label">Protein</span>
            </div>
            <div class="recipe-add__nutrition-item">
              <span class="recipe-add__nutrition-value recipe-add__nutrition-value--carbs">{{ liveNutrition.carbs }}g</span>
              <span class="recipe-add__nutrition-label">Kohlenhydr.</span>
            </div>
            <div class="recipe-add__nutrition-item">
              <span class="recipe-add__nutrition-value recipe-add__nutrition-value--fat">{{ liveNutrition.fat }}g</span>
              <span class="recipe-add__nutrition-label">Fett</span>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <div class="recipe-add__actions">
          <button
            class="button button-primary recipe-add__save-btn"
            type="button"
            @click="saveRecipe"
          >
            <AppIcon name="check" size="1rem" />
            Rezept speichern
          </button>
        </div>

      </template>

    </div>
  </div>

  <!-- Ingredient amount bottom sheet -->
  <Teleport to="body">
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
        aria-label="Zutat hinzufügen"
      >
        <div class="bottom-sheet-handle" aria-hidden="true" />

        <div class="bottom-sheet-header has-divider">
          <div class="recipe-add-sheet__title-group">
            <p class="title">{{ selectedFood?.name }}</p>
            <p class="subtitle">
              {{ selectedFood ? Math.round(selectedFood.calories_per_100g) : '—' }} kcal / 100g
            </p>
          </div>
          <button
            class="close button button-icon"
            aria-label="Schließen"
            @click="closeIngSheet"
          >
            <AppIcon name="close" size="1.25rem" />
          </button>
        </div>

        <div class="bottom-sheet-body">

          <!-- Amount control -->
          <div class="recipe-add-sheet__section">
            <p class="recipe-add-sheet__section-label">Menge</p>
            <div class="recipe-add-sheet__amount">
              <button
                class="button button-outline recipe-add-sheet__amount-btn"
                :disabled="ingAmount <= 10"
                aria-label="10g weniger"
                @click="ingAmount = Math.max(1, ingAmount - 10)"
              >
                <AppIcon name="remove" size="1rem" />
              </button>
              <div class="form-group recipe-add-sheet__amount-group">
                <div class="input-group">
                  <input
                    v-model.number="ingAmount"
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    aria-label="Menge in Gramm"
                    class="recipe-add-sheet__amount-input"
                  />
                  <span class="recipe-add-sheet__amount-unit">g</span>
                </div>
              </div>
              <button
                class="button button-outline recipe-add-sheet__amount-btn"
                aria-label="10g mehr"
                @click="ingAmount = Math.min(9999, ingAmount + 10)"
              >
                <AppIcon name="add" size="1rem" />
              </button>
            </div>
          </div>

          <!-- Nutrition preview -->
          <div v-if="ingSheetNutrition" class="recipe-add-sheet__nutrition">
            <div class="recipe-add-sheet__nutrition-item">
              <span class="recipe-add-sheet__nutrition-value">{{ ingSheetNutrition.cal }}</span>
              <span class="recipe-add-sheet__nutrition-label">kcal</span>
            </div>
            <div class="recipe-add-sheet__nutrition-item">
              <span class="recipe-add-sheet__nutrition-value recipe-add-sheet__nutrition-value--protein">
                {{ ingSheetNutrition.protein }}g
              </span>
              <span class="recipe-add-sheet__nutrition-label">Protein</span>
            </div>
            <div class="recipe-add-sheet__nutrition-item">
              <span class="recipe-add-sheet__nutrition-value recipe-add-sheet__nutrition-value--carbs">
                {{ ingSheetNutrition.carbs }}g
              </span>
              <span class="recipe-add-sheet__nutrition-label">Kohlenhydrate</span>
            </div>
            <div class="recipe-add-sheet__nutrition-item">
              <span class="recipe-add-sheet__nutrition-value recipe-add-sheet__nutrition-value--fat">
                {{ ingSheetNutrition.fat }}g
              </span>
              <span class="recipe-add-sheet__nutrition-label">Fett</span>
            </div>
          </div>

        </div>

        <div class="bottom-sheet-footer">
          <div class="buttons">
            <button class="button" @click="closeIngSheet">Abbrechen</button>
            <button
              class="button button-primary"
              :disabled="isAddingIng"
              @click="handleAddIngredient"
            >
              <span v-if="isAddingIng" class="loading" />
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

definePageMeta({ title: 'Neues Rezept' })

const recipesStore = useRecipesStore()
const foodStore = useFoodStore()
const router = useRouter()

// ─── Step state ────────────────────────────────────────────────────────────────

const step = ref<1 | 2>(1)
const recipeId = ref<string | null>(null)
const isCreating = ref(false)

// ─── Form ──────────────────────────────────────────────────────────────────────

const form = reactive({
  name: '',
  servings: 1,
  description: '',
})

function handleBack() {
  if (step.value === 2) {
    step.value = 1
  } else {
    router.back()
  }
}

async function goToStep2() {
  if (!form.name.trim() || isCreating.value) return
  isCreating.value = true
  try {
    if (!recipeId.value) {
      // First visit to step 2: create the recipe
      const id = await recipesStore.createRecipe(
        form.name.trim(),
        form.servings,
        form.description.trim() || undefined,
      )
      recipeId.value = id
    } else {
      // Returning to step 2: update base info
      await recipesStore.updateRecipe(recipeId.value, {
        name: form.name.trim(),
        servings: form.servings,
        description: form.description.trim() || undefined,
      })
    }
    await recipesStore.loadRecipe(recipeId.value)
    step.value = 2
  } finally {
    isCreating.value = false
  }
}

// ─── Live nutrition ────────────────────────────────────────────────────────────

const liveIngredients = computed(() => recipesStore.activeRecipe?.ingredients ?? [])

const liveNutrition = computed(() => {
  const ings = liveIngredients.value
  if (!ings.length) return null
  const s = Math.max(1, form.servings)
  const totalCal     = ings.reduce((acc, ing) => acc + ing.food.calories_per_100g * ing.amount_g / 100, 0)
  const totalProtein = ings.reduce((acc, ing) => acc + ing.food.protein_per_100g  * ing.amount_g / 100, 0)
  const totalCarbs   = ings.reduce((acc, ing) => acc + ing.food.carbs_per_100g    * ing.amount_g / 100, 0)
  const totalFat     = ings.reduce((acc, ing) => acc + ing.food.fat_per_100g      * ing.amount_g / 100, 0)
  return {
    cal:     Math.round(totalCal / s),
    protein: +(totalProtein / s).toFixed(1),
    carbs:   +(totalCarbs   / s).toFixed(1),
    fat:     +(totalFat     / s).toFixed(1),
  }
})

// ─── Food search ───────────────────────────────────────────────────────────────

const ingSearchQuery = ref('')
const ingSearchInput = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleIngSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (ingSearchQuery.value.trim()) {
      await foodStore.search(ingSearchQuery.value)
    }
  }, 300)
}

function clearIngSearch() {
  ingSearchQuery.value = ''
  if (searchTimer) clearTimeout(searchTimer)
  ingSearchInput.value?.focus()
}

// ─── Ingredient bottom sheet ───────────────────────────────────────────────────

const ingSheetVisible = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const ingAmount = ref(100)
const isAddingIng = ref(false)

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

function selectFood(food: FoodItem) {
  selectedFood.value = food
  ingAmount.value = 100
  ingSheetVisible.value = true
  document.body.style.overflow = 'hidden'
  ingSearchQuery.value = ''
}

function closeIngSheet() {
  ingSheetVisible.value = false
  document.body.style.overflow = ''
  setTimeout(() => { selectedFood.value = null }, 420)
}

async function handleAddIngredient() {
  if (!selectedFood.value || !recipeId.value || isAddingIng.value) return
  isAddingIng.value = true
  try {
    await recipesStore.addIngredient(recipeId.value, selectedFood.value.id, ingAmount.value)
    await recipesStore.loadRecipe(recipeId.value)
    closeIngSheet()
  } finally {
    isAddingIng.value = false
  }
}

async function handleRemoveIngredient(ing: { id: string; recipe_id: string }) {
  await recipesStore.removeIngredient(ing.id, ing.recipe_id)
  if (recipeId.value) {
    await recipesStore.loadRecipe(recipeId.value)
  }
}

// ─── Save ──────────────────────────────────────────────────────────────────────

function saveRecipe() {
  navigateTo('/recipes')
}

// ─── Keyboard ──────────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ingSheetVisible.value) closeIngSheet()
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
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Animations ───────────────────────────────────────────────────────────────

@keyframes itemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes stepIn {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .recipe-add__result-item,
  .recipe-add__step { animation: none !important; }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.recipe-add {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1);
  padding-bottom: calc(#{$spacing} * 3);
}

// ─── Header ───────────────────────────────────────────────────────────────────

.recipe-add__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-add__back {
  flex-shrink: 0;
  margin-left: calc(#{$spacing} * -0.5);
}

.recipe-add__title-group {
  min-width: 0;
}

.recipe-add__title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--primary-text);
  line-height: 1.1;
}

.recipe-add__step-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--secondary-text);
  margin-top: 0.15rem;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

.recipe-add__progress {
  margin: 0 0 calc(#{$spacing} * 0.25);
}

.recipe-add__progress-track {
  height: 3px;
  background: var(--divider);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.recipe-add__progress-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: var(--radius-full);
  transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

.recipe-add__step {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 1);
  animation: stepIn 350ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

// ─── Form groups ──────────────────────────────────────────────────────────────

.recipe-add__form-group {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.4);
  margin: 0;
}

.recipe-add__label-row {
  display: flex;
  align-items: baseline;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-add__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
}

.recipe-add__optional {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--secondary-text);
  opacity: 0.65;
}

.recipe-add__text-input {
  width: 100%;
  font-size: 1rem;
  font-weight: 600;
}

.recipe-add__char-count {
  font-size: 0.72rem;
  color: var(--secondary-text);
  text-align: right;
  margin-top: calc(#{$spacing} * 0.15);
}

.recipe-add__textarea {
  width: 100%;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.5;
  min-height: 5rem;
}

// ─── Servings qty row ──────────────────────────────────────────────────────────

.recipe-add__qty-row {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-add__qty-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.recipe-add__qty-field {
  flex: 1;
  margin: 0;
  display: flex;
  align-items: center;
}

.recipe-add__qty-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.recipe-add__qty-unit {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  white-space: nowrap;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

.recipe-add__actions {
  margin-top: calc(#{$spacing} * 0.5);
}

.recipe-add__next-btn,
.recipe-add__save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

// ─── Recipe chip (step 2 header) ──────────────────────────────────────────────

.recipe-add__recipe-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--accent-color-tint);
  border-radius: var(--radius-full);
  padding: 0.3rem 0.75rem;
  align-self: flex-start;
}

.recipe-add__chip-icon {
  color: var(--accent-color);
  flex-shrink: 0;
}

.recipe-add__chip-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-color);
  max-width: 16ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-add__chip-servings {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--accent-color);
  opacity: 0.8;
  white-space: nowrap;
}

// ─── Search (step 2) ──────────────────────────────────────────────────────────

.recipe-add__search {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(#{$spacing} * 0.25) 0;
  background: var(--background);
}

.recipe-add__search-field {
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

.recipe-add__search-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
}

.recipe-add__search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--primary-text);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  min-width: 0;

  &::placeholder {
    color: var(--secondary-text);
    opacity: 0.7;
  }

  &::-webkit-search-cancel-button { display: none; }
}

.recipe-add__search-clear {
  flex-shrink: 0;
  color: var(--secondary-text);
  padding: 0.2rem;
  margin: -0.2rem;
  transition: color 150ms ease;

  &:hover { color: var(--primary-text); }
}

// ─── Search results ───────────────────────────────────────────────────────────

.recipe-add__results {
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

.recipe-add__result-item {
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

.recipe-add__result-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.recipe-add__result-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.recipe-add__result-brand {
  font-size: 0.72rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-add__result-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.recipe-add__result-kcal {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.recipe-add__result-kcal-unit {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  line-height: 1;
}

.recipe-add__search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: calc(#{$spacing} * 1.5) 0;
  color: var(--secondary-text);
  font-size: 0.85rem;
  text-align: center;
}

.recipe-add__search-empty-icon {
  opacity: 0.4;
}

// ─── Section label ────────────────────────────────────────────────────────────

.recipe-add__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

// ─── Ingredient list ──────────────────────────────────────────────────────────

.recipe-add__ing-list {
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

.recipe-add__ing-item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.75) $spacing;
  background: var(--primary-bg);

  &:first-child { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  &:last-child  { border-radius: 0 0 var(--radius-xl) var(--radius-xl); }
  &:only-child  { border-radius: var(--radius-xl); }
}

.recipe-add__ing-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.recipe-add__ing-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-add__ing-meta {
  font-size: 0.75rem;
  color: var(--secondary-text);
}

.recipe-add__ing-delete {
  flex-shrink: 0;
  color: var(--error);
  opacity: 0.7;
  transition: opacity 150ms ease;
  width: 2rem;
  height: 2rem;
  padding: 0;

  &:hover,
  &:focus-visible { opacity: 1; }
}

.recipe-add__ing-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: calc(#{$spacing} * 1.5) 0;
  text-align: center;
}

.recipe-add__ing-empty-icon {
  color: var(--secondary-text);
  opacity: 0.35;
}

.recipe-add__ing-empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 24ch;
  line-height: 1.4;
}

// ─── Live nutrition card ──────────────────────────────────────────────────────

.recipe-add__nutrition {
  padding: calc(#{$spacing} * 0.875) $spacing;
  background: var(--primary-bg);
}

.recipe-add__nutrition-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  margin-bottom: calc(#{$spacing} * 0.6);
}

.recipe-add__nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
}

.recipe-add__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.recipe-add__nutrition-value {
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

.recipe-add__nutrition-label {
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

// ─── Ingredient sheet content ─────────────────────────────────────────────────

.recipe-add-sheet__title-group {
  flex: 1;
  min-width: 0;

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.recipe-add-sheet__section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: $spacing;
}

.recipe-add-sheet__section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
}

.recipe-add-sheet__amount {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
}

.recipe-add-sheet__amount-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.recipe-add-sheet__amount-group {
  flex: 1;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.recipe-add-sheet__amount-input {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.recipe-add-sheet__amount-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-text);
  padding-right: calc(#{$spacing} * 0.5);
  flex-shrink: 0;
}

.recipe-add-sheet__nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(#{$spacing} * 0.5);
  background: var(--secondary-background);
  border-radius: var(--radius-lg);
  padding: calc(#{$spacing} * 0.875);
  margin-bottom: calc(#{$spacing} * 0.5);
}

.recipe-add-sheet__nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.recipe-add-sheet__nutrition-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
  line-height: 1.1;

  &--protein { color: $macro-protein; }
  &--carbs   { color: $macro-carbs; }
  &--fat     { color: $macro-fat; }
}

.recipe-add-sheet__nutrition-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
</style>
