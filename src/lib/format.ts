const dateTime = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const time = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
})

const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value))
}

export function formatTime(value: string): string {
  return time.format(new Date(value))
}

export function formatPrice(value: number): string {
  return money.format(value)
}
