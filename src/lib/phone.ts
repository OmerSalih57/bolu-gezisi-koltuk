export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('90')) return `0${digits.slice(2)}`
  if (digits.length === 10 && digits.startsWith('5')) return `0${digits}`
  return digits
}

export function isValidPhone(value: string): boolean {
  return /^05\d{9}$/.test(normalizePhone(value))
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value)
  if (!/^05\d{9}$/.test(digits)) return value
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
}
