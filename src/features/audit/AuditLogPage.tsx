import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { fetchAuditLogs } from '@/lib/api.ts'
import { formatDateTime } from '@/lib/format.ts'
import type { AuditLog } from '@/types/index.ts'

export function AuditLogPage() {
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [logs, setLogs] = useState<AuditLog[] | null>(null)

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setLogs(null)
    const result = await fetchAuditLogs(password)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setLogs(result.logs)
  }

  if (logs) {
    return (
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Koltuk seçim kayıtları</h1>
          <button
            type="button"
            onClick={() => {
              setLogs(null)
              setPassword('')
            }}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
          >
            Kilitle
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">Henüz kayıt yok.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Zaman</th>
                  <th className="px-4 py-3 font-medium">Otobüs</th>
                  <th className="px-4 py-3 font-medium">Koltuk</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Cihaz</th>
                  <th className="px-4 py-3 font-medium">User agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 whitespace-nowrap">{formatWhen(log.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">Otobüs {log.busNumber}</td>
                    <td className="px-4 py-3">{log.seatNumber}</td>
                    <td className="px-4 py-3 font-mono">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.deviceInfo || '—'}</td>
                    <td className="max-w-sm truncate px-4 py-3 font-mono text-xs" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Doğrulama</h1>
      <p className="mt-1 text-sm text-slate-500">Devam etmek için şifre gerekir.</p>
      <form className="mt-5" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="audit-password">
          Şifre
        </label>
        <div className="relative mt-1.5">
          <input
            id="audit-password"
            type={passwordVisible ? 'text' : 'password'}
            autoFocus
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(null)
            }}
            className="w-full rounded-xl border border-slate-200 py-2.5 pr-11 pl-3 outline-none focus:border-teal-700"
          />
          <button
            type="button"
            aria-label={passwordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700"
          >
            {passwordVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Kontrol ediliyor…' : 'Giriş'}
        </button>
      </form>
    </section>
  )
}

function formatWhen(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return formatDateTime(value)
}
