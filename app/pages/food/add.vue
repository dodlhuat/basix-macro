<template>
  <div class="food-form page-content">

    <!-- Page header -->
    <div class="food-form__header">
      <button
        class="button button-icon food-form__back"
        aria-label="Zurück"
        @click="router.back()"
      >
        <AppIcon name="arrow_back" size="1.25rem" />
      </button>
      <h1 class="food-form__title">Neues Lebensmittel</h1>
    </div>

    <form class="food-form__body" @submit.prevent="handleSave" novalidate>

      <!-- Name -->
      <div class="form-group" :class="{ 'food-form__field--error': errors.name }">
        <label for="name">Name <span class="food-form__required" aria-hidden="true">*</span></label>
        <div class="input-group">
          <input
            id="name"
            v-model.trim="form.name"
            type="text"
            placeholder="z.B. Chicken Breast"
            autocomplete="off"
            :aria-invalid="!!errors.name"
            @blur="validateField('name')"
          />
        </div>
        <p v-if="errors.name" class="food-form__error-msg" role="alert">{{ errors.name }}</p>
      </div>

      <!-- Brand -->
      <div class="form-group">
        <label for="brand">Marke <span class="food-form__optional">(optional)</span></label>
        <div class="input-group">
          <input
            id="brand"
            v-model.trim="form.brand"
            type="text"
            placeholder="z.B. Kaufland"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Main macros grid -->
      <p class="food-form__section-title">Nährwerte pro 100g</p>

      <div class="food-form__macro-grid">

        <div class="form-group" :class="{ 'food-form__field--error': errors.calories_per_100g }">
          <label for="calories">
            <span class="food-form__macro-dot food-form__macro-dot--kcal" aria-hidden="true" />
            Kalorien <span class="food-form__unit">kcal</span>
            <span class="food-form__required" aria-hidden="true">*</span>
          </label>
          <div class="input-group">
            <input
              id="calories"
              v-model.number="form.calories_per_100g"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              :aria-invalid="!!errors.calories_per_100g"
              @blur="validateField('calories_per_100g')"
            />
          </div>
          <p v-if="errors.calories_per_100g" class="food-form__error-msg" role="alert">
            {{ errors.calories_per_100g }}
          </p>
        </div>

        <div class="form-group" :class="{ 'food-form__field--error': errors.protein_per_100g }">
          <label for="protein">
            <span class="food-form__macro-dot food-form__macro-dot--protein" aria-hidden="true" />
            Protein <span class="food-form__unit">g</span>
            <span class="food-form__required" aria-hidden="true">*</span>
          </label>
          <div class="input-group">
            <input
              id="protein"
              v-model.number="form.protein_per_100g"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              :aria-invalid="!!errors.protein_per_100g"
              @blur="validateField('protein_per_100g')"
            />
          </div>
          <p v-if="errors.protein_per_100g" class="food-form__error-msg" role="alert">
            {{ errors.protein_per_100g }}
          </p>
        </div>

        <div class="form-group" :class="{ 'food-form__field--error': errors.carbs_per_100g }">
          <label for="carbs">
            <span class="food-form__macro-dot food-form__macro-dot--carbs" aria-hidden="true" />
            Kohlenhydrate <span class="food-form__unit">g</span>
            <span class="food-form__required" aria-hidden="true">*</span>
          </label>
          <div class="input-group">
            <input
              id="carbs"
              v-model.number="form.carbs_per_100g"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              :aria-invalid="!!errors.carbs_per_100g"
              @blur="validateField('carbs_per_100g')"
            />
          </div>
          <p v-if="errors.carbs_per_100g" class="food-form__error-msg" role="alert">
            {{ errors.carbs_per_100g }}
          </p>
        </div>

        <div class="form-group" :class="{ 'food-form__field--error': errors.fat_per_100g }">
          <label for="fat">
            <span class="food-form__macro-dot food-form__macro-dot--fat" aria-hidden="true" />
            Fett <span class="food-form__unit">g</span>
            <span class="food-form__required" aria-hidden="true">*</span>
          </label>
          <div class="input-group">
            <input
              id="fat"
              v-model.number="form.fat_per_100g"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              :aria-invalid="!!errors.fat_per_100g"
              @blur="validateField('fat_per_100g')"
            />
          </div>
          <p v-if="errors.fat_per_100g" class="food-form__error-msg" role="alert">
            {{ errors.fat_per_100g }}
          </p>
        </div>

      </div>

      <!-- Live calorie sanity check -->
      <div v-if="macroCalories > 0" class="food-form__preview" role="status" aria-live="polite">
        <AppIcon name="info" size="0.9rem" class="food-form__preview-icon" />
        <span>
          Makros ergeben
          <strong>{{ macroCalories }} kcal</strong>
          <template v-if="calorieDeviation > 15">
            — abweichend von {{ form.calories_per_100g || 0 }} kcal (Angabe)
          </template>
        </span>
      </div>

      <!-- Optional fields -->
      <p class="food-form__section-title">Weitere Angaben <span class="food-form__optional">(optional)</span></p>

      <div class="food-form__macro-grid">
        <div class="form-group">
          <label for="fiber">Ballaststoffe <span class="food-form__unit">g</span></label>
          <div class="input-group">
            <input
              id="fiber"
              v-model.number="form.fiber_per_100g"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="sugar">Zucker <span class="food-form__unit">g</span></label>
          <div class="input-group">
            <input
              id="sugar"
              v-model.number="form.sugar_per_100g"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="barcode">Barcode</label>
        <div class="input-group">
          <input
            id="barcode"
            v-model.trim="form.barcode"
            type="text"
            inputmode="numeric"
            placeholder="EAN/GTIN"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Error summary -->
      <div v-if="submitError" class="alert alert-error food-form__alert" role="alert">
        {{ submitError }}
      </div>

      <!-- Actions -->
      <div class="food-form__actions">
        <button type="button" class="button food-form__cancel" @click="router.back()">
          Abbrechen
        </button>
        <button type="submit" class="button button-primary food-form__save" :disabled="isSaving">
          <span v-if="isSaving" class="loading" />
          <template v-else>
            <AppIcon name="check" size="1rem" />
            Speichern
          </template>
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Lebensmittel anlegen' })

const foodStore = useFoodStore()
const router = useRouter()
const route = useRoute()

// ─── Form state ───────────────────────────────────────────────────────────────

const form = reactive({
  name:              '',
  brand:             '',
  barcode:           '',
  calories_per_100g: null as number | null,
  protein_per_100g:  null as number | null,
  carbs_per_100g:    null as number | null,
  fat_per_100g:      null as number | null,
  fiber_per_100g:    null as number | null,
  sugar_per_100g:    null as number | null,
})

const errors = reactive<Record<string, string>>({})
const isSaving = ref(false)
const submitError = ref('')

// ─── Pre-fill barcode from scanner query param ────────────────────────────────

onMounted(() => {
  if (route.query.barcode) {
    form.barcode = String(route.query.barcode)
  }
})

// ─── Live calorie preview ─────────────────────────────────────────────────────

const macroCalories = computed(() => {
  const p = Number(form.protein_per_100g) || 0
  const c = Number(form.carbs_per_100g)   || 0
  const f = Number(form.fat_per_100g)     || 0
  return Math.round(p * 4 + c * 4 + f * 9)
})

const calorieDeviation = computed(() => {
  const entered = Number(form.calories_per_100g) || 0
  if (!entered || !macroCalories.value) return 0
  return Math.abs(((macroCalories.value - entered) / entered) * 100)
})

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g'] as const

function validateField(field: string) {
  if (field === 'name') {
    errors.name = form.name.trim() ? '' : 'Name ist erforderlich.'
  } else {
    const val = (form as Record<string, unknown>)[field]
    errors[field] = val !== null && val !== undefined && Number(val) >= 0
      ? ''
      : 'Gib einen Wert ≥ 0 ein.'
  }
}

function validateAll(): boolean {
  let valid = true
  for (const f of REQUIRED_FIELDS) {
    validateField(f)
    if (errors[f]) valid = false
  }
  return valid
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function handleSave() {
  submitError.value = ''
  if (!validateAll()) return
  isSaving.value = true
  try {
    await foodStore.addItem({
      name:              form.name,
      brand:             form.brand || undefined,
      barcode:           form.barcode || undefined,
      calories_per_100g: Number(form.calories_per_100g),
      protein_per_100g:  Number(form.protein_per_100g),
      carbs_per_100g:    Number(form.carbs_per_100g),
      fat_per_100g:      Number(form.fat_per_100g),
      fiber_per_100g:    form.fiber_per_100g != null ? Number(form.fiber_per_100g) : undefined,
      sugar_per_100g:    form.sugar_per_100g != null ? Number(form.sugar_per_100g) : undefined,
      source:            'manual',
      is_favorite:       false,
    })
    navigateTo('/food')
  } catch {
    submitError.value = 'Speichern fehlgeschlagen. Bitte versuche es erneut.'
  } finally {
    isSaving.value = false
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

// ─── Layout ───────────────────────────────────────────────────────────────────

.food-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.food-form__header {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.5);
  margin-bottom: calc(#{$spacing} * 1.25);
}

.food-form__back {
  flex-shrink: 0;
  margin-left: calc(#{$spacing} * -0.5);
}

.food-form__title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--primary-text);
  line-height: 1.1;
}

.food-form__body {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing} * 0.75);
}

// ─── Section title ────────────────────────────────────────────────────────────

.food-form__section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--secondary-text);
  margin-top: calc(#{$spacing} * 0.5);
  margin-bottom: calc(#{$spacing} * -0.25);
}

// ─── Macro grid (2 columns) ───────────────────────────────────────────────────

.food-form__macro-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(#{$spacing} * 0.75);
}

// ─── Labels & helpers ─────────────────────────────────────────────────────────

.food-form__unit {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--secondary-text);
  margin-left: 0.15rem;
}

.food-form__optional {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--secondary-text);
}

.food-form__required {
  color: var(--error);
  margin-left: 0.1rem;
}

// ─── Macro colored dots ───────────────────────────────────────────────────────

.food-form__macro-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 0.3rem;
  vertical-align: middle;

  &--kcal    { background: var(--accent-color); }
  &--protein { background: #ef4444; }
  &--carbs   { background: #3b82f6; }
  &--fat     { background: #f59e0b; }
}

// ─── Error state ──────────────────────────────────────────────────────────────

.food-form__field--error {
  label { color: var(--error); }

  .input-group {
    border-color: var(--error);
    box-shadow: 0 0 0 2px var(--error-tint);
  }
}

.food-form__error-msg {
  font-size: 0.75rem;
  color: var(--error);
  margin-top: 0.2rem;
}

// ─── Live calorie preview ─────────────────────────────────────────────────────

.food-form__preview {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing} * 0.4);
  background: var(--secondary-background);
  border-radius: var(--radius-md);
  padding: calc(#{$spacing} * 0.6) calc(#{$spacing} * 0.75);
  font-size: 0.8rem;
  color: var(--secondary-text);
  line-height: 1.4;

  strong {
    color: var(--primary-text);
    font-weight: 700;
  }
}

.food-form__preview-icon {
  flex-shrink: 0;
  color: var(--accent-color);
}

// ─── Alert ────────────────────────────────────────────────────────────────────

.food-form__alert {
  margin-top: calc(#{$spacing} * 0.25);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

.food-form__actions {
  display: flex;
  gap: calc(#{$spacing} * 0.75);
  margin-top: calc(#{$spacing} * 0.5);
  padding-bottom: calc(#{$spacing} * 2);
}

.food-form__cancel {
  flex: 0 0 auto;
}

.food-form__save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: 600;
}
</style>
