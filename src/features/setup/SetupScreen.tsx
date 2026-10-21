export function SetupScreen() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Supabase bağlantısı gerekli</h1>
      <p className="mt-2 text-sm text-slate-600">
        Koltuklar ve katılımcı doğrulaması veritabanında durur. Tarayıcıya T.C. kimlik listesi inmez.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>Supabase projesinde SQL Editor ile supabase/schema.sql dosyasını çalıştırın.</li>
        <li>Project Settings içindeki URL ve anon key değerlerini .env.local dosyasına yazın.</li>
        <li>Yönetim şifresini veritabanındaki admin_secret kaydına yazın. Bu şifreyi site ayarlarına eklemeyin.</li>
        <li>Yayında yalnızca VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değişkenlerini ekleyin.</li>
      </ol>
    </section>
  )
}
