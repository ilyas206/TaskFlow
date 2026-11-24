// Turns "2026-01-01T00:00:00.000000Z" into "1 janv. 2026"
export function formatDate(value) {
  if (!value) return '—'

  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}