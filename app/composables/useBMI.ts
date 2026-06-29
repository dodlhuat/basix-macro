export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface BMIResult {
  value: number
  category: BMICategory
  label: string
}

export function useBMI() {
  function calcBMI(weight_kg: number, height_cm: number): BMIResult {
    const h = height_cm / 100
    const value = Math.round((weight_kg / (h * h)) * 10) / 10

    let category: BMICategory
    let label: string
    if (value < 18.5) {
      category = 'underweight'
      label = 'Untergewicht'
    }
    else if (value < 25) {
      category = 'normal'
      label = 'Normalgewicht'
    }
    else if (value < 30) {
      category = 'overweight'
      label = 'Übergewicht'
    }
    else {
      category = 'obese'
      label = 'Adipositas'
    }

    return { value, category, label }
  }

  return { calcBMI }
}
