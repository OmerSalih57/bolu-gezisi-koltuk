import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const supabaseConfigError =
  url && anonKey
    ? null
    : 'Supabase adresi ve anonim anahtar tanımlı değil. .env.local dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY yazın.'

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null
