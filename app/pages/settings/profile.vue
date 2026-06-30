<template>
  <div class="page-content">
    <h1>{{ $t('profile.title') }}</h1>

    <div v-if="user" class="profile">
      <div class="card card-bordered profile__section">
        <h2>{{ $t('profile.personal') }}</h2>

        <div class="form-group">
          <label for="name">{{ $t('profile.name') }}</label>
          <input id="name" v-model="form.name" type="text" >
        </div>

        <div class="form-group">
          <label>{{ $t('profile.gender') }}</label>
          <div class="chips">
            <button
v-for="g in genderOptions" :key="g.value" type="button" class="chip clickable"
              :class="{ 'selected': form.gender === g.value }" @click="form.gender = g.value">
              {{ g.label }}
            </button>
          </div>
        </div>

        <div class="profile__row">
          <div class="form-group">
            <label for="age">{{ $t('profile.age') }}</label>
            <input id="age" v-model.number="form.age" type="number" min="10" max="100" >
          </div>
          <div class="form-group">
            <label for="height">{{ $t('profile.height') }}</label>
            <input id="height" v-model.number="form.height_cm" type="number" min="100" max="250" >
          </div>
        </div>

        <div class="form-group">
          <label for="weight">{{ $t('profile.weight') }}</label>
          <input id="weight" v-model.number="form.weight_kg" type="number" min="30" max="300" step="0.1" >
        </div>
      </div>

      <div class="card card-bordered profile__section">
        <h2>{{ $t('profile.activityGoal') }}</h2>

        <div class="form-group">
          <label>{{ $t('profile.activityLevel') }}</label>
          <div class="chips" style="flex-wrap: wrap;">
            <button
v-for="a in activityOptions" :key="a.value" type="button" class="chip clickable"
              :class="{ 'selected': form.activity_level === a.value }" @click="form.activity_level = a.value">
              {{ a.label }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>{{ $t('profile.goal') }}</label>
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
        </div>
      </div>

      <div class="card card-bordered profile__section">
        <h2>{{ $t('profile.calorieGoal') }}</h2>
        <p class="profile__hint">{{ $t('profile.autoCalc') }}: <strong>{{ autoCalories }} kcal</strong></p>

        <div class="form-group">
          <label for="calorie-goal">{{ $t('profile.calorieGoalLabel') }}</label>
          <input id="calorie-goal" v-model.number="form.calorie_goal" type="number" min="1200" max="6000" step="50" >
        </div>

        <button type="button" class="button button-outline" @click="resetToAuto">
          {{ $t('profile.calcAuto') }}
        </button>

        <div class="profile__macros">
          <div class="form-group">
            <label for="protein">{{ $t('common.protein') }} (g)</label>
            <input id="protein" v-model.number="form.protein_goal_g" type="number" min="0" >
          </div>
          <div class="form-group">
            <label for="carbs">{{ $t('common.carbs') }} (g)</label>
            <input id="carbs" v-model.number="form.carbs_goal_g" type="number" min="0" >
          </div>
          <div class="form-group">
            <label for="fat">{{ $t('common.fat') }} (g)</label>
            <input id="fat" v-model.number="form.fat_goal_g" type="number" min="0" >
          </div>
        </div>
      </div>

      <p v-if="saved" class="profile__saved">{{ $t('common.saved') }}</p>

      <button
type="button" class="button button-primary" :class="{ 'is-loading': saving }" :disabled="saving"
        @click="save">
        {{ $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Profile' })

const userStore = useUserStore()
const { calculate, calcMacros } = useCalorieCalculator()
const { user } = storeToRefs(userStore)
const { t } = useI18n()

const saving = ref(false)
const saved = ref(false)

const form = reactive({
  name: '',
  gender: 'male' as 'male' | 'female' | 'other',
  age: 0,
  height_cm: 0,
  weight_kg: 0,
  activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  goal: 'maintain' as 'cut' | 'light_cut' | 'maintain' | 'lean_bulk' | 'bulk',
  calorie_goal: 2000,
  protein_goal_g: 0,
  carbs_goal_g: 0,
  fat_goal_g: 0,
})

const genderOptions = computed(() => [
  { value: 'male' as const, label: t('profile.male') },
  { value: 'female' as const, label: t('profile.female') },
  { value: 'other' as const, label: t('profile.other') },
])

const activityOptions = computed(() => [
  { value: 'sedentary' as const,   label: t('profile.activity.sedentary') },
  { value: 'light' as const,       label: t('profile.activity.light') },
  { value: 'moderate' as const,    label: t('profile.activity.moderate') },
  { value: 'active' as const,      label: t('profile.activity.active') },
  { value: 'very_active' as const, label: t('profile.activity.veryActive') },
])

const goalOptions = computed(() => [
  { value: 'cut' as const,       label: t('profile.goals.cut'),      desc: t('profile.goalDesc.cut') },
  { value: 'light_cut' as const, label: t('profile.goals.lightCut'), desc: t('profile.goalDesc.lightCut') },
  { value: 'maintain' as const,  label: t('profile.goals.maintain'), desc: t('profile.goalDesc.maintain') },
  { value: 'lean_bulk' as const, label: t('profile.goals.leanBulk'), desc: t('profile.goalDesc.leanBulk') },
  { value: 'bulk' as const,      label: t('profile.goals.bulk'),     desc: t('profile.goalDesc.bulk') },
])

const autoCalories = computed(() => {
  if (!form.age || !form.height_cm || !form.weight_kg) return 0
  return calculate(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level, form.goal).calories
})

function resetToAuto() {
  const macros = calcMacros(autoCalories.value)
  form.calorie_goal = macros.calories
  form.protein_goal_g = macros.protein_g
  form.carbs_goal_g = macros.carbs_g
  form.fat_goal_g = macros.fat_g
}

async function save() {
  if (!user.value) return
  saving.value = true
  await userStore.saveUser({
    ...user.value,
    ...form,
    updated_at: new Date().toISOString(),
    sync_status: 'dirty',
  })
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

watch(user, (u) => {
  if (!u) return
  Object.assign(form, {
    name: u.name,
    gender: u.gender,
    age: u.age,
    height_cm: u.height_cm,
    weight_kg: u.weight_kg,
    activity_level: u.activity_level,
    goal: u.goal,
    calorie_goal: u.calorie_goal,
    protein_goal_g: u.protein_goal_g,
    carbs_goal_g: u.carbs_goal_g,
    fat_goal_g: u.fat_goal_g,
  })
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use "@dodlhuat/basix/css/parameters" as *;

.profile {
  display: flex;
  flex-direction: column;
  gap: $spacing;
  margin-top: $spacing;

  &__section {
    padding: $spacing;
    display: flex;
    flex-direction: column;
    gap: calc($spacing * 0.75);

    h2 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing;
  }

  &__macros {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: calc($spacing * 0.5);
  }

  &__hint {
    color: var(--secondary-text);
    font-size: 0.875rem;
    margin: 0;
  }

  &__saved {
    color: var(--success);
    font-weight: 600;
    text-align: center;
    margin: 0;
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

  // Grid-row expand trick: desc collapses to 0 height without max-height hacks
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
    white-space: break-spaces;
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
