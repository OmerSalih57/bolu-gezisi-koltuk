import { Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AdminLoginModal } from '@/features/seats/AdminLoginModal.tsx'
import { NamedSeatMap } from '@/features/seats/NamedSeatMap.tsx'
import { SetupScreen } from '@/features/setup/SetupScreen.tsx'
import { useTrip } from '@/hooks/useTrip.ts'
import { APP_TITLE } from '@/lib/brand.ts'
import { formatDateTime, formatTime } from '@/lib/format.ts'
import { TRIP_ID } from '@/lib/trip.ts'

export function PrintSchemasPage() {
  const { tripId } = useParams()
  const { configured, ready, loadError, isAdmin, trip, bookings, signIn } = useTrip()

  if (!configured) return <SetupScreen />
  if (!ready) return <p className="text-slate-600">Koltuk durumu yükleniyor…</p>
  if (loadError) return <p className="max-w-xl text-rose-700">{loadError}</p>
  if (tripId !== TRIP_ID) return <p className="text-slate-600">Gezi bulunamadı.</p>

  if (!isAdmin) {
    return (
      <AdminLoginModal
        title="İsimli koltuk şeması"
        description="Yolcu adlarının göründüğü çıktı için yönetici girişi gerekir."
        backHref={`/geziler/${trip.id}/koltuklar`}
        backLabel="Koltuklara dön"
        onSubmit={signIn}
      />
    )
  }

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{APP_TITLE}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Dolu koltuklarda yolcunun adı soyadı yazar. PDF için yazdır penceresinde “PDF olarak kaydet”i seçin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/geziler/${trip.id}/koltuklar`}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
          >
            Koltuklara dön
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-white"
          >
            <Printer className="size-4" aria-hidden="true" />
            Yazdır / PDF kaydet
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {trip.buses.map((bus) => (
          <article key={bus.id} className="print-sheet mx-auto w-[210mm] max-w-full bg-white p-[8mm] shadow-sm">
            <header className="mb-[4mm] border-b border-slate-300 pb-[3mm]">
              <p className="text-[11pt] font-semibold">{APP_TITLE}</p>
              <h2 className="mt-[1mm] text-[16pt] font-bold">
                {bus.name} · {bus.capacity} kişilik
              </h2>
              <p className="mt-[1mm] text-[10pt]">
                Kalkış {formatDateTime(trip.departureAt)} · {trip.meetingPoint} · İniş {formatTime(trip.returnAt)}, aynı
                konum
              </p>
            </header>
            <NamedSeatMap
              bus={bus}
              namesBySeat={bookings
                .filter((person) => person.busNumber === bus.number)
                .map((person) => ({ seatNumber: person.seatNumber, fullName: person.fullName }))}
            />
          </article>
        ))}
      </div>
    </div>
  )
}
