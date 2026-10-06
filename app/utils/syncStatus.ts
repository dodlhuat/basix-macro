export type SyncIndicatorState = 'hidden' | 'syncing' | 'offline' | 'error' | 'pending'

export interface SyncStatusInput {
  authenticated: boolean
  online: boolean
  isSyncing: boolean
  pendingCount: number
  syncError: string | null
}

/**
 * Single state for the header sync indicator. "Everything in sync" (and any logged-out
 * user, who has nothing to sync) is `hidden`; offline is a normal state for a local-first
 * app, so it ranks above `pending` but below an active sync.
 */
export function deriveSyncIndicatorState(input: SyncStatusInput): SyncIndicatorState {
  if (!input.authenticated) return 'hidden'
  if (input.isSyncing) return 'syncing'
  if (!input.online) return 'offline'
  if (input.syncError) return 'error'
  if (input.pendingCount > 0) return 'pending'
  return 'hidden'
}
