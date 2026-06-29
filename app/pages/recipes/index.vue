<template>
  <div class="recipe-list page-content">

    <!-- Search bar -->
    <div class="recipe-list__search">
      <div class="input-group recipe-list__search-field">
        <AppIcon name="search" size="1.25rem" class="recipe-list__search-icon" />
        <input
          ref="searchInput"
          v-model="localQuery"
          type="search"
          class="recipe-list__search-input"
          placeholder="Rezept suchen …"
          aria-label="Rezept suchen"
        />
        <button
          v-if="localQuery"
          class="button button-icon recipe-list__search-clear"
          aria-label="Suche löschen"
          @click="clearSearch"
        >
          <AppIcon name="close" size="1rem" />
        </button>
      </div>
    </div>

    <!-- Recipe list -->
    <ul
      v-if="filteredRecipes.length"
      class="recipe-list__items"
      role="list"
      aria-label="Rezeptliste"
    >
      <li
        v-for="(recipe, idx) in filteredRecipes"
        :key="recipe.id"
        class="recipe-list__item"
        :style="{ animationDelay: `${Math.min(idx, 9) * 35}ms` }"
        @click="navigateTo(`/recipes/${recipe.id}/edit`)"
      >
        <div class="recipe-list__item-body">
          <span class="recipe-list__item-name">{{ recipe.name }}</span>
          <span v-if="recipe.description" class="recipe-list__item-desc">{{ recipe.description }}</span>
          <span class="recipe-list__item-servings">
            <AppIcon name="group" size="0.8rem" />
            {{ recipe.servings }} Portion{{ recipe.servings === 1 ? '' : 'en' }}
          </span>
        </div>
        <AppIcon name="chevron_right" size="1.125rem" class="recipe-list__item-arrow" />
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="recipe-list__empty">
      <template v-if="localQuery">
        <AppIcon name="search_off" size="2.5rem" class="recipe-list__empty-icon" />
        <p class="recipe-list__empty-title">Keine Treffer</p>
        <p class="recipe-list__empty-hint">Kein Rezept für „{{ localQuery }}" gefunden.</p>
      </template>
      <template v-else>
        <AppIcon name="menu_book" size="2.5rem" class="recipe-list__empty-icon" />
        <p class="recipe-list__empty-title">Noch keine Rezepte</p>
        <p class="recipe-list__empty-hint">Erstelle dein erstes Rezept.</p>
        <button
          class="button button-primary recipe-list__empty-action"
          @click="navigateTo('/recipes/add')"
        >
          <AppIcon name="add" size="1rem" />
          Rezept erstellen
        </button>
      </template>
    </div>

  </div>

  <!-- FAB -->
  <Teleport to="body">
    <button
      class="recipe-list__fab"
      aria-label="Neues Rezept erstellen"
      @click="navigateTo('/recipes/add')"
    >
      <AppIcon name="add" size="1.5rem" />
    </button>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Rezepte' })

const recipesStore = useRecipesStore()

// ─── Search ────────────────────────────────────────────────────────────────────

const localQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const filteredRecipes = computed(() => {
  if (!localQuery.value.trim()) return recipesStore.recipes
  const q = localQuery.value.toLowerCase()
  return recipesStore.recipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.description && r.description.toLowerCase().includes(q)),
  )
})

function clearSearch() {
  localQuery.value = ''
  searchInput.value?.focus()
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await recipesStore.loadAll()
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
  .recipe-list__item,
  .recipe-list__fab { animation: none !important; }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.875);
  padding-bottom: calc(#{$spacing} * 4 + 3.5rem);
}

// ─── Search ───────────────────────────────────────────────────────────────────

.recipe-list__search {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(#{$spacing} * 0.5) 0 calc(#{$spacing} * 0.25);
  background: var(--background);
}

.recipe-list__search-field {
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

.recipe-list__search-icon {
  color: var(--secondary-text);
  flex-shrink: 0;
}

.recipe-list__search-input {
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

.recipe-list__search-clear {
  flex-shrink: 0;
  color: var(--secondary-text);
  padding: 0.2rem;
  margin: -0.2rem;
  transition: color 150ms ease;

  &:hover { color: var(--primary-text); }
}

// ─── Recipe list ──────────────────────────────────────────────────────────────

.recipe-list__items {
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

.recipe-list__item {
  display: flex;
  align-items: center;
  gap: $spacing;
  padding: calc(#{$spacing} * 0.875) $spacing;
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

.recipe-list__item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.recipe-list__item-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.recipe-list__item-desc {
  font-size: 0.75rem;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-list__item-servings {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--secondary-text);
  margin-top: 0.1rem;
}

.recipe-list__item-arrow {
  color: var(--secondary-text);
  opacity: 0.4;
  flex-shrink: 0;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

.recipe-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  padding: calc(#{$spacing} * 3) $spacing;
  text-align: center;
}

.recipe-list__empty-icon {
  color: var(--secondary-text);
  opacity: 0.4;
  margin-bottom: calc(#{$spacing} * 0.25);
}

.recipe-list__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-text);
  letter-spacing: -0.02em;
}

.recipe-list__empty-hint {
  font-size: 0.85rem;
  color: var(--secondary-text);
  max-width: 22ch;
  line-height: 1.5;
}

.recipe-list__empty-action {
  margin-top: calc(#{$spacing} * 0.5);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

.recipe-list__fab {
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

  &:active { transform: scale(0.96); }

  &:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 3px;
  }
}
</style>
