import { Bus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { APP_TITLE } from '@/lib/brand.ts'

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <NavLink to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-800 text-white">
              <Bus className="size-5" aria-hidden="true" />
            </span>
            <span className="leading-snug">{APP_TITLE}</span>
          </NavLink>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="no-print border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-sm text-slate-500">
          Geliştirici: <span className="font-medium text-slate-700">Ömer Salih Aydın</span>
        </p>
      </footer>
    </div>
  )
}
