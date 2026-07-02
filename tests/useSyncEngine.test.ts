import { describe, it, expect } from 'vitest'
import { resolveConflict, partitionDirtyRows, buildSyncPayload, shouldApplyRemote } from '../app/composables/useSyncEngine'

describe('resolveConflict', () => {
  it('keeps local when there is no remote row', () => {
    const local = { updated_at: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, undefined)).toBe('keep-local')
  })

  it('keeps remote when it is newer than local', () => {
    const local = { updated_at: '2026-01-01T00:00:00.000Z' }
    const remote = { updated_at: '2026-01-02T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe('keep-remote')
  })

  it('keeps local when it is newer than remote', () => {
    const local = { updated_at: '2026-01-02T00:00:00.000Z' }
    const remote = { updated_at: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe('keep-local')
  })

  it('breaks a tie in favor of the remote/server version', () => {
    const local = { updated_at: '2026-01-01T00:00:00.000Z' }
    const remote = { updated_at: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe('keep-remote')
  })
})

describe('partitionDirtyRows', () => {
  it('keeps local and dirty rows, drops synced rows', () => {
    const rows = [
      { id: 'a', sync_status: 'local' as const },
      { id: 'b', sync_status: 'synced' as const },
      { id: 'c', sync_status: 'dirty' as const },
    ]
    expect(partitionDirtyRows(rows).map(r => r.id)).toEqual(['a', 'c'])
  })

  it('returns an empty array when everything is already synced', () => {
    const rows = [{ id: 'a', sync_status: 'synced' as const }]
    expect(partitionDirtyRows(rows)).toEqual([])
  })
})

describe('buildSyncPayload', () => {
  it('picks id, updated_at, deleted_at and the declared domain fields', () => {
    const rows = [{
      id: 'abc',
      name: 'Apfel',
      calories_per_100g: 52,
      internal_note: 'should not be sent',
      updated_at: '2026-01-01T00:00:00.000Z',
      deleted_at: null,
      sync_status: 'dirty' as const,
    }]
    expect(buildSyncPayload(rows, ['name', 'calories_per_100g'])).toEqual([{
      id: 'abc',
      updated_at: '2026-01-01T00:00:00.000Z',
      deleted_at: null,
      name: 'Apfel',
      calories_per_100g: 52,
    }])
  })

  it('defaults a missing deleted_at to null', () => {
    const rows = [{ id: 'x', updated_at: '2026-01-01T00:00:00.000Z', name: 'y' }]
    expect(buildSyncPayload(rows, ['name'])[0]).toEqual({
      id: 'x',
      updated_at: '2026-01-01T00:00:00.000Z',
      deleted_at: null,
      name: 'y',
    })
  })
})

describe('shouldApplyRemote', () => {
  it('applies remote when there is no local row yet', () => {
    const remote = { updated_at: '2026-01-01T00:00:00.000Z' }
    expect(shouldApplyRemote(undefined, remote)).toBe(true)
  })

  it('applies remote when it is newer', () => {
    const local = { updated_at: '2026-01-01T00:00:00.000Z' }
    const remote = { updated_at: '2026-01-02T00:00:00.000Z' }
    expect(shouldApplyRemote(local, remote)).toBe(true)
  })

  it('keeps local when it is newer than the incoming remote row', () => {
    const local = { updated_at: '2026-01-02T00:00:00.000Z' }
    const remote = { updated_at: '2026-01-01T00:00:00.000Z' }
    expect(shouldApplyRemote(local, remote)).toBe(false)
  })
})
