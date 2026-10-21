import { formatDateTime, formatTime } from '@/lib/format.ts'
import type { Trip } from '@/types/index.ts'

export function TripSchedule({ trip }: { trip: Trip }) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-slate-600">
        {trip.origin} → {trip.destination}
      </p>
      <p className="text-sm text-slate-600">
        Kalkış {formatDateTime(trip.departureAt)} · {trip.meetingPoint}
      </p>
      <p className="text-sm text-slate-500">İniş {formatTime(trip.returnAt)} · aynı konum</p>
    </div>
  )
}
