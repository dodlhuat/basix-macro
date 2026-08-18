import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

const STORAGE_KEY = 'basixmacro.auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persist() {
    if (!import.meta.client) return
    if (token.value && user.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token.value, user: user.value }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function hydrate() {
    if (!import.meta.client) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { token: string, user: AuthUser }
      token.value = parsed.token
      user.value = parsed.user
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** Clears the local session without calling the backend (e.g. after a 401). */
  function clearSession() {
    token.value = null
    user.value = null
    persist()
  }

  async function login(email: string, password: string, options: { awaitSync?: boolean } = {}): Promise<void> {
    const { post } = useApi()
    const response = await post<{ token: string, user: AuthUser }>('/auth/login', { email, password })
    token.value = response.token
    user.value = response.user
    persist()

    // Upload/merge whatever this device already has locally, then pull the rest of the account's data.
    // Fire-and-forget by default so callers (e.g. settings' login form) get instant UI
    // feedback without waiting on a full sync — but the pre-onboarding login screen needs
    // to know whether a profile came down before deciding where to navigate, so it awaits.
    const syncStore = useSyncStore()
    const syncPromise = syncStore.syncNow({ full: true })
    if (options.awaitSync) {
      await syncPromise
    } else {
      void syncPromise
    }
  }

  async function logout(): Promise<void> {
    const { post } = useApi()
    try {
      await post('/auth/logout')
    } catch {
      // Session is cleared locally regardless of whether the backend call succeeds.
    }
    clearSession()
  }

  /** Always resolves (the backend never reveals whether the email exists). */
  async function requestPasswordReset(email: string): Promise<void> {
    const { post } = useApi()
    await post('/auth/forgot-password', { email })
  }

  async function confirmPasswordReset(token: string, email: string, password: string): Promise<void> {
    const { post } = useApi()
    await post('/auth/reset-password', { token, email, password })
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    hydrate,
    login,
    logout,
    clearSession,
    requestPasswordReset,
    confirmPasswordReset,
  }
})
