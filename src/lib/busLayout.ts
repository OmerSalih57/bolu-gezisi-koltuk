import type { BusCapacity, BusNumber, Seat } from '@/types/index.ts'

export type LayoutSlot =
  | { kind: 'seat'; number: number }
  | { kind: 'driver' }
  | { kind: 'front-door' }
  | { kind: 'middle-door' }
  | { kind: 'muavin' }
  | { kind: 'blank' }

export type LayoutRow = {
  id: string
  left: LayoutSlot[]
  right: LayoutSlot[]
  center?: LayoutSlot[]
  separated?: boolean
}

export const FLEET: Array<{ id: string; number: BusNumber; name: string; capacity: BusCapacity }> = [
  { id: 'otobus-1', number: 1, name: 'Otobüs 1', capacity: 46 },
  { id: 'otobus-2', number: 2, name: 'Otobüs 2', capacity: 46 },
  { id: 'otobus-3', number: 3, name: 'Otobüs 3', capacity: 55 },
]

function pair(leftNumber: number, rightNumber: number): LayoutSlot[] {
  return [
    { kind: 'seat', number: leftNumber },
    { kind: 'seat', number: rightNumber },
  ]
}

// Önden arkaya. Sol çiftler dıştan içe, sağ çiftler koridordan cama doğru.
// 55 kişilik planda 46'lık düzen korunur; 47-55 arkaya eklenir.
export function busLayout(capacity: BusCapacity): LayoutRow[] {
  const rows: LayoutRow[] = [
    {
      id: 'front',
      left: [{ kind: 'driver' }],
      right: [{ kind: 'front-door' }],
    },
    {
      id: 'row-1',
      left: pair(1, 2),
      right: [{ kind: 'muavin' }],
    },
    { id: 'row-5', left: pair(5, 6), right: pair(3, 4) },
    { id: 'row-9', left: pair(9, 10), right: pair(7, 8) },
    { id: 'row-13', left: pair(13, 14), right: pair(11, 12) },
    { id: 'row-17', left: pair(17, 18), right: pair(15, 16) },
    { id: 'row-21', left: pair(21, 22), right: pair(19, 20) },
    { id: 'row-25', left: pair(25, 26), right: pair(23, 24) },
    {
      id: 'middle-door',
      left: pair(27, 28),
      right: [{ kind: 'middle-door' }],
      separated: true,
    },
    { id: 'row-31', left: pair(31, 32), right: pair(29, 30) },
    { id: 'row-35', left: pair(35, 36), right: pair(33, 34) },
    { id: 'row-39', left: pair(39, 40), right: pair(37, 38) },
    { id: 'row-43', left: pair(43, 44), right: pair(41, 42) },
    {
      id: 'row-45',
      left: [{ kind: 'blank' }],
      right: pair(45, 46),
    },
  ]

  if (capacity === 55) {
    rows.push(
      { id: 'row-47', left: pair(47, 48), right: pair(49, 50) },
      { id: 'row-51', left: pair(51, 52), right: pair(53, 54) },
      { id: 'row-55', left: [], right: [], center: [{ kind: 'seat', number: 55 }] },
    )
  }

  assertLayout(capacity, rows)
  return rows
}

function collectSeatNumbers(rows: LayoutRow[]): number[] {
  const numbers: number[] = []
  for (const row of rows) {
    for (const slot of [...row.left, ...row.right, ...(row.center ?? [])]) {
      if (slot.kind === 'seat') numbers.push(slot.number)
    }
  }
  return numbers
}

function assertLayout(capacity: BusCapacity, rows: LayoutRow[]): void {
  const numbers = collectSeatNumbers(rows)
  const unique = new Set(numbers)
  if (unique.size !== numbers.length || unique.size !== capacity) {
    throw new Error(`Koltuk düzeni ${capacity} kişilik için ${unique.size} koltuk üretiyor.`)
  }
  for (let number = 1; number <= capacity; number += 1) {
    if (!unique.has(number)) {
      throw new Error(`Koltuk ${number} düzende yok.`)
    }
  }
}

export function createSeats(capacity: BusCapacity): Seat[] {
  return collectSeatNumbers(busLayout(capacity))
    .sort((left, right) => left - right)
    .map((number) => ({
      number,
      status: 'available',
    }))
}
