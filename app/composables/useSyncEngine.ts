import type { Table } from 'dexie'

export type SyncStatus = 'local' | 'synced' | 'dirty'

export interface SyncRow {
  id: string
  updated_at: string
  deleted_at?: string | null
  sync_status: SyncStatus
  [key: string]: unknown
}

interface SyncTableConfig {
  key: string
  fields: readonly string[]
}

const SYNC_TABLES: readonly SyncTableConfig[] = [
  {
    key: 'food_items',
    fields: ['name', 'brand', 'barcode', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'fiber_per_100g', 'sugar_per_100g', 'source', 'is_favorite', 'last_used_at'],
  },
  {
    key: 'recipes',
    fields: ['name', 'description', 'servings', 'image_url'],
  },
  {
    key: 'recipe_ingredients',
    fields: ['recipe_id', 'food_item_id', 'amount_g'],
  },
  {
    key: 'diary_entries',
    fields: ['date', 'meal_type', 'food_item_id', 'recipe_id', 'amount_g', 'servings', 'calories_total', 'protein_total_g', 'carbs_total_g', 'fat_total_g', 'logged_at'],
  },
  {
    key: 'weight_entries',
    fields: ['date', 'weight_kg', 'note'],
  },
  {
    key: 'water_entries',
    fields: ['date', 'amount_ml', 'logged_at'],
  },
  {
    key: 'body_fat_entries',
    fields: ['date', 'gender', 'height_cm', 'neck_cm', 'waist_cm', 'hip_cm', 'body_fat_percent', 'category'],
  },
  {
    key: 'activity_entries',
    fields: ['date', 'name', 'calories_burned', 'duration_min'],
  },
] as const

const PROFILE_FIELDS = [
  'name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'goal',
  'calorie_goal', 'protein_goal_g', 'carbs_goal_g', 'fat_goal_g', 'unit_system',
  'water_goal_ml', 'dark_mode', 'adaptive_calories_enabled',
  'adaptive_calories_last_adjusted_at', 'adaptive_calories_last_delta_kcal', 'locale',
] as const

interface SyncPushResult {
  id: string | null
  status: 'applied' | 'superseded' | 'invalid'
  server?: Record<string, unknown>
}

interface SyncResponse {
  server_time: string
  push_results: Record<string, SyncPushResult[] | SyncPushResult | undefined>
  changes: Record<string, unknown[] | Record<string, unknown> | null | undefined>
}

// ─── Pure functions (unit tested, no IO) ───────────────────────────────────

/** Last-write-wins conflict resolution. Ties are broken in favor of the remote/server version. */
export function resolveConflict<T extends { updated_at: string }>(local: T, remote: T | undefined): 'keep-local' | 'keep-remote' {
  if (!remote) return 'keep-local'
  return Date.parse(remote.updated_at) >= Date.parse(local.updated_at) ? 'keep-remote' : 'keep-local'
}

/** Rows that still need to be pushed to the server (never synced, or changed since the last sync). */
export function partitionDirtyRows<T extends { sync_status: SyncStatus }>(rows: T[]): T[] {
  return rows.filter(row => row.sync_status !== 'synced')
}

/** Builds the wire payload for a table: id + declared domain fields + updated_at + deleted_at. */
export function buildSyncPayload<T extends Record<string, unknown>>(rows: T[], fields: readonly string[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const payload: Record<string, unknown> = {
      id: row.id,
      updated_at: row.updated_at,
      deleted_at: (row.deleted_at as string | null | undefined) ?? null,
    }
    for (const field of fields) payload[field] = row[field]
    return payload
  })
}

/** Whether a pulled remote row should overwrite the local one. New local rows always lose to remote. */
export function shouldApplyRemote<T extends { updated_at: string }>(local: T | undefined, remote: T): boolean {
  return !local || resolveConflict(local, remote) === 'keep-remote'
}

// ─── Orchestration (impure: Dexie + network IO) ────────────────────────────

function getDexieTable(db: object, key: string): Table<SyncRow, string> {
  const table = (db as unknown as Record<string, Table<SyncRow, string> | undefined>)[key]
  if (!table) throw new Error(`Unknown sync table: ${key}`)
  return table
}

async function countPendingRows(db: object, profileDirty: boolean): Promise<number> {
  let count = profileDirty ? 1 : 0
  for (const table of SYNC_TABLES) {
    count += await getDexieTable(db, table.key).where('sync_status').notEqual('synced').count()
  }
  return count
}

export interface SyncOutcome {
  ok: boolean
  error?: string
}

/**
 * Pushes local changes and pulls remote changes in a single round trip against `/sync`.
 * `full: true` ignores `sync_status`/`lastSyncedAt` and re-uploads/re-downloads everything —
 * used for the one-time merge right after login on a device with pre-existing local data.
 */
export async function performSync(options: { full?: boolean } = {}): Promise<SyncOutcome> {
  const authStore = useAuthStore()
  const syncStore = useSyncStore()
  const userStore = useUserStore()

  if (!authStore.isAuthenticated) return { ok: false, error: 'not authenticated' }
  if (syncStore.isSyncing) return { ok: false, error: 'already syncing' }

  syncStore.isSyncing = true
  syncStore.syncError = null

  try {
    const { db } = await import('../../db')
    const { post } = useApi()

    const since = options.full ? null : syncStore.lastSyncedAt
    const localUser = userStore.user
    const profileDirty = !!localUser && (options.full || localUser.sync_status !== 'synced')

    const tablesPayload: Record<string, Record<string, unknown>[]> = {}
    for (const table of SYNC_TABLES) {
      const allRows = await getDexieTable(db, table.key).toArray()
      const rowsToPush = options.full ? allRows : partitionDirtyRows(allRows)
      tablesPayload[table.key] = buildSyncPayload(rowsToPush, table.fields)
    }

    const profilePayload = profileDirty && localUser
      ? buildSyncPayload([localUser as unknown as SyncRow], PROFILE_FIELDS)[0]
      : null

    const response = await post<SyncResponse>('/sync', {
      since,
      profile: profilePayload,
      tables: tablesPayload,
    })

    // Apply push results: mark pushed rows as synced, or adopt the server's version on conflict.
    for (const table of SYNC_TABLES) {
      const dexieTable = getDexieTable(db, table.key)
      const results = (response.push_results[table.key] as SyncPushResult[] | undefined) ?? []
      for (const result of results) {
        if (!result.id) continue
        if (result.status === 'applied') {
          await dexieTable.update(result.id, { sync_status: 'synced' })
        } else if (result.status === 'superseded' && result.server) {
          const local = await dexieTable.get(result.id)
          if (local) {
            await dexieTable.put({ ...local, ...result.server, id: result.id, sync_status: 'synced' } as SyncRow)
          }
        }
      }
    }

    if (profileDirty && localUser) {
      const profileResult = response.push_results.profile as SyncPushResult | undefined
      if (profileResult?.status === 'applied') {
        await userStore.markSynced()
      } else if (profileResult?.status === 'superseded' && profileResult.server) {
        await userStore.applyRemote(profileResult.server)
      }
    }

    // Apply pulled changes, resolving conflicts against whatever is now stored locally.
    for (const table of SYNC_TABLES) {
      const dexieTable = getDexieTable(db, table.key)
      const remoteRows = (response.changes[table.key] as SyncRow[] | undefined) ?? []
      for (const remote of remoteRows) {
        const local = await dexieTable.get(remote.id)
        if (shouldApplyRemote(local, remote)) {
          await dexieTable.put({
            ...local,
            ...remote,
            created_at: local?.created_at ?? remote.updated_at,
            sync_status: 'synced',
          } as SyncRow)
        }
      }
    }

    // No `&& userStore.user` guard here: a fresh device with no local profile yet
    // (e.g. logging in before ever completing onboarding on this device) must still
    // pull the remote profile. shouldApplyRemote() already returns true whenever
    // `local` is falsy, so passing `userStore.user === null` through it is safe.
    const remoteProfile = response.changes.profile as Record<string, unknown> | null | undefined
    if (remoteProfile) {
      if (shouldApplyRemote(userStore.user as unknown as SyncRow, remoteProfile as unknown as SyncRow)) {
        await userStore.applyRemote(remoteProfile)
      }
    }

    syncStore.lastSyncedAt = response.server_time
    syncStore.pendingCount = await countPendingRows(db, !!userStore.user && userStore.user.sync_status !== 'synced')
    return { ok: true }
  } catch (error) {
    const normalized = normalizeApiError(error)
    syncStore.syncError = normalized.message
    return { ok: false, error: normalized.message }
  } finally {
    syncStore.isSyncing = false
  }
}
