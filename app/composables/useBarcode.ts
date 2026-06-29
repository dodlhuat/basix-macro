import { ref, onUnmounted } from 'vue'

export type ScannerState = 'idle' | 'requesting' | 'scanning' | 'error'

export function useBarcode() {
  const state = ref<ScannerState>('idle')
  const error = ref<string | null>(null)

  let controls: { stop: () => void } | null = null

  async function startScanner(
    video: HTMLVideoElement,
    onDetected: (barcode: string) => void,
  ) {
    state.value = 'requesting'
    error.value = null

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const codeReader = new BrowserMultiFormatReader()

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      const deviceId = devices.find(d =>
        /back|rear|environment/i.test(d.label),
      )?.deviceId ?? devices[0]?.deviceId

      state.value = 'scanning'

      controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        video,
        (result, err) => {
          if (result) {
            onDetected(result.getText())
          }
          // Ignore per-frame NotFoundException (expected when no barcode in view)
          if (err && err.name !== 'NotFoundException') {
            console.warn('[useBarcode]', err)
          }
        },
      )
    }
    catch (e: unknown) {
      state.value = 'error'
      const msg = e instanceof Error ? e.message : String(e)
      if (/Permission|NotAllowed|NotFound/i.test(msg)) {
        error.value = 'Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.'
      }
      else {
        error.value = 'Kamera konnte nicht gestartet werden.'
      }
    }
  }

  function stopScanner() {
    controls?.stop()
    controls = null
    state.value = 'idle'
  }

  onUnmounted(() => stopScanner())

  return { state, error, startScanner, stopScanner }
}
