import { normalizePhone } from '@/lib/phone.ts'
import type { RosterEntry } from '@/types/index.ts'

export type { RosterEntry }

export function parseRosterCsv(text: string): { entries: RosterEntry[] } | { error: string } {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!cleaned) return { error: 'Dosya boş.' }

  const delimiter = detectDelimiter(cleaned)
  const rows = parseCsv(cleaned, delimiter).filter((row) => row.some((cell) => cell.trim() !== ''))
  if (rows.length < 2) return { error: 'CSV en az bir başlık ve bir katılımcı satırı içermeli.' }

  const headers = rows[0].map(normalizeHeader)
  const nameIndex = headers.findIndex((header) => header.includes('soyad') || header.includes('isim'))
  const nationalIdIndex = headers.findIndex(
    (header) => header.includes('kimlik') || header.includes('t c') || header === 'tc',
  )
  const phoneIndex = headers.findIndex(
    (header) => header.includes('telefon') || header.includes('gsm') || header === 'tel',
  )

  if (nameIndex < 0 || nationalIdIndex < 0 || phoneIndex < 0) {
    return {
      error: 'Başlıkta Ad Soyad, T.C. Kimlik No ve Telefon sütunları bulunamadı.',
    }
  }

  const seen = new Set<string>()
  const entries: RosterEntry[] = []

  for (const row of rows.slice(1)) {
    const fullName = (row[nameIndex] ?? '').trim().replace(/\s+/g, ' ')
    const nationalId = (row[nationalIdIndex] ?? '').replace(/\D/g, '')
    const phone = normalizePhone(row[phoneIndex] ?? '')
    if (!nationalId && !phone) continue

    const key = `${fullName}|${nationalId}|${phone}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ fullName: fullName || 'İsimsiz', nationalId, phone })
  }

  if (entries.length === 0) return { error: 'Dosyada katılımcı satırı bulunamadı.' }
  return { entries }
}

export async function readCsvText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
  } catch {
    return new TextDecoder('windows-1254').decode(buffer)
  }
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split('\n')[0] ?? ''
  const commas = countChar(firstLine, ',')
  const semicolons = countChar(firstLine, ';')
  return semicolons > commas ? ';' : ','
}

function countChar(value: string, char: string): number {
  return [...value].filter((item) => item === char).length
}

function parseCsv(text: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}
