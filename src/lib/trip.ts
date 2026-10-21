import { createSeats, FLEET } from '@/lib/busLayout.ts'
import { APP_TITLE } from '@/lib/brand.ts'
import type { PublicSeat, Trip } from '@/types/index.ts'

export const TRIP_ID = 'bolu-gezisi'

const tripMeta = {
  id: TRIP_ID,
  title: 'Bolu Gezisi',
  community: APP_TITLE,
  origin: 'Ankara',
  destination: 'Bolu',
  departureAt: '2026-11-14T07:30:00+03:00',
}

export function tripFromSeats(rows: PublicSeat[]): Trip {
  const booked = new Set(
    rows.filter((row) => row.isBooked).map((row) => `${row.busNumber}:${row.seatNumber}`),
  )

  return {
    ...tripMeta,
    buses: FLEET.map((bus) => ({
      id: bus.id,
      number: bus.number,
      name: bus.name,
      capacity: bus.capacity,
      seats: createSeats(bus.capacity).map((seat) => ({
        number: seat.number,
        status: booked.has(`${bus.number}:${seat.number}`) ? 'occupied' : 'available',
      })),
    })),
  }
}
