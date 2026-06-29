import type { User } from '../../db'

type Gender = 'male' | 'female' | 'other'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
type Goal = 'cut' | 'light_cut' | 'maintain' | 'lean_bulk' | 'bulk'

interface MacroGoals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
}

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  cut:       -500,
  light_cut: -250,
  maintain:  0,
  lean_bulk: +250,
  bulk:      +500,
}

export function useCalorieCalculator() {
  function calcBMR(weight_kg: number, height_cm: number, age: number, gender: Gender): number {
    const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return gender === 'female' ? base - 161 : base + 5
  }

  function calcTDEE(bmr: number, activity: ActivityLevel): number {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity])
  }

  function calcCalorieGoal(tdee: number, goal: Goal): number {
    return Math.max(1200, tdee + GOAL_ADJUSTMENTS[goal])
  }

  function calcMacros(calories: number): MacroGoals {
    return {
      calories,
      protein_g: Math.round((calories * 0.25) / 4),
      carbs_g:   Math.round((calories * 0.50) / 4),
      fat_g:     Math.round((calories * 0.25) / 9),
    }
  }

  function calculate(
    weight_kg: number,
    height_cm: number,
    age: number,
    gender: Gender,
    activity: ActivityLevel,
    goal: Goal,
  ): MacroGoals {
    const bmr = calcBMR(weight_kg, height_cm, age, gender)
    const tdee = calcTDEE(bmr, activity)
    const calories = calcCalorieGoal(tdee, goal)
    return calcMacros(calories)
  }

  function calculateFromUser(user: Pick<User, 'weight_kg' | 'height_cm' | 'age' | 'gender' | 'activity_level' | 'goal'>): MacroGoals {
    return calculate(
      user.weight_kg,
      user.height_cm,
      user.age,
      user.gender,
      user.activity_level,
      user.goal,
    )
  }

  return { calcBMR, calcTDEE, calcCalorieGoal, calcMacros, calculate, calculateFromUser }
}
