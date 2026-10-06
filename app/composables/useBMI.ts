export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface BMIResult {
  value: number
  category: BMICategory
}

export function useBMI() {
  function calcBMI(weight_kg: number, height_cm: number): BMIResult {
    const h = height_cm / 100
    const value = Math.round((weight_kg / (h * h)) * 10) / 10

    let category: BMICategory
    if (value < 18.5) {
      category = 'underweight'
    }
    else if (value < 25) {
      category = 'normal'
    }
    else if (value < 30) {
      category = 'overweight'
    }
    else {
      category = 'obese'
    }

    return { value, category }
  }

  return { calcBMI }
}
