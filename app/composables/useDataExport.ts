export function useDataExport() {
  async function exportJSON(): Promise<void> {
    const { db } = await import('../../db')
    const [diary, water, weight, food] = await Promise.all([
      db.diary_entries.toArray(),
      db.water_entries.toArray(),
      db.weight_entries.toArray(),
      db.food_items.toArray(),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      diary_entries: diary,
      water_entries: water,
      weight_entries: weight,
      food_items: food,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `basixmacro-export-${today()}.json`)
  }

  async function exportCSV(): Promise<void> {
    const { db } = await import('../../db')
    const entries = await db.diary_entries.orderBy('date').toArray()

    const header = 'date,meal_type,calories,protein_g,carbs_g,fat_g,amount_g'
    const rows = entries.map(e =>
      [e.date, e.meal_type, e.calories_total.toFixed(1), e.protein_total_g.toFixed(1),
        e.carbs_total_g.toFixed(1), e.fat_total_g.toFixed(1), e.amount_g].join(','),
    )

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, `basixmacro-diary-${today()}.csv`)
  }

  function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function today(): string {
    return new Date().toISOString().split('T')[0] ?? ''
  }

  return { exportJSON, exportCSV }
}
