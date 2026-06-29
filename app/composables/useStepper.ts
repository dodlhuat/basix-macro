export function useStepper(totalSteps: number) {
  const currentStep = ref(0)
  const isFirst = computed(() => currentStep.value === 0)
  const isLast = computed(() => currentStep.value === totalSteps - 1)

  function next() {
    if (currentStep.value < totalSteps - 1) currentStep.value++
  }

  function prev() {
    if (currentStep.value > 0) currentStep.value--
  }

  function goTo(index: number) {
    if (index >= 0 && index < totalSteps) currentStep.value = index
  }

  return { currentStep, isFirst, isLast, next, prev, goTo }
}
