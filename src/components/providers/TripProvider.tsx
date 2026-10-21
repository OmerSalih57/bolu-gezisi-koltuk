import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TripContext, type RosterUploadResult, type TripContextValue } from '@/hooks/useTrip.ts'
import {
  clearStoredAdminPassword,
  expectedAdminPassword,
  readStoredAdminPassword,
  storeAdminPassword,
} from '@/lib/adminPassword.ts'
import {
  bookSeat as requestBookSeat,
  closeRoster as requestCloseRoster,
  fetchBookings,
  fetchRoster,
  fetchSeatStatus,
  releaseSeat as requestReleaseSeat,
  replaceParticipants,
  verifyAdmin,
} from '@/lib/api.ts'
import { supabase, supabaseConfigError } from '@/lib/supabase.ts'
import { tripFromSeats } from '@/lib/trip.ts'
import type { Booking, BusNumber, PassengerInput, PublicSeat, RosterEntry, RosterPerson } from '@/types/index.ts'

const legacyKeys = ['gezikoltuk.data.v1', 'gezikoltuk.data.v2', 'gezikoltuk.data.v3']

function purgeLegacyStorage() {
  for (const key of legacyKeys) localStorage.removeItem(key)
  sessionStorage.removeItem('gezikoltuk.admin.session')
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [seats, setSeats] = useState<PublicSeat[]>([])
  const [ready, setReady] = useState(!supabase)
  const [loadError, setLoadError] = useState<string | null>(supabaseConfigError)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roster, setRoster] = useState<RosterPerson[]>([])
  const adminRef = useRef(false)
  const passwordRef = useRef<string | null>(null)
  const seatsRef = useRef<PublicSeat[]>([])

  function unlock(password: string) {
    passwordRef.current = password
    adminRef.current = true
    storeAdminPassword(password)
    setIsAdmin(true)
  }

  function clearAdmin() {
    passwordRef.current = null
    adminRef.current = false
    clearStoredAdminPassword()
    setIsAdmin(false)
    setBookings([])
    setRoster([])
  }

  async function reloadSeats() {
    const result = await fetchSeatStatus()
    if (!result.ok) {
      if (seatsRef.current.length === 0) setLoadError(result.error)
      return
    }
    seatsRef.current = result.seats
    setSeats(result.seats)
    setLoadError(null)
  }

  async function reloadAdminLists(): Promise<string | null> {
    const password = passwordRef.current
    if (!password) return 'Yönetici girişi gerekli.'
    const [bookingResult, rosterResult] = await Promise.all([
      fetchBookings(password),
      fetchRoster(password),
    ])
    if (!bookingResult.ok) return bookingResult.error
    if (!rosterResult.ok) return rosterResult.error
    setBookings(bookingResult.bookings)
    setRoster(rosterResult.roster)
    return null
  }

  useEffect(() => {
    purgeLegacyStorage()
    const db = supabase
    if (!db) return

    let active = true
    void (async () => {
      await reloadSeats()
      const saved = readStoredAdminPassword()
      if (saved && saved === expectedAdminPassword()) {
        const verified = await verifyAdmin(saved)
        if (!active) return
        if (verified.ok) {
          unlock(saved)
          await reloadAdminLists()
        } else {
          clearAdmin()
        }
      } else if (saved) {
        clearAdmin()
      }
      if (active) setReady(true)
    })()

    const channel = db
      .channel('seat-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_status' }, () => {
        void reloadSeats()
      })
      .subscribe()

    return () => {
      active = false
      void db.removeChannel(channel)
    }
  }, [])

  const trip = useMemo(() => tripFromSeats(seats), [seats])

  const value = useMemo<TripContextValue>(() => {
    return {
      configured: supabase !== null,
      ready,
      loadError: supabase ? loadError : supabaseConfigError,
      trip,
      isAdmin,
      bookings,
      roster,
      async signIn(password: string) {
        if (!supabase) return supabaseConfigError
        if (password !== expectedAdminPassword()) return 'Şifre hatalı.'
        const verified = await verifyAdmin(password)
        if (!verified.ok) return verified.error
        unlock(password)
        return reloadAdminLists()
      },
      async signOut() {
        clearAdmin()
      },
      async bookSeat(input: PassengerInput & { busNumber: BusNumber; seatNumber: number }) {
        const result = await requestBookSeat(input)
        if (!result.ok) return result.error
        await reloadSeats()
        if (adminRef.current) await reloadAdminLists()
        return null
      },
      async replaceRoster(entries: RosterEntry[]): Promise<RosterUploadResult> {
        const password = passwordRef.current
        if (!password) return { error: 'Yönetici girişi gerekli.' }
        const result = await replaceParticipants(password, entries)
        if ('error' in result) return result
        const listError = await reloadAdminLists()
        if (listError) return { error: listError }
        return result
      },
      async closeRoster() {
        const password = passwordRef.current
        if (!password) return 'Yönetici girişi gerekli.'
        const result = await requestCloseRoster(password)
        if (!result.ok) return result.error
        return reloadAdminLists()
      },
      async releaseSeat(busNumber: BusNumber, seatNumber: number) {
        const password = passwordRef.current
        if (!password) return 'Yönetici girişi gerekli.'
        const result = await requestReleaseSeat(password, busNumber, seatNumber)
        if (!result.ok) return result.error
        await reloadSeats()
        return reloadAdminLists()
      },
    }
  }, [bookings, isAdmin, loadError, ready, roster, trip])

  return <TripContext value={value}>{children}</TripContext>
}
