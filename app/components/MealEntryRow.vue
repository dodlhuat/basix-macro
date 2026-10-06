<template>
  <li
    class="meal-entry"
    :class="{ 'meal-entry--editing': editing }"
  >
    <!-- The whole row is one tap target that toggles the inline edit panel. -->
    <button
      ref="rowEl"
      type="button"
      class="meal-entry__row"
      :aria-label="rowLabel"
      :aria-expanded="editing"
      :aria-controls="editing ? panelId : undefined"
      @click="editing ? emit('close') : emit('open')"
    >
      <span class="meal-entry__info">
        <span class="meal-entry__name">{{ entry.food_item_name }}</span>
        <span v-if="amountLabel" class="meal-entry__amount">{{ amountLabel }}</span>
      </span>
      <span class="meal-entry__kcal">{{ kcal }} kcal</span>
      <AppIcon name="chevron_right" size="1.1rem" class="meal-entry__chevron" />
    </button>

    <form
      v-if="editing"
      :id="panelId"
      class="meal-entry__edit"
      role="group"
      :aria-label="entry.food_item_name"
      @submit.prevent="save"
      @keydown.esc.stop="close"
    >
      <div class="meal-entry__edit-top">
        <span class="meal-entry__edit-label">{{ fieldLabel }}</span>
        <div class="meal-entry__stepper">
          <button
            type="button"
            class="button button-outline meal-entry__step-btn"
            :disabled="value - step < MIN"
            :aria-label="$t('diary.sheet.decrease')"
            @click="adjust(-step)"
          >
            <AppIcon name="remove" size="1rem" />
          </button>
          <div class="form-group meal-entry__group">
            <div class="input-group">
              <input
                ref="inputEl"
                v-model.number="value"
                type="number"
                :inputmode="isQuick || isRecipe ? 'numeric' : 'decimal'"
                enterkeyhint="done"
                :min="MIN"
                :max="max"
                step="1"
                :aria-label="fieldLabel"
                class="meal-entry__input"
              >
              <span class="meal-entry__unit">{{ unit }}</span>
            </div>
          </div>
          <button
            type="button"
            class="button button-outline meal-entry__step-btn"
            :disabled="value + step > max"
            :aria-label="$t('diary.sheet.increase')"
            @click="adjust(step)"
          >
            <AppIcon name="add" size="1rem" />
          </button>
        </div>
      </div>

      <div class="meal-entry__actions">
        <button type="submit" class="button button-sm button-primary" :disabled="!isValid">
          {{ $t('common.save') }}
        </button>
        <button type="button" class="button button-sm button-outline" @click="close">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="button button-icon meal-entry__delete"
          :aria-label="$t('entry.delete', { name: entry.food_item_name })"
          @click="remove"
        >
          <AppIcon name="delete" size="1.25rem" />
        </button>
      </div>
    </form>
  </li>
</template>

<script setup lang="ts">
import type { DiaryEntryWithName } from '~/stores/diary'

/**
 * One diary entry inside a meal section (dashboard + diary/[date]).
 * Tap the row to open an inline edit panel: quantity stepper (grams / servings)
 * or a kcal field for quick-add entries, plus save / cancel / delete. Delete is
 * immediate and recoverable through the shared <MealUndoBar />.
 * The parent only owns *which* entry is open, so only one panel is open at once.
 */
const props = defineProps<{
  entry: DiaryEntryWithName
  date: string
  editing: boolean
}>()

const emit = defineEmits<{
  open: []
  close: []
}>()

const MIN = 1

const { t } = useI18n()
const diaryStore = useDiaryStore()
const dateRef = computed(() => props.date)
const { deleteEntryWithUndo } = useMealClipboard(dateRef)

const rowEl = ref<HTMLButtonElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const panelId = `meal-entry-${props.entry.id}`

const isQuick = computed(() => props.entry.is_quick_add)
const isRecipe = computed(() => !!props.entry.recipe_id)

const kcal = computed(() => Math.round(props.entry.calories_total))

const amountLabel = computed(() => {
  if (isQuick.value) return ''
  return isRecipe.value
    ? `${props.entry.servings} ${t('diary.sheet.portion')}`
    : `${props.entry.amount_g} g`
})

const rowLabel = computed(() =>
  isQuick.value
    ? t('entry.rowLabelQuick', { name: props.entry.food_item_name, kcal: kcal.value })
    : t('entry.rowLabel', { name: props.entry.food_item_name, amount: amountLabel.value, kcal: kcal.value })
)

const fieldLabel = computed(() => {
  if (isQuick.value) return t('common.calories')
  return isRecipe.value ? t('diary.sheet.servings') : t('diary.sheet.amount')
})

const unit = computed(() => {
  if (isQuick.value) return 'kcal'
  return isRecipe.value ? t('diary.sheet.portion') : 'g'
})

const step = computed(() => (isRecipe.value && !isQuick.value ? 1 : 10))
const max = computed(() => {
  if (isQuick.value) return 99999
  return isRecipe.value ? 99 : 9999
})

const value = ref<number>(0)

const isValid = computed(() => Number.isFinite(value.value) && value.value >= MIN)

function initialValue(): number {
  if (isQuick.value) return Math.round(props.entry.calories_total)
  return isRecipe.value ? props.entry.servings : props.entry.amount_g
}

function adjust(delta: number): void {
  const current = Number.isFinite(value.value) ? value.value : 0
  value.value = Math.min(max.value, Math.max(MIN, current + delta))
}

// Opening: seed the field and move focus into it. Closing is handled by the
// explicit handlers below (focus back to the row), so a panel that closes
// because *another* row opened never steals focus.
watch(() => props.editing, async (open) => {
  if (!open) return
  value.value = initialValue()
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}, { immediate: true, flush: 'post' })

function focusRow(): void {
  nextTick(() => rowEl.value?.focus())
}

function close(): void {
  emit('close')
  focusRow()
}

async function save(): Promise<void> {
  if (!isValid.value) return
  const next = isQuick.value || !isRecipe.value ? Math.round(value.value * 100) / 100 : Math.round(value.value)
  if (isQuick.value) {
    await diaryStore.updateQuickEntryCalories(props.entry.id, Math.round(next))
  } else {
    await diaryStore.updateEntryQuantity(props.entry.id, next)
  }
  close()
}

async function remove(): Promise<void> {
  // Focus a neighbour that survives the removal: next row, else previous row,
  // else the meal's add button.
  const li = rowEl.value?.closest('li')
  const neighbour = (li?.nextElementSibling ?? li?.previousElementSibling)
    ?.querySelector<HTMLElement>('.meal-entry__row')
  const fallback = li?.closest('[data-meal]')?.querySelector<HTMLElement>('[data-meal-focus]')
  emit('close')
  await deleteEntryWithUndo(props.entry)
  await nextTick()
  ;(neighbour ?? fallback)?.focus()
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;

$bleed: 0.5rem; // row tint extends past the text column by this much

.meal-entry {
  position: relative;
  // Basix typography sets `ul li { list-style-type: disc }` on the li itself,
  // so the list's own `list-style: none` is not inherited.
  list-style: none;
  margin-inline: -#{$bleed};
  border-radius: $border-radius;
  transition: background-color $duration-fast $ease-standard;

  // Hairline between rows, inset to the text column.
  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    inset-inline: $bleed;
    height: 1px;
    background: var(--divider);
  }

  &--editing {
    margin-block: 0.15rem;
    background: var(--accent-color-tint);

    &::before { display: none; }
  }

  &--editing + &::before { display: none; }
}

// ─── Row (single tap target) ──────────────────────────────────────────────────

.meal-entry__row {
  display: flex;
  align-items: center;
  gap: $spacing;
  width: 100%;
  min-height: 3.25rem; // 52px
  padding: 0.5rem $bleed;
  margin: 0;
  border: 0;
  border-radius: $border-radius;
  background: transparent;
  color: var(--primary-text);
  font: inherit;
  text-align: left;
  white-space: normal; // Basix buttons are nowrap; names may wrap to 2 lines
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color $duration-fast $ease-standard;

  // Text-colour tints rather than Basix --hover (4-5% black/white): on the
  // accent-washed "current meal" section that token was nearly invisible.
  //
  // Meta text (amount, chevron) darkens 50% toward --primary-text while the
  // tint is shown, so it keeps >= 4.5:1 on the tinted surface. A parent can
  // raise the resting colour via --entry-meta-rest (the dashboard's accent-
  // washed "current meal" does, see index.vue).
  --entry-meta: var(--entry-meta-rest, var(--secondary-text));

  &:hover,
  &:active {
    --entry-meta: color-mix(in srgb, var(--entry-meta-rest, var(--secondary-text)) 50%, var(--primary-text));
  }

  &:hover { background: color-mix(in srgb, var(--primary-text) 8%, transparent); }
  &:active { background: color-mix(in srgb, var(--primary-text) 13%, transparent); }

  &:focus-visible {
    outline: 2px solid var(--app-accent-text);
    outline-offset: -2px;
  }
}

.meal-entry--editing .meal-entry__row:hover {
  background: transparent;
}

.meal-entry__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.meal-entry__name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: var(--fs-base);
  font-weight: 500;
  line-height: 1.3;
  color: var(--primary-text);
}

.meal-entry__amount {
  font-size: var(--fs-xs);
  color: var(--entry-meta, var(--secondary-text));
}

.meal-entry__kcal {
  flex-shrink: 0;
  font-size: var(--fs-sm);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--primary-text);
}

// Affordance only: on hover-capable devices it fades in on hover/focus; while
// the panel is open it points down on every device.
.meal-entry__chevron {
  display: none;
  flex-shrink: 0;
  margin-inline-start: -0.35rem;
  color: var(--entry-meta, var(--secondary-text));
  transition: transform $duration-fast $ease-standard, opacity $duration-fast $ease-standard;
}

@media (hover: hover) {
  .meal-entry__chevron {
    display: block;
    opacity: 0;
  }

  .meal-entry__row:hover .meal-entry__chevron,
  .meal-entry__row:focus-visible .meal-entry__chevron {
    opacity: 1;
  }
}

.meal-entry--editing .meal-entry__chevron {
  display: block;
  opacity: 1;
  transform: rotate(90deg);
}

// ─── Inline edit panel ────────────────────────────────────────────────────────

.meal-entry__edit {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.1rem $bleed 0.6rem;
  animation: mealEntryOpen 180ms $ease-out-soft;
}

@keyframes mealEntryOpen {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.meal-entry__edit-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.meal-entry__edit-label {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary-text);
}

.meal-entry__stepper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.meal-entry__step-btn {
  @include tap-target;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

.meal-entry__group {
  flex: 1;
  min-width: 0;
  margin: 0;

  .input-group {
    display: flex;
    align-items: center;
  }
}

.meal-entry__input {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: var(--fs-base);
  font-weight: 700;
  letter-spacing: -0.02em;
  appearance: textfield; // steppers are the +/- buttons, hide native spin arrows

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }
}

.meal-entry__unit {
  flex-shrink: 0;
  padding-right: calc(#{$spacing} * 0.5);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--secondary-text);
}

// Save / cancel on the left, delete pushed to the far right edge with at least
// 3rem (48px) of clear space so a mis-tap on Save can never hit the trash.
.meal-entry__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.meal-entry__delete {
  width: 2.75rem;
  height: 2.75rem;
  margin-inline-start: auto;
  padding: 0;
  border-color: transparent;
  background: transparent;
  color: var(--secondary-text);
  transition: color $duration-fast $ease-standard, background-color $duration-fast $ease-standard;

  &:hover,
  &:focus-visible {
    color: var(--error-text);
    background: var(--error-tint);
  }
}

.meal-entry__actions::before {
  content: '';
  order: 2;
  flex: 0 0 2.3rem; // + 2x gap = >=48px clear space to the trash
}

.meal-entry__delete { order: 3; }

@media (prefers-reduced-motion: reduce) {
  .meal-entry,
  .meal-entry__row,
  .meal-entry__chevron,
  .meal-entry__delete {
    transition: none;
  }

  .meal-entry__edit {
    animation: none;
  }
}
</style>
