/**
 * Formats a Date as YYYY-MM-DD using its *local* calendar date.
 *
 * `Date#toISOString()` converts to UTC first, which silently shifts the date
 * by a day for anyone east of UTC (e.g. right after local midnight, or after
 * any `setDate()` arithmetic) — every "today"/"±1 day" bug in this app has
 * come from that exact pattern. Always use this instead.
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Locale-aware "dd.mm.yyyy, hh:mm" style timestamp (de-DE / en-US). Shared by the
 * settings page and the header sync-status sheet so both render "last synced" alike.
 */
export function formatLocalDateTime(iso: string, locale: string): string {
  const loc = locale === 'en' ? 'en-US' : 'de-DE'
  return new Date(iso).toLocaleString(loc, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
