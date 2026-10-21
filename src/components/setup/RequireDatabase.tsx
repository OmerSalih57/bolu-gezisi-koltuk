import type { ReactNode } from 'react'
import { SetupScreen } from '@/features/setup/SetupScreen.tsx'
import { useTrip } from '@/hooks/useTrip.ts'

export function RequireDatabase({ children }: { children: ReactNode }) {
  const { configured, ready, loadError } = useTrip()
  if (!configured) return <SetupScreen />
  if (!ready) return <p className="text-slate-600">Koltuk durumu yükleniyor…</p>
  if (loadError) return <p className="max-w-xl text-rose-700">{loadError}</p>
  return children
}
