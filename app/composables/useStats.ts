export interface DayTotal {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  water_ml: number
}

export interface MacroAvg {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface MacroPercentages {
  protein: number
  carbs: number
  fat: number
}

export function useStats() {
  function calcAverage(days: DayTotal[]): MacroAvg {
    if (!days.length) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    const sum = days.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein_g: acc.protein_g + d.protein_g,
        carbs_g: acc.carbs_g + d.carbs_g,
        fat_g: acc.fat_g + d.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )
    const n = days.length
    return {
      calories: Math.round(sum.calories / n),
      protein_g: Math.round(sum.protein_g / n),
      carbs_g: Math.round(sum.carbs_g / n),
      fat_g: Math.round(sum.fat_g / n),
    }
  }

  function calcMacroPercentages(protein_g: number, carbs_g: number, fat_g: number): MacroPercentages {
    const total = protein_g * 4 + carbs_g * 4 + fat_g * 9
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 }
    return {
      protein: Math.round((protein_g * 4 / total) * 100),
      carbs: Math.round((carbs_g * 4 / total) * 100),
      fat: Math.round((fat_g * 9 / total) * 100),
    }
  }

  function calcAdherence(days: DayTotal[], calorieGoal: number): number {
    if (!days.length || !calorieGoal) return 0
    const onTarget = days.filter(d => d.calories > 0 && d.calories <= calorieGoal * 1.1).length
    return Math.round((onTarget / days.length) * 100)
  }

  function bestDay(days: DayTotal[]): DayTotal | null {
    const logged = days.filter(d => d.calories > 0)
    if (!logged.length) return null
    return logged.reduce((best, d) => d.calories > best.calories ? d : best)
  }

  function worstDay(days: DayTotal[]): DayTotal | null {
    const logged = days.filter(d => d.calories > 0)
    if (!logged.length) return null
    return logged.reduce((worst, d) => d.calories < worst.calories ? d : worst)
  }

  return { calcAverage, calcMacroPercentages, calcAdherence, bestDay, worstDay }
}
