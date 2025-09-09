// CSV and import/export helpers shared across pages

export function normalizeHeader(name: string): string {
  return name.toLowerCase().trim().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '')
}

export function csvEscape(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  try {
    const content = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {}
}

