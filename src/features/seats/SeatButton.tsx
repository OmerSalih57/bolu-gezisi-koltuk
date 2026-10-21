import type { SeatStatus } from '@/types/index.ts'

type SeatButtonProps = {
  number: number
  status: SeatStatus
  selected: boolean
  onSelect: (number: number) => void
}

export function SeatButton({ number, status, selected, onSelect }: SeatButtonProps) {
  const occupied = status === 'occupied' && !selected
  const label = selected
    ? `Koltuk ${number}, seçili`
    : occupied
      ? `Koltuk ${number}, dolu`
      : `Koltuk ${number}, boş`

  return (
    <button
      type="button"
      data-seat={number}
      data-status={selected ? 'selected' : status}
      aria-label={label}
      title={occupied ? 'Dolu' : selected ? 'Seçilen koltuk' : 'Boş koltuk'}
      onClick={() => onSelect(number)}
      className={`relative flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
        selected
          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
          : occupied
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
      }`}
    >
      <span
        className={`absolute inset-x-2 top-1.5 h-1.5 rounded-full ${
          selected ? 'bg-amber-700/25' : 'bg-black/15'
        }`}
      />
      <span className="leading-none">{number}</span>
      {occupied ? <span className="text-[10px] font-medium leading-none">Dolu</span> : null}
    </button>
  )
}
