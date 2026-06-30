<template>
  <div class="onboarding">
    <div class="onboarding__header">
      <h1 class="onboarding__title">BasixMacro</h1>
      <p class="onboarding__subtitle">Lass uns dein Profil einrichten</p>
    </div>

    <!-- Stepper: managed via Vue :class, no vanilla JS -->
    <div class="stepper">
      <template v-for="(label, i) in ['Name', 'Körper', 'Aktivität', 'Ziel']" :key="i">
        <div class="stepper-step" :class="{ active: currentStep === i, completed: currentStep > i }">
          <div class="stepper-indicator">
            <AppIcon v-if="currentStep > i" name="check" size="1rem" class="stepper-check" />
            <template v-else>{{ i + 1 }}</template>
          </div>
          <div class="stepper-label"><span class="stepper-title">{{ label }}</span></div>
        </div>
        <div v-if="i < 3" class="stepper-connector" :class="{ completed: currentStep > i }" />
      </template>
    </div>

    <div class="onboarding__content">

      <!-- Step 1: Name -->
      <div v-show="currentStep === 0" class="onboarding__step">
        <h2>Wie heißt du?</h2>
        <div class="form-group">
          <label for="name">Dein Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Name eingeben"
            autocomplete="given-name"
            @keyup.enter="tryNext"
          />
        </div>
        <p v-if="errors.name" class="onboarding__error">{{ errors.name }}</p>
      </div>

      <!-- Step 2: Physical data -->
      <div v-show="currentStep === 1" class="onboarding__step">
        <h2>Deine Körperdaten</h2>

        <div class="form-group">
          <label>Geschlecht</label>
          <div class="chips">
            <button
              v-for="g in genderOptions"
              :key="g.value"
              type="button"
              class="chip clickable"
              :class="{ 'selected': form.gender === g.value }"
              @click="form.gender = g.value"
            >{{ g.label }}</button>
          </div>
        </div>

        <div class="onboarding__row">
          <div class="form-group">
            <label for="age">Alter</label>
            <input id="age" v-model.number="form.age" type="number" min="10" max="100" placeholder="Jahre" />
          </div>
          <div class="form-group">
            <label for="height">Größe (cm)</label>
            <input id="height" v-model.number="form.height_cm" type="number" min="100" max="250" placeholder="cm" />
          </div>
        </div>

        <div class="form-group">
          <label for="weight">Gewicht (kg)</label>
          <input id="weight" v-model.number="form.weight_kg" type="number" min="30" max="300" step="0.1" placeholder="kg" />
        </div>
        <p v-if="errors.body" class="onboarding__error">{{ errors.body }}</p>
      </div>

      <!-- Step 3: Activity level -->
      <div v-show="currentStep === 2" class="onboarding__step">
        <h2>Wie aktiv bist du?</h2>
        <div class="onboarding__activity-list">
          <button
            v-for="a in activityOptions"
            :key="a.value"
            type="button"
            class="onboarding__activity-card"
            :class="{ 'onboarding__activity-card--active': form.activity_level === a.value }"
            @click="form.activity_level = a.value"
          >
            <span class="onboarding__activity-icon">
              <AppIcon :name="a.icon" size="1.125rem" />
            </span>
            <span class="onboarding__activity-text">
              <strong>{{ a.label }}</strong>
              <span>{{ a.desc }}</span>
            </span>
            <span class="onboarding__activity-bars" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </span>
          </button>
        </div>
      </div>

      <!-- Step 4: Goal + Result -->
      <div v-show="currentStep === 3" class="onboarding__step">
        <h2>Was ist dein Ziel?</h2>
        <div class="goal-options">
          <button
            v-for="g in goalOptions"
            :key="g.value"
            type="button"
            class="goal-option"
            :class="{ 'goal-option--selected': form.goal === g.value }"
            @click="form.goal = g.value"
          >
            <span class="goal-option__label">{{ g.label }}</span>
            <div class="goal-option__desc-wrap">
              <span class="goal-option__desc">{{ g.desc }}</span>
            </div>
          </button>
        </div>

        <div v-if="calculatedMacros" class="onboarding__result card card-bordered">
          <p class="onboarding__result-title">Dein Tagesbedarf</p>
          <div class="onboarding__result-calories">
            <span class="onboarding__result-value">{{ calculatedMacros.calories }}</span>
            <span class="onboarding__result-unit">kcal</span>
          </div>

          <div class="form-group">
            <label for="calorie-override">Kalorienziel anpassen</label>
            <input
              id="calorie-override"
              v-model.number="calorieOverride"
              type="number"
              min="1200"
              max="6000"
              step="50"
            />
          </div>

          <div class="onboarding__macros">
            <div class="onboarding__macro">
              <span class="onboarding__macro-value">{{ finalMacros.protein_g }}g</span>
              <span class="onboarding__macro-label">Protein</span>
            </div>
            <div class="onboarding__macro">
              <span class="onboarding__macro-value">{{ finalMacros.carbs_g }}g</span>
              <span class="onboarding__macro-label">Kohlenhydrate</span>
            </div>
            <div class="onboarding__macro">
              <span class="onboarding__macro-value">{{ finalMacros.fat_g }}g</span>
              <span class="onboarding__macro-label">Fett</span>
            </div>
          </div>
        </div>

        <!-- Adaptive calorie toggle -->
        <div class="onboarding__adaptive card card-bordered">
          <div class="onboarding__adaptive-text">
            <p class="onboarding__adaptive-title">Kalorienziel automatisch anpassen</p>
            <p class="onboarding__adaptive-desc">
              Vergleicht deine Gewichtsentwicklung mit dem erwarteten Fortschritt und korrigiert das Ziel wöchentlich — erst nach 2 Wochen Tracking.
            </p>
          </div>
          <div class="switch">
            <input id="adaptive-toggle" v-model="form.adaptive_calories_enabled" type="checkbox" />
            <label for="adaptive-toggle"></label>
          </div>
        </div>
      </div>

    </div>

    <!-- Navigation buttons -->
    <div class="onboarding__nav">
      <button
        v-if="!isFirst"
        type="button"
        class="button button-outline"
        @click="goBack"
      >Zurück</button>
      <button
        v-if="!isLast"
        type="button"
        class="button button-primary"
        @click="tryNext"
      >Weiter</button>
      <button
        v-if="isLast"
        type="button"
        class="button button-primary"
        :class="{ 'is-loading': saving }"
        :disabled="saving"
        @click="finish"
      >Los geht's</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'

definePageMeta({ layout: false })

const { calculate, calcMacros } = useCalorieCalculator()
const userStore = useUserStore()
const weightStore = useWeightStore()
const router = useRouter()

const STEPS = 4
const { currentStep, isFirst, isLast, next, prev } = useStepper(STEPS)

const saving = ref(false)
const errors = reactive({ name: '', body: '' })

const form = reactive({
  name: '',
  gender: 'male' as 'male' | 'female' | 'other',
  age: null as number | null,
  height_cm: null as number | null,
  weight_kg: null as number | null,
  activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  goal: 'maintain' as 'cut' | 'light_cut' | 'maintain' | 'lean_bulk' | 'bulk',
  adaptive_calories_enabled: false,
})

const genderOptions: { value: 'male' | 'female' | 'other', label: string }[] = [
  { value: 'male', label: 'Männlich' },
  { value: 'female', label: 'Weiblich' },
  { value: 'other', label: 'Divers' },
]

const activityOptions: { value: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active', label: string, desc: string, icon: string }[] = [
  { value: 'sedentary',   label: 'Kaum aktiv',      desc: 'Bürojob, kein Sport',              icon: 'chair' },
  { value: 'light',       label: 'Leicht aktiv',     desc: '1–3× Sport pro Woche',             icon: 'directions_walk' },
  { value: 'moderate',    label: 'Mäßig aktiv',      desc: '3–5× Sport pro Woche',             icon: 'directions_run' },
  { value: 'active',      label: 'Sehr aktiv',       desc: '6–7× intensiver Sport',            icon: 'fitness_center' },
  { value: 'very_active', label: 'Extrem aktiv',     desc: 'Körperliche Arbeit + viel Sport',  icon: 'sports' },
]

const goalOptions: { value: 'cut' | 'light_cut' | 'maintain' | 'lean_bulk' | 'bulk', label: string, desc: string }[] = [
  { value: 'cut',       label: 'Cut',          desc: '500 g Fettverlust pro Woche. Empfohlen für max. 12 Wochen, dann Diätpause.' },
  { value: 'light_cut', label: 'Leichter Cut', desc: '250 g Fettverlust pro Woche. Schonend, gut für Einsteiger, bis zu 20 Wochen.' },
  { value: 'maintain',  label: 'Halten',       desc: 'Kalorienbedarf exakt decken. Gewicht und Muskelmasse stabil halten.' },
  { value: 'lean_bulk', label: 'Lean Bulk',    desc: '250 g Muskelaufbau pro Woche bei minimaler Fettzunahme. Empfohlen 8–16 Wochen.' },
  { value: 'bulk',      label: 'Bulk',         desc: '500 g Gewichtszunahme pro Woche, maximaler Muskelaufbau. Empfohlen 8–12 Wochen.' },
]

const calculatedMacros = computed(() => {
  if (!form.age || !form.height_cm || !form.weight_kg) return null
  return calculate(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level, form.goal)
})

const calorieOverride = ref<number | null>(null)

watch(calculatedMacros, (val) => {
  if (val) calorieOverride.value = val.calories
})

const finalMacros = computed(() => {
  const cal = calorieOverride.value ?? calculatedMacros.value?.calories ?? 2000
  return calcMacros(cal)
})

function validateStep(): boolean {
  errors.name = ''
  errors.body = ''

  if (currentStep.value === 0) {
    if (!form.name.trim()) {
      errors.name = 'Bitte gib deinen Namen ein.'
      return false
    }
  }
  if (currentStep.value === 1) {
    if (!form.age || form.age < 10 || form.age > 100) {
      errors.body = 'Bitte gib ein gültiges Alter ein (10–100).'
      return false
    }
    if (!form.height_cm || form.height_cm < 100 || form.height_cm > 250) {
      errors.body = 'Bitte gib eine gültige Größe ein (100–250 cm).'
      return false
    }
    if (!form.weight_kg || form.weight_kg < 30 || form.weight_kg > 300) {
      errors.body = 'Bitte gib ein gültiges Gewicht ein (30–300 kg).'
      return false
    }
  }
  return true
}

function tryNext() {
  if (!validateStep()) return
  next()
}

function goBack() {
  errors.name = ''
  errors.body = ''
  prev()
}

async function finish() {
  if (!validateStep()) return
  if (!form.age || !form.height_cm || !form.weight_kg) return

  saving.value = true
  const macros = finalMacros.value
  const now = new Date().toISOString()

  await userStore.saveUser({
    id: uuidv4(),
    name: form.name.trim(),
    age: form.age,
    gender: form.gender,
    height_cm: form.height_cm,
    weight_kg: form.weight_kg,
    activity_level: form.activity_level,
    goal: form.goal,
    calorie_goal: macros.calories,
    protein_goal_g: macros.protein_g,
    carbs_goal_g: macros.carbs_g,
    fat_goal_g: macros.fat_g,
    unit_system: 'metric',
    water_goal_ml: 2000,
    dark_mode: false,
    adaptive_calories_enabled: form.adaptive_calories_enabled,
    created_at: now,
    updated_at: now,
    sync_status: 'local',
  })

  const today = now.slice(0, 10)
  await weightStore.addEntry(form.weight_kg, today)

  await router.replace('/')
}

</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;
@use "~/assets/scss/variables" as *;

.onboarding {
  display: flex;
  flex-direction: column;
  max-width: $app-max-width;
  margin: 0 auto;
  padding: calc($spacing * 2) $spacing 0;
  gap: calc($spacing * 1.5);

  &__header {
    text-align: center;
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 calc($spacing * 0.25);
  }

  &__subtitle {
    color: var(--secondary-text);
    margin: 0;
  }

  .stepper {
    flex-shrink: 0;

    &-check {
      fill: currentColor;
      animation: stepper-check-in 0.3s ease-out both;
    }
  }

  @keyframes stepper-check-in {
    from { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.2); }
    to   { transform: scale(1); opacity: 1; }
  }

  &__content {
    padding-bottom: $spacing;
  }

  &__step {
    display: flex;
    flex-direction: column;
    gap: $spacing;

    h2 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 calc($spacing * 0.25);
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing;
  }

  &__error {
    color: var(--error);
    font-size: 0.875rem;
    margin: 0;
  }

  &__activity-list {
    display: flex;
    flex-direction: column;
    gap: calc($spacing * 0.375);
  }

  &__activity-icon {
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-sm);
    background: var(--secondary-background);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.25s ease;

    .app-icon {
      color: var(--secondary-text);
      transition: color 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  &__activity-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    strong {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text);
      transition: color 0.2s ease;
    }

    span {
      font-size: 0.78rem;
      color: var(--secondary-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__activity-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 1rem;
    flex-shrink: 0;

    span {
      display: block;
      width: 3px;
      border-radius: 2px;
      background: var(--divider);
      transition: background 0.2s ease;

      &:nth-child(1) { height: 20%; }
      &:nth-child(2) { height: 40%; }
      &:nth-child(3) { height: 60%; }
      &:nth-child(4) { height: 80%; }
      &:nth-child(5) { height: 100%; }
    }
  }

  &__activity-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: calc($spacing * 0.75);
    padding: calc($spacing * 0.65) calc($spacing * 0.75);
    border-radius: var(--radius-md);
    border: none;
    background: var(--primary-bg);
    box-shadow: $shadow;
    cursor: pointer;
    text-align: left;
    width: 100%;
    color: inherit;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

    /* Left accent rail — springs in on selection */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background: var(--accent-color);
      transform: scaleY(0);
      transform-origin: center;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    &:active {
      transform: scale(0.985);
    }

    /* Intensity indicator: first n bars lit per activity tier */
    &:nth-child(1) .onboarding__activity-bars span:nth-child(-n+1) { background: var(--accent-color-lighten); }
    &:nth-child(2) .onboarding__activity-bars span:nth-child(-n+2) { background: var(--accent-color-lighten); }
    &:nth-child(3) .onboarding__activity-bars span:nth-child(-n+3) { background: var(--accent-color-lighten); }
    &:nth-child(4) .onboarding__activity-bars span:nth-child(-n+4) { background: var(--accent-color-lighten); }
    &:nth-child(5) .onboarding__activity-bars span:nth-child(-n+5) { background: var(--accent-color-lighten); }

    &--active {
      background: var(--secondary-background);
      box-shadow: 0 0 0 1.5px var(--accent-color), $shadow;

      &::before {
        transform: scaleY(1);
      }

      .onboarding__activity-icon {
        background: var(--accent-color);

        .app-icon {
          color: var(--accent-color-text);
          transform: scale(1.15);
        }
      }

      .onboarding__activity-text strong {
        color: var(--accent-color);
      }

      .onboarding__activity-bars span {
        background: var(--accent-color);
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__activity-card,
    &__activity-card::before,
    &__activity-icon,
    &__activity-icon .app-icon,
    &__activity-text strong,
    &__activity-bars span {
      transition: none;
    }
  }

  &__result {
    padding: $spacing;
    display: flex;
    flex-direction: column;
    gap: $spacing;

    &-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--secondary-text);
      margin: 0;
    }

    &-calories {
      display: flex;
      align-items: baseline;
      gap: calc($spacing * 0.35);
    }

    &-value {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--accent-color);
    }

    &-unit {
      font-size: 1rem;
      color: var(--secondary-text);
    }
  }

  &__macros {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: calc($spacing * 0.5);
  }

  &__macro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: calc($spacing * 0.5);
    border-radius: $border-radius;
    background: var(--secondary-background);

    &-value {
      font-size: 1.1rem;
      font-weight: 700;
    }

    &-label {
      font-size: 0.7rem;
      color: var(--secondary-text);
    }
  }

  &__adaptive {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing;
    padding: $spacing;
  }

  &__adaptive-text {
    flex: 1;
    min-width: 0;
  }

  &__adaptive-title {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--primary-text);
  }

  &__adaptive-desc {
    font-size: 0.78rem;
    color: var(--secondary-text);
    line-height: 1.45;
    margin: 0;
  }

  &__nav {
    display: flex;
    gap: $spacing;
    justify-content: flex-end;
    position: sticky;
    bottom: 0;
    background: var(--background);
    padding: calc($spacing * 0.75) 0 calc($spacing * 1.5);
    border-top: 1px solid var(--divider);

    .button {
      flex: 1;
    }
  }
}

.goal-options {
  display: flex;
  flex-direction: column;
  gap: calc($spacing * 0.375);
}

.goal-option {
  display: flex;
  flex-direction: column;
  padding: calc($spacing * 0.65) calc($spacing * 0.75);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--divider);
  background: var(--primary-bg);
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;

  &:active {
    transform: scale(0.99);
  }

  &__label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text);
    transition: color 0.22s ease;
  }

  /* Grid-row expand trick: desc collapses to 0 height without max-height hacks */
  &__desc-wrap {
    display: grid;
    grid-template-rows: 0fr;
    margin-top: 0;
    transition: grid-template-rows 0.28s ease, margin-top 0.28s ease;
  }

  &__desc {
    overflow: hidden;
    min-height: 0;
    font-size: 0.78rem;
    color: var(--secondary-text);
    line-height: 1.4;
  }

  &--selected {
    border-color: var(--accent-color);
    background: var(--accent-color-tint);
    box-shadow: 0 0 0 0.5px var(--accent-color);

    .goal-option__label {
      color: var(--accent-color);
    }

    .goal-option__desc-wrap {
      grid-template-rows: 1fr;
      margin-top: 4px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .goal-option,
  .goal-option__desc-wrap {
    transition: none;
  }
}
</style>
