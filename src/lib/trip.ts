import { createSeats, FLEET, isGuideSeat } from '@/lib/busLayout.ts'
import { APP_TITLE } from '@/lib/brand.ts'
import type { PublicSeat, Trip } from '@/types/index.ts'

export const TRIP_ID = 'bolu-gezisi'

const tripMeta = {
  id: TRIP_ID,
  title: 'Bolu Gezisi',
  community: APP_TITLE,
  origin: 'Ankara',
  destination: 'Bolu',
  meetingPoint: 'Kızılay Gama İş Merkezi önü',
  departureAt: '2026-10-24T06:30:00+03:00',
  returnAt: '2026-10-24T22:00:00+03:00',
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
      plate: bus.plate,
      capacity: bus.capacity,
      seats: createSeats(bus.capacity).map((seat) => ({
        number: seat.number,
        status:
          isGuideSeat(seat.number)
            ? 'reserved'
            : booked.has(`${bus.number}:${seat.number}`)
              ? 'occupied'
              : 'available',
      })),
    })),
  }
}
