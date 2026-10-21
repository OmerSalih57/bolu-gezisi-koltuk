import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { TripSchedule } from '@/components/trip/TripSchedule.tsx'
import { useTrip } from '@/hooks/useTrip.ts'
import { TRIP_ID } from '@/lib/trip.ts'

const sections = [
  { to: 'koltuklar', label: 'Koltuklar' },
  { to: 'katilimcilar', label: 'Katılımcılar' },
]

export function TripSectionLayout() {
  const { tripId } = useParams()
  const { trip, configured, ready } = useTrip()

  if (!configured || !ready) {
    return <Outlet />
  }

  if (tripId !== TRIP_ID) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Gezi bulunamadı</h1>
        <Link to="/" className="mt-3 inline-block text-sm text-teal-800">
          Gezilere dön
        </Link>
      </div>
    )
  }

  return (
    <section>
      <p className="text-sm text-teal-800">{trip.community}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{trip.title}</h1>
      <TripSchedule trip={trip} />
      <nav className="mt-6 flex gap-2">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-teal-800 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </section>
  )
}
