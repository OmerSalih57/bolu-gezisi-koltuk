import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

type AdminLoginModalProps = {
  title?: string
  description?: string
  onClose?: () => void
  backHref?: string
  backLabel?: string
  onSubmit: (password: string) => Promise<string | null>
  onSuccess?: () => void
}

export function AdminLoginModal({
  title = 'Yönetim paneli',
  description = 'CSV yükleme, katılımcı listesi ve isimli otobüs şeması için yönetim şifresi gerekir.',
  onClose,
  backHref,
  backLabel = 'Geri dön',
  onSubmit,
  onSuccess,
}: AdminLoginModalProps) {
  const titleId = useId()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const nextError = await onSubmit(password)
    setPending(false)
    if (nextError) {
      setError(nextError)
      return
    }
    onSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <form className="mt-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="admin-password">
            Şifre
            <input
              id="admin-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-700"
            />
          </label>
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex items-center justify-end gap-3">
            {backHref ? (
              <Link to={backHref} className="text-sm text-slate-500">
                {backLabel}
              </Link>
            ) : null}
            {onClose ? (
              <button type="button" className="text-sm text-slate-500" onClick={onClose}>
                Vazgeç
              </button>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? 'Kontrol ediliyor…' : 'Giriş'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
