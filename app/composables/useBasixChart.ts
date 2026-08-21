import type { Ref } from 'vue'
import type { ChartOptions, ChartSeries } from '@dodlhuat/basix/js/chart.js'

/**
 * Mounts a Basix `Chart` on `elRef` and keeps it in sync with `series`.
 *
 * Unlike the datepicker (whose options never change after mount), a chart's
 * `yMin`/`yMax` and similar range options often need to be recomputed as new
 * data comes in — and the Chart API only exposes `update(series)` /
 * `setType(type)`, neither of which can change those. So instead of calling
 * `update()` in place, this composable destroys and recreates the instance
 * on every series change, re-invoking `buildOptions()` each time to pick up
 * a fresh range. Chart's own `render()` rebuilds its DOM from scratch anyway,
 * so the extra destroy/construct is not meaningfully more expensive.
 *
 * `elRef` may start out `null` (e.g. the container sits behind a `v-if` that
 * depends on the same data the chart renders) — the composable watches it
 * and creates the chart lazily once it appears, and tears it down again if
 * the element is removed.
 */
export function useBasixChart(
  elRef: Ref<HTMLElement | null>,
  series: Ref<ChartSeries[]>,
  buildOptions: () => Omit<ChartOptions, 'series'>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chart: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ChartCtor: any = null

  async function recreate() {
    if (!elRef.value) return
    if (!ChartCtor) {
      ({ Chart: ChartCtor } = await import('@dodlhuat/basix/js/chart.js'))
    }
    // Re-check after the async import: the element or component may be gone by now.
    if (!elRef.value) return
    chart?.destroy()
    chart = new ChartCtor(elRef.value, { ...buildOptions(), series: series.value })
  }

  onMounted(recreate)

  watch(elRef, (el) => {
    if (el) {
      recreate()
    }
    else {
      chart?.destroy()
      chart = null
    }
  })

  watch(series, () => { recreate() }, { deep: true })

  onUnmounted(() => {
    chart?.destroy()
    chart = null
  })
}
