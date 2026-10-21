import { busLayout, type LayoutSlot } from '@/lib/busLayout.ts'
import type { Bus } from '@/types/index.ts'
import { SeatButton } from '@/features/seats/SeatButton.tsx'

type SeatMapProps = {
  bus: Bus
  activeSeat: number | null
  onSelect: (number: number) => void
}

const pairWidth = 'w-[7.375rem]'

export function SeatMap({ bus, activeSeat, onSelect }: SeatMapProps) {
  const rows = busLayout(bus.capacity)
  const seats = new Map(bus.seats.map((seat) => [seat.number, seat]))

  return (
    <div className="mx-auto w-fit">
      <div className="rounded-[2rem] bg-gradient-to-b from-slate-700 to-slate-900 p-3 shadow-xl">
        <div className="rounded-[1.5rem] bg-[#eef2f6] px-4 py-4">
          <div className="mb-3 h-8 rounded-t-2xl rounded-b-md bg-slate-300/90" />
          <p className="mb-3 text-center text-[11px] font-bold tracking-[0.28em] text-slate-500">
            ÖN
          </p>
          <div className="mb-2 flex items-center justify-center gap-3 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            <span className={pairWidth}>Sol</span>
            <span className="w-6" />
            <span className={pairWidth}>Sağ</span>
          </div>
          <div className="flex flex-col gap-1.5" aria-label={`${bus.name} koltuk planı`}>
            {rows.map((row) =>
              row.center ? (
                <div key={row.id} className="flex justify-center pt-1">
                  {row.center.map((slot) =>
                    slot.kind === 'seat' ? (
                      <SeatSlot
                        key={slot.number}
                        slot={slot}
                        seats={seats}
                        activeSeat={activeSeat}
                        onSelect={onSelect}
                      />
                    ) : null,
                  )}
                </div>
              ) : (
                <div
                  key={row.id}
                  className={`flex items-center justify-center gap-3 ${row.separated ? 'my-2' : ''}`}
                >
                  <Side
                    slots={row.left}
                    seats={seats}
                    activeSeat={activeSeat}
                    onSelect={onSelect}
                  />
                  <div className="h-8 w-6 rounded-full bg-slate-200/80" />
                  <Side
                    slots={row.right}
                    seats={seats}
                    activeSeat={activeSeat}
                    onSelect={onSelect}
                  />
                </div>
              ),
            )}
          </div>
          <p className="mt-3 text-center text-[11px] font-bold tracking-[0.28em] text-slate-500">
            ARKA
          </p>
        </div>
      </div>
      {bus.capacity === 55 ? (
        <p className="mt-3 text-center text-xs text-slate-500">
          47–55 numaralı koltuklar, 46 kişilik düzenin arka uzatmasıdır.
        </p>
      ) : null}
    </div>
  )
}

function Side({
  slots,
  seats,
  activeSeat,
  onSelect,
}: {
  slots: LayoutSlot[]
  seats: Map<number, Bus['seats'][number]>
  activeSeat: number | null
  onSelect: (number: number) => void
}) {
  if (slots.length === 1 && slots[0]?.kind !== 'seat') {
    return (
      <div className={pairWidth}>
        <Zone slot={slots[0]} />
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-1.5 ${pairWidth}`}>
      {slots.map((slot, index) =>
        slot.kind === 'seat' ? (
          <SeatSlot
            key={slot.number}
            slot={slot}
            seats={seats}
            activeSeat={activeSeat}
            onSelect={onSelect}
          />
        ) : (
          <span key={`${slot.kind}-${index}`} />
        ),
      )}
    </div>
  )
}

function SeatSlot({
  slot,
  seats,
  activeSeat,
  onSelect,
}: {
  slot: Extract<LayoutSlot, { kind: 'seat' }>
  seats: Map<number, Bus['seats'][number]>
  activeSeat: number | null
  onSelect: (number: number) => void
}) {
  const seat = seats.get(slot.number)
  return (
    <SeatButton
      number={slot.number}
      status={seat?.status ?? 'available'}
      selected={activeSeat === slot.number}
      onSelect={onSelect}
    />
  )
}

function Zone({ slot }: { slot: LayoutSlot }) {
  if (slot.kind === 'driver') {
    return (
      <div className="flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-semibold text-white">
        <SteeringWheel />
        Şoför
      </div>
    )
  }

  if (slot.kind === 'front-door') {
    return (
      <div className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 text-center text-[11px] font-bold leading-tight text-amber-800">
        Ön
        <br />
        Kapı
      </div>
    )
  }

  if (slot.kind === 'middle-door') {
    return (
      <div className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 text-center text-[11px] font-bold leading-tight text-amber-800">
        Orta
        <br />
        Kapı
      </div>
    )
  }

  if (slot.kind === 'muavin') {
    return (
      <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-white text-xs font-semibold text-slate-500">
        Muavin
      </div>
    )
  }

  return <div className="h-14" />
}

function SteeringWheel() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 4.2v5.2M5.2 14.2h5.2M13.6 14.2h5.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
