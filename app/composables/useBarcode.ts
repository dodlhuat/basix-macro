import { ref, onUnmounted } from 'vue'

export type ScannerState = 'idle' | 'requesting' | 'scanning' | 'error'

type StopFn = () => void

interface BarcodeDetectorResult {
  rawValue: string
  format: string
}

interface BarcodeDetectorType {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>
}

declare global {
  interface Window {
    BarcodeDetector: {
      new(options?: { formats: string[] }): BarcodeDetectorType
      getSupportedFormats(): Promise<string[]>
    }
  }
}

const WANTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39']

async function startNativeScanner(
  video: HTMLVideoElement,
  onDetected: (barcode: string) => void,
): Promise<StopFn> {
  const supported = await window.BarcodeDetector.getSupportedFormats()
  const formats = WANTED_FORMATS.filter(f => supported.includes(f))
  const detector = new window.BarcodeDetector({ formats: formats.length ? formats : supported })

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
  })
  video.srcObject = stream
  await video.play()

  let rafId: number
  let stopped = false
  let detecting = false

  async function scanFrame() {
    if (stopped) return
    if (!detecting && video.readyState >= video.HAVE_ENOUGH_DATA) {
      detecting = true
      try {
        const results = await detector.detect(video)
        const first = results[0]
        if (first && !stopped) {
          onDetected(first.rawValue)
        }
      }
      // eslint-disable-next-line no-empty
      catch {}
      detecting = false
    }
    if (!stopped) rafId = requestAnimationFrame(scanFrame)
  }

  rafId = requestAnimationFrame(scanFrame)

  return () => {
    stopped = true
    cancelAnimationFrame(rafId)
    stream.getTracks().forEach(t => t.stop())
    video.srcObject = null
  }
}

async function startZxingScanner(
  video: HTMLVideoElement,
  onDetected: (barcode: string) => void,
): Promise<StopFn> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const codeReader = new BrowserMultiFormatReader()

  const devices = await BrowserMultiFormatReader.listVideoInputDevices()
  const deviceId = devices.find(d => /back|rear|environment/i.test(d.label))?.deviceId
    ?? devices[0]?.deviceId

  const controls = await codeReader.decodeFromVideoDevice(
    deviceId,
    video,
    (result, err) => {
      if (result) onDetected(result.getText())
      if (err && err.name !== 'NotFoundException') console.warn('[useBarcode]', err)
    },
  )

  return () => controls.stop()
}

export function useBarcode() {
  const { t } = useI18n()
  const state = ref<ScannerState>('idle')
  // Store the message key, not the translated string, so the text follows the
  // active locale (the locale is applied a moment after a cold start).
  const errorKey = ref<'camera.denied' | 'camera.error' | null>(null)
  const error = computed(() => (errorKey.value ? t(errorKey.value) : null))
  let stop: StopFn | null = null

  async function startScanner(
    video: HTMLVideoElement,
    onDetected: (barcode: string) => void,
  ) {
    state.value = 'requesting'
    errorKey.value = null

    try {
      stop = 'BarcodeDetector' in window
        ? await startNativeScanner(video, onDetected)
        : await startZxingScanner(video, onDetected)

      state.value = 'scanning'
    }
    catch (e: unknown) {
      state.value = 'error'
      const msg = e instanceof Error ? e.message : String(e)
      errorKey.value = /Permission|NotAllowed|NotFound/i.test(msg)
        ? 'camera.denied'
        : 'camera.error'
    }
  }

  function stopScanner() {
    stop?.()
    stop = null
    state.value = 'idle'
  }

  onUnmounted(() => stopScanner())

  return { state, error, startScanner, stopScanner }
}
