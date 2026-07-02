type SyncStatus = 'local' | 'synced' | 'dirty'

interface SoftDeletable {
  deleted_at?: string | null
}

interface SoftDeletableRecord extends SoftDeletable {
  updated_at: string
  sync_status: SyncStatus
}

export function excludeDeleted<T extends SoftDeletable>(rows: T[]): T[] {
  return rows.filter(row => !row.deleted_at)
}

export function markDeleted<T extends SoftDeletableRecord>(row: T, now: string): T {
  return { ...row, deleted_at: now, updated_at: now, sync_status: 'dirty' }
}
