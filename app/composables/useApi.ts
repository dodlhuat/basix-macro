export interface NormalizedApiError {
  status: number | null
  message: string
}

export function buildAuthHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return { status: null, message: 'Unbekannter Fehler.' }
  }

  const err = error as {
    response?: { status?: number }
    data?: { message?: string }
    statusCode?: number
    message?: string
  }

  const status = err.response?.status ?? err.statusCode ?? null

  if (status === null) {
    return { status: null, message: 'Keine Verbindung zum Server.' }
  }

  const message = err.data?.message ?? err.message ?? 'Unbekannter Fehler.'
  return { status, message }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  async function request<T>(
    method: HttpMethod,
    path: string,
    options: { body?: unknown, query?: Record<string, unknown> } = {},
  ): Promise<T> {
    try {
      return await $fetch(path, {
        baseURL: config.public.apiBase,
        method,
        body: options.body as Record<string, unknown> | undefined,
        query: options.query,
        headers: {
          Accept: 'application/json',
          ...buildAuthHeader(authStore.token),
        },
      }) as T
    } catch (error) {
      const normalized = normalizeApiError(error)
      if (normalized.status === 401) {
        authStore.clearSession()
      }
      throw normalized
    }
  }

  return {
    get: <T>(path: string, query?: Record<string, unknown>) => request<T>('GET', path, { query }),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
    delete: <T>(path: string) => request<T>('DELETE', path),
  }
}
