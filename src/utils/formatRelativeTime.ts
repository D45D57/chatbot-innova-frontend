export function formatRelativeTime(value: string, now = new Date()): string {
  const date = new Date(value)
  const differenceMs = Math.max(0, now.getTime() - date.getTime())
  const minutes = Math.floor(differenceMs / 60_000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}
