export type BodyFatCategory = 'essential' | 'athlete' | 'fitness' | 'average' | 'obese'

export interface BodyFatInput {
  gender: 'male' | 'female' | 'other'
  height_cm: number
  neck_cm: number
  waist_cm: number
  hip_cm?: number
}

export interface BodyFatResult {
  value: number
  category: BodyFatCategory
  label: string
}

export function useBodyFat() {
  /**
   * US Navy body fat estimation method.
   * All measurements must be in centimetres.
   * 'other' gender uses the female formula (hip circumference required).
   */
  function calcBodyFat(input: BodyFatInput): BodyFatResult {
    const { gender, height_cm, neck_cm, waist_cm, hip_cm } = input

    let raw: number

    if (gender === 'male') {
      // US Navy formula — men
      raw =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waist_cm - neck_cm) +
            0.15456 * Math.log10(height_cm)) -
        450
    }
    else {
      // US Navy formula — women / other (hip circumference required)
      const hip = hip_cm ?? 0
      raw =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waist_cm + hip - neck_cm) +
            0.221 * Math.log10(height_cm)) -
        450
    }

    const value = Math.round(raw * 10) / 10

    let category: BodyFatCategory
    let label: string

    if (gender === 'male') {
      if (value < 6) {
        category = 'essential'
        label = 'Essenziell'
      }
      else if (value < 14) {
        category = 'athlete'
        label = 'Sportler'
      }
      else if (value < 18) {
        category = 'fitness'
        label = 'Fitness'
      }
      else if (value < 25) {
        category = 'average'
        label = 'Durchschnitt'
      }
      else {
        category = 'obese'
        label = 'Übergewicht'
      }
    }
    else {
      if (value < 14) {
        category = 'essential'
        label = 'Essenziell'
      }
      else if (value < 21) {
        category = 'athlete'
        label = 'Sportlich'
      }
      else if (value < 25) {
        category = 'fitness'
        label = 'Fitness'
      }
      else if (value < 32) {
        category = 'average'
        label = 'Durchschnitt'
      }
      else {
        category = 'obese'
        label = 'Übergewicht'
      }
    }

    return { value, category, label }
  }

  return { calcBodyFat }
}
