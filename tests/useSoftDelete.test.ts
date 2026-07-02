import { describe, it, expect } from 'vitest'
import { excludeDeleted, markDeleted } from '../app/composables/useSoftDelete'
import type { WeightEntry } from '../db'

function makeEntry(id: string, deleted_at: string | null = null): WeightEntry {
  return {
    id,
    date: '2025-01-01',
    weight_kg: 80,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    sync_status: 'synced',
    deleted_at,
  }
}

describe('excludeDeleted', () => {
  it('keeps rows without deleted_at', () => {
    const rows = [makeEntry('a'), makeEntry('b')]
    expect(excludeDeleted(rows).map(r => r.id)).toEqual(['a', 'b'])
  })

  it('filters out rows with a deleted_at timestamp', () => {
    const rows = [makeEntry('a'), makeEntry('b', '2025-02-01T00:00:00.000Z')]
    expect(excludeDeleted(rows).map(r => r.id)).toEqual(['a'])
  })

  it('returns an empty array when all rows are deleted', () => {
    const rows = [makeEntry('a', '2025-02-01T00:00:00.000Z')]
    expect(excludeDeleted(rows)).toEqual([])
  })
})

describe('markDeleted', () => {
  it('sets deleted_at, updated_at and sync_status', () => {
    const row = makeEntry('a')
    const now = '2025-03-01T00:00:00.000Z'
    const result = markDeleted(row, now)
    expect(result.deleted_at).toBe(now)
    expect(result.updated_at).toBe(now)
    expect(result.sync_status).toBe('dirty')
  })

  it('preserves other fields and does not mutate the input', () => {
    const row = makeEntry('a')
    const result = markDeleted(row, '2025-03-01T00:00:00.000Z')
    expect(result.id).toBe('a')
    expect(result.weight_kg).toBe(80)
    expect(row.deleted_at).toBeNull()
  })
})
