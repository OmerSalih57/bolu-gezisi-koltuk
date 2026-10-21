# Bolu Gezisi Koltuk Seçim Sistemi

Koltuk durumu ve katılımcı doğrulaması Supabase üzerindedir. T.C. kimlik listesi tarayıcıya açık gelmez.

## Yerel çalıştırma

```bash
npm install
```

`.env.local` dosyasına yalnızca Supabase proje adresini ve anonim anahtarı yazın. Yönetim şifresi bu dosyaya yazılmaz; site paketine gömülür.

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Supabase SQL Editor'da `supabase/schema.sql` dosyasını çalıştırın. Yönetim paneli e-posta istemez. Şifre veritabanındaki `admin_secret` kaydındadır. Değiştirmek için:

```sql
update public.admin_secret
set password = extensions.crypt('yeni-sifre', extensions.gen_salt('bf'))
where id = 1;
```

```bash
npm run dev
```

## Yayına alma

Vercel ve Netlify için build komutu `npm run build`, çıktı klasörü `dist`. Ortam değişkenleri: `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY`. Yönetim şifresini bu değişkenlere eklemeyin. Tek sayfa yönlendirmesi `vercel.json` ve `netlify.toml` içindedir.
