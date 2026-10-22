import { busLayout, isGuideSeat, type LayoutSlot } from '@/lib/busLayout.ts'
import type { Bus } from '@/types/index.ts'

type NamedSeatMapProps = {
  bus: Bus
  namesBySeat: Array<{ seatNumber: number; fullName: string }>
}

const pairWidth = 'w-[73.5mm]'

export function NamedSeatMap({ bus, namesBySeat }: NamedSeatMapProps) {
  const rows = busLayout(bus.capacity)
  const names = new Map(namesBySeat.map((person) => [person.seatNumber, person.fullName]))

  return (
    <div className="mx-auto w-fit text-slate-950">
      <p className="mb-[2mm] text-center text-[9pt] font-bold tracking-[0.25em]">ÖN</p>
      <div className="mb-[2mm] flex items-center justify-center gap-[2mm] text-[8pt] font-semibold tracking-wide uppercase">
        <span className={`${pairWidth} text-center`}>Sol</span>
        <span className="w-[8mm]" />
        <span className={`${pairWidth} text-center`}>Sağ</span>
      </div>
      <div className="flex flex-col gap-[1mm]" aria-label={`${bus.name} isimli şema`}>
        {rows.map((row) =>
          row.full ? (
            <div key={row.id} className="grid w-[159mm] grid-cols-5 gap-[1.5mm] pt-[1mm]">
              {row.full.map((slot) =>
                slot.kind === 'seat' ? (
                  <NamedSeat key={slot.number} number={slot.number} name={names.get(slot.number)} wide />
                ) : null,
              )}
            </div>
          ) : row.center ? (
            <div key={row.id} className="flex justify-center">
              {row.center.map((slot) =>
                slot.kind === 'seat' ? (
                  <NamedSeat key={slot.number} number={slot.number} name={names.get(slot.number)} />
                ) : null,
              )}
            </div>
          ) : (
            <div
              key={row.id}
              className={`flex items-center justify-center gap-[2mm] ${row.separated ? 'my-[1.5mm]' : ''}`}
            >
              <Side slots={row.left} names={names} />
              <div className="h-[6mm] w-[8mm] rounded-full border border-dashed border-slate-300" />
              <Side slots={row.right} names={names} />
            </div>
          ),
        )}
      </div>
      <p className="mt-[2mm] text-center text-[9pt] font-bold tracking-[0.25em]">ARKA</p>
    </div>
  )
}

function Side({ slots, names }: { slots: LayoutSlot[]; names: Map<number, string> }) {
  if (slots.length === 1 && slots[0]?.kind !== 'seat') {
    return (
      <div className={pairWidth}>
        <Zone slot={slots[0]} />
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-[1.5mm] ${pairWidth}`}>
      {slots.map((slot, index) =>
        slot.kind === 'seat' ? (
          <NamedSeat key={slot.number} number={slot.number} name={names.get(slot.number)} />
        ) : (
          <span key={`${slot.kind}-${index}`} />
        ),
      )}
    </div>
  )
}

function NamedSeat({ number, name, wide = false }: { number: number; name?: string; wide?: boolean }) {
  const guide = isGuideSeat(number)
  const label = guide ? 'Rehber' : name
  return (
    <div
      data-print-seat={number}
      data-passenger={label ?? ''}
      className={`flex h-[12.5mm] flex-col justify-center overflow-hidden rounded-[1.5mm] border px-[1mm] leading-none ${
        wide ? 'w-full' : 'w-[36mm]'
      } ${
        guide
          ? 'border-slate-500 bg-slate-200'
          : label
            ? 'border-slate-900 bg-amber-100'
            : 'border-slate-400 bg-white'
      }`}
    >
      <span className="text-[8pt] font-bold">{number}</span>
      {label ? (
        <span className="mt-[0.4mm] line-clamp-2 text-[7.5pt] leading-tight font-semibold">{label}</span>
      ) : null}
    </div>
  )
}

function Zone({ slot }: { slot: LayoutSlot }) {
  const className =
    'flex h-[12.5mm] items-center justify-center rounded-[1.5mm] border text-center text-[8pt] leading-tight font-bold'

  if (slot.kind === 'driver') {
    return <div className={`${className} border-slate-900 bg-slate-900 text-white`}>Şoför</div>
  }
  if (slot.kind === 'front-door') {
    return <div className={`${className} border-dashed border-amber-700 bg-amber-50 text-amber-900`}>Ön Kapı</div>
  }
  if (slot.kind === 'middle-door') {
    return <div className={`${className} border-dashed border-amber-700 bg-amber-50 text-amber-900`}>Orta Kapı</div>
  }
  if (slot.kind === 'muavin') {
    return <div className={`${className} border-dashed border-slate-500 bg-white text-slate-600`}>Muavin</div>
  }
  return <div className="h-[12.5mm]" />
}
