import { createContext, useContext } from 'react'
import type { Booking, BusNumber, PassengerInput, RosterEntry, RosterPerson, Trip } from '@/types/index.ts'

export type RosterUploadResult = { saved: number; skipped: number } | { error: string }

export type TripContextValue = {
  configured: boolean
  ready: boolean
  loadError: string | null
  trip: Trip
  isAdmin: boolean
  bookings: Booking[]
  roster: RosterPerson[]
  signIn: (password: string) => Promise<string | null>
  signOut: () => Promise<void>
  bookSeat: (input: PassengerInput & { busNumber: BusNumber; seatNumber: number }) => Promise<string | null>
  replaceRoster: (entries: RosterEntry[]) => Promise<RosterUploadResult>
  closeRoster: () => Promise<string | null>
  releaseSeat: (busNumber: BusNumber, seatNumber: number) => Promise<string | null>
}

export const TripContext = createContext<TripContextValue | null>(null)

export function useTrip(): TripContextValue {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTrip yalnızca TripProvider içinde kullanılabilir.')
  }
  return context
}
