import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequireDatabase } from '@/components/setup/RequireDatabase.tsx'
import { TripSchedule } from '@/components/trip/TripSchedule.tsx'
import { PageHeading } from '@/components/ui/PageHeading.tsx'
import { useTrip } from '@/hooks/useTrip.ts'
import { APP_TITLE } from '@/lib/brand.ts'

export function TripsPage() {
  return (
    <RequireDatabase>
      <TripList />
    </RequireDatabase>
  )
}

function TripList() {
  const { trip } = useTrip()
  const occupied = trip.buses.reduce(
    (sum, bus) => sum + bus.seats.filter((seat) => seat.status === 'occupied').length,
    0,
  )
  const total = trip.buses.reduce((sum, bus) => sum + bus.seats.length, 0)

  return (
    <section>
      <PageHeading
        title={APP_TITLE}
        description="İki adet 46 kişilik ve bir adet 55 kişilik otobüs. Koltuk seçmek için kayıt bilgilerinizi girin."
      />
      <ul className="grid gap-4">
        <li>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-teal-800">{trip.community}</p>
                <h2 className="mt-1 text-xl font-semibold">{trip.title}</h2>
                <TripSchedule trip={trip} />
              </div>
              <p className="text-sm text-slate-500">
                {occupied}/{total} koltuk dolu
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to={`/geziler/${trip.id}/koltuklar`}
                className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-white"
              >
                Koltuk seç
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to={`/geziler/${trip.id}/katilimcilar`}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
              >
                Katılımcılar
              </Link>
            </div>
          </article>
        </li>
      </ul>
    </section>
  )
}
