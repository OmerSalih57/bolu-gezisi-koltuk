import { useParams } from 'react-router-dom'
import { RequireDatabase } from '@/components/setup/RequireDatabase.tsx'
import { useTrip } from '@/hooks/useTrip.ts'
import { TRIP_ID } from '@/lib/trip.ts'

export function ParticipantsPage() {
  return (
    <RequireDatabase>
      <ParticipantCounts />
    </RequireDatabase>
  )
}

function ParticipantCounts() {
  const { tripId } = useParams()
  const { trip } = useTrip()
  if (tripId !== TRIP_ID) return <p className="text-slate-600">Gezi bulunamadı.</p>

  const occupied = trip.buses.reduce(
    (sum, bus) => sum + bus.seats.filter((seat) => seat.status === 'occupied').length,
    0,
  )

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Katılımcılar</h2>
      <p className="mt-2 text-slate-600">Bu geziye {occupied} koltuk dolu.</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {trip.buses.map((bus) => {
          const filled = bus.seats.filter((seat) => seat.status === 'occupied').length
          return (
            <li key={bus.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">{bus.name}</span>
              <span className="text-slate-600">
                {filled} dolu · {bus.seats.length - filled} boş
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
