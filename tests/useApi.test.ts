import { describe, it, expect } from 'vitest'
import { buildAuthHeader, normalizeApiError } from '../app/composables/useApi'

describe('buildAuthHeader', () => {
  it('returns an empty object when there is no token', () => {
    expect(buildAuthHeader(null)).toEqual({})
  })

  it('returns a Bearer authorization header when a token is present', () => {
    expect(buildAuthHeader('abc123')).toEqual({ Authorization: 'Bearer abc123' })
  })
})

describe('normalizeApiError', () => {
  it('treats non-object errors as unknown errors', () => {
    expect(normalizeApiError('boom')).toEqual({ status: null, message: 'Unbekannter Fehler.' })
  })

  it('treats missing status as an offline/network error', () => {
    expect(normalizeApiError({ message: 'network fail' })).toEqual({
      status: null,
      message: 'Keine Verbindung zum Server.',
    })
  })

  it('extracts status and server message from an ofetch-style error', () => {
    const error = { response: { status: 422 }, data: { message: 'Diese Zugangsdaten sind ungültig.' } }
    expect(normalizeApiError(error)).toEqual({
      status: 422,
      message: 'Diese Zugangsdaten sind ungültig.',
    })
  })

  it('falls back to the error message when no server message is present', () => {
    const error = { response: { status: 500 }, message: 'Internal Server Error' }
    expect(normalizeApiError(error)).toEqual({ status: 500, message: 'Internal Server Error' })
  })

  it('reads statusCode when response.status is not present', () => {
    const error = { statusCode: 401 }
    expect(normalizeApiError(error)).toEqual({ status: 401, message: 'Unbekannter Fehler.' })
  })
})
