# Bolu Gezisi Koltuk Seçim Sistemi

## Yerel çalıştırma

```bash
npm install
```

`.env.local` dosyasına Supabase proje adresini, anonim anahtarı ve yönetim şifresini yazın:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_ADMIN_PASSWORD=bolu2026
```

Supabase SQL Editor'da `supabase/schema.sql` dosyasını çalıştırın. Yönetim paneli e-posta istemez; şifre `VITE_ADMIN_PASSWORD` değeridir. Bu değer boşsa varsayılan şifre `bolu2026` olur. Şifreyi değiştirirseniz `admin_secret` tablosundaki kaydı da aynı yapın.

```bash
npm run dev
```

## Yayına alma

Vercel ve Netlify için build komutu `npm run build`, çıktı klasörü `dist`. Ortam değişkenleri: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ve `VITE_ADMIN_PASSWORD`. Tek sayfa yönlendirmesi `vercel.json` ve `netlify.toml` içindedir.
