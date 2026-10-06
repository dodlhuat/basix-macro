import { describe, it, expect } from 'vitest'
import { deriveSyncIndicatorState, type SyncStatusInput } from '../app/utils/syncStatus'

const base: SyncStatusInput = {
  authenticated: true,
  online: true,
  isSyncing: false,
  pendingCount: 0,
  syncError: null,
}

describe('deriveSyncIndicatorState', () => {
  it('is hidden when everything is in sync', () => {
    expect(deriveSyncIndicatorState(base)).toBe('hidden')
  })

  it('is always hidden for logged-out users', () => {
    expect(deriveSyncIndicatorState({ ...base, authenticated: false, online: false, pendingCount: 5, syncError: 'x' })).toBe('hidden')
  })

  it('shows pending when changes wait for sync', () => {
    expect(deriveSyncIndicatorState({ ...base, pendingCount: 3 })).toBe('pending')
  })

  it('shows syncing while a sync runs, even with pending changes or offline flag', () => {
    expect(deriveSyncIndicatorState({ ...base, isSyncing: true, pendingCount: 3 })).toBe('syncing')
  })

  it('shows offline when there is no connection', () => {
    expect(deriveSyncIndicatorState({ ...base, online: false })).toBe('offline')
  })

  it('ranks offline above error and pending', () => {
    expect(deriveSyncIndicatorState({ ...base, online: false, syncError: 'x', pendingCount: 2 })).toBe('offline')
  })

  it('shows error when online and the last sync failed', () => {
    expect(deriveSyncIndicatorState({ ...base, syncError: 'boom', pendingCount: 2 })).toBe('error')
  })
})
