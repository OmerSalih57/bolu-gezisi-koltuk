import { supabase } from '@/lib/supabase.ts'
import type { Booking, BusNumber, PassengerInput, PublicSeat, RosterEntry, RosterPerson } from '@/types/index.ts'

type OkResult = { ok: true }
type FailResult = { ok: false; error: string }

const genericError = 'İşlem tamamlanamadı. Bağlantıyı kontrol edin.'
const schemaError =
  'Veritabanı tabloları bulunamadı. supabase/schema.sql dosyasını Supabase SQL editöründe çalıştırın.'

function client() {
  if (!supabase) throw new Error(schemaError)
  return supabase
}

function readResult(data: unknown): OkResult | FailResult {
  if (!data || typeof data !== 'object' || !('ok' in data)) {
    return { ok: false, error: genericError }
  }
  if ((data as { ok?: unknown }).ok === true) return { ok: true }
  const error = (data as { error?: unknown }).error
  return { ok: false, error: typeof error === 'string' ? error : genericError }
}

function readCount(data: unknown): { saved: number; skipped: number } | FailResult {
  const result = readResult(data)
  if (!result.ok) return result
  const saved = Number((data as { saved?: unknown }).saved)
  const skipped = Number((data as { skipped?: unknown }).skipped)
  return {
    saved: Number.isFinite(saved) ? saved : 0,
    skipped: Number.isFinite(skipped) ? skipped : 0,
  }
}

function isBusNumber(value: number): value is BusNumber {
  return value === 1 || value === 2 || value === 3
}

function schemaLike(message: string): boolean {
  return /seat_status|schema cache|relation|does not exist|PGRST205/i.test(message)
}

export async function fetchSeatStatus(): Promise<{ ok: true; seats: PublicSeat[] } | FailResult> {
  const { data, error } = await client()
    .from('seat_status')
    .select('bus_number, seat_number, is_booked')

  if (error) {
    return { ok: false, error: schemaLike(error.message) ? schemaError : genericError }
  }

  const seats: PublicSeat[] = []
  for (const row of data ?? []) {
    const busNumber = Number(row.bus_number)
    const seatNumber = Number(row.seat_number)
    if (!isBusNumber(busNumber) || !Number.isInteger(seatNumber)) continue
    seats.push({
      busNumber,
      seatNumber,
      isBooked: Boolean(row.is_booked),
    })
  }

  if (seats.length === 0) {
    return { ok: false, error: schemaError }
  }

  return { ok: true, seats }
}

export async function bookSeat(
  input: PassengerInput & { busNumber: BusNumber; seatNumber: number },
): Promise<OkResult | FailResult> {
  const { data, error } = await client().rpc('book_seat', {
    p_full_name: input.fullName,
    p_tc_no: input.nationalId,
    p_phone: input.phone,
    p_bus_number: input.busNumber,
    p_seat_number: input.seatNumber,
  })

  if (error) return { ok: false, error: genericError }
  return readResult(data)
}

export async function verifyAdmin(password: string): Promise<OkResult | FailResult> {
  const { data, error } = await client().rpc('is_admin', { p_password: password })
  if (error) {
    if (/PGRST202|schema cache|could not find the function|is_admin/i.test(error.message)) {
      return {
        ok: false,
        error: 'Yönetim şifresi için supabase/schema.sql dosyasını SQL Editor’da yeniden çalıştırın.',
      }
    }
    return { ok: false, error: 'Şifre doğrulanamadı.' }
  }
  if (data === true) return { ok: true }
  return { ok: false, error: 'Şifre hatalı.' }
}

export async function replaceParticipants(
  password: string,
  entries: RosterEntry[],
): Promise<{ saved: number; skipped: number } | FailResult> {
  const { data, error } = await client().rpc('replace_participants', {
    p_password: password,
    p_entries: entries.map((entry) => ({
      full_name: entry.fullName,
      tc_no: entry.nationalId,
      phone: entry.phone,
    })),
  })

  if (error) return { ok: false, error: genericError }
  return readCount(data)
}

export async function closeRoster(password: string): Promise<OkResult | FailResult> {
  const { data, error } = await client().rpc('close_roster', { p_password: password })
  if (error) return { ok: false, error: genericError }
  return readResult(data)
}

export async function releaseSeat(
  password: string,
  busNumber: BusNumber,
  seatNumber: number,
): Promise<OkResult | FailResult> {
  const { data, error } = await client().rpc('release_seat', {
    p_password: password,
    p_bus_number: busNumber,
    p_seat_number: seatNumber,
  })
  if (error) return { ok: false, error: genericError }
  return readResult(data)
}

export async function fetchBookings(
  password: string,
): Promise<{ ok: true; bookings: Booking[] } | FailResult> {
  const { data, error } = await client().rpc('list_bookings', { p_password: password })
  if (error) return { ok: false, error: 'Yolcu listesi alınamadı.' }

  const bookings: Booking[] = []
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const busNumber = Number(row.bus_number)
    const seatNumber = Number(row.seat_number)
    if (!isBusNumber(busNumber) || !Number.isInteger(seatNumber)) continue
    bookings.push({
      busNumber,
      seatNumber,
      fullName: String(row.full_name ?? ''),
      nationalId: String(row.tc_no ?? ''),
      phone: String(row.phone ?? ''),
    })
  }
  return { ok: true, bookings }
}

export async function fetchRoster(
  password: string,
): Promise<{ ok: true; roster: RosterPerson[] } | FailResult> {
  const { data, error } = await client().rpc('list_roster', { p_password: password })
  if (error) return { ok: false, error: 'Katılımcı listesi alınamadı.' }

  const roster: RosterPerson[] = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    fullName: String(row.full_name ?? ''),
    nationalId: String(row.tc_no ?? ''),
    phone: String(row.phone ?? ''),
    isRegistered: Boolean(row.is_registered),
  }))
  return { ok: true, roster }
}
