import { Printer, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrip } from '@/hooks/useTrip.ts'
import { formatPhone } from '@/lib/phone.ts'
import { parseRosterCsv, readCsvText } from '@/lib/roster.ts'

export function FleetAdmin() {
  const { trip, bookings, roster, replaceRoster, closeRoster, releaseSeat } = useTrip()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onFile(file: File) {
    setPending(true)
    const text = await readCsvText(file)
    const parsed = parseRosterCsv(text)
    if ('error' in parsed) {
      setPending(false)
      setUploadError(parsed.error)
      setUploadNote(null)
      return
    }

    const result = await replaceRoster(parsed.entries)
    setPending(false)
    if ('error' in result) {
      setUploadError(result.error)
      setUploadNote(null)
      return
    }
    setUploadError(null)
    setUploadNote(
      result.skipped > 0
        ? `${result.saved} kişi eklendi veya güncellendi. ${result.skipped} satır atlandı.`
        : `${result.saved} kişi eklendi veya güncellendi.`,
    )
  }

  const hasRoster = roster.length > 0

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Yönetim</h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasRoster
              ? `${roster.length} katılımcı kayıtlı. Yeniden yüklemek zorunlu değildir.`
              : 'Katılımcı listesini bir kez yüklemeniz yeter. Liste kayıtlı kalır.'}
          </p>
        </div>
        <Link
          to={`/geziler/${trip.id}/cikti`}
          className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-white"
        >
          <Printer className="size-4" aria-hidden="true" />
          Otobüs Şemalarını İsimli Çıktı Al / PDF İndir
        </Link>
      </div>

      {hasRoster ? (
        <div className="mt-6">
          <h4 className="font-semibold">Katılımcı listesi</h4>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Ad Soyad</th>
                  <th className="py-2 pr-3 font-medium">T.C. Kimlik No</th>
                  <th className="py-2 pr-3 font-medium">Telefon</th>
                  <th className="py-2 font-medium">Kayıt</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((person) => (
                  <tr key={person.nationalId} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{person.fullName}</td>
                    <td className="py-2 pr-3 font-mono">{person.nationalId}</td>
                    <td className="py-2 pr-3">{formatPhone(person.phone)}</td>
                    <td className="py-2">{person.isRegistered ? 'Açık' : 'Kapalı'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-medium">
          {hasRoster ? 'Yeni katılımcı ekle veya listeyi güncelle' : 'Katılımcı Listesi Yükle (CSV)'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Sütunlar: Ad Soyad, T.C. Kimlik No, Telefon. Yeni dosya mevcut kişileri silmez; aynı T.C. kimlik
          numarasında ad ve telefon güncellenir.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-200">
            <Upload className="size-4" aria-hidden="true" />
            {pending ? 'Yükleniyor…' : hasRoster ? 'CSV ile güncelle' : 'CSV seç'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void onFile(file)
              }}
            />
          </label>
          {hasRoster ? (
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const error = await closeRoster()
                  if (error) {
                    setUploadError(error)
                    setUploadNote(null)
                    return
                  }
                  setUploadError(null)
                  setUploadNote('Kayıt hakkı kapatıldı. Mevcut koltuklar duruyor.')
                })()
              }}
              className="inline-flex items-center gap-1 text-sm text-slate-600"
            >
              <X className="size-4" aria-hidden="true" />
              Kayıt hakkını kapat
            </button>
          ) : null}
        </div>
        {uploadError ? <p className="mt-3 text-sm text-rose-700">{uploadError}</p> : null}
        {uploadNote ? <p className="mt-3 text-sm text-teal-800">{uploadNote}</p> : null}
        {!hasRoster ? <p className="mt-3 text-sm text-slate-600">Henüz kayıtlı katılımcı yok.</p> : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <h4 className="font-semibold">Koltuk kayıtları</h4>
        <p className="text-sm text-slate-500">{bookings.length} kayıtlı yolcu</p>
      </div>
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Henüz koltuğa yazılmış yolcu yok.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Otobüs</th>
                <th className="py-2 pr-3 font-medium">Koltuk</th>
                <th className="py-2 pr-3 font-medium">Ad Soyad</th>
                <th className="py-2 pr-3 font-medium">T.C. Kimlik No</th>
                <th className="py-2 pr-3 font-medium">Telefon</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((person) => {
                const bus = trip.buses.find((item) => item.number === person.busNumber)
                return (
                  <tr key={`${person.busNumber}-${person.seatNumber}`} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      {bus?.name ?? `Otobüs ${person.busNumber}`}
                      <span className="mt-0.5 block text-xs text-slate-400">{bus?.capacity} kişilik</span>
                    </td>
                    <td className="py-3 pr-3 font-semibold">{person.seatNumber}</td>
                    <td className="py-3 pr-3">{person.fullName}</td>
                    <td className="py-3 pr-3 font-mono">{person.nationalId}</td>
                    <td className="py-3 pr-3">{formatPhone(person.phone)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-rose-700"
                        onClick={() => {
                          if (!window.confirm(`${bus?.name ?? 'Otobüs'} koltuk ${person.seatNumber} boşaltılsın mı?`)) {
                            return
                          }
                          void releaseSeat(person.busNumber, person.seatNumber)
                        }}
                      >
                        Boşalt
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
