import { Lock, Table2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { RequireDatabase } from '@/components/setup/RequireDatabase.tsx'
import { AdminLoginModal } from '@/features/seats/AdminLoginModal.tsx'
import { FleetAdmin } from '@/features/seats/FleetAdmin.tsx'
import { PassengerModal } from '@/features/seats/PassengerModal.tsx'
import { SeatMap } from '@/features/seats/SeatMap.tsx'
import { useTrip } from '@/hooks/useTrip.ts'
import { isTakenSeat } from '@/lib/busLayout.ts'
import { TRIP_ID } from '@/lib/trip.ts'
import type { PassengerInput } from '@/types/index.ts'

export function SeatSelectionPage() {
  return (
    <RequireDatabase>
      <SeatSelection />
    </RequireDatabase>
  )
}

function SeatSelection() {
  const { tripId } = useParams()
  const { trip, isAdmin, signIn, signOut, bookSeat } = useTrip()
  const [busId, setBusId] = useState('otobus-1')
  const [activeSeat, setActiveSeat] = useState<number | null>(null)
  const [occupiedNotice, setOccupiedNotice] = useState<number | null>(null)
  const [guideNotice, setGuideNotice] = useState<number | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const bus = trip.buses.find((item) => item.id === busId) ?? trip.buses[0]

  if (tripId !== TRIP_ID || !bus) {
    return <p className="text-slate-600">Gezi bulunamadı.</p>
  }

  const occupied = bus.seats.filter((seat) => isTakenSeat(seat.status)).length

  async function savePassenger(input: PassengerInput): Promise<string | null> {
    if (activeSeat === null) return 'Koltuk seçin.'
    return bookSeat({
      ...input,
      busNumber: bus.number,
      seatNumber: activeSeat,
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Koltuk seçimi</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Otobüsü seçin, boş koltuğa tıklayın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) {
                setLoginOpen(true)
                return
              }
              setAdminOpen((open) => !open)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
          >
            <Table2 className="size-4" aria-hidden="true" />
            Yönetim
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                void signOut()
                setAdminOpen(false)
                setActiveSeat(null)
              }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
            >
              <Lock className="size-4" aria-hidden="true" />
              Çıkış
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {trip.buses.map((item) => {
          const filled = item.seats.filter((seat) => isTakenSeat(seat.status)).length
          const selected = item.id === bus.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setBusId(item.id)
                setActiveSeat(null)
              }}
              className={`rounded-2xl px-4 py-3 text-left ${
                selected ? 'bg-teal-800 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
              }`}
            >
              <span className="block font-semibold">{item.name}</span>
              {item.plate ? (
                <span className={`mt-1 block font-mono text-sm font-semibold tracking-wide ${selected ? 'text-white' : 'text-slate-900'}`}>
                  {item.plate}
                </span>
              ) : null}
              <span className={`mt-1 block text-sm ${selected ? 'text-teal-100' : 'text-slate-500'}`}>
                {item.capacity} kişilik · {filled} dolu
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <SeatMap
          bus={bus}
          activeSeat={activeSeat}
          onSelect={(number) => {
            const seat = bus.seats.find((item) => item.number === number)
            if (seat?.status === 'reserved') {
              setActiveSeat(null)
              setOccupiedNotice(null)
              setGuideNotice(number)
              return
            }
            if (seat?.status === 'occupied') {
              setActiveSeat(null)
              setGuideNotice(null)
              setOccupiedNotice(number)
              return
            }
            setOccupiedNotice(null)
            setGuideNotice(null)
            setActiveSeat(number)
          }}
        />
        <aside className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">{bus.name}</h3>
          {bus.plate ? <p className="mt-1 font-mono text-sm font-semibold tracking-wide">{bus.plate}</p> : null}
          <p className="mt-1 text-sm text-slate-500">
            {occupied} dolu · {bus.seats.length - occupied} boş
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            <Legend swatch="bg-emerald-500" label="Boş koltuk" />
            <Legend swatch="bg-rose-600" label="Dolu koltuk" />
            <Legend swatch="bg-slate-400" label="Rehber koltukları" />
            <Legend swatch="bg-amber-400" label="Seçilen koltuk" />
          </ul>
        </aside>
      </div>

      {adminOpen && isAdmin ? <FleetAdmin /> : null}

      {loginOpen ? (
        <AdminLoginModal
          onClose={() => setLoginOpen(false)}
          onSubmit={signIn}
          onSuccess={() => {
            setLoginOpen(false)
            setAdminOpen(true)
          }}
        />
      ) : null}

      {guideNotice ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={() => setGuideNotice(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="guide-title" className="text-xl font-semibold">
              Koltuk {guideNotice}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Bu koltuk rehber için ayrılmıştır.</p>
            <button
              type="button"
              onClick={() => setGuideNotice(null)}
              className="mt-5 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tamam
            </button>
          </div>
        </div>
      ) : null}

      {occupiedNotice !== null ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={() => setOccupiedNotice(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="occupied-title"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="occupied-title" className="text-xl font-semibold">
              Koltuk {occupiedNotice}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Bu koltuk dolu.</p>
            <button
              type="button"
              onClick={() => setOccupiedNotice(null)}
              className="mt-5 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tamam
            </button>
          </div>
        </div>
      ) : null}

      {activeSeat !== null ? (
        <PassengerModal
          key={`${bus.id}-${activeSeat}`}
          busName={bus.plate ? `${bus.name} · ${bus.plate}` : bus.name}
          seatNumber={activeSeat}
          onClose={() => setActiveSeat(null)}
          onSave={savePassenger}
        />
      ) : null}
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`size-4 rounded-md ${swatch}`} />
      <span>{label}</span>
    </li>
  )
}
