import { useEffect, useId, useState, type FormEvent } from 'react'
import { isValidNationalId } from '@/lib/nationalId.ts'
import { isValidPhone, normalizePhone } from '@/lib/phone.ts'
import type { PassengerInput } from '@/types/index.ts'

type PassengerModalProps = {
  busName: string
  seatNumber: number
  onClose: () => void
  onSave: (input: PassengerInput) => Promise<string | null>
}

type FieldErrors = {
  fullName?: string
  nationalId?: string
  phone?: string
  form?: string
}

export function PassengerModal({ busName, seatNumber, onClose, onSave }: PassengerModalProps) {
  const titleId = useId()
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors: FieldErrors = {}
    const trimmedName = fullName.trim().replace(/\s+/g, ' ')
    const nameParts = trimmedName.split(' ')
    if (
      nameParts.length < 2 ||
      nameParts.some((part) => !/^[\p{L}][\p{L}'-]{1,}$/u.test(part))
    ) {
      nextErrors.fullName = 'Ad ve soyadı birlikte yazın.'
    }

    if (!isValidNationalId(nationalId)) {
      nextErrors.nationalId = 'Geçerli bir T.C. kimlik numarası girin.'
    }

    if (!isValidPhone(phone)) {
      nextErrors.phone = 'Telefon 05 ile başlayan 11 hane olmalı.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    const error = await onSave({
      fullName: trimmedName,
      nationalId,
      phone: normalizePhone(phone),
    })
    setSaving(false)
    if (error) {
      setErrors({ form: error })
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-medium text-teal-800">{busName}</p>
        <h2 id={titleId} className="mt-1 text-2xl font-semibold">
          Koltuk {seatNumber}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ad soyad, T.C. kimlik numarası ve telefon ile kayıt olun. Koltuk, listedeki T.C. kimlik numarasıyla ayrılır.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <Field
            label="Ad Soyad"
            value={fullName}
            autoComplete="name"
            error={errors.fullName}
            onChange={setFullName}
          />
          <Field
            label="T.C. Kimlik Numarası"
            value={nationalId}
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            error={errors.nationalId}
            onChange={(value) => setNationalId(value.replace(/\D/g, '').slice(0, 11))}
          />
          <Field
            label="Telefon Numarası"
            value={phone}
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
            onChange={setPhone}
          />
          {errors.form ? <p className="text-sm text-rose-700">{errors.form}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button type="button" className="text-sm text-slate-500" onClick={onClose} disabled={saving}>
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  error,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  autoComplete?: string
  inputMode?: 'numeric' | 'tel' | 'text'
  maxLength?: number
}) {
  const id = useId()
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={id}
        value={value}
        autoFocus={label === 'Ad Soyad'}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-700"
      />
      {error ? <span className="mt-1 block text-sm text-rose-700">{error}</span> : null}
    </label>
  )
}
